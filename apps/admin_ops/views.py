from statistics import mean, StatisticsError
from rest_framework import status
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.views import APIView

from apps.accounts.documents import User
from apps.accounts.permissions import IsAdminRole
from apps.admin_ops.serializers import BlockUserSerializer, ComplaintStatusSerializer, FraudReportSerializer
from apps.common.responses import success
from apps.employers.documents import EmployerProfile
from apps.employers.serializers import serialize_employer
from apps.jobs.documents import Complaint, Job, JobApplication, Review
from apps.jobs.serializers import serialize_job
from apps.workers.documents import WorkerProfile
from apps.workers.serializers import serialize_worker

ALLOWED_LOCATIONS = {'Duvvada', 'Gajuwaka'}


def get_location_label(location):
    if not location:
        return None
    label = (
        getattr(location, 'address', None)
        or getattr(location, 'village', None)
        or getattr(location, 'district', None)
        or getattr(location, 'state', None)
    )
    if label:
        label = label.strip()
        if label in ALLOWED_LOCATIONS:
            return label
    return None


def serialize_registration(user, worker_profiles, employer_profiles):
    profile = worker_profiles.get(str(user.id)) or employer_profiles.get(str(user.id))
    location = None
    if profile is not None:
        location = get_location_label(getattr(profile, 'location', None))
    return {
        'id': str(user.id),
        'name': user.name,
        'phone': user.phone,
        'role': user.role,
        'location': location or '',
        'created_at': user.created_at,
    }


class AdminUsersView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], responses=dict)
    def get(self, request):
        users = User.objects.order_by("-created_at")
        return success({"results": [serialize_user(user) for user in users]})


class AdminWorkersView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], responses=dict)
    def get(self, request):
        workers = WorkerProfile.objects.order_by("-created_at")
        return success({"results": [serialize_worker(worker) for worker in workers]})


class AdminEmployersView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], responses=dict)
    def get(self, request):
        employers = EmployerProfile.objects.order_by("-created_at")
        return success({"results": [serialize_employer(employer) for employer in employers]})


class BlockUserView(APIView):
    permission_classes = [IsAdminRole]
    serializer_class = BlockUserSerializer

    @extend_schema(tags=["Admin"], request=BlockUserSerializer, responses=dict)
    def post(self, request, user_id):
        serializer = BlockUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects(id=user_id).first()
        if not user:
            raise NotFound("User not found.")
        user.is_blocked = serializer.validated_data["is_blocked"]
        user.save()
        return success({"user": serialize_user(user)}, "User block status updated.")

    patch = post


class RemoveFakeJobView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], responses=dict)
    def delete(self, request, job_id):
        job = Job.objects(id=job_id).first()
        if not job:
            raise NotFound("Job not found.")
        job.status = Job.STATUS_REMOVED
        job.save()
        return success({"job_id": job_id}, "Job removed.")


class ComplaintsView(APIView):
    permission_classes = [IsAdminRole]
    serializer_class = FraudReportSerializer

    @extend_schema(tags=["Admin"], responses=dict)
    def get(self, request):
        complaints = Complaint.objects.order_by("-created_at")
        return success({"results": [serialize_complaint(item) for item in complaints]})

    @extend_schema(tags=["Admin"], request=FraudReportSerializer, responses=dict)
    def post(self, request):
        serializer = FraudReportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        complaint = Complaint(
            reported_by=request.user.document,
            reported_user=User.objects(id=data.get("reported_user_id")).first() if data.get("reported_user_id") else None,
            job=Job.objects(id=data.get("job_id")).first() if data.get("job_id") else None,
            reason=data["reason"],
            details=data.get("details", ""),
        ).save()
        return success({"complaint": serialize_complaint(complaint)}, "Complaint created.", status.HTTP_201_CREATED)


class ComplaintDetailView(APIView):
    permission_classes = [IsAdminRole]
    serializer_class = ComplaintStatusSerializer

    @extend_schema(tags=["Admin"], request=ComplaintStatusSerializer, responses=dict)
    def patch(self, request, complaint_id):
        serializer = ComplaintStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        complaint = Complaint.objects(id=complaint_id).first()
        if not complaint:
            raise NotFound("Complaint not found.")
        complaint.status = serializer.validated_data["status"]
        complaint.save()
        return success({"complaint": serialize_complaint(complaint)}, "Complaint updated.")


