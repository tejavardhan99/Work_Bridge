import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks'
import { jobsAPI, normalizeResponseList, employerAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Briefcase, Users, TrendingUp, Eye } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { Link, useNavigate } from 'react-router-dom'
import { isEmployerProfileComplete } from '../../utils/profileValidation'

const EmployerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    activeJobs: 0,
    totalViews: 0,
    pendingApplications: 0,
  })
  const [recentJobs, setRecentJobs] = useState([])
  const [recentApplications, setRecentApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    if (user?.id) {
      console.log("EmployerDashboard: Loading data for user ID:", user.id);
      loadDashboardData()
    } else {
      console.log("EmployerDashboard: Waiting for user authentication");
    }
  }, [user?.id])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('access_token') || (window.__AUTH_STORE__ && window.__AUTH_STORE__.accessToken)
      console.log("EmployerDashboard: Sending token:", token ? token.slice(0,8) : null)
      console.log("EmployerDashboard: Fetching employer jobs");
      const response = await jobsAPI.getMyJobs({ page_size: 1000 })
      console.log("EmployerDashboard: API Response data:", response);
      const jobs = normalizeResponseList(response.results || [])
      console.log("EmployerDashboard: Total Jobs Returned:", jobs.length);
      console.log("EmployerDashboard: Resolved Jobs state:", jobs);

      setRecentJobs(jobs)
      setRecentApplications([])

      const pendingResponse = await employerAPI.getAllApplications({ status: 'pending', page_size: 1, page: 1 })
      setStats({
        totalJobs: jobs.length,
        totalApplications: jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0),
        activeJobs: jobs.filter((j) => j.status === 'active' || j.status === 'open').length,
        totalViews: jobs.reduce((sum, j) => sum + (j.views || 0), 0),
        pendingApplications: pendingResponse.total || 0,
      })

      // Check employer profile completeness
      const profileResponse = await employerAPI.getProfile()
      const employer = profileResponse.employer
      const isComplete = isEmployerProfileComplete(employer)
      console.log('EmployerDashboard: employer profile complete', isComplete, employer)
      setProfileComplete(!!isComplete)
    } catch (error) {
      console.error("EmployerDashboard: loadDashboardData error:", error);
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { icon: Briefcase, label: 'Total Jobs', value: stats.totalJobs },
    { icon: Users, label: 'Applications', value: stats.totalApplications },
    { icon: TrendingUp, label: 'Pending Applications', value: stats.pendingApplications },
    { icon: Eye, label: 'Total Views', value: stats.totalViews },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Manage your jobs and applications</p>
      </motion.div>

      {/* Profile Incomplete Warning Banner */}
      {!profileComplete && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl" role="img" aria-label="warning">⚠</span>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-400">Your profile is incomplete</h4>
              <p className="text-sm text-amber-700 dark:text-amber-500/90 mt-0.5">Complete your profile to start posting jobs.</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              console.log('Redirecting employer to profile page from dashboard banner')
              navigate('/profile/employer')
            }}
            className="bg-amber-600 hover:bg-amber-700 border-none text-white font-semibold py-2 px-4 shadow-sm shrink-0"
          >
            Complete Profile
          </Button>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Icon size={24} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Jobs</h2>
          {profileComplete ? (
            <Link to="/post-job">
              <Button variant="primary" size="sm">
                Post New Job
              </Button>
            </Link>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              disabled
              title="Complete your profile before posting jobs"
              onClick={() => {
                console.log('Redirecting employer to profile page from disabled dashboard button')
                navigate('/profile/employer')
              }}
              className="opacity-60 cursor-not-allowed"
            >
              Post New Job
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {recentJobs.slice(0, 5).map((job) => (
              <Card key={job.id} hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{job.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {job.applications_count || 0} applications · Hired {job.filled_openings || 0}/{job.openings || 1}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {job.remaining_openings ?? Math.max(0, (job.openings || 1) - (job.filled_openings || 0))} remaining
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        job.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-gray-600 py-8">No jobs posted yet</p>
          </Card>
        )}
      </motion.div>

      {/* Recent Applications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Applications</h2>

        {recentApplications.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {recentApplications.slice(0, 5).map((app) => (
              <Card key={app.id} hover>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {app.worker_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">{app.job_title}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Review
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-gray-600 py-8">No applications yet</p>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

export default EmployerDashboard
