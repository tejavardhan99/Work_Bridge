from django.urls import path
from apps.applications import views

urlpatterns = [
    path("apply/", views.ApplyJobView.as_view(), name="apply-job"),
]
