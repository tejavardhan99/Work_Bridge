from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployer, IsWorker
from apps.common.documents import Location
from apps.common.responses import success
from apps.common.serializers import EmptySerializer
from apps.employers.services import get_employer_profile
from apps.workers.services import get_worker_profile
from apps.jobs.documents import Job, JobApplication, Review
from apps.jobs.serializers import (
    ApplicationDecisionSerializer,
    JobQuerySerializer,
    JobSerializer,
    NearbyJobsQuerySerializer,
    ReviewSerializer,
    WorkerRatingSerializer,
    serialize_application,
    serialize_job,
)
from apps.jobs.services import (
    apply_job_filters,
    complete_job_by_job_id,
    create_job,
    decide_application,
    ensure_employer_owns_job,
    get_job_or_404,
    paginate_query,
    rate_worker_for_job,
    update_job,
)
from apps.recommendations.services import recommend_workers_for_job
from apps.jobs.services.recommendation_service import recommend_jobs_for_worker, nearby_jobs_for_query
from apps.workers.documents import WorkerProfile
from apps.workers.serializers import serialize_worker


class JobListView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = JobQuerySerializer

    @extend_schema(tags=["Jobs"], parameters=[JobQuerySerializer], responses=dict)
    def get(self, request):
        serializer = JobQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        query = apply_job_filters(Job.objects(status=Job.STATUS_OPEN), data).order_by("-created_at")
        total, jobs = paginate_query(query, data["page"], data["page_size"])
        return success({"count": total, "page": data["page"], "page_size": data["page_size"], "results": [serialize_job(job) for job in jobs]})


class JobDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(tags=["Jobs"], responses=dict)
    def get(self, request, job_id):
        job = Job.objects(id=job_id, status=Job.STATUS_OPEN).first()
        if not job:
            raise NotFound("Job not found.")
        return success({"job": serialize_job(job)})


class SearchJobsView(JobListView):
    @extend_schema(tags=["Jobs"], parameters=[JobQuerySerializer], responses=dict)
    def get(self, request):
        return super().get(request)


class FilterJobsView(JobListView):
    @extend_schema(tags=["Jobs"], parameters=[JobQuerySerializer], responses=dict)
    def get(self, request):
        return super().get(request)


