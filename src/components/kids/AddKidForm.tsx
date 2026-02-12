'use client'

import { useState } from 'react'
import { createKid } from '@/actions/kids'

export default function AddKidForm() {
  const [firstName, setFirstName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!firstName.trim()) {
      setError('Name is required')
      return
    }

    setLoading(true)

    try {
      const pin = sessionStorage.getItem('haushalt_pin') || ''
      await createKid({ firstName: firstName.trim(), pin })
      setFirstName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create kid')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Add New Kid</h2>

      <div className="mb-4">
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={loading}
          placeholder="Enter name..."
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Adding...' : 'Add Kid'}
      </button>
    </form>
  )
}
