import { forwardRef } from 'react'
import { AlertCircle } from 'lucide-react'

const Input = forwardRef(
  (
    {
      type = 'text',
      placeholder = '',
      label = '',
      error = '',
      icon: Icon = null,
      variant = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'w-full px-4 py-2.5 rounded-lg border-2 transition focus:outline-none'

    const variants = {
      default:
        'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-700',
      error:
        'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-red-500 placeholder-red-400 dark:placeholder-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100',
      dark:
        'bg-gray-800 text-white border-gray-700 placeholder-gray-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-700',
    }

    const inputVariant = error ? 'error' : variant

    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Icon size={18} />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            className={`${baseClasses} ${variants[inputVariant]} ${Icon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && (
          <div className="flex items-center space-x-1 mt-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
