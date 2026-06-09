import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks'
import { workerAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Briefcase, MapPin, Star, Users, TrendingUp } from 'lucide-react'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'

const WorkerDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profileComplete, setProfileComplete] = useState(true)
  const [stats, setStats] = useState({
    totalApplications: 0,
    completedJobs: 0,
    totalEarnings: 0,
    avgRating: 0,
  })
  const [nearbyJobs, setNearbyJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await workerAPI.getNearbyJobs()
      setNearbyJobs(response.results || [])

      // Fetch worker profile to check completeness and rating
      const profileResponse = await workerAPI.getProfile()
      const worker = profileResponse.worker
      
      // Check if profile is complete
      const hasName = worker?.name && worker.name.trim() !== ''
      const hasPhone = worker?.phone && worker.phone.trim() !== ''
      const hasSkills = Array.isArray(worker?.skills) ? worker.skills.length > 0 : !!worker?.skills
      const hasLocation = worker?.location && (
        worker.location.address?.trim() || 
        worker.location.village?.trim() || 
        worker.location.district?.trim() || 
        worker.location.state?.trim()
      )
      
      const isComplete = hasName && hasPhone && hasSkills && hasLocation
      setProfileComplete(!!isComplete)

      // Fetch worker applications list to dynamically calculate stats
      const appsResponse = await workerAPI.getApplications()
      const apps = appsResponse.results || []
      const completedApps = apps.filter(app => app.status === 'completed')

      setStats({
        totalApplications: apps.length,
        completedJobs: completedApps.length,
        totalEarnings: completedApps.reduce((sum, app) => sum + (app.job?.salary || 0), 0),
        avgRating: worker?.average_rating || 0,
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      icon: Briefcase,
      label: 'Applications',
      value: stats.totalApplications,
      bgClass: 'bg-primary-100',
      iconClass: 'text-primary-600',
    },
    {
      icon: TrendingUp,
      label: 'Completed',
      value: stats.completedJobs,
      bgClass: 'bg-emerald-100',
      iconClass: 'text-emerald-600',
    },
    {
      icon: Users,
      label: 'Earnings',
      value: `₹${stats.totalEarnings}`,
      bgClass: 'bg-blue-100',
      iconClass: 'text-blue-600',
    },
    {
      icon: Star,
      label: 'Rating',
      value: `${stats.avgRating}/5`,
      bgClass: 'bg-amber-100',
      iconClass: 'text-amber-600',
    },
  ]

  return (
    <div className="space-y-8">
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
              <h4 className="font-bold text-amber-900 dark:text-amber-400">Complete your profile to unlock job applications</h4>
              <p className="text-sm text-amber-700 dark:text-amber-500/90 mt-0.5">Skills, location, name, and phone number are required before applying for jobs.</p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/profile/worker')}
            className="bg-amber-600 hover:bg-amber-700 border-none text-white font-semibold py-2 px-4 shadow-sm shrink-0"
          >
            Complete Profile
          </Button>
        </motion.div>
      )}

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">Here's what's happening in your job space</p>
      </motion.div>

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
                <div className="flex items-center justify-between">
                  <div className={`${stat.bgClass} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon size={24} className={stat.iconClass} />
                  </div>
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

      {/* Nearby Jobs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nearby Jobs</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/worker')}>
            View All
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : nearbyJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {nearbyJobs.slice(0, 5).map((job) => (
              <Card key={job.id} hover className="cursor-pointer" onClick={() => navigate(`/jobs/${job.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-300">
                      <span>{job.location?.address || job.location?.village || job.location?.district || job.location?.state || 'Location'}</span>
                      <div className="flex items-center space-x-1">
                        <MapPin size={14} />
                        <span>{job.location?.address || job.location?.village || job.location?.district || job.location?.state || 'Location'}</span>
                      </div>
                      <span>Hired {job.filled_openings || 0} / {job.openings || 1} · {job.remaining_openings ?? Math.max(0, (job.openings || 1) - (job.filled_openings || 0))} remaining</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">₹{job.salary}</p>
                    <Button variant="primary" size="sm" className="mt-2" onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}>
                      Apply
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-gray-600 py-8">No nearby jobs found</p>
          </Card>
        )}
      </motion.div>
    </div>
  )
}

export default WorkerDashboard
