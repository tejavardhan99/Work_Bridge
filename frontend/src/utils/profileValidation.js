/**
 * Check if an employer profile is complete
 * Required fields: name, company_name, phone, location
 * @param {object} profile - Employer profile object
 * @returns {boolean} True if profile has all required fields
 */
export const isEmployerProfileComplete = (profile) => {
  if (!profile) return false

  const hasName = profile?.name && profile.name.trim() !== ''
  const hasCompanyName =
    (profile?.organization_name && profile.organization_name.trim() !== '') ||
    (profile?.company_name && profile.company_name.trim() !== '')
  const hasPhone = profile?.phone && profile.phone.trim() !== ''
  const hasLocation = profile?.location && (
    (typeof profile.location === 'string' && profile.location.trim() !== '') ||
    (typeof profile.location === 'object' && (
      profile.location.address?.trim() ||
      profile.location.village?.trim() ||
      profile.location.district?.trim() ||
      profile.location.state?.trim()
    ))
  )

  const complete = hasName && hasCompanyName && hasPhone && hasLocation
  if (import.meta.env.DEV) {
    console.log('Profile Complete:', complete, {
      hasName,
      hasCompanyName,
      hasPhone,
      hasLocation,
      profile,
    })
  }

  return complete
}

/**
 * Check if a worker profile is complete
 * Required fields: name, phone, skills, location
 * @param {object} profile - Worker profile object
 * @returns {boolean} True if profile has all required fields
 */
export const isWorkerProfileComplete = (profile) => {
  if (!profile) return false
  
  const hasName = profile?.name && profile.name.trim() !== ''
  const hasPhone = profile?.phone && profile.phone.trim() !== ''
  const hasSkills = Array.isArray(profile?.skills) ? profile.skills.length > 0 : !!profile?.skills
  const hasLocation = profile?.location && (
    profile.location.address?.trim() ||
    profile.location.village?.trim() ||
    profile.location.district?.trim() ||
    profile.location.state?.trim()
  )
  
  return hasName && hasPhone && hasSkills && hasLocation
}
