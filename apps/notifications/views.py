from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import NotFound
from rest_framework.views import APIView

from apps.common.responses import success
from apps.common.serializers import EmptySerializer
from apps.notifications.documents import Notification
from apps.notifications.services import serialize_notification


class NotificationListView(APIView):
    @extend_schema(tags=["Notifications"], responses=dict)
    def get(self, request):
        notifications = Notification.objects(user=request.user.document).order_by("-created_at")
        return success({"results": [serialize_notification(item) for item in notifications]})


class NotificationReadView(APIView):
    serializer_class = EmptySerializer

    @extend_schema(tags=["Notifications"], request=EmptySerializer, responses=dict)
    def patch(self, request, notification_id):
        notification = Notification.objects(id=notification_id, user=request.user.document).first()
        if not notification:
            raise NotFound("Notification not found.")
        notification.is_read = True
        notification.save()
        return success({"notification": serialize_notification(notification)}, "Notification marked as read.")


class NotificationDeleteView(APIView):
    serializer_class = EmptySerializer

    @extend_schema(tags=["Notifications"], responses=dict)
    def delete(self, request, notification_id):
        notification = Notification.objects(id=notification_id, user=request.user.document).first()
        if not notification:
            raise NotFound("Notification not found.")
        notification.delete()
        print(f"Notification deleted: {notification_id}")
        return success({}, "Notification deleted.")
