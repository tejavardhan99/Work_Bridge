from apps.common.documents import utcnow
from apps.common.firebase_config import FirebaseModel


class User(FirebaseModel):
    collection = "users"

    ROLE_WORKER = "worker"
    ROLE_EMPLOYER = "employer"
    ROLE_ADMIN = "admin"
    ROLES = (ROLE_WORKER, ROLE_EMPLOYER, ROLE_ADMIN)

    DEFAULTS = {
        "name": "",
        "phone": "",
        "email": "",
        "password_hash": "",
        "role": ROLE_WORKER,
        "is_active": True,
        "is_blocked": False,
        "otp_hash": "",
        "otp_channel": "",
        "otp_expires_at": None,
        "created_at": utcnow,
        "updated_at": utcnow,
    }

    def __init__(self, id=None, **kwargs):
        super().__init__(id=id, **kwargs)
