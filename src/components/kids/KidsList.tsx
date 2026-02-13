'use client'

import { useState } from 'react'
import { Kid } from '@prisma/client'
import { updateKid, toggleKidActive, deleteKid } from '@/actions/kids'

interface KidsListProps {
  kids: Kid[]
}

export default function KidsList({ kids }: KidsListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleEdit = (kid: Kid) => {
    setEditingId(kid.id)
    setEditName(kid.firstName)
    setError('')
  }

  const handleSave = async (id: string) => {
    setError('')
    setLoading(id)

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await updateKid({ id, firstName: editName, pin })
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update kid')
    } finally {
      setLoading(null)
    }
  }

  const handleToggle = async (id: string) => {
    setLoading(id)
    setError('')

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await toggleKidActive({ id, pin })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle kid')
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will hide them from the app but keep their data in the database.`)) {
      return
    }

    setLoading(id)
    setError('')

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await deleteKid({ id, pin })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete kid')
    } finally {
      setLoading(null)
    }
  }

  if (kids.length === 0) {
    return <p className="text-gray-500">No kids yet. Add one below!</p>
  }

  return (
    <div>
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {kids.map((kid) => (
          <div
            key={kid.id}
            className={`flex items-center justify-between p-4 rounded-lg border ${
              kid.isActive ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300'
            }`}
          >
            {editingId === kid.id ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className={kid.isActive ? 'font-medium' : 'text-gray-500'}>
                  {kid.firstName}
                </span>
                {!kid.isActive && (
                  <span className="text-xs bg-gray-500 text-white px-2 py-1 rounded">
                    Inactive
                  </span>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {editingId === kid.id ? (
                <>
                  <button
                    onClick={() => handleSave(kid.id)}
                    disabled={loading === kid.id}
                    className="bg-primary-600 text-white px-3 py-1 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    disabled={loading === kid.id}
                    className="bg-gray-300 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-400 transition-colors disabled:opacity-50 text-sm"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(kid)}
                    disabled={loading === kid.id}
                    className="bg-primary-100 text-primary-700 px-3 py-1 rounded-md hover:bg-primary-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggle(kid.id)}
                    disabled={loading === kid.id}
                    className={`px-3 py-1 rounded-md transition-colors disabled:opacity-50 text-sm ${
                      kid.isActive
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {kid.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(kid.id, kid.firstName)}
                    disabled={loading === kid.id}
                    className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
