'use client'

import { useState, useEffect } from 'react'
import { TaskStats } from '@/lib/analytics'
import AddCompletionModal from './AddCompletionModal'

interface TenMinTasksOverviewProps {
  tasks: TaskStats[]
  kids: { id: string; firstName: string }[]
  pinRequired?: boolean
}

export default function TenMinTasksOverview({ tasks, kids, pinRequired = false }: TenMinTasksOverviewProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string; assignedKids?: { kidId: string; kidName: string }[] } | null>(null)
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

  // Calculate total points per kid across all 10-minute tasks (only for tasks they're assigned to)
  const kidPoints = kids.map((kid) => {
    const totalPoints = tasks.reduce((sum, task) => {
      // Only count if kid is assigned to this task
      const isAssigned = !task.assignedKids || task.assignedKids.length === 0 || 
                        task.assignedKids.some(ak => ak.kidId === kid.id)
      if (!isAssigned) return sum
      
      const completion = task.completionsByKid.find((c) => c.kidId === kid.id)
      return sum + (completion?.count || 0)
    }, 0)
    
    return {
      kidId: kid.id,
      kidName: kid.firstName,
      points: totalPoints,
    }
  })

  // Calculate max points for scaling
  const maxPoints = Math.max(...kidPoints.map((k) => k.points), 1)

  // Sort by points descending
  const sortedKidPoints = [...kidPoints].sort((a, b) => b.points - a.points)

  const handleAddClick = (task: TaskStats) => {
    setSelectedTask({ 
      id: task.taskId, 
      title: task.taskTitle,
      assignedKids: task.assignedKids 
    })
    setShowModal(true)
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-900">10-Minute Tasks</h2>
        <p className="text-gray-600 mb-6 text-sm">
          Quick tasks completed - each task completion earns one point
        </p>

        <div className="space-y-4">
          {sortedKidPoints.map((kidPoint, index) => {
            const percentage = maxPoints > 0 ? (kidPoint.points / maxPoints) * 100 : 0
            const isLeader = index === 0 && kidPoint.points > 0
            const isFallingBehind = kidPoint.points < maxPoints && maxPoints > 0

            return (
              <div
                key={kidPoint.kidId}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isLeader
                    ? 'bg-green-50 border-green-300'
                    : isFallingBehind
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {isLeader && (
                      <span className="text-2xl" title="Leader">
                        🏆
                      </span>
                    )}
                    <span className="text-lg font-semibold text-gray-900">
                      {kidPoint.kidName}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-600">
                      {kidPoint.points}
                    </div>
                    <div className="text-xs text-gray-600">
                      {kidPoint.points === 1 ? 'point' : 'points'}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isLeader
                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                        : isFallingBehind
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                        : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    style={{ width: `${Math.max(percentage, kidPoint.points > 0 ? 10 : 0)}%` }}
                  />
                </div>
              </div>
            )
          })}

          {kidPoints.length === 0 && (
            <p className="text-gray-500 text-center py-8">No kids found</p>
          )}
        </div>

        {/* Quick add buttons for 10-minute tasks */}
        {tasks.length > 0 && isAuthenticated && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Add</h3>
            <div className="flex flex-wrap gap-2">
              {tasks.map((task) => (
                <button
                  key={task.taskId}
                  onClick={() => handleAddClick(task)}
                  className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
                >
                  + {task.taskTitle}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {tasks.reduce((sum, task) => sum + task.totalCompletions, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Completions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-600">
                {tasks.length}
              </div>
              <div className="text-sm text-gray-600">Active Tasks</div>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedTask && (
        <AddCompletionModal
          task={selectedTask}
          kids={kids}
          onClose={() => {
            setShowModal(false)
            setSelectedTask(null)
          }}
        />
      )}
    </>
  )
}
