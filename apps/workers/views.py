from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.views import APIView

from apps.accounts.permissions import IsWorker
from apps.accounts.documents import User
from apps.common.documents import Location, utcnow
from apps.common.files import save_uploaded_file
from apps.common.responses import success
from apps.jobs.documents import JobApplication, Review
from apps.jobs.serializers import ApplicationSerializer, serialize_application, serialize_job
from apps.jobs.services import apply_for_job, get_job_or_404
from apps.notifications.documents import Notification
from apps.notifications.services import serialize_notification
from apps.notifications.services import create_notification
from apps.recommendations.services import recommend_jobs_for_worker
from apps.workers.serializers import (
    AvailabilitySerializer,
    CertificateUploadSerializer,
    NeedWorkTodaySerializer,
    WorkerProfileSerializer,
    WorkerSkillsSerializer,
    serialize_worker,
)
from apps.workers.services import get_worker_profile


class WorkerProfileView(APIView):
    permission_classes = [IsWorker]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    serializer_class = WorkerProfileSerializer

    @extend_schema(tags=["Workers"], responses=dict)
    def get(self, request):
        return success({"worker": serialize_worker(get_worker_profile(request.user))})

    @extend_schema(tags=["Workers"], request=WorkerProfileSerializer, responses=dict)
    def put(self, request):
        worker = get_worker_profile(request.user)
        serializer = WorkerProfileSerializer(data=request.data, partial=True)
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
        if "location" in data:
            location_value = data["location"]
            if location_value:
                if isinstance(location_value, str):
                    worker.location = Location(address=location_value)
                elif isinstance(location_value, dict):
                    worker.location = Location(**location_value)
            else:
                # Preserve existing location if empty string is sent
                pass
        for field in ("skills", "languages", "availability", "experience"):
            if field in data:
                setattr(worker, field, data[field])
        if request.FILES.get("profile_image"):
            worker.profile_image = save_uploaded_file(request.FILES["profile_image"], "workers/profile-images")
        if request.FILES.getlist("certificates"):
            worker.certificates.extend([save_uploaded_file(file, "workers/certificates") for file in request.FILES.getlist("certificates")])
        worker.updated_at = utcnow()
        worker.save()
        return success({"worker": serialize_worker(worker)}, "Worker profile updated.")

    patch = put


class WorkerSkillsView(APIView):
    permission_classes = [IsWorker]
    serializer_class = WorkerSkillsSerializer

    @extend_schema(tags=["Workers"], request=WorkerSkillsSerializer, responses=dict)
    def post(self, request):
        serializer = WorkerSkillsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        worker = get_worker_profile(request.user)
        existing = {skill.lower(): skill for skill in worker.skills}
        for skill in serializer.validated_data["skills"]:
            normalized = skill.strip()
            if normalized and normalized.lower() not in existing:
                worker.skills.append(normalized)
                existing[normalized.lower()] = normalized
        worker.updated_at = utcnow()
        worker.save()
        return success({"skills": worker.skills}, "Skills updated.", status.HTTP_201_CREATED)


class WorkerCertificatesView(APIView):
    permission_classes = [IsWorker]
    parser_classes = [MultiPartParser, FormParser]
    serializer_class = CertificateUploadSerializer

    @extend_schema(tags=["Workers"], request=CertificateUploadSerializer, responses=dict)
    def post(self, request):
        serializer = CertificateUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        files = request.FILES.getlist("certificates")
        if not files:
            from rest_framework.exceptions import ValidationError

            raise ValidationError({"certificates": "Upload at least one certificate file."})

        worker = get_worker_profile(request.user)
        worker.certificates.extend([save_uploaded_file(file, "workers/certificates") for file in files])
        worker.skill_verification_score = min(100, worker.skill_verification_score + (len(files) * 10))
        worker.updated_at = utcnow()
        worker.save()
        return success(
            {"certificates": worker.certificates, "skill_verification_score": worker.skill_verification_score},
            "Certificates uploaded.",
            status.HTTP_201_CREATED,
        )


class WorkerAvailabilityView(APIView):
    permission_classes = [IsWorker]
    serializer_class = AvailabilitySerializer

    @extend_schema(tags=["Workers"], request=AvailabilitySerializer, responses=dict)
    def post(self, request):
        return self.patch(request)

    @extend_schema(tags=["Workers"], request=AvailabilitySerializer, responses=dict)
    def patch(self, request):
        serializer = AvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        worker = get_worker_profile(request.user)
        worker.availability = serializer.validated_data["availability"]
        worker.save()
        return success({"availability": worker.availability}, "Availability updated.")


class NeedWorkTodayView(APIView):
    permission_classes = [IsWorker]
    serializer_class = NeedWorkTodaySerializer

    @extend_schema(tags=["Workers"], request=NeedWorkTodaySerializer, responses=dict)
    def post(self, request):
        serializer = NeedWorkTodaySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        worker = get_worker_profile(request.user)
        worker.need_work_today = serializer.validated_data["enabled"]
        worker.availability = True
        worker.save()
        create_notification(worker.user, "Need Work Today enabled", "Emergency work preference is active.", "emergency")
        return success({"need_work_today": worker.need_work_today}, "Emergency work preference updated.")


class RecommendedJobsView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(tags=["Workers", "Recommendations"], responses=dict)
    def get(self, request):
        worker = get_worker_profile(request.user)
        items = [serialize_job(item["job"], item["score"], item["distance_km"]) for item in recommend_jobs_for_worker(worker)]
        return success({"results": items})


class ApplyJobView(APIView):
    permission_classes = [IsWorker]
    serializer_class = ApplicationSerializer

    @extend_schema(tags=["Workers"], request=ApplicationSerializer, responses=dict)
    def post(self, request, job_id):
        serializer = ApplicationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = apply_for_job(get_worker_profile(request.user), get_job_or_404(job_id), serializer.validated_data.get("cover_note", ""))
        return success({"application": serialize_application(application)}, "Applied successfully.", status.HTTP_201_CREATED)


class WorkerApplicationsView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(tags=["Workers"], responses=dict)
    def get(self, request):
        worker = get_worker_profile(request.user)
        status_filter = request.query_params.get("status")
        query = JobApplication.objects(worker=worker)
        if status_filter:
            query = query.filter(status=status_filter)
        return success({"results": [serialize_application(item) for item in query.order_by("-created_at")]})


class CompletedJobsView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(tags=["Workers"], responses=dict)
    def get(self, request):
        worker = get_worker_profile(request.user)
        applications = JobApplication.objects(worker=worker, status=JobApplication.STATUS_COMPLETED)
        return success({"results": [serialize_application(item) for item in applications]})


class WorkerReviewsView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(tags=["Workers"], responses=dict)
    def get(self, request):
        worker = get_worker_profile(request.user)
        reviews = Review.objects(worker=worker)
        return success({"results": [{"rating": item.rating, "comment": item.comment, "job_id": str(item.job.id), "created_at": item.created_at} for item in reviews]})


class WorkerTrustScoreView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(tags=["Workers"], responses=dict)
    def get(self, request):
        worker = get_worker_profile(request.user)
        return success({"trust_score": worker.trust_score, "level": worker.level, "completed_jobs_count": worker.completed_jobs_count})


class WorkerNotificationsView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(tags=["Workers", "Notifications"], responses=dict)
    def get(self, request):
        notifications = Notification.objects(user=request.user.document).order_by("-created_at")
        return success({"results": [serialize_notification(item) for item in notifications]})
