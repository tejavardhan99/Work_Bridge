import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Briefcase, CheckCircle } from 'lucide-react'
import Input from '../components/common/Input'
import PasswordInput from '../components/common/PasswordInput'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Spinner from '../components/common/Spinner'
import { useAuthStore } from '../context/store'
import { useUIStore } from '../context/store'
import { apiClient } from '../services/api'
import { validateEmail, validatePhone, validatePassword, validatePasswordStrength } from '../utils/helpers'

const Register = () => {
  const [step, setStep] = useState(1)
  const locations = ['Duvvada', 'Gajuwaka']

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'worker',
    location: '',
    company_name: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const navigate = useNavigate()
  const { setUser, setTokens, setUserRole } = useAuthStore()
  const { darkMode } = useUIStore()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      newErrors.phone = 'Phone or email is required'
      newErrors.email = 'Phone or email is required'
    } else {
      if (formData.phone.trim() && !/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number'
      }
      if (formData.email.trim() && !validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address'
      }
    }
    return newErrors
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.location) {
      newErrors.location = 'Please select your location'
    }
    if (formData.role === 'employer' && !formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    }
    return newErrors
  }

  const handleNextStep = () => {
    const newErrors = step === 1 ? validateStep1() : validateStep2()
    if (Object.keys(newErrors).length === 0) {
      if (step === 1) {
        setStep(2)
      } else {
        handleSubmit()
      }
    } else {
      setErrors(newErrors)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const endpoint =
        formData.role === 'worker' ? '/auth/worker-register/' : '/auth/employer-register/'

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        location: formData.location,
      }

      const response = await apiClient.post(endpoint, payload)
      const { user, tokens } = response
      const { access, refresh } = tokens

      // Save auth state
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      setTokens(access, refresh)
      setUser(user)
      setUserRole(formData.role)

      toast.success('Registration successful! Redirecting to dashboard...')
      const dashboardRoute =
        formData.role === 'employer'
          ? '/dashboard/employer'
          : formData.role === 'admin'
          ? '/dashboard/admin'
          : '/dashboard/worker'
      setTimeout(() => {
        navigate(dashboardRoute)
      }, 800)
    } catch (error) {
      let message = 'Registration failed. Please try again.'
      const data = error.response?.data
      if (data) {
        if (data.message) {
          message = data.message
        } else if (data.error && typeof data.error === 'object') {
          const parts = []
          for (const [k, v] of Object.entries(data.error)) {
            if (Array.isArray(v)) parts.push(`${k}: ${v.join(' ')}`)
            else parts.push(`${k}: ${v}`)
          }
          if (parts.length) message = parts.join(' ')
        } else if (typeof data === 'string') {
          message = data
        }
      }
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
                whileHover={{ scale: 1.05, rotate: -5 }}
                className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg"
              />
            </div>
            <h1 className={`text-4xl font-bold ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Join WorkBridge
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {step === 1 ? 'Create your account' : 'Set your password'}
            </p>
            {/* Progress Indicator */}
            <div className="flex gap-2 mt-4 justify-center">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                className={`h-2 w-8 rounded-full origin-left ${
                  step >= 1 ? 'bg-primary-600' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`}
              />
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: step >= 2 ? 1 : 0 }}
                transition={{ delay: 0.3 }}
                className={`h-2 w-8 rounded-full origin-left ${
                  step >= 2 ? 'bg-primary-600' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
                }`}
              />
            </div>
          </motion.div>

          {/* Form */}
          <motion.div variants={itemVariants}>
            <Card className={`space-y-6 ${
              darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'
            }`}>
              {/* Role Selection */}
              {step === 1 && (
                <motion.div variants={itemVariants}>
                  <label className={`block text-sm font-semibold mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    I am a
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: 'worker', icon: User, label: 'Worker' },
                      { value: 'employer', icon: Briefcase, label: 'Employer' },
                    ].map((option) => {
                      const Icon = option.icon
                      return (
                        <motion.button
                          key={option.value}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, role: option.value }))
                          }
                          className={`flex-1 py-3 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                            formData.role === option.value
                              ? 'bg-gradient-primary text-white shadow-lg'
                              : darkMode
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Icon size={18} />
                          <span>{option.label}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              <form className="space-y-4">
                {step === 1 ? (
                  <>
                    {/* Name */}
                    <motion.div variants={itemVariants}>
                      <Input
                        icon={User}
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        label="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        error={errors.name}
                      />
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
                    <motion.div variants={itemVariants}>
                      <Input
                        icon={Mail}
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        label="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                      />
                    </motion.div>
                  </>
                ) : (
                  <>
                    {/* Location */}
                    <motion.div variants={itemVariants}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <MapPin size={18} />
                        </div>
                        <select
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          className={`w-full px-4 py-2.5 rounded-lg border-2 transition focus:outline-none pl-10 ${
                            errors.location
                              ? 'border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-700'
                          }`}
                          required
                        >
                          <option value="">Select Location</option>
                          {locations.map((locationOption) => (
                            <option key={locationOption} value={locationOption}>
                              {locationOption}
                            </option>
                          ))}
                        </select>
                      </div>
                      {errors.location && (
                        <div className="flex items-center space-x-1 mt-2 text-red-600">
                          <span className="text-sm">{errors.location}</span>
                        </div>
                      )}
                    </motion.div>

                    {/* Company Name - Only for Employer */}
                    {formData.role === 'employer' && (
                      <motion.div variants={itemVariants}>
                        <Input
                          icon={Briefcase}
                          type="text"
                          name="company_name"
                          placeholder="Enter your company name"
                          label="Company Name"
                          value={formData.company_name}
                          onChange={handleChange}
                          error={errors.company_name}
                        />
                      </motion.div>
                    )}

                    {/* Password */}
                    <motion.div variants={itemVariants}>
                      <PasswordInput
                        name="password"
                        placeholder="Create a password"
                        label="Password"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                      />
                    </motion.div>

                    {/* Confirm Password */}
                    <motion.div variants={itemVariants}>
                      <PasswordInput
                        name="confirmPassword"
                        placeholder="Confirm your password"
                        label="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        error={errors.confirmPassword}
                      />
                    </motion.div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-sm p-3 rounded-lg ${
                          darkMode
                            ? 'bg-gray-700/50 border border-gray-600'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <p className={`mb-2 font-medium ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Password Strength:
                        </p>
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((i) => {
                            const strength = validatePasswordStrength(formData.password)
                            const filled = i < strength
                            return (
                              <motion.div
                                key={i}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className={`h-2 flex-1 rounded-full origin-left ${
                                  filled ? 'bg-green-500' : darkMode ? 'bg-gray-600' : 'bg-gray-300'
                                }`}
                              />
                            )
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Password Match Indicator */}
                    {formData.password && formData.confirmPassword && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`flex items-center gap-2 text-sm p-3 rounded-lg ${
                          formData.password === formData.confirmPassword
                            ? darkMode
                              ? 'bg-green-900/20 border border-green-700 text-green-400'
                              : 'bg-green-50 border border-green-200 text-green-700'
                            : darkMode
                            ? 'bg-red-900/20 border border-red-700 text-red-400'
                            : 'bg-red-50 border border-red-200 text-red-700'
                        }`}
                      >
                        <CheckCircle size={16} />
                        <span>
                          {formData.password === formData.confirmPassword
                            ? 'Passwords match'
                            : 'Passwords do not match'}
                        </span>
                      </motion.div>
                    )}
                  </>
                )}

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

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-4">
                  {step === 2 && (
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        className="w-full"
                        onClick={() => {
                          setStep(1)
                          setErrors({})
                        }}
                      >
                        Back
                      </Button>
                    </motion.div>
                  )}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={step === 1 ? 'w-full' : 'flex-1'}
                  >
                    <Button
                      type="button"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      loading={loading}
                      onClick={handleNextStep}
                    >
                      {loading ? (
                        <Spinner size="sm" />
                      ) : step === 1 ? (
                        'Next'
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </motion.div>
                </div>
              </form>

              {/* Sign In Link */}
              <motion.div variants={itemVariants} className={`border-t pt-4 text-center text-sm ${
                darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
              }`}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold"
                >
                  Sign in
                </Link>
              </motion.div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default Register
