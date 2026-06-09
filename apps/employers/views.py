from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployer
from apps.accounts.documents import User
from apps.common.documents import Location, utcnow
# using human-readable location matching instead of geographic coordinates
from apps.common.responses import success
from apps.common.serializers import EmptySerializer
from apps.employers.serializers import EmployerProfileSerializer, serialize_employer
from apps.employers.services import get_employer_profile
from apps.jobs.documents import Job, JobApplication, Review
from apps.jobs.serializers import ApplicationDecisionSerializer, JobSerializer, ReviewSerializer, serialize_application, serialize_job
from apps.jobs.services import complete_work, create_job, create_review, decide_application, ensure_employer_owns_job, get_job_or_404, update_job
from apps.recommendations.services import recommend_workers_for_job
from apps.workers.documents import WorkerProfile


class EmployerProfileView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = EmployerProfileSerializer

    @extend_schema(tags=["Employers"], responses=dict)
    def get(self, request):
        return success({"employer": serialize_employer(get_employer_profile(request.user))})

    @extend_schema(tags=["Employers"], request=EmployerProfileSerializer, responses=dict)
    def put(self, request):
        employer = get_employer_profile(request.user)
        serializer = EmployerProfileSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        user = request.user.document
        if "name" in data:
            user.name = data["name"]
        if "phone" in data and data["phone"] != user.phone:
            if data["phone"] and User.objects(phone=data["phone"], id__ne=user.id).first():
                from rest_framework.exceptions import ValidationError

                raise ValidationError({"phone": "Phone already registered."})
            user.phone = data["phone"]
        if "email" in data and data["email"] != user.email:
            if data["email"] and User.objects(email=data["email"], id__ne=user.id).first():
                from rest_framework.exceptions import ValidationError

                raise ValidationError({"email": "Email already registered."})
            user.email = data["email"]
        user.updated_at = utcnow()
        user.save()
        if "location" in data and data["location"]:
            location_value = data["location"]
            if isinstance(location_value, str):
                employer.location = Location(address=location_value)
            elif isinstance(location_value, dict):
                employer.location = Location(**location_value)
        for field in ("organization_name", "business_type"):
            if field in data:
                setattr(employer, field, data[field])
        employer.updated_at = utcnow()
        employer.save()
        return success({"employer": serialize_employer(employer)}, "Employer profile updated.")

    patch = put


class EmployerJobListCreateView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = JobSerializer

    @extend_schema(tags=["Employer Jobs"], responses=dict)
    def get(self, request):
        employer = get_employer_profile(request.user)
        employer_id = str(employer.id)
        raw_jobs = Job._collection_ref().get() or {}
        jobs = []

        for job_id, job_data in raw_jobs.items():
            if not isinstance(job_data, dict):
                continue
            if job_data.get("employer_id") == employer_id or job_data.get("employer") == employer_id:
                job = Job.from_dict(job_data, id=job_id)
                jobs.append(job)

        jobs = sorted(jobs, key=lambda j: j.created_at, reverse=True)
        return success({"results": [serialize_job(job) for job in jobs]})

    @extend_schema(tags=["Employer Jobs"], request=JobSerializer, responses=dict)
    def post(self, request):
        employer = get_employer_profile(request.user)
        serializer = JobSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data["location"] = Location(**data["location"])
        job = create_job(employer, data)
        return success({"job": serialize_job(job)}, "Job posted successfully.", status.HTTP_201_CREATED)


class EmployerJobDetailView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = JobSerializer

    @extend_schema(tags=["Employer Jobs"], request=JobSerializer, responses=dict)
    def patch(self, request, job_id):
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

    @extend_schema(tags=["Employer Jobs"], responses=dict)
    def delete(self, request, job_id):
        employer = get_employer_profile(request.user)
        job = get_job_or_404(job_id)
        ensure_employer_owns_job(employer, job)
        JobApplication.objects(job=job).delete()
        Review.objects(job=job).delete()
        job.delete()
        return success({"job_id": job_id}, "Job deleted permanently.")


class JobApplicationsView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Employer Jobs"], responses=dict)
    def get(self, request, job_id):
        employer = get_employer_profile(request.user)
        job = get_job_or_404(job_id)
        ensure_employer_owns_job(employer, job)
        applications = JobApplication.objects(job=job).order_by("-created_at")
        return success({"results": [serialize_application(item) for item in applications]})


class EmployerApplicationsView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Employer Jobs"], responses=dict)
    def get(self, request):
        employer = get_employer_profile(request.user)
        employer_id = str(employer.id)

        status = request.query_params.get("status", "").strip().lower()
        search = request.query_params.get("search", "").strip().lower()
        sort = request.query_params.get("sort", "newest").strip().lower()
        page = int(request.query_params.get("page", 1) or 1)
        page_size = int(request.query_params.get("page_size", 50) or 50)
        if page_size > 200:
            page_size = 200

        applications = list(JobApplication.objects(employer_id=employer_id))

        if status:
            applications = [app for app in applications if getattr(app, "status", "").lower() == status]

        if search:
            applications = [
                app for app in applications
                if search in (getattr(app, "worker_name", "") or "").lower()
                or search in (getattr(app, "job_title", "") or "").lower()
            ]

        if sort == "oldest":
            applications.sort(key=lambda app: str(getattr(app, "created_at", "")))
        elif sort == "status":
            applications.sort(key=lambda app: (getattr(app, "status", "") or "").lower())
        elif sort == "worker_name":
            applications.sort(key=lambda app: (getattr(app, "worker_name", "") or "").lower())
        elif sort == "job_title":
            applications.sort(key=lambda app: (getattr(app, "job_title", "") or "").lower())
        else:
            applications.sort(key=lambda app: str(getattr(app, "created_at", "")), reverse=True)

        total = len(applications)
        start = (page - 1) * page_size
        end = start + page_size
        page_items = applications[start:end]

        return success({
            "results": [serialize_application(item) for item in page_items],
            "total": total,
        })


