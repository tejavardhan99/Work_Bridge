import React from 'react'

const RecommendationBadge = ({ type }) => {
  let className = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mr-2'
  let label = ''
  switch (type) {
    case 'best':
      className += ' bg-amber-100 text-amber-800 border border-amber-200'
      label = 'Best Match'
      break
    case 'nearby':
    case 'location':
    case 'location_match':
      className += ' bg-blue-100 text-blue-800 border border-blue-200'
      label = 'Location Match'
      break
    case 'skill':
    case 'skill_match':
      className += ' bg-green-100 text-green-800 border border-green-200'
      label = 'Skill Match'
      break
    case 'general':
    case 'general_job':
      className += ' bg-purple-100 text-purple-800 border border-purple-200'
      label = 'General Job'
      break
    default:
      className += ' bg-gray-100 text-gray-700'
      label = type
  }

  return <span className={className}>{label}</span>
}

export default RecommendationBadge
