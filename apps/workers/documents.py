from apps.accounts.documents import User
from apps.common.documents import Location, utcnow
from apps.common.firebase_config import FirebaseModel


class WorkerProfile(FirebaseModel):
    collection = "workers"
    REFERENCE_FIELDS = {"user": User}
    EMBEDDED_FIELDS = {"location": Location}
    DEFAULTS = {
        "name": "",
        "phone": "",
        "email": "",
        "role": User.ROLE_WORKER,
        "password_hash": "",
        "is_active": True,
        "is_blocked": False,
        "otp_hash": "",
        "otp_channel": "",
        "otp_expires_at": None,
        "location": None,
        "skills": [],
        "reviews": [],
        "completed_jobs_count": 0,
        "ratings": [],
        "rating": 0,
        "trust_score": 20,
        "languages": [],
        "availability": True,
        "experience": "",
        "profile_image": "",
        "certificates": [],
        "skill_verification_score": 0,
        "consistency_score": 50,
        "need_work_today": False,
        "verified": False,
        "experience_level": "beginner",
        "created_at": utcnow,
        "updated_at": utcnow,
    }

    def __init__(self, id=None, **kwargs):
        super().__init__(id=id, **kwargs)

    @property
    def level(self):
        if self.completed_jobs_count < 5:
            return "Beginner"
        if self.completed_jobs_count < 15:
            return "Intermediate"
        return "Experienced"

    @property
    def average_rating(self):
        return round(sum(self.ratings) / len(self.ratings), 2) if self.ratings else 0
