import { useState, useRef } from 'react'

const TagsInput = ({ tags = [], onChange, placeholder = 'Add a tag' }) => {
  const [value, setValue] = useState('')
  const inputRef = useRef(null)

  const addTag = (tag) => {
    const t = tag.trim()
    if (!t) return
    if (tags.includes(t)) return
    onChange([...tags, t])
    setValue('')
  }

  const removeTag = (index) => {
    const next = tags.filter((_, i) => i !== index)
    onChange(next)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(value)
    } else if (e.key === 'Backspace' && !value && tags.length) {
      removeTag(tags.length - 1)
    }
  }

  return (
    <div className="border-2 border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, idx) => (
          <button
            type="button"
            key={tag + idx}
            onClick={() => removeTag(idx)}
            className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white px-3 py-1 rounded-full text-sm"
          >
            <span>{tag}</span>
            <span className="text-xs text-gray-500">×</span>
          </button>
        ))}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(value)}
          placeholder={placeholder}
          className="flex-1 min-w-[120px] bg-transparent outline-none px-1 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>
    </div>
  )
}

export default TagsInput
