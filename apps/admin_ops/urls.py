from django.urls import path

from apps.admin_ops import views

urlpatterns = [
    path("workers/", views.AdminWorkersView.as_view()),
    path("employers/", views.AdminEmployersView.as_view()),
    path("block-user/<str:user_id>/", views.BlockUserView.as_view()),
    path("remove-job/<str:job_id>/", views.RemoveFakeJobView.as_view()),
    path("dashboard/", views.DashboardAnalyticsView.as_view()),
    path("users/", views.AdminUsersView.as_view()),
    path("users/<str:user_id>/block/", views.BlockUserView.as_view()),
    path("jobs/<str:job_id>/remove/", views.RemoveFakeJobView.as_view()),
    path("complaints/", views.ComplaintsView.as_view()),
    path("complaints/<str:complaint_id>/", views.ComplaintDetailView.as_view()),
    path("ratings/", views.RatingsMonitorView.as_view()),
    path("analytics/", views.DashboardAnalyticsView.as_view()),
    path("fraud-monitoring/", views.FraudMonitoringView.as_view()),
]