class ApplicationDecisionView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = ApplicationDecisionSerializer

    @extend_schema(tags=["Employer Jobs"], request=ApplicationDecisionSerializer, responses=dict)
    def post(self, request, application_id):
        serializer = ApplicationDecisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = decide_application(get_employer_profile(request.user), application_id, serializer.validated_data["status"])
        return success({"application": serialize_application(application)}, "Application decision saved.")


class MarkCompletedView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = EmptySerializer

    @extend_schema(tags=["Employer Jobs"], request=EmptySerializer, responses=dict)
    def post(self, request, application_id):
        application = complete_work(get_employer_profile(request.user), application_id)
        return success({"application": serialize_application(application)}, "Work marked completed.")


class StartWorkView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = EmptySerializer

    @extend_schema(tags=["Employer Jobs"], request=EmptySerializer, responses=dict)
    def post(self, request, application_id):
        application = None
        try:
            application = __import__('apps.jobs.services', fromlist=['start_work']).start_work(get_employer_profile(request.user), application_id)
        except Exception:
            # fallback import to avoid circular import issues
            from apps.jobs.services import start_work

            application = start_work(get_employer_profile(request.user), application_id)
        return success({"application": serialize_application(application)}, "Work started.")


class GiveReviewView(APIView):
    permission_classes = [IsEmployer]
    serializer_class = ReviewSerializer

    @extend_schema(tags=["Employer Jobs"], request=ReviewSerializer, responses=dict)
    def post(self, request, application_id):
        # Debug: log incoming payload
        try:
            print("Review Payload:", request.data)
        except Exception:
            pass

        serializer = ReviewSerializer(data=request.data)
        if not serializer.is_valid():
            # log and return clearer validation errors
            try:
                print("Serializer errors:", serializer.errors)
            except Exception:
                pass
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        rating = data.get('rating')
        # Safe field access for optional cross-checks
        worker_id = request.data.get('worker_id')
        job_id = request.data.get('job_id')
        if rating is None:
            return Response({"error": "Rating is required"}, status=status.HTTP_400_BAD_REQUEST)
        # cross-validate optional worker/job ids if provided
        try:
            application = None
            from apps.jobs.services import get_application_or_404

            application = get_application_or_404(application_id)
            if worker_id and str(getattr(application.worker, 'id', '')) != str(worker_id):
                return Response({"error": "Worker ID does not match application."}, status=status.HTTP_400_BAD_REQUEST)
            if job_id and str(getattr(application.job, 'id', '')) != str(job_id):
                return Response({"error": "Job ID does not match application."}, status=status.HTTP_400_BAD_REQUEST)

            review = create_review(get_employer_profile(request.user), application_id, request.user.document, **data)
        except Exception as e:
            # surface meaningful message for client and keep server logs
            print(f"Error creating review: {e}")
            # If it's a DRF ValidationError it will have a detail attribute
            from rest_framework.exceptions import ValidationError as DRFValidationError

            if isinstance(e, DRFValidationError):
                # detect duplicate-review message and return 409 Conflict
                detail = e.detail
                msg = ''
                try:
                    # detail may be dict like {'rating': ['This worker has already been rated for this job.']}
                    if isinstance(detail, dict):
                        # gather messages
                        vals = []
                        for v in detail.values():
                            if isinstance(v, (list, tuple)):
                                vals.extend([str(x) for x in v])
                            else:
                                vals.append(str(v))
                        msg = ' '.join(vals)
                    else:
                        msg = str(detail)
                except Exception:
                    msg = str(detail)

                if 'already been rated' in msg or 'already rated' in msg:
                    return Response({"error": "Review already submitted for this job."}, status=status.HTTP_409_CONFLICT)

                return Response(detail, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return success({"review_id": str(review.id)}, "Review submitted.", status.HTTP_201_CREATED)


class NearbyWorkersView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Employers", "Recommendations"], responses=dict)
    def get(self, request):
        employer = get_employer_profile(request.user)
        max_distance = float(request.query_params.get("max_distance_km", 50))
        workers = []
        for worker in WorkerProfile.objects(availability=True):
            score = 0
            wloc = worker.location
            eloc = employer.location
            if wloc and eloc:
                if wloc.village and eloc.village and wloc.village.lower() == eloc.village.lower():
                    score += 20
                elif wloc.district and eloc.district and wloc.district.lower() == eloc.district.lower():
                    score += 12
                elif wloc.state and eloc.state and wloc.state.lower() == eloc.state.lower():
                    score += 6
            if score > 0:
                workers.append(serialize_worker(worker, score))
        return success({"results": sorted(workers, key=lambda item: item.get("recommendation_score", 0), reverse=True)})


class RecommendedWorkersView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Recommendations"], responses=dict)
    def get(self, request, job_id):
        employer = get_employer_profile(request.user)
        job = get_job_or_404(job_id)
        ensure_employer_owns_job(employer, job)
        items = [serialize_worker(item["worker"], item["score"], item["distance_km"]) for item in recommend_workers_for_job(job)]
        return success({"results": items})


class WorkerTrustLookupView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Employers"], responses=dict)
    def get(self, request, worker_id):
        worker = WorkerProfile.objects(id=worker_id).first()
        if not worker:
            from rest_framework.exceptions import NotFound

            raise NotFound("Worker not found.")
        return success({"worker_id": worker_id, "trust_score": worker.trust_score, "level": worker.level, "completed_jobs_count": worker.completed_jobs_count})
