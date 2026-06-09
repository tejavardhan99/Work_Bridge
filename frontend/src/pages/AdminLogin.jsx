import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Phone } from 'lucide-react'
import Input from '../components/common/Input'
import PasswordInput from '../components/common/PasswordInput'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import { useAuthStore } from '../context/store'
import { authAPI } from '../services/api'

const AdminLogin = () => {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { setUser, setTokens, setUserRole } = useAuthStore()

  const validateForm = () => {
    const newErrors = {}
    const trimmed = identifier.trim()
    if (!trimmed) {
      newErrors.identifier = 'Email or phone is required'
    } else if (trimmed.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmed)) {
        newErrors.identifier = 'Please enter a valid email address'
      }
    } else {
      const digits = trimmed.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 15) {
        newErrors.identifier = 'Please enter a valid phone number'
      }
    }
    if (!password) {
      newErrors.password = 'Password is required'
    }
    return newErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setLoading(true)
    try {
      console.log('Admin Login Attempt', { identifier })
      const response = await authAPI.adminLogin({ identifier: identifier.trim(), password })
      console.log('Admin Login Success', response)

      const { user, tokens } = response
      const { access, refresh } = tokens
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setTokens(access, refresh)
      setUser(user)
      setUserRole('admin')

      toast.success('Admin login successful')
      navigate('/admin-dashboard')
    } catch (error) {
      console.error('Admin Login Failed', error)
      const message = error.response?.data?.message || 'Invalid Admin Credentials'
      setErrors({ submit: message })
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md w-full mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-blue-600 rounded-xl shadow-lg" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Admin Login</h1>
            <p className="mt-2 text-gray-600">Sign in with admin credentials to access the platform dashboard.</p>
          </div>

          <Card className="space-y-6 bg-white">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                icon={Phone}
                type="text"
                name="identifier"
                placeholder="Enter admin email or phone"
                label="Email or Phone"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value)
                  if (errors.identifier) setErrors((prev) => ({ ...prev, identifier: '' }))
                }}
                error={errors.identifier}
              />

              <PasswordInput
                name="password"
                placeholder="Enter password"
                label="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                }}
                error={errors.password}
              />

              {errors.submit && (
                <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                  {errors.submit}
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" loading={loading}>
                Sign in as Admin
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminLogin
