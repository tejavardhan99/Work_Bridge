from django.urls import path

from apps.recommendations import views

urlpatterns = [
    path("jobs/", views.WorkerJobRecommendationsView.as_view()),
    path("workers/", views.EmployerWorkerRecommendationsQueryView.as_view()),
    path("jobs/for-worker/", views.WorkerJobRecommendationsView.as_view()),
    path("workers/for-job/<str:job_id>/", views.EmployerWorkerRecommendationsView.as_view()),
]
