import React from 'react'
import RecommendationBadge from './RecommendationBadge'

const RecommendedJobCard = ({ job }) => {
  const { job_id, title, score, skill_match, location_match, general_job } = job
  return (
    <div className="p-4 border rounded-lg shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">Job ID: {job_id}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Score</div>
          <div className="text-2xl font-bold text-primary-600">{score}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-y-1 items-center">
        {score >= 180 && <RecommendationBadge type="best" />}
        {location_match && <RecommendationBadge type="location_match" />}
        {skill_match && <RecommendationBadge type="skill_match" />}
        {general_job && <RecommendationBadge type="general_job" />}
      </div>
    </div>
  )
}

export default RecommendedJobCard
