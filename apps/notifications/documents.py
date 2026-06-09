from apps.accounts.documents import User
from apps.common.documents import utcnow
from apps.common.firebase_config import FirebaseModel


class Notification(FirebaseModel):
    collection = "notifications"
    REFERENCE_FIELDS = {"user": User}
    DEFAULTS = {
        "title": "",
        "message": "",
        "category": "system",
        "is_read": False,
        "created_at": utcnow,
    }

    def __init__(self, id=None, **kwargs):
        super().__init__(id=id, **kwargs)
