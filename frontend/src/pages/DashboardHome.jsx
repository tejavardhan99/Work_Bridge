import { useEffect } from 'react'
import { useAuth } from '../hooks'
import { useNavigate } from 'react-router-dom'

const DashboardHome = () => {
  const { userRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (userRole === 'employer') navigate('/dashboard/employer', { replace: true })
    else if (userRole === 'admin') navigate('/admin-dashboard', { replace: true })
    else navigate('/dashboard/worker', { replace: true })
  }, [userRole, navigate])

  return null
}

export default DashboardHome
