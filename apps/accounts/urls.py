from django.urls import path

from apps.accounts import views

urlpatterns = [
    path("", views.AuthIndexView.as_view()),
    path("worker-register/", views.WorkerRegisterView.as_view()),
    path("worker-login/", views.WorkerLoginView.as_view()),
    path("employer-register/", views.EmployerRegisterView.as_view()),
    path("employer-login/", views.EmployerLoginView.as_view()),
    path("admin-login/", views.AdminLoginView.as_view()),
    path("refresh/", views.RefreshTokenView.as_view()),
    path("demo-tokens/", views.DemoTokensView.as_view()),
    path("workers/register/", views.WorkerRegisterView.as_view()),
    path("workers/login/", views.WorkerLoginView.as_view()),
    path("employers/register/", views.EmployerRegisterView.as_view()),
    path("employers/login/", views.EmployerLoginView.as_view()),
    path("admin/login/", views.AdminLoginView.as_view()),
    path("token/refresh/", views.RefreshTokenView.as_view()),
]
