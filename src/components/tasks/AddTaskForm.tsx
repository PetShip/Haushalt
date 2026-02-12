'use client'

import { useState } from 'react'
import { createTask } from '@/actions/tasks'

export default function AddTaskForm() {
  const [title, setTitle] = useState('')
  const [group, setGroup] = useState<'REGULAR' | 'TEN_MIN'>('REGULAR')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setLoading(true)

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await createTask({ title: title.trim(), group, pin })
      setTitle('')
      setGroup('REGULAR')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Add New Task</h2>

      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Task Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={loading}
          placeholder="Enter task title..."
        />
      </div>

      <div className="mb-4">
        <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-2">
          Task Group
        </label>
        <select
          id="group"
          value={group}
          onChange={(e) => setGroup(e.target.value as 'REGULAR' | 'TEN_MIN')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={loading}
        >
          <option value="REGULAR">Regular Tasks</option>
          <option value="TEN_MIN">10-Minute Tasks</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Task'}
      </button>
    </form>
  )
}
