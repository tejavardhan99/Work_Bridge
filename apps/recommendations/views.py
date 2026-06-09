from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from apps.accounts.permissions import IsEmployer, IsWorker
from apps.common.responses import success
from apps.employers.services import get_employer_profile
from apps.jobs.serializers import serialize_job
from apps.jobs.services import ensure_employer_owns_job, get_job_or_404
from apps.recommendations.services import recommend_jobs_for_worker, recommend_workers_for_job
from apps.workers.serializers import serialize_worker
from apps.workers.services import get_worker_profile


class WorkerJobRecommendationsView(APIView):
    permission_classes = [IsWorker]

    @extend_schema(tags=["Recommendations"], responses=dict)
    def get(self, request):
        worker = get_worker_profile(request.user)
        return success({"results": [serialize_job(item["job"], item["score"], item["distance_km"]) for item in recommend_jobs_for_worker(worker)]})


class EmployerWorkerRecommendationsView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Recommendations"], responses=dict)
    def get(self, request, job_id):
        employer = get_employer_profile(request.user)
        job = get_job_or_404(job_id)
        ensure_employer_owns_job(employer, job)
        return success({"results": [serialize_worker(item["worker"], item["score"], item["distance_km"]) for item in recommend_workers_for_job(job)]})


class EmployerWorkerRecommendationsQueryView(APIView):
    permission_classes = [IsEmployer]

    @extend_schema(tags=["Recommendations"], parameters=[OpenApiParameter("job_id", str, OpenApiParameter.QUERY)], responses=dict)
    def get(self, request):
        job_id = request.query_params.get("job_id")
        if not job_id:
            raise ValidationError({"job_id": "This query parameter is required."})
        employer = get_employer_profile(request.user)
        job = get_job_or_404(job_id)
        ensure_employer_owns_job(employer, job)
        return success({"results": [serialize_worker(item["worker"], item["score"], item["distance_km"]) for item in recommend_workers_for_job(job)]})
