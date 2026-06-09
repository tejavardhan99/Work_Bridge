from apps.notifications.documents import Notification


def create_notification(user, title, message, category="system"):
    return Notification(user=user, title=title, message=message, category=category).save()


def serialize_notification(notification):
    return {
        "id": str(notification.id),
        "title": notification.title,
        "message": notification.message,
        "category": notification.category,
        "is_read": notification.is_read,
        "created_at": notification.created_at,
    }