class RatingsMonitorView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], responses=dict)
    def get(self, request):
        reviews = Review.objects.order_by("-created_at")
        return success({"results": [{"worker_id": str(item.worker.id), "job_id": str(item.job.id), "rating": item.rating, "comment": item.comment} for item in reviews]})


class DashboardAnalyticsView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], responses=dict)
    def get(self, request):
        try:
            # Count users by role
            all_users = list(User.objects())
            workers_count = sum(1 for u in all_users if u.role == User.ROLE_WORKER)
            employers_count = sum(1 for u in all_users if u.role == User.ROLE_EMPLOYER)
            admins_count = sum(1 for u in all_users if u.role == User.ROLE_ADMIN)
            blocked_count = sum(1 for u in all_users if u.is_blocked)

            # Count jobs by status
            all_jobs = list(Job.objects())
            jobs_total = len(all_jobs)
            jobs_open = sum(1 for j in all_jobs if j.status == Job.STATUS_OPEN)
            jobs_closed = sum(1 for j in all_jobs if j.status == Job.STATUS_CLOSED)
            jobs_removed = sum(1 for j in all_jobs if j.status == Job.STATUS_REMOVED)
            jobs_emergency = sum(1 for j in all_jobs if j.urgency == "emergency" and j.status == Job.STATUS_OPEN)

            # Count applications
            all_applications = list(JobApplication.objects())
            applications_total = len(all_applications)
            applications_completed = sum(1 for a in all_applications if a.status == JobApplication.STATUS_COMPLETED)
            applications_pending = sum(1 for a in all_applications if a.status == JobApplication.STATUS_PENDING)
            applications_accepted = sum(1 for a in all_applications if a.status == JobApplication.STATUS_ACCEPTED)
            applications_rejected = sum(1 for a in all_applications if a.status == JobApplication.STATUS_REJECTED)

            # Build job location counts (only supported locations)
            job_location_counts = {}
            for job in all_jobs:
                location = getattr(job, 'location', None)
                label = get_location_label(location)
                if label:
                    job_location_counts[label] = job_location_counts.get(label, 0) + 1
                elif location is not None:
                    job.location = None
                    try:
                        job.save()
                    except Exception:
                        pass

            # Recent registrations
            worker_profiles = {str(w.user.id): w for w in WorkerProfile.objects() if getattr(w, 'user', None)}
            employer_profiles = {str(e.user.id): e for e in EmployerProfile.objects() if getattr(e, 'user', None)}
            recent_users = sorted(all_users, key=lambda u: getattr(u, 'created_at', ''), reverse=True)[:5]
            recent_registrations = [serialize_registration(user, worker_profiles, employer_profiles) for user in recent_users]

            # Worker trust and level analytics
            all_workers = list(WorkerProfile.objects())
            trust_scores = [w.trust_score for w in all_workers if hasattr(w, 'trust_score') and w.trust_score is not None]
            avg_trust = mean(trust_scores) if trust_scores else 0
            low_trust_count = sum(1 for w in all_workers if getattr(w, 'trust_score', 0) < 30)

            beginner_count = sum(1 for w in all_workers if getattr(w, 'completed_jobs_count', 0) < 5)
            intermediate_count = sum(1 for w in all_workers if 5 <= getattr(w, 'completed_jobs_count', 0) < 15)
            expert_count = sum(1 for w in all_workers if getattr(w, 'completed_jobs_count', 0) >= 15)

            # Top skills
            skill_counts = {}
            for worker in all_workers:
                for skill in getattr(worker, 'skills', []) or []:
                    if not skill:
                        continue
                    label = skill.strip().title()
                    if not label:
                        continue
                    skill_counts[label] = skill_counts.get(label, 0) + 1
            top_skills = [
                {"skill": skill, "count": count}
                for skill, count in sorted(skill_counts.items(), key=lambda item: item[1], reverse=True)[:10]
            ]

            active_jobs = max(0, jobs_total - applications_completed)

            print("Workers:", workers_count)
            print("Employers:", employers_count)
            print("Jobs:", jobs_total)
            print("Applications:", applications_total)
            print("Active Jobs:", active_jobs)
            print("Top Skills:", top_skills)

            return success(
                {
                    "total_workers": workers_count,
                    "total_employers": employers_count,
                    "total_jobs": jobs_total,
                    "active_jobs": active_jobs,
                    "total_applications": applications_total,
                    "pending_applications": applications_pending,
                    "accepted_applications": applications_accepted,
                    "rejected_applications": applications_rejected,
                    "completed_jobs": applications_completed,
                    "jobs_by_location": {k: v for k, v in sorted(job_location_counts.items(), key=lambda item: item[1], reverse=True)},
                    "top_skills": top_skills,
                    "worker_levels": {
                        "beginner": beginner_count,
                        "intermediate": intermediate_count,
                        "expert": expert_count,
                    },
                    "recent_registrations": recent_registrations,
                    "users": {
                        "workers": workers_count,
                        "employers": employers_count,
                        "admins": admins_count,
                        "blocked": blocked_count,
                    },
                    "jobs": {
                        "total": jobs_total,
                        "open": jobs_open,
                        "closed": jobs_closed,
                        "removed": jobs_removed,
                        "emergency": jobs_emergency,
                    },
                    "applications": {
                        "total": applications_total,
                        "completed": applications_completed,
                    },
                    "trust": {
                        "avg_worker_trust": avg_trust,
                        "low_trust_workers": low_trust_count,
                    },
                    "complaints": {
                        "open": sum(1 for c in Complaint.objects() if c.status == "open"),
                        "reviewing": sum(1 for c in Complaint.objects() if c.status == "reviewing"),
                    },
                }
            )
        except Exception as e:
            print(f"Error in DashboardAnalyticsView: {e}")
            import traceback
            traceback.print_exc()
            return success(
                {
                    "total_workers": 0,
                    "total_employers": 0,
                    "total_jobs": 0,
                    "active_jobs": 0,
                    "total_applications": 0,
                    "pending_applications": 0,
                    "accepted_applications": 0,
                    "rejected_applications": 0,
                    "completed_jobs": 0,
                    "jobs_by_location": {},
                    "top_skills": [],
                    "worker_levels": {"beginner": 0, "intermediate": 0, "expert": 0},
                    "recent_registrations": [],
                    "users": {"workers": 0, "employers": 0, "admins": 0, "blocked": 0},
                    "jobs": {"total": 0, "open": 0, "closed": 0, "removed": 0, "emergency": 0},
                    "applications": {"total": 0, "completed": 0},
                    "trust": {"avg_worker_trust": 0, "low_trust_workers": 0},
                    "complaints": {"open": 0, "reviewing": 0},
                }
            )



