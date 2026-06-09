from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsWorker
from apps.common.responses import success
from apps.workers.services import get_worker_profile
from apps.jobs.documents import Job, JobApplication
from apps.common.documents import utcnow
from apps.notifications.services import create_notification
from apps.jobs.serializers import serialize_application, serialize_location

class ApplyJobView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsWorker]

    def post(self, request):
        try:
            job_id = request.data.get("job_id")
            print(f"Apply clicked: {job_id}")

            if not job_id:
                return Response({"error": "job_id is required."}, status=status.HTTP_400_BAD_REQUEST)

            # 1. Fetch worker profile
            worker = get_worker_profile(request.user)
            if not worker:
                return Response({"error": "Worker profile not found."}, status=status.HTTP_404_NOT_FOUND)

            # 2. Verify worker profile completed (skills, location, name, phone)
            is_complete = True
            if not worker.skills or len(worker.skills) == 0:
                is_complete = False
            if not worker.location or not (worker.location.address or worker.location.village or worker.location.district or worker.location.state):
                is_complete = False
            if not worker.name or not worker.name.strip():
                is_complete = False
            if not worker.phone or not worker.phone.strip():
                is_complete = False

            if not is_complete:
                return Response({"error": "Complete your profile before applying."}, status=status.HTTP_400_BAD_REQUEST)

            # 3. Fetch job details
            job = Job.objects(id=job_id).first()
            if not job:
                return Response({"error": "Job not found."}, status=status.HTTP_404_NOT_FOUND)

            if job.status != Job.STATUS_OPEN:
                return Response({"error": "This job is no longer open."}, status=status.HTTP_400_BAD_REQUEST)

            # 4. Prevent duplicate applications
            existing = JobApplication.objects(worker=worker, job=job).first()
            if not existing:
                raw_apps = JobApplication._collection_ref().get() or {}
                for app_id, app_data in raw_apps.items():
                    if isinstance(app_data, dict):
                        if app_data.get("worker_id") == str(worker.id) and app_data.get("job_id") == str(job.id):
                            existing = True
                            break

            if existing:
                return Response({"error": "You already applied for this job."}, status=status.HTTP_400_BAD_REQUEST)

            # 5. Store application in Firebase with exact required database structure
            application = JobApplication(
                worker=worker,
                job=job,
                worker_id=str(worker.id),
                worker_name=worker.user.name if worker.user else worker.name,
                worker_phone=worker.user.phone if worker.user else worker.phone,
                worker_skills=worker.skills,
                worker_location=serialize_location(worker.location),
                employer_id=str(job.employer.id) if job.employer else job.employer_id,
                job_id=str(job.id),
                job_title=job.title,
                status="pending",
                applied_at=utcnow().isoformat(),
                created_at=utcnow(),
                updated_at=utcnow(),
            )
            application.save()

            # Send notification to employer if possible, but do not fail the application when notification fails.
            try:
                if job.employer and job.employer.user:
                    create_notification(
                        user=job.employer.user,
                        title="New Worker Applied",
                        message=f"{worker.name} applied for your job: {job.title}.",
                        category="application"
                    )
            except Exception as notification_error:
                print(f"Create notification failed for application {application.id}: {notification_error}")

            try:
                serialized_app = serialize_application(application)
            except Exception as serialization_error:
                print(f"Serialize application failed for application {application.id}: {serialization_error}")
                serialized_app = {
                    "id": str(application.id),
                    "job_id": str(application.job.id) if application.job else str(application.job_id),
                    "status": application.status,
                }

            return success({"application": serialized_app}, "Application submitted successfully", status.HTTP_201_CREATED)
        except Exception as exc:
            print(f"ApplyJobView error: {exc}")
            return Response({"error": "Failed to apply for this job."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
