import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, PublicRoute } from './ProtectedRoute'

// Layouts
import MainLayout from '../layouts/MainLayout'
import DashboardLayout from '../layouts/DashboardLayout'

// Pages
import Landing from '../pages/Landing'
import Register from '../pages/Register'
import Login from '../pages/Login'
import NotFound from '../pages/NotFound'
import LoadingScreen from '../components/common/LoadingScreen'

// Lazy loaded pages
const WorkerDashboard = lazy(() => import('../pages/dashboards/WorkerDashboard'))
const EmployerDashboard = lazy(() => import('../pages/dashboards/EmployerDashboard'))
const AdminDashboard = lazy(() => import('../pages/dashboards/AdminDashboard'))
const AdminLogin = lazy(() => import('../pages/AdminLogin'))
const DashboardHome = lazy(() => import('../pages/DashboardHome'))
const ProfileHome = lazy(() => import('../pages/ProfileHome'))
const JobDetails = lazy(() => import('../pages/JobDetails'))
const PostJob = lazy(() => import('../pages/PostJob'))
const AppliedJobs = lazy(() => import('../pages/AppliedJobs'))
const ManageJobs = lazy(() => import('../pages/ManageJobs'))
const WorkerProfile = lazy(() => import('../pages/WorkerProfile'))
const EmployerProfile = lazy(() => import('../pages/EmployerProfile'))
const Notifications = lazy(() => import('../pages/Notifications'))
const Recommendations = lazy(() => import('../pages/Recommendations'))
const ViewApplicants = lazy(() => import('../pages/ViewApplicants'))
const EmployerApplications = lazy(() => import('../pages/EmployerApplications'))

export const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            }
          />
        </Route>

        {/* Auth Routes */}
        <Route element={<MainLayout />}>
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/admin-login"
            element={
              <PublicRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <AdminLogin />
                </Suspense>
              </PublicRoute>
            }
          />
        </Route>

        {/* Protected Routes - Dashboard */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <DashboardHome />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/worker"
            element={
              <ProtectedRoute requiredRole="worker">
                <Suspense fallback={<LoadingScreen />}>
                  <WorkerDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/employer"
            element={
              <ProtectedRoute requiredRole="employer">
                <Suspense fallback={<LoadingScreen />}>
                  <EmployerDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute requiredRole="admin" loginPath="/admin-login">
                <Navigate to="/admin-dashboard" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin" loginPath="/admin-login">
                <Suspense fallback={<LoadingScreen />}>
                  <AdminDashboard />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Protected Routes - Jobs */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/jobs/:jobId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <JobDetails />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-job"
            element={
              <ProtectedRoute requiredRole="employer">
                <Suspense fallback={<LoadingScreen />}>
                  <PostJob />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId/edit"
            element={
              <ProtectedRoute requiredRole="employer">
                <Suspense fallback={<LoadingScreen />}>
                  <PostJob />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applied-jobs"
            element={
              <ProtectedRoute requiredRole="worker">
                <Suspense fallback={<LoadingScreen />}>
                  <AppliedJobs />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-jobs"
            element={
              <ProtectedRoute requiredRole="employer">
                <Suspense fallback={<LoadingScreen />}>
                  <ManageJobs />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute requiredRole="employer">
                <Suspense fallback={<LoadingScreen />}>
                  <EmployerApplications />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/jobs/:jobId/applicants"
            element={
              <ProtectedRoute requiredRole="employer">
                <Suspense fallback={<LoadingScreen />}>
                  <ViewApplicants />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <ProtectedRoute requiredRole="worker">
                <Suspense fallback={<LoadingScreen />}>
                  <Recommendations />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Protected Routes - Profile */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <ProfileHome />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/worker"
            element={
              <ProtectedRoute requiredRole="worker">
                <Suspense fallback={<LoadingScreen />}>
                  <WorkerProfile />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/employer"
            element={
              <ProtectedRoute requiredRole="employer">
                <Suspense fallback={<LoadingScreen />}>
                  <EmployerProfile />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <Notifications />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
