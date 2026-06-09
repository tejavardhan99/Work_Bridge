from django.urls import path

from apps.employers import views

urlpatterns = [
    path("profile/", views.EmployerProfileView.as_view()),
    path("me/", views.EmployerProfileView.as_view()),
    path("jobs/", views.EmployerJobListCreateView.as_view()),
    path("jobs/<str:job_id>/", views.EmployerJobDetailView.as_view()),
    path("jobs/<str:job_id>/applications/", views.JobApplicationsView.as_view()),
    path("applications/", views.EmployerApplicationsView.as_view()),
    path("applications/<str:application_id>/decision/", views.ApplicationDecisionView.as_view()),
    path("applications/<str:application_id>/complete/", views.MarkCompletedView.as_view()),
    path("applications/<str:application_id>/start/", views.StartWorkView.as_view()),
    path("applications/<str:application_id>/review/", views.GiveReviewView.as_view()),
    path("nearby-workers/", views.NearbyWorkersView.as_view()),
    path("jobs/<str:job_id>/recommended-workers/", views.RecommendedWorkersView.as_view()),
    path("workers/<str:worker_id>/trust-score/", views.WorkerTrustLookupView.as_view()),
]
