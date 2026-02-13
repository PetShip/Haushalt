'use client'

import { useState, useEffect } from 'react'
import { TaskStats } from '@/lib/analytics'
import AddCompletionModal from './AddCompletionModal'

interface RegularTaskChartProps {
  task: TaskStats
  kids: { id: string; firstName: string }[]
  pinRequired?: boolean
}

export default function RegularTaskChart({ task, kids, pinRequired = false }: RegularTaskChartProps) {
  const [showModal, setShowModal] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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

  // Filter to only show kids assigned to this task
  const assignedKids = task.assignedKids && task.assignedKids.length > 0
    ? kids.filter(kid => task.assignedKids!.some(ak => ak.kidId === kid.id))
    : kids

  // Calculate max count for scaling (only among assigned kids)
  const maxCount = Math.max(
    ...assignedKids.map((kid) => {
      const completion = task.completionsByKid.find((c) => c.kidId === kid.id)
      return completion?.count || 0
    }),
    1 // Minimum of 1 to avoid division by zero
  )

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{task.taskTitle}</h3>
          {isAuthenticated && (
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
            >
              + Add
            </button>
          )}
        </div>
        <div className="space-y-3">
          {assignedKids.length === 0 ? (
            <p className="text-gray-500 text-sm">No kids assigned to this task</p>
          ) : (
            assignedKids.map((kid) => {
              const completion = task.completionsByKid.find((c) => c.kidId === kid.id)
              const count = completion?.count || 0
              const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0
              
              // Determine if this kid is falling behind
              const isFallingBehind = count < maxCount && maxCount > 0
              
              return (
                <div key={kid.id} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{kid.firstName}</span>
                    <span className={`font-semibold ${isFallingBehind ? 'text-red-600' : 'text-green-600'}`}>
                      {count} {count === 1 ? 'completion' : 'completions'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFallingBehind
                          ? 'bg-gradient-to-r from-yellow-400 to-red-500'
                          : 'bg-gradient-to-r from-green-400 to-green-600'
                      }`}
                      style={{ width: `${Math.max(percentage, count > 0 ? 10 : 0)}%` }}
                    >
                      {count > 0 && (
                        <span className="flex items-center justify-center h-full text-xs font-bold text-white">
                          {count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total completions:</span>
            <span className="font-semibold">{task.totalCompletions}</span>
          </div>
        </div>
      </div>

      {showModal && (
        <AddCompletionModal
          task={{ id: task.taskId, title: task.taskTitle, assignedKids: task.assignedKids }}
          kids={kids}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
