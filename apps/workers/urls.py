from django.urls import path

from apps.workers import views

urlpatterns = [
    path("profile/", views.WorkerProfileView.as_view()),
    path("skills/", views.WorkerSkillsView.as_view()),
    path("certificates/", views.WorkerCertificatesView.as_view()),
    path("apply-job/<str:job_id>/", views.ApplyJobView.as_view()),
    path("applied-jobs/", views.WorkerApplicationsView.as_view()),
    path("ratings/", views.WorkerReviewsView.as_view()),
    path("notifications/", views.WorkerNotificationsView.as_view()),
    path("me/", views.WorkerProfileView.as_view()),
    path("availability/", views.WorkerAvailabilityView.as_view()),
    path("need-work-today/", views.NeedWorkTodayView.as_view()),
    path("recommended-jobs/", views.RecommendedJobsView.as_view()),
    path("jobs/<str:job_id>/apply/", views.ApplyJobView.as_view()),
    path("applications/", views.WorkerApplicationsView.as_view()),
    path("completed-jobs/", views.CompletedJobsView.as_view()),
    path("reviews/", views.WorkerReviewsView.as_view()),
    path("trust-score/", views.WorkerTrustScoreView.as_view()),
]
