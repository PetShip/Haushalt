'use client'

import { useState, useEffect } from 'react'
import { TaskStats } from '@/lib/analytics'
import AddCompletionModal from './AddCompletionModal'

interface TaskGroupCardProps {
  title: string
  tasks: TaskStats[]
  kids: { id: string; firstName: string }[]
  pinRequired: boolean
}

export default function TaskGroupCard({ title, tasks, kids, pinRequired }: TaskGroupCardProps) {
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string } | null>(null)
  const [hasPin, setHasPin] = useState(false)

  useEffect(() => {
    if (!pinRequired) {
      setHasPin(true)
      return
    }
    
    const storedPin = sessionStorage.getItem('haushalt_pin')
    setHasPin(!!storedPin)
  }, [pinRequired])

  const handleAddClick = (taskId: string, taskTitle: string) => {
    if (!hasPin && pinRequired) {
      alert('Please enter your PIN first to add completions. Go to Tasks or Kids page to enter your PIN.')
      return
    }
    setSelectedTask({ id: taskId, title: taskTitle })
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="text-gray-500">No tasks in this group</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.taskId} className="border-b pb-4 last:border-b-0 last:pb-0">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{task.taskTitle}</h3>
                <button
                  onClick={() => handleAddClick(task.taskId, task.taskTitle)}
                  className={`px-3 py-1 rounded-md transition-colors text-sm ${
                    hasPin || !pinRequired
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  title={!hasPin && pinRequired ? 'PIN required to add completions' : 'Add completion'}
                >
                  + Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {kids.map((kid) => {
                  const completion = task.completionsByKid.find((c) => c.kidId === kid.id)
                  const count = completion?.count || 0
                  return (
                    <div
                      key={kid.id}
                      className={`px-3 py-1 rounded-full text-sm ${
                        count > 0
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {kid.firstName}: {count}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedTask && (
        <AddCompletionModal
          task={selectedTask}
          kids={kids}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </>
  )
}
