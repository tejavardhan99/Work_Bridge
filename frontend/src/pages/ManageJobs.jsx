import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { jobsAPI, employerAPI, normalizeResponseList } from '../services/api'
import toast from 'react-hot-toast'
import { Edit2, Trash2, Plus, Users } from 'lucide-react'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import { useAuth } from '../hooks'
import { isEmployerProfileComplete } from '../utils/profileValidation'

const ManageJobs = () => {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user?.id) {
      console.log("ManageJobs: Loading data for user ID:", user.id)
      loadJobs()
      loadEmployerProfile()
    } else {
      console.log("ManageJobs: Waiting for user authentication")
    }
  }, [user?.id])

  const loadEmployerProfile = async () => {
    try {
      const response = await employerAPI.getProfile()
      const employer = response.employer
      const complete = isEmployerProfileComplete(employer)
      setProfileComplete(complete)
      console.log('ManageJobs: Employer profile complete:', complete)
    } catch (error) {
      console.error('ManageJobs: Failed to load employer profile', error)
    }
  }

  const handleNewJob = () => {
    if (profileComplete) {
      navigate('/post-job')
    } else {
      toast.error('Complete your profile before posting jobs.')
      navigate('/profile/employer')
    }
  }

  const loadJobs = async () => {
    try {
      const token = localStorage.getItem('access_token') || (window.__AUTH_STORE__ && window.__AUTH_STORE__.accessToken)
      console.log("ManageJobs: Sending token:", token ? token.slice(0,8) : null)
      console.log("ManageJobs: Fetching employer jobs");
      const response = await jobsAPI.getMyJobs({ page_size: 1000 })
      console.log("ManageJobs: API Response data:", response);
      const list = normalizeResponseList(response.results || [])
      console.log("ManageJobs: Total Jobs Returned:", list.length);
      console.log("ManageJobs: Resolved Jobs state:", list);
      setJobs(list)
    } catch (error) {
      console.error('ManageJobs load error', error)
      toast.error('Failed to load jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (jobId) => {
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        await employerAPI.deleteJob(jobId)
        setJobs(jobs.filter((j) => j.id !== jobId))
        toast.success('Job deleted successfully')
      } catch (error) {
        toast.error('Failed to delete job')
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Manage Jobs</h1>
          <p className="text-gray-600 mt-2">Control your posted jobs and applications</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="primary"
            size="lg"
            onClick={handleNewJob}
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Post New Job</span>
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/applications')}
            className="flex items-center space-x-2"
          >
            <Users size={20} />
            <span>Applications</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <Card key={job.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>{job.location?.address || job.location?.village || job.location?.district || job.location?.state || 'Location'}</span>
                    <span>₹{job.salary}</span>
                    <span>{job.duration || 'Flexible'}</span>
                    <span>{job.applications_count || 0} applications</span>
                    <span>Hired {job.filled_openings || 0} / {job.openings || 1}</span>
                    <span>{job.remaining_openings ?? Math.max(0, (job.openings || 1) - (job.filled_openings || 0))} remaining</span>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        job.status === 'open'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/jobs/${job.id}/applicants`)}
                    className="flex items-center space-x-1"
                  >
                    <Users size={16} />
                    <span>View Applicants</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/jobs/${job.id}/edit`)}
                    className="flex items-center space-x-1"
                  >
                    <Edit2 size={16} />
                    <span>Edit</span>
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(job.id)}
                    className="flex items-center space-x-1"
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-center text-gray-600 py-8">
            No jobs posted yet.{' '}
            <Button
              variant="primary"
              size="sm"
              onClick={handleNewJob}
              className="inline-flex items-center space-x-1 mt-2"
            >
              <Plus size={16} />
              <span>Post your first job</span>
            </Button>
          </p>
        </Card>
      )}
    </motion.div>
  )
}

export default ManageJobs
