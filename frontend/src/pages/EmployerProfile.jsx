import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks'
import { employerAPI } from '../services/api'
import toast from 'react-hot-toast'
import { User, Mail, Phone, MapPin, Building } from 'lucide-react'
import Card from '../components/common/Card'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

const EmployerProfile = () => {
  const { user, updateUser } = useAuth()
  const locations = ['Duvvada', 'Gajuwaka']
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company_name: user?.organization_name || '',
    business_type: user?.business_type || '',
    location:
      typeof user?.location === 'string'
        ? user.location
        : user?.location?.address || '',
  })
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      company_name: user?.organization_name || '',
      business_type: user?.business_type || '',
      location:
        typeof user?.location === 'string'
          ? user.location
          : user?.location?.address || '',
    })
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.location) {
      newErrors.location = 'Please select your location'
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validateForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setLoading(true)
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        organization_name: formData.company_name,
        business_type: formData.business_type,
        location: formData.location,
      }
      console.log('Employer Profile Save Payload:', payload)
      const response = await employerAPI.updateProfile(payload)
      console.log('Employer Profile API Response:', response)
      
      const locationData = 
        typeof response?.location === 'string'
          ? response.location
          : response?.location?.address || formData.location
      
      updateUser({
        name: response?.name || formData.name,
        phone: response?.phone || formData.phone,
        organization_name: response?.organization_name || formData.company_name,
        business_type: response?.business_type || formData.business_type,
        location: locationData,
      })
      toast.success('Profile updated successfully!')
      setEditing(false)
    } catch (error) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to update profile'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Company Profile</h1>
        <Button
          variant={editing ? 'secondary' : 'primary'}
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </Button>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 pb-6 border-b">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {formData.company_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formData.company_name}</h2>
              <p className="text-gray-600 dark:text-gray-300 mt-1">{formData.name}</p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <Input
              label="Contact Person"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!editing}
              icon={User}
            />
            <Input
              label="Company Name"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              disabled={!editing}
              icon={Building}
            />
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              disabled={!editing}
              icon={Phone}
            />
            {editing ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <MapPin size={18} />
                  </div>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border-2 transition focus:outline-none pl-10 ${
                      errors.location
                        ? 'border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-700'
                    }`}
                    required
                  >
                    <option value="">Select Location</option>
                    {locations.map((locationOption) => (
                      <option key={locationOption} value={locationOption}>
                        {locationOption}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.location && (
                  <div className="flex items-center space-x-1 mt-2 text-red-600">
                    <span className="text-sm">{errors.location}</span>
                  </div>
                )}
              </div>
            ) : (
              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={true}
                icon={MapPin}
              />
            )}

            {editing && (
              <Input
                label="Business Type"
                name="business_type"
                value={formData.business_type}
                onChange={handleChange}
                placeholder="e.g., Retail, Agriculture, Services"
                icon={Building}
              />
            )}
          </div>

          {/* Submit Button */}
          {editing && (
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Save Changes
            </Button>
          )}
        </form>
      </Card>
    </motion.div>
  )
}

export default EmployerProfile
