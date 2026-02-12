'use client'

import { useState } from 'react'
import { TaskStats } from '@/lib/analytics'
import AddCompletionModal from './AddCompletionModal'

interface TaskGroupCardProps {
  title: string
  tasks: TaskStats[]
  kids: { id: string; firstName: string }[]
}

export default function TaskGroupCard({ title, tasks, kids }: TaskGroupCardProps) {
  const [selectedTask, setSelectedTask] = useState<{ id: string; title: string } | null>(null)

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
                  onClick={() =>
                    setSelectedTask({ id: task.taskId, title: task.taskTitle })
                  }
                  className="bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 transition-colors text-sm"
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
