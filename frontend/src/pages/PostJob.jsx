import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Briefcase, IndianRupee } from 'lucide-react'
import Input from '../components/common/Input'
import TagsInput from '../components/common/TagsInput'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import Spinner from '../components/common/Spinner'
import apiClient, { employerAPI } from '../services/api'
import { useAuth } from '../hooks'
import { isEmployerProfileComplete } from '../utils/profileValidation'

const PostJob = () => {
  const { jobId } = useParams()
  const isEdit = !!jobId
  const navigate = useNavigate()

  const DURATION_OPTIONS = [
    'Flexible',
    '1 day',
    '2 days',
    '3 days',
    '5 days',
    '1 week',
    '2 weeks',
    '1 month',
    '3 months',
  ]

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    salary: '',
    duration: 'Flexible',
    urgency: 'normal',
    worker_level_required: 'Beginner',
    required_skills: [],
    address: '',
    village: '',
    district: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    openings: 1,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const { user } = useAuth()
  const [profileComplete, setProfileComplete] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profileLoadError, setProfileLoadError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  // Check employer profile completeness on mount
  useEffect(() => {
    const checkProfileCompleteness = async () => {
      try {
        setLoadingProfile(true)
        setProfileLoadError(null)
        const response = await employerAPI.getProfile()
        const employer = response?.employer ?? response

        const validatedProfile = {
          ...employer,
          name: employer?.name || user?.name,
          phone: employer?.phone || user?.phone,
          email: employer?.email || user?.email,
          organization_name:
            employer?.organization_name ||
            employer?.company_name ||
            user?.organization_name ||
            user?.company_name,
          company_name:
            employer?.company_name ||
            employer?.organization_name ||
            user?.organization_name ||
            user?.company_name,
          location: employer?.location || user?.location,
        }

        console.log('Employer Profile:', validatedProfile)
        const isComplete = isEmployerProfileComplete(validatedProfile)
        console.log('Profile Complete:', isComplete)

        setProfileComplete(!!isComplete)
      } catch (error) {
        console.error('Failed to load employer profile:', error)
        setProfileLoadError(error)
        toast.error('Failed to validate your profile. Please try again.')

        const fallbackProfile = {
          name: user?.name,
          phone: user?.phone,
          organization_name: user?.organization_name || user?.company_name,
          company_name: user?.organization_name || user?.company_name,
          location: user?.location,
        }
        setProfileComplete(!!isEmployerProfileComplete(fallbackProfile))
      } finally {
        setLoadingProfile(false)
      }
    }

    checkProfileCompleteness()
  }, [user])

  useEffect(() => {
    if (!loadingProfile && !profileLoadError && !profileComplete) {
      console.log('Redirecting employer to profile page')
      navigate('/profile/employer')
    }
  }, [loadingProfile, profileComplete, profileLoadError, navigate])

  useEffect(() => {
    if (!isEdit) return

    const loadJob = async () => {
      try {
        const response = await apiClient.get(`/jobs/${jobId}/`)
        const job = response.job
        const location = job.location || {}
        setFormData({
          title: job.title || '',
          description: job.description || '',
          salary: job.salary || '',
          openings: job.openings || 1,
          duration: job.duration || 'Flexible',
          urgency: job.urgency || 'normal',
          worker_level_required: job.worker_level_required || 'Beginner',
          required_skills: job.required_skills || [],
          address: location.address || location.village || '',
          village: location.village || location.address || '',
          district: location.district || 'Visakhapatnam',
          state: location.state || 'Andhra Pradesh',
        })
      } catch (error) {
        toast.error('Failed to load job details')
      }
    }

    loadJob()
  }, [isEdit, jobId])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.salary || Number(formData.salary) <= 0) newErrors.salary = 'Salary is required'
    if (!formData.openings || Number(formData.openings) < 1) newErrors.openings = 'Number of openings must be at least 1'
    if (Number(formData.openings) > 100) newErrors.openings = 'Number of openings must be at most 100'
    if (!formData.duration || !formData.duration.trim()) newErrors.duration = 'Please select job duration'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!formData.village.trim()) newErrors.village = 'Village is required'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Check profile completeness before submitting
    if (!profileComplete) {
      toast.error('Please complete your profile before posting jobs.')
      console.log('Redirecting employer to profile page before submit')
      navigate('/profile/employer')
      return
    }

    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      salary: Number(formData.salary),
      openings: Number(formData.openings),
      duration: formData.duration.trim() || 'Flexible',
      urgency: formData.urgency,
      worker_level_required: formData.worker_level_required,
      required_skills: Array.isArray(formData.required_skills)
        ? formData.required_skills.map((s) => s.trim()).filter(Boolean)
        : [],
      location: {
        address: formData.address.trim(),
        village: formData.village.trim(),
        district: formData.district,
        state: formData.state,
      },
    }

    try {
      if (isEdit) {
        await employerAPI.updateJob(jobId, payload)
        toast.success('Job updated successfully!')
      } else {
        await employerAPI.postJob(payload)
        toast.success('Job posted successfully!')
      }
      navigate('/manage-jobs')
    } catch (error) {
      console.error('PostJob submit error', error)
      toast.error(`Failed to ${isEdit ? 'update' : 'post'} job`) 
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading your employer profile...</p>
        </div>
      </div>
    )
  }

  if (profileLoadError && !profileComplete) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center text-center px-4">
        <p className="text-xl font-semibold text-gray-900 mb-3">Unable to validate your employer profile</p>
        <p className="text-gray-600 mb-6">
          We could not verify your profile information right now. Please refresh the page or try again later.
        </p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">
          {isEdit ? 'Edit Job' : 'Post a New Job'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEdit
            ? 'Update your job listing'
            : 'Fill in the details to post a new job opportunity'}
        </p>
      </div>

      {/* Profile Incomplete Warning Banner */}
      {!profileComplete && !loadingProfile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm mb-6"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl" role="img" aria-label="warning">⚠</span>
            <div>
              <h4 className="font-bold text-red-900 dark:text-red-400">Complete your profile before posting jobs</h4>
              <p className="text-sm text-red-700 dark:text-red-500/90 mt-0.5">Name, email, phone, and location are required before posting jobs.</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              console.log('Redirecting employer to profile page from PostJob banner')
              navigate('/profile/employer')
            }}
            className="bg-red-600 hover:bg-red-700 border-none text-white font-semibold py-2 px-4 shadow-sm shrink-0"
          >
            Complete Profile
          </Button>
        </motion.div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <Input
            icon={Briefcase}
            label="Job Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            error={errors.title}
            placeholder="e.g., Farm Laborer, Construction Worker"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none text-gray-900 dark:text-white"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Worker Level
              </label>
              <select
                name="worker_level_required"
                value={formData.worker_level_required}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none text-gray-900 dark:text-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Experienced">Experienced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              icon={IndianRupee}
              label="Salary (INR)"
              name="salary"
              type="number"
              value={formData.salary}
              onChange={handleChange}
              error={errors.salary}
              placeholder="₹"
            />
            <Input
              icon={Briefcase}
              label="Number of Openings"
              name="openings"
              type="number"
              min={1}
              max={100}
              value={formData.openings}
              onChange={handleChange}
              error={errors.openings}
              placeholder="Number of workers needed"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:border-primary-600 focus:outline-none"
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.duration && <p className="text-red-600 text-sm mt-1">{errors.duration}</p>}
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <div className="relative">
                <select
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:border-primary-600 focus:outline-none"
                >
                  <option value="">Select Location</option>
                  <option value="Duvvada">Duvvada</option>
                  <option value="Gajuwaka">Gajuwaka</option>
                </select>
              </div>
              {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">Village</label>
              <div className="relative">
                <select
                  name="village"
                  value={formData.village}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:border-primary-600 focus:outline-none"
                >
                  <option value="">Select Village</option>
                  <option value="Duvvada">Duvvada</option>
                  <option value="Gajuwaka">Gajuwaka</option>
                </select>
              </div>
              {errors.village && <p className="text-red-600 text-sm mt-1">{errors.village}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
              <input
                type="text"
                value="Visakhapatnam"
                readOnly
                className="w-full px-4 py-2.5 rounded-lg border-2 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value="Andhra Pradesh"
                readOnly
                className="w-full px-4 py-2.5 rounded-lg border-2 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 focus:outline-none"
              />
            </div>
          </div>
          {/* Latitude/Longitude removed — using human-readable location fields only */}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Required Skills
            </label>
            <TagsInput
              tags={formData.required_skills}
              placeholder="Add skills and press Enter"
              onChange={(tags) => setFormData((p) => ({ ...p, required_skills: tags }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary-600 focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Describe the job and responsibilities"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!profileComplete || loadingProfile}
              className="flex-1"
            >
              {isEdit ? 'Update Job' : 'Post Job'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => navigate('/manage-jobs')}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </motion.div>
  )
}

export default PostJob
