from apps.accounts.documents import User
from apps.common.documents import Location, utcnow
from apps.common.firebase_config import FirebaseModel


class EmployerProfile(FirebaseModel):
    collection = "employers"
    REFERENCE_FIELDS = {"user": User}
    EMBEDDED_FIELDS = {"location": Location}
    DEFAULTS = {
        "name": "",
        "phone": "",
        "email": "",
        "role": User.ROLE_EMPLOYER,
        "password_hash": "",
        "is_active": True,
        "is_blocked": False,
        "otp_hash": "",
        "otp_channel": "",
        "otp_expires_at": None,
        "organization_name": "",
        "business_type": "",
        "location": None,
        "created_at": utcnow,
        "updated_at": utcnow,
    }

    def __init__(self, id=None, **kwargs):
        super().__init__(id=id, **kwargs)
