import React, { useState, useEffect } from 'react'
import { Star } from 'lucide-react'

const RatingStars = ({ rating = 0, interactive = false, onRatingChange = null, size = 'lg' }) => {
  const [hoverRating, setHoverRating] = useState(0)
  const [selectedRating, setSelectedRating] = useState(rating)

  useEffect(() => {
    setSelectedRating(rating)
  }, [rating])

  const sizeMap = {
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
  }

  const px = sizeMap[size] || sizeMap.lg

  const handleStarClick = (star) => {
    if (interactive) {
      setSelectedRating(star)
      onRatingChange?.(star)
    }
  }

  const displayRating = interactive ? (hoverRating || selectedRating) : rating

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-3 touch-manipulation">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            disabled={!interactive}
            aria-label={`${star} star`}
            className={`p-2 rounded-md transition-transform duration-150 ease-out ${interactive ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
          >
            <Star
              size={px}
              className={`transition-colors duration-150 ${star <= displayRating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
            />
          </button>
        ))}
      </div>
      {!interactive && rating > 0 && (
        <span className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}

export default RatingStars
