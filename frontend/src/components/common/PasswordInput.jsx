import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const PasswordInput = ({
  label,
  name,
  value,
  onChange,
  placeholder = 'Enter password',
  disabled = false,
  error = '',
  required = true,
}) => {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-4 py-2.5 pr-11 border-2 rounded-lg transition focus:outline-none ${
            error
              ? 'border-red-500 focus:border-red-600 bg-red-50 dark:bg-red-950'
              : 'border-gray-300 dark:border-gray-600 focus:border-primary-600 dark:focus:border-primary-500'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>}
    </div>
  )
}

export default PasswordInput
