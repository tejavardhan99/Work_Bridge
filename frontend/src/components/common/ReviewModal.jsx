import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'
import Button from './Button'
import RatingStars from './RatingStars'

const ReviewModal = ({ isOpen, onClose, onSubmit, workerName = 'Worker', isSubmitting = false }) => {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setRating(5)
      setComment('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }, [isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (rating > 0) {
      onSubmit({ rating, comment })
      setRating(5)
      setComment('')
    }
  }

  const handleClose = () => {
    setRating(5)
    setComment('')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-xl w-full mx-4">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Rate {workerName}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Share your experience with this worker
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Rating Section */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Overall Rating
                  </label>
                  <div className="flex flex-col items-center py-4">
                    <RatingStars
                      rating={rating}
                      interactive={true}
                      onRatingChange={setRating}
                      size="xl"
                    />
                    <div className="mt-2 text-center min-h-[1.25rem]">
                      {rating === 5 && <p className="text-sm font-semibold text-green-600">Excellent</p>}
                      {rating === 4 && <p className="text-sm font-semibold text-emerald-600">Very Good</p>}
                      {rating === 3 && <p className="text-sm font-semibold text-yellow-600">Good</p>}
                      {rating === 2 && <p className="text-sm font-semibold text-amber-600">Fair</p>}
                      {rating === 1 && <p className="text-sm font-semibold text-rose-600">Poor</p>}
                      {rating === 0 && <p className="text-sm text-gray-500">Please select a rating</p>}
                    </div>
                  </div>
                </div>

                {/* Comment Section */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value)
                      // autosize
                      const ta = textareaRef.current
                      if (ta) {
                        ta.style.height = 'auto'
                        ta.style.height = Math.min(300, ta.scrollHeight) + 'px'
                      }
                    }}
                    placeholder="Share details about the work quality, professionalism, punctuality, etc. (optional)"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                      placeholder-gray-500 dark:placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                      overflow-hidden"
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {comment.length}/500 characters
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600
                      text-gray-700 dark:text-gray-300 font-medium
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || rating === 0}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white"
                  >
                    <Send size={16} />
                    Submit Review
                  </Button>
                </div>
              </form>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ReviewModal
