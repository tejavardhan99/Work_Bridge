from django.urls import path

from apps.notifications import views

urlpatterns = [
    path("", views.NotificationListView.as_view()),
    path("<str:notification_id>/delete/", views.NotificationDeleteView.as_view()),
    path("<str:notification_id>/read/", views.NotificationReadView.as_view()),
]
