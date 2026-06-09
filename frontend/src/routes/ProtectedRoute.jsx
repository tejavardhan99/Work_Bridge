import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../context/store'

export const ProtectedRoute = ({ children, requiredRole = null, loginPath = '/login' }) => {
  const { isAuthenticated, userRole } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to={loginPath} replace />
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
