'use client'

import { useState, useEffect } from 'react'
import { CompletionLog, Kid, Task } from '@prisma/client'
import { deleteCompletion } from '@/actions/logs'

interface HistoryTableProps {
  logs: (CompletionLog & { kid: Kid; task: Task })[]
  pinRequired: boolean
}

export default function HistoryTable({ logs, pinRequired }: HistoryTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this log?')) {
      return
    }

    setLoading(id)
    setError('')

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await deleteCompletion({ id, pin })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete log')
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No completion logs found.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {error && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-3">
          {error}
        </div>
      )}
      {!isAuthenticated && pinRequired && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-700 px-4 py-3">
          <p className="text-sm">
            <strong>Read-Only Mode:</strong> You can view the history but cannot delete entries. Click &quot;Unlock&quot; in the menu to enable editing.
          </p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kid
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Minutes
              </th>
              {isAuthenticated && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(log.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.kid.firstName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.task.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {log.minutes || '-'}
                </td>
                {isAuthenticated && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={loading === log.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 font-medium"
                    >
                      {loading === log.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