class FraudMonitoringView(APIView):
    permission_classes = [IsAdminRole]

    @extend_schema(tags=["Admin"], responses=dict)
    def get(self, request):
        suspicious_workers = WorkerProfile.objects(trust_score__lt=30)
        suspicious_jobs = Job.objects(status=Job.STATUS_OPEN, salary__lte=0)
        return success(
            {
                "low_trust_workers": [serialize_worker(worker) for worker in suspicious_workers],
                "suspicious_jobs": [serialize_job(job) for job in suspicious_jobs],
            }
        )


def serialize_user(user):
    return {
        "id": str(user.id),
        "name": user.name,
        "phone": user.phone,
        "email": user.email,
        "role": user.role,
        "is_blocked": user.is_blocked,
        "created_at": user.created_at,
    }


def serialize_complaint(complaint):
    return {
        "id": str(complaint.id),
        "reported_by": str(complaint.reported_by.id),
        "reported_user": str(complaint.reported_user.id) if complaint.reported_user else None,
        "job": str(complaint.job.id) if complaint.job else None,
        "reason": complaint.reason,
        "details": complaint.details,
        "status": complaint.status,
        "created_at": complaint.created_at,
    }


def average(values):
    values = list(values)
    return round(sum(values) / len(values), 2) if values else 0
