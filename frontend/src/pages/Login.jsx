import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Phone } from 'lucide-react'
import Input from '../components/common/Input'
import PasswordInput from '../components/common/PasswordInput'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Spinner from '../components/common/Spinner'
import { useAuthStore } from '../context/store'
import { useUIStore } from '../context/store'
import { apiClient, authAPI } from '../services/api'

const Login = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    role: 'worker',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { setUser, setTokens, setUserRole } = useAuthStore()
  const { darkMode, fetchNotifications } = useUIStore()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      let response
      const payload = {
        identifier: formData.phone,
        password: formData.password,
      }

      if (formData.role === 'admin') {
        response = await authAPI.adminLogin(payload)
      } else if (formData.role === 'worker') {
        response = await authAPI.workerLogin(payload)
      } else {
        response = await authAPI.employerLogin(payload)
      }

      const { user, tokens } = response
      const { access, refresh } = tokens

      // Store tokens and user info
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setTokens(access, refresh)
      setUser(user)
      setUserRole(formData.role)
      await fetchNotifications().catch((error) => {
        console.error('Login notification fetch failed:', error)
      })

      toast.success(`Welcome back, ${user.name}!`)
      const dashboardRoute =
        formData.role === 'employer'
          ? '/dashboard/employer'
          : formData.role === 'admin'
          ? '/admin-dashboard'
          : '/dashboard/worker'
      navigate(dashboardRoute)
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.'
      toast.error(message)
      setErrors({ submit: message })
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div
      className={`min-h-screen py-12 px-4 sm:px-6 lg:px-8 flex items-center ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 to-gray-800'
          : 'bg-gradient-to-br from-slate-50 to-slate-100'
      }`}
    >
      <div className="max-w-md w-full mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center">
            <div className="flex justify-center mb-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-12 h-12 bg-gradient-to-br from-primary-600 to-blue-600 rounded-xl shadow-lg"
              />
            </div>
            <h1 className={`text-4xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome Back
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Sign in to your WorkBridge account
            </p>
          </motion.div>

          {/* Form */}
          <motion.div variants={itemVariants}>
            <Card className={`space-y-6 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
            }`}>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Role Selection */}
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-semibold mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Login As
                  </label>
                  <div className="flex gap-2">
                    {['worker', 'employer', 'admin'].map((role) => (
                      <motion.button
                        key={role}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setFormData((prev) => ({ ...prev, role }))}
                        className={`flex-1 py-2.5 px-3 rounded-lg font-medium transition capitalize ${
                          formData.role === role
                            ? 'bg-gradient-primary text-white shadow-lg'
                            : darkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {role}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                {/* Phone */}
                <motion.div variants={itemVariants}>
                  <Input
                    icon={Phone}
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    label="Phone Number"
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                  />
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants}>
                  <PasswordInput
                    name="password"
                    placeholder="Enter your password"
                    label="Password"
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                  />
                </motion.div>

                {/* Submit Error */}
                {errors.submit && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg border ${
                      darkMode
                        ? 'bg-red-900/20 border-red-700 text-red-400'
                        : 'bg-red-50 border-red-200 text-red-700'
                    }`}
                  >
                    <p className="text-sm font-medium">{errors.submit}</p>
                  </motion.div>
                )}

                {/* Submit Button */}
                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading}
                    className="w-full"
                  >
                    {loading ? <Spinner size="sm" /> : 'Sign In'}
                  </Button>
                </motion.div>
              </form>

              {/* Links */}
              <motion.div variants={itemVariants} className={`space-y-3 border-t pt-4 ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="text-center">
                  <Link
                    to="/"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <p className={`text-center text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
                  >
                    Sign up
                  </Link>
                </p>
              </motion.div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Login