class NearbyJobsView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = NearbyJobsQuerySerializer

    @extend_schema(tags=["Jobs"], parameters=[NearbyJobsQuerySerializer], responses=dict)
    def get(self, request):
        try:
            serializer = NearbyJobsQuerySerializer(data=request.query_params)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
            
            # Check if user is authenticated and is worker
            from apps.accounts.documents import User
            if request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == User.ROLE_WORKER:
                from apps.workers.services import get_worker_profile
                worker = get_worker_profile(request.user)
                from apps.workers.documents import WorkerProfile
                latest_worker = WorkerProfile.objects(id=worker.id).first()
                if latest_worker:
                    worker = latest_worker
                
                from backend.ml.recommendation_engine import calculate_score
                from apps.recommendations.services import level_allowed
                
                matches = []
                completed_jobs_count = getattr(worker, 'completed_jobs_count', 0)
                rating = getattr(worker, 'average_rating', 0) if hasattr(worker, 'average_rating') else getattr(worker, 'rating', 0)
                if not rating:
                    rating = getattr(worker, 'rating', 0)
                
                for job in Job.objects(status=Job.STATUS_OPEN):
                    if not level_allowed(worker.level, job.worker_level_required, completed_jobs_count, rating):
                        continue
                    score = calculate_score(worker, job)
                    if score is None:
                        continue
                    matches.append((job, round(score, 2)))
                matches = sorted(matches, key=lambda item: item[1], reverse=True)
            else:
                matches = nearby_jobs_for_query(
                    village=data.get("village", ""),
                    district=data.get("district", ""),
                    state=data.get("state", ""),
                    skills=data.get("skills", ""),
                )
            
            total = len(matches)
            start = (data["page"] - 1) * data["page_size"]
            page_items = matches[start : start + data["page_size"]]
            results = []
            for job, score in page_items:
                try:
                    results.append(serialize_job(job, score=score))
                except Exception as e:
                    print(f"Error serializing job {job.id if hasattr(job, 'id') else 'unknown'}: {str(e)}")
                    continue
            return success({"count": total, "page": data["page"], "page_size": data["page_size"], "results": results})
        except Exception as e:
            print(f"Nearby Jobs Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return success({"count": 0, "page": 1, "page_size": 20, "results": []})


class CreateJobView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = JobSerializer

    @extend_schema(tags=["Employer Jobs"], request=JobSerializer, responses=dict)
    def post(self, request):
        # Get employer profile
        employer = get_employer_profile(request.user)
        if not employer:
            raise NotFound("Employer profile not found.")
        
        # Verify employer profile is complete (name, phone, email, location)
        is_complete = True
        if not employer.name or not employer.name.strip():
            is_complete = False
        if not employer.phone or not employer.phone.strip():
            is_complete = False
        if not employer.email or not employer.email.strip():
            is_complete = False
        if not employer.location or not (employer.location.address or employer.location.village or employer.location.district or employer.location.state):
            is_complete = False
        
        if not is_complete:
            return Response(
                {"error": "Complete your profile before posting jobs."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = JobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data["location"] = Location(**data["location"])
        job = create_job(employer, data)
        return success({"job": serialize_job(job)}, "Job posted successfully.", status.HTTP_201_CREATED)


def _get_employer_jobs(employer):
    employer_id = str(employer.id)
    raw_jobs = Job._collection_ref().get() or {}
    matches = []

    for job_id, job_data in raw_jobs.items():
        if not isinstance(job_data, dict):
            continue
        if job_data.get("employer_id") == employer_id or job_data.get("employer") == employer_id:
            matches.append({"id": job_id, **job_data})

    from apps.common.firebase_config import FirebaseQuerySet

    return FirebaseQuerySet(Job, matches)


class UpdateJobView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = JobSerializer

    @extend_schema(tags=["Employer Jobs"], request=JobSerializer, responses=dict)
    def put(self, request, job_id):
        employer = get_employer_profile(request.user)
        job = get_job_or_404(job_id)
        ensure_employer_owns_job(employer, job)
        serializer = JobSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if "location" in data:
            data["location"] = Location(**data["location"])
        job = update_job(job, data)
        return success({"job": serialize_job(job)}, "Job updated.")

    patch = put


class DeleteJobView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Employer Jobs"], responses=dict)
    def delete(self, request, job_id):
        employer = get_employer_profile(request.user)
        job = get_job_or_404(job_id)
        ensure_employer_owns_job(employer, job)
        JobApplication.objects(job=job).delete()
        Review.objects(job=job).delete()
        job.delete()
        return success({"job_id": job_id}, "Job deleted permanently.")


class MyJobsView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Employer Jobs"], parameters=[JobQuerySerializer], responses=dict)
    def get(self, request):
        serializer = JobQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        employer = get_employer_profile(request.user)
        query = _get_employer_jobs(employer)
        query = apply_job_filters(query, data).order_by("-created_at")
        total, jobs = paginate_query(query, data["page"], data["page_size"])
        return success({"count": total, "page": data["page"], "page_size": data["page_size"], "results": [serialize_job(job) for job in jobs]})


class RecommendedJobsView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(tags=["Jobs"], responses=dict)
    def get(self, request):
        # Recommend jobs for authenticated worker
        recs = recommend_jobs_for_worker(request.user)
        results = []
        
        # Get worker profile to calculate match flags
        worker = get_worker_profile(request.user)
        from apps.workers.documents import WorkerProfile
        latest_worker = WorkerProfile.objects(id=worker.id).first()
        if latest_worker:
            worker = latest_worker

        from backend.ml.scoring_rules import exact_skill_match, location_score, general_job_score

        for item in recs:
            job = item.get('job')
            if not job:
                continue
                
            skill_match = exact_skill_match(worker.skills, job.title, job.required_skills)
            loc_score = location_score(worker.location, job.location)
            location_match = (loc_score == 100)
            general_job = (general_job_score(job.title) > 0)
            
            results.append({
                'job_id': str(getattr(job, 'id', '')),
                'title': getattr(job, 'title', ''),
                'score': item.get('score'),
                'skill_match': skill_match,
                'location_match': location_match,
                'general_job': general_job,
                'nearby': location_match,
            })
        return success({"results": results})


class ApplicantsView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Employer Jobs"], responses=dict)
    def get(self, request, job_id):
        employer = get_employer_profile(request.user)
        job = get_job_or_404(job_id)
        ensure_employer_owns_job(employer, job)
        applications = JobApplication.objects(job=job).order_by("-created_at")
        return success({"results": [serialize_application(item) for item in applications]})


class AcceptApplicationView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = EmptySerializer

    @extend_schema(tags=["Employer Jobs"], request=EmptySerializer, responses=dict)
    def post(self, request, application_id):
        application = decide_application(get_employer_profile(request.user), application_id, JobApplication.STATUS_ACCEPTED)
        return success({"application": serialize_application(application)}, "Application accepted.")


class RejectApplicationView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = EmptySerializer

    @extend_schema(tags=["Employer Jobs"], request=EmptySerializer, responses=dict)
    def post(self, request, application_id):
        application = decide_application(get_employer_profile(request.user), application_id, JobApplication.STATUS_REJECTED)
        return success({"application": serialize_application(application)}, "Application rejected.")


class CompleteJobView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = EmptySerializer

    @extend_schema(tags=["Employer Jobs"], request=EmptySerializer, responses=dict)
    def post(self, request, job_id):
        application = complete_job_by_job_id(get_employer_profile(request.user), job_id)
        return success({"application": serialize_application(application)}, "Job marked completed.")


class RateWorkerView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = WorkerRatingSerializer

    @extend_schema(tags=["Employer Jobs"], request=WorkerRatingSerializer, responses=dict)
    def post(self, request, worker_id):
        serializer = WorkerRatingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        worker = WorkerProfile.objects(id=worker_id).first()
        if not worker:
            raise NotFound("Worker not found.")
        data = serializer.validated_data
        review = rate_worker_for_job(
            get_employer_profile(request.user),
            worker,
            data["job_id"],
            request.user.document,
            data["rating"],
            data.get("comment", ""),
        )
        return success({"rating_id": str(review.id)}, "Worker rated.", status.HTTP_201_CREATED)


class RecommendedWorkersForJobView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Recommendations"], parameters=[OpenApiParameter("job_id", str, OpenApiParameter.QUERY)], responses=dict)
    def get(self, request):
        job_id = request.query_params.get("job_id")
        if not job_id:
            raise NotFound("job_id query parameter is required.")
        employer = get_employer_profile(request.user)
        job = get_job_or_404(job_id)
        ensure_employer_owns_job(employer, job)
        items = [serialize_worker(item["worker"], item["score"], item["distance_km"]) for item in recommend_workers_for_job(job)]
        return success({"results": items})
