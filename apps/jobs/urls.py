from django.urls import path

from apps.jobs import views

urlpatterns = [
    path("create/", views.CreateJobView.as_view()),
    path("update/<str:job_id>/", views.UpdateJobView.as_view()),
    path("delete/<str:job_id>/", views.DeleteJobView.as_view()),
    path("my-jobs/", views.MyJobsView.as_view()),
    path("recommended/", views.RecommendedJobsView.as_view()),
    path("applicants/<str:job_id>/", views.ApplicantsView.as_view()),
    path("accept/<str:application_id>/", views.AcceptApplicationView.as_view()),
    path("reject/<str:application_id>/", views.RejectApplicationView.as_view()),
    path("complete/<str:job_id>/", views.CompleteJobView.as_view()),
    path("rate-worker/<str:worker_id>/", views.RateWorkerView.as_view()),
    path("nearby/", views.NearbyJobsView.as_view()),
    path("search/", views.SearchJobsView.as_view()),
    path("filter/", views.FilterJobsView.as_view()),
    path("recommended-workers/", views.RecommendedWorkersForJobView.as_view()),
    path("", views.JobListView.as_view()),
    path("<str:job_id>/", views.JobDetailView.as_view()),
]
