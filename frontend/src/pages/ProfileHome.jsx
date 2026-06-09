import { useEffect } from 'react'
import { useAuth } from '../hooks'
import { useNavigate } from 'react-router-dom'

const ProfileHome = () => {
  const { userRole } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (userRole === 'employer') navigate('/profile/employer', { replace: true })
    else if (userRole === 'admin') navigate('/profile', { replace: true })
    else navigate('/profile/worker', { replace: true })
  }, [userRole, navigate])

  return null
}

export default ProfileHome
