'use client'

import { useState } from 'react'
import { createCompletion } from '@/actions/logs'

interface AddCompletionModalProps {
  task: { id: string; title: string; assignedKids?: { kidId: string; kidName: string }[] }
  kids: { id: string; firstName: string }[]
  onClose: () => void
}

export default function AddCompletionModal({ task, kids, onClose }: AddCompletionModalProps) {
  const [selectedKidId, setSelectedKidId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filter kids to only show those assigned to this task
  const availableKids = task.assignedKids && task.assignedKids.length > 0
    ? kids.filter(kid => task.assignedKids!.some(ak => ak.kidId === kid.id))
    : kids

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!selectedKidId) {
      setError('Please select a kid')
      return
    }

    setLoading(true)

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await createCompletion({
        kidId: selectedKidId,
        taskId: task.id,
        pin,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add completion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Add Completion</h2>
        <p className="text-gray-600 mb-4">
          Task: <span className="font-semibold">{task.title}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="kid" className="block text-sm font-medium text-gray-700 mb-2">
              Who completed this task?
            </label>
            <select
              id="kid"
              value={selectedKidId}
              onChange={(e) => setSelectedKidId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loading}
              aria-describedby={availableKids.length === 0 ? "no-kids-error" : undefined}
            >
              <option value="">Select a kid...</option>
              {availableKids.map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.firstName}
                </option>
              ))}
            </select>
            {availableKids.length === 0 && (
              <p id="no-kids-error" className="text-sm text-red-600 mt-1" role="alert">
                No kids are assigned to this task
              </p>
            )}
            {error && <p className="text-red-600 text-sm mt-1" role="alert">{error}</p>}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Completion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
