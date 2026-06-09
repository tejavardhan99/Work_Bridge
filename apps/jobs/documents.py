from apps.accounts.documents import User
from apps.common.documents import Location, utcnow
from apps.common.firebase_config import FirebaseModel
from apps.employers.documents import EmployerProfile
from apps.workers.documents import WorkerProfile


class Job(FirebaseModel):
    collection = "jobs"
    REFERENCE_FIELDS = {"employer": EmployerProfile, "assigned_worker": WorkerProfile}
    EMBEDDED_FIELDS = {"location": Location}
    DEFAULTS = {
        "title": "",
        "description": "",
        "required_skills": [],
        "salary": 0.0,
        "location": None,
        "duration": "",
        "urgency": "normal",
        "worker_level_required": "Beginner",
        "status": "open",
        "openings": 1,
        "filled_openings": 0,
        "assigned_worker": None,
        "employer_id": "",
        "created_at": utcnow,
        "updated_at": utcnow,
    }

    STATUS_OPEN = "open"
    STATUS_CLOSED = "closed"
    STATUS_REMOVED = "removed"

    def __init__(self, id=None, **kwargs):
        super().__init__(id=id, **kwargs)


class JobApplication(FirebaseModel):
    collection = "applications"
    REFERENCE_FIELDS = {"job": Job, "worker": WorkerProfile}
    DEFAULTS = {
        "status": "pending",
        "cover_note": "",
        "worker_id": "",
        "worker_name": "",
        "worker_phone": "",
        "worker_skills": [],
        "worker_location": None,
        "employer_id": "",
        "job_id": "",
        "job_title": "",
        "applied_at": "",
        "created_at": utcnow,
        "updated_at": utcnow,
    }

    STATUS_PENDING = "pending"
    STATUS_APPLIED = "pending"  # kept for backwards compatibility if referenced elsewhere
    STATUS_ACCEPTED = "accepted"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_CANCELLED = "cancelled"
    STATUS_REJECTED = "rejected"
    STATUS_COMPLETED = "completed"

    def __init__(self, id=None, **kwargs):
        super().__init__(id=id, **kwargs)


class Review(FirebaseModel):
    collection = "ratings"
    REFERENCE_FIELDS = {
        "job": Job,
        "worker": WorkerProfile,
        "employer": EmployerProfile,
        "created_by": User,
    }
    DEFAULTS = {
        "rating": 0,
        "comment": "",
        "created_at": utcnow,
    }

    def __init__(self, id=None, **kwargs):
        super().__init__(id=id, **kwargs)


class Complaint(FirebaseModel):
    collection = "reports"
    REFERENCE_FIELDS = {"reported_by": User, "reported_user": User, "job": Job}
    DEFAULTS = {
        "reason": "",
        "details": "",
        "status": "open",
        "created_at": utcnow,
    }

    def __init__(self, id=None, **kwargs):
        super().__init__(id=id, **kwargs)
