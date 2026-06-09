import React from 'react'
import { motion } from 'framer-motion'
import { Calendar } from 'lucide-react'
import RatingStars from './RatingStars'

const ReviewCard = ({ review, index = 0 }) => {
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const employerName = review.employer_name || 'Anonymous Employer'
  const rating = review.rating || 0
  const comment = review.review || review.comment || ''
  const date = review.created_at || new Date().toISOString()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="p-4 rounded-lg border border-gray-200 dark:border-gray-700
        bg-white dark:bg-gray-800 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {employerName}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <RatingStars rating={rating} size="sm" />
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <Calendar size={12} />
          {formatDate(date)}
        </div>
      </div>

      {/* Comment */}
      {comment && (
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
          {comment}
        </p>
      )}

      {!comment && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
          No additional comment provided
        </p>
      )}
    </motion.div>
  )
}

export default ReviewCard
