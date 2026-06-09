import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import recommendationAPI from '../services/recommendationApi'
import toast from 'react-hot-toast'
import Card from '../components/common/Card'
import RecommendedJobCard from '../components/recommendations/RecommendedJobCard'

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    try {
      const response = await recommendationAPI.getRecommendedJobs()
      setRecommendations(response.results || [])
    } catch (error) {
      toast.error('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-4xl font-bold text-gray-900">Recommended for You</h1>
        <p className="text-gray-600 mt-2">
          Jobs best suited for your profile
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((r, index) => (
            <motion.div
              key={r.job_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <RecommendedJobCard job={r} />
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-center text-gray-600 py-12">
            No recommendations available yet. Complete your profile to get started!
          </p>
        </Card>
      )}
    </motion.div>
  )
}

export default Recommendations
