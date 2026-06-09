import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import apiClient, { workerAPI } from '../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks'
import { useUIStore } from '../context/store'
import { ArrowLeft, MapPin, Briefcase, Clock, IndianRupee } from 'lucide-react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'

const formatLocation = (location) => {
  if (!location) return 'Location unavailable'
  return location.address || location.village || location.district || location.state || 'Location unavailable'
}

const JobDetails = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [profileComplete, setProfileComplete] = useState(true)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const { userRole } = useAuth()
  const { fetchNotifications } = useUIStore()

  useEffect(() => {
    loadJobDetailsAndStatus()
  }, [jobId])

  const handleBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1)
    } else {
      navigate('/dashboard/worker')
    }
  }

  const loadJobDetailsAndStatus = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/jobs/${jobId}/`)
      setJob(response.job)

      if (userRole === 'worker') {
        // Fetch worker profile to check completeness
        const profileResponse = await workerAPI.getProfile()
        const worker = profileResponse.worker
        
        const isComplete = worker && 
                           worker.name && worker.name.trim() !== '' &&
                           worker.phone && worker.phone.trim() !== '' &&
                           worker.skills && worker.skills.length > 0 &&
                           worker.location && (worker.location.address || worker.location.village || worker.location.district || worker.location.state);
        
        setProfileComplete(!!isComplete)

        // Fetch applications to check if already applied
        const appsResponse = await workerAPI.getApplications()
        const hasApplied = appsResponse.results ? appsResponse.results.some(app => app.job?.id === jobId || app.job_id === jobId) : false
        setAlreadyApplied(hasApplied)
      }
    } catch (error) {
      toast.error('Failed to load job details')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    console.log("Apply clicked:", jobId)

    const accessToken = localStorage.getItem('access_token')
    if (!accessToken) {
      toast.error('Please login again to apply for jobs.')
      navigate('/login')
      return
    }

    try {
      setApplying(true)

      const profileResponse = await workerAPI.getProfile()
      const worker = profileResponse.worker
      const isComplete = worker &&
                         worker.name && worker.name.trim() !== '' &&
                         worker.phone && worker.phone.trim() !== '' &&
                         worker.skills && worker.skills.length > 0 &&
                         worker.location && (worker.location.address || worker.location.village || worker.location.district || worker.location.state)

      if (!isComplete) {
        toast.error('Please complete your profile before applying for jobs.')
        navigate('/profile/worker')
        return
      }

      const response = await workerAPI.applyJob(jobId)
      console.log('Apply Response:', response)

      toast.success('Application submitted successfully')
      setAlreadyApplied(true)
      await fetchNotifications().catch((error) => {
        console.error('JobDetails notification refresh failed:', error)
      })
    } catch (error) {
      console.error('Apply Error:', error.response || error)
      console.error('Apply Error response data:', error.response?.data)
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to apply for this job.'

      if (error.response?.data?.error === 'You already applied for this job.') {
        toast.warning('You already applied for this job.')
        setAlreadyApplied(true)
      } else if (error.response?.status === 401) {
        toast.error('Please login again')
        navigate('/login')
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!job) {
    return (
      <Card>
        <p className="text-center text-gray-600 py-8">Job not found</p>
      </Card>
    )
  }

  const renderApplyButton = (className = "") => {
    if (!profileComplete) {
      return (
        <Button
          variant="secondary"
          size="lg"
          onClick={() => navigate('/profile/worker')}
          className={`${className} bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm`}
        >
          Complete Profile
        </Button>
      )
    }

    if (alreadyApplied) {
      return (
        <Button
          variant="secondary"
          size="lg"
          disabled
          className={`${className} bg-green-50 text-green-800 border border-green-200 cursor-default opacity-90`}
        >
          Applied
        </Button>
      )
    }

    return (
      <Button
        variant="primary"
        size="lg"
        loading={applying}
        onClick={handleApply}
        className={className}
      >
        {applying ? "Applying..." : "Apply"}
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* Header */}
      <Card className="space-y-4">
          <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-xl text-gray-600 mt-2">{formatLocation(job.location)}</p>
          </div>
          {userRole === 'worker' && renderApplyButton()}
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
          <div>
            <div className="flex items-center space-x-2 text-gray-600">
              <IndianRupee size={18} />
              <span className="text-sm">Salary</span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">₹{job.salary}</p>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin size={18} />
              <span className="text-sm">Location</span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatLocation(job.location)}</p>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock size={18} />
              <span className="text-sm">Duration</span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">{job.duration || 'Flexible'}</p>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Briefcase size={18} />
              <span className="text-sm">Level</span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1 capitalize">{job.worker_level_required}</p>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Clock size={18} />
              <span className="text-sm">Urgency</span>
            </div>
            <p className="text-xl font-bold text-green-600 mt-1 capitalize">{job.urgency}</p>
          </div>
          <div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Briefcase size={18} />
              <span className="text-sm">Hiring</span>
            </div>
            <p className="text-xl font-bold text-gray-900 mt-1">
              Hired {job.filled_openings || 0} / {job.openings || 1}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {job.applications_count || 0} applications · {job.remaining_openings ?? Math.max(0, (job.openings || 1) - (job.filled_openings || 0))} remaining
            </p>
          </div>
        </div>
      </Card>

      {/* Description */}
      <Card className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">About the Job</h2>
        <p className="text-gray-600 leading-relaxed">{job.description}</p>
      </Card>

      {/* Requirements */}
      {job.required_skills?.length > 0 && (
        <Card className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Required Skills</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {job.required_skills.map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex items-center justify-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Apply Button (worker only) */}
      {userRole === 'worker' && (
        <div className="flex gap-4">
          {renderApplyButton("flex-1")}
          <Button variant="secondary" size="lg" className="flex-1">
            Save Job
          </Button>
        </div>
      )}
    </motion.div>
  )
}

export default JobDetails
