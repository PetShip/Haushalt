'use client'

import { useState } from 'react'
import { createTask } from '@/actions/tasks'

interface AddTaskFormProps {
  kids: { id: string; firstName: string }[]
}

export default function AddTaskForm({ kids }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [group, setGroup] = useState<'REGULAR' | 'TEN_MIN'>('REGULAR')
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleKidToggle = (kidId: string) => {
    setSelectedKidIds(prev => 
      prev.includes(kidId) 
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    )
  }

  const handleSelectAll = () => {
    if (selectedKidIds.length === kids.length) {
      setSelectedKidIds([])
    } else {
      setSelectedKidIds(kids.map(k => k.id))
    }
  }

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
      await createTask({ 
        title: title.trim(), 
        group, 
        kidIds: selectedKidIds.length > 0 ? selectedKidIds : undefined,
        pin 
      })
      setTitle('')
      setGroup('REGULAR')
      setSelectedKidIds([])
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

      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Assign to Kids
          </label>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-primary-600 hover:text-primary-700"
            disabled={loading}
          >
            {selectedKidIds.length === kids.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="space-y-2 border border-gray-300 rounded-md p-3 max-h-40 overflow-y-auto">
          {kids.length === 0 ? (
            <p className="text-sm text-gray-500">No active kids available</p>
          ) : (
            kids.map((kid) => (
              <label key={kid.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedKidIds.includes(kid.id)}
                  onChange={() => handleKidToggle(kid.id)}
                  disabled={loading}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{kid.firstName}</span>
              </label>
            ))
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {selectedKidIds.length === 0 
            ? 'No kids selected - task will be assigned to all active kids'
            : `${selectedKidIds.length} kid(s) selected`}
        </p>
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
