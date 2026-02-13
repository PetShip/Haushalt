'use client'

import { useState } from 'react'
import { updateTask, toggleTaskActive, deleteTask, updateTaskKids } from '@/actions/tasks'

interface TaskWithKids {
  id: string
  title: string
  group: string
  isActive: boolean
  kidAssignments: {
    kid: {
      id: string
      firstName: string
      isActive: boolean
    }
  }[]
}

interface TasksListProps {
  tasks: TaskWithKids[]
  kids: { id: string; firstName: string }[]
}

export default function TasksList({ tasks, kids }: TasksListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editingKidsId, setEditingKidsId] = useState<string | null>(null)
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([])
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const regularTasks = tasks.filter((t) => t.group === 'REGULAR')
  const tenMinTasks = tasks.filter((t) => t.group === 'TEN_MIN')

  const handleEdit = (task: TaskWithKids) => {
    setEditingId(task.id)
    setEditTitle(task.title)
    setError('')
  }

  const handleEditKids = (task: TaskWithKids) => {
    setEditingKidsId(task.id)
    setSelectedKidIds(task.kidAssignments.map(a => a.kid.id))
    setError('')
  }

  const handleKidToggle = (kidId: string) => {
    setSelectedKidIds(prev => 
      prev.includes(kidId) 
        ? prev.filter(id => id !== kidId)
        : [...prev, kidId]
    )
  }

  const handleSaveKids = async (taskId: string) => {
    setError('')
    setLoading(taskId)

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await updateTaskKids({ taskId, kidIds: selectedKidIds, pin })
      setEditingKidsId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update kid assignments')
    } finally {
      setLoading(null)
    }
  }

  const handleSave = async (id: string) => {
    setError('')
    setLoading(id)

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await updateTask({ id, title: editTitle, pin })
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
    } finally {
      setLoading(null)
    }
  }

  const handleToggle = async (id: string) => {
    setLoading(id)
    setError('')

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await toggleTaskActive({ id, pin })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle task')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will hide it from the app but keep the data in the database.`)) {
      return
    }

    setLoading(id)
    setError('')

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await deleteTask({ id, pin })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
    } finally {
      setLoading(null)
    }
  }

  const renderTaskGroup = (groupTasks: TaskWithKids[], title: string) => (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3 text-primary-600">{title}</h3>
      {groupTasks.length === 0 ? (
        <p className="text-gray-500 text-sm">No tasks in this group</p>
      ) : (
        <div className="space-y-2">
          {groupTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-lg border ${
                task.isActive ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {editingId === task.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={task.isActive ? 'font-medium' : 'text-gray-500'}>
                      {task.title}
                    </span>
                    {!task.isActive && (
                      <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {editingId === task.id ? (
                    <>
                      <button
                        onClick={() => handleSave(task.id)}
                        disabled={loading === task.id}
                        className="bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={loading === task.id}
                        className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(task)}
                        disabled={loading === task.id}
                        className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md hover:bg-primary-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(task.id)}
                        disabled={loading === task.id}
                        className={`px-3 py-1 rounded-md transition-colors disabled:opacity-50 text-sm ${
                          task.isActive
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {task.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(task.id, task.title)}
                        disabled={loading === task.id}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Kids Assignment Section */}
              <div className="mt-2 pt-2 border-t border-gray-200">
                {editingKidsId === task.id ? (
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-2">Assigned Kids:</div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {kids.map((kid) => (
                        <label key={kid.id} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedKidIds.includes(kid.id)}
                            onChange={() => handleKidToggle(kid.id)}
                            disabled={loading === task.id}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 mr-1"
                          />
                          <span className="text-xs">{kid.firstName}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveKids(task.id)}
                        disabled={loading === task.id}
                        className="bg-primary-600 text-white px-2 py-1 rounded text-xs hover:bg-primary-700 transition-colors disabled:opacity-50"
                      >
                        Save Kids
                      </button>
                      <button
                        onClick={() => setEditingKidsId(null)}
                        disabled={loading === task.id}
                        className="bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Kids:</span>
                      {task.kidAssignments.length === 0 ? (
                        <span className="text-xs text-gray-500 italic">None assigned</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {task.kidAssignments.map((assignment) => (
                            <span
                              key={assignment.kid.id}
                              className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded"
                            >
                              {assignment.kid.firstName}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleEditKids(task)}
                      disabled={loading === task.id}
                      className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
                    >
                      Edit Kids
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (tasks.length === 0) {
    return <p className="text-gray-500">No tasks yet. Add one below!</p>
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {renderTaskGroup(regularTasks, 'Regular Tasks')}
      {renderTaskGroup(tenMinTasks, '10-Minute Tasks')}
    </div>
  )
}
