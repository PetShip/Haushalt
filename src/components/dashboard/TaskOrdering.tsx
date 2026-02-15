'use client'

import { useState, useEffect } from 'react'
import { reorderTasks } from '@/actions/tasks'
import { useRouter } from 'next/navigation'

interface TaskOrderingProps {
  tasks: { id: string; title: string; order: number }[]
  pinRequired?: boolean
}

export default function TaskOrdering({ tasks, pinRequired = false }: TaskOrderingProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [orderedTasks, setOrderedTasks] = useState(tasks)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const checkAuth = () => {
      if (!pinRequired) {
        setIsAuthenticated(true)
        return
      }
      const storedPin = sessionStorage.getItem('haushalt_pin')
      setIsAuthenticated(!!storedPin)
    }

    checkAuth()
    const interval = setInterval(checkAuth, 500)
    return () => clearInterval(interval)
  }, [pinRequired])

  useEffect(() => {
    setOrderedTasks(tasks)
  }, [tasks])

  const moveTask = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === orderedTasks.length - 1)
    ) {
      return
    }

    const newTasks = [...orderedTasks]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newTasks[index], newTasks[swapIndex]] = [newTasks[swapIndex], newTasks[index]]
    
    setOrderedTasks(newTasks)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!isAuthenticated) {
      setError('Please unlock first')
      return
    }

    const pin = sessionStorage.getItem('haushalt_pin')
    if (!pin) {
      setError('PIN not found. Please unlock again.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await reorderTasks({
        taskIds: orderedTasks.map((t) => t.id),
        pin,
      })
      setHasChanges(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setOrderedTasks(tasks)
    setHasChanges(false)
    setError(null)
  }

  if (!isAuthenticated || orderedTasks.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Reorder Tasks</h2>
      <p className="text-sm text-gray-600 mb-4">
        Change the order in which tasks appear on the dashboard
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2 mb-4">
        {orderedTasks.map((task, index) => (
          <div
            key={task.id}
            className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex flex-col gap-1">
              <button
                onClick={() => moveTask(index, 'up')}
                disabled={index === 0}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => moveTask(index, 'down')}
                disabled={index === orderedTasks.length - 1}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <div className="flex-1 font-medium text-gray-900">
              {index + 1}. {task.title}
            </div>
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Order'}
          </button>
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  )
}
