import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks'
import { workerAPI } from '../services/api'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Briefcase, Star, Award, TrendingUp } from 'lucide-react'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import RatingStars from '../components/common/RatingStars'
import ReviewCard from '../components/common/ReviewCard'

const WorkerProfile = () => {
  const { user, updateUser } = useAuth()
  const locations = ['Duvvada', 'Gajuwaka']
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location:
      typeof user?.location === 'string'
        ? user.location
        : user?.location?.address || '',
    skills: user?.skills?.join(', ') || '',
  })
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    loadProfile()
  }, [])

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location:
        typeof user?.location === 'string'
          ? user.location
          : user?.location?.address || '',
      skills: user?.skills?.join(', ') || '',
    })
  }, [user])

  const loadProfile = async () => {
    try {
      const response = await workerAPI.getProfile()
      setProfile(response?.worker || null)
    } catch (error) {
      console.error('Failed to load profile', error)
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.location) {
      newErrors.location = 'Please select your location'
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
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        skills: formData.skills.split(',').map((s) => s.trim()).filter(Boolean),
      }
      const response = await workerAPI.updateProfile(payload)
      const returnedWorker = response?.worker || response || null
      const locationData =
        typeof returnedWorker?.location === 'string'
          ? returnedWorker.location
          : returnedWorker?.location?.address || formData.location

      updateUser({
        name: returnedWorker?.name || formData.name,
        phone: returnedWorker?.phone || formData.phone,
        email: returnedWorker?.email || formData.email,
        location: locationData,
        skills: returnedWorker?.skills || payload.skills,
      })
      
      const updatedProfile = await workerAPI.getProfile()
      const worker = updatedProfile?.worker || {}
      updateUser({
        name: worker.name || formData.name,
        phone: worker.phone || formData.phone,
        email: worker.email || formData.email,
        location:
          typeof worker.location === 'string'
            ? worker.location
            : worker.location?.address || formData.location,
        skills: worker.skills || payload.skills,
      })
      
      setProfile(worker)
      toast.success('Profile updated successfully!')
      setEditing(false)
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update profile'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const rating = profile?.rating || 0
  const completedJobs = profile?.completed_jobs_count || 0
  const reviews = profile?.reviews || []
  const trustScore = profile?.trust_score || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
        <Button
          variant={editing ? 'secondary' : 'primary'}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="text-yellow-500 fill-yellow-500" size={24} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {rating.toFixed(1)}
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Award className="text-emerald-600" size={24} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Completed Jobs</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {completedJobs}
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail className="text-blue-600" size={24} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Reviews</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {reviews.length}
          </p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="text-purple-600" size={24} />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Trust Score</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {trustScore.toFixed(0)}
          </p>
        </Card>
      </div>

      {/* Profile Form */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formData.name}</h2>
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400 mt-1 text-sm">
                <div className="flex items-center gap-1">
                  <RatingStars rating={rating} size="sm" />
                  <span>({reviews.length} reviews)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!editing}
              icon={User}
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!editing}
              icon={Phone}
            />
            {editing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
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
              </div>
            ) : (
              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={true}
                icon={MapPin}
              />
            )}

            {editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills (comma-separated)
                </label>
                <Input
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  icon={Briefcase}
                  placeholder="e.g., Farming, Carpentry, Plumbing"
                />
              </div>
            )}

            {!editing && formData.skills && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.split(',').map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium"
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          {editing && (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Save Changes
            </Button>
          )}
        </form>
      </Card>

      {/* Reviews Section */}
      {!loadingProfile && reviews.length > 0 && (
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Star size={20} className="text-yellow-500 fill-yellow-500" />
                Recent Reviews
              </h3>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3">
              {reviews.slice(0, 5).map((review, idx) => (
                <ReviewCard key={idx} review={review} index={idx} />
              ))}
            </div>

            {reviews.length > 5 && (
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  +{reviews.length - 5} more review{reviews.length - 5 !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Empty Reviews State */}
      {!loadingProfile && reviews.length === 0 && completedJobs === 0 && (
        <Card className="text-center py-8">
          <Star size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No reviews yet</p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
            Complete your first job to earn reviews from employers
          </p>
        </Card>
      )}
    </motion.div>
  )
}

export default WorkerProfile
