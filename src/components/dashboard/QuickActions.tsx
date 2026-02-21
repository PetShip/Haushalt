'use client'

import { useState, useEffect } from 'react'
import { logQuickTenMinuteTask, logTvPenalty } from '@/actions/logs'
import { useRouter } from 'next/navigation'

interface QuickActionsProps {
  kids: { id: string; firstName: string }[]
  pinRequired?: boolean
}

export default function QuickActions({ kids, pinRequired = false }: QuickActionsProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showTenMinModal, setShowTenMinModal] = useState(false)
  const [showTvPenaltyModal, setShowTvPenaltyModal] = useState(false)
  const [selectedKid, setSelectedKid] = useState<string>('')
  const [minutes, setMinutes] = useState<number>(10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Prevent background scroll on Chrome iOS when any modal is open
  useEffect(() => {
    const isModalOpen = showTenMinModal || showTvPenaltyModal
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showTenMinModal, showTvPenaltyModal])

  const handleTenMinTask = async () => {
    if (!selectedKid) {
      setError('Please select a child')
      return
    }

    const pin = sessionStorage.getItem('haushalt_pin')
    if (!pin) {
      setError('PIN not found. Please unlock again.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await logQuickTenMinuteTask({ kidId: selectedKid, minutes, pin })
      setShowTenMinModal(false)
      setSelectedKid('')
      setMinutes(10)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log task')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTvPenalty = async () => {
    if (!selectedKid) {
      setError('Please select a child')
      return
    }

    const pin = sessionStorage.getItem('haushalt_pin')
    if (!pin) {
      setError('PIN not found. Please unlock again.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await logTvPenalty({ kidId: selectedKid, minutes, pin })
      setShowTvPenaltyModal(false)
      setSelectedKid('')
      setMinutes(10)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log penalty')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="space-y-3">
          <button
            onClick={() => setShowTenMinModal(true)}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <span>⏱️</span>
            Log 10-Minute Task
          </button>
          <button
            onClick={() => setShowTvPenaltyModal(true)}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <span>📺</span>
            Add TV Penalty
          </button>
        </div>
      </div>

      {/* 10-Minute Task Modal */}
      {showTenMinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Log 10-Minute Task</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child
                </label>
                <select
                  value={selectedKid}
                  onChange={(e) => setSelectedKid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a child</option>
                  {kids.map((kid) => (
                    <option key={kid.id} value={kid.id}>
                      {kid.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minutes (optional)
                </label>
                <input
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(Number(e.target.value))}
                  min="1"
                  max="60"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTenMinModal(false)
                  setSelectedKid('')
                  setMinutes(10)
                  setError(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleTenMinTask}
                disabled={isSubmitting || !selectedKid}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Logging...' : 'Log Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TV Penalty Modal */}
      {showTvPenaltyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add TV Penalty</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Child
                </label>
                <select
                  value={selectedKid}
                  onChange={(e) => setSelectedKid(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select a child</option>
                  {kids.map((kid) => (
                    <option key={kid.id} value={kid.id}>
                      {kid.firstName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penalty Duration
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMinutes(5)}
                    className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                      minutes === 5
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    5 min
                  </button>
                  <button
                    onClick={() => setMinutes(10)}
                    className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                      minutes === 10
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    10 min
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowTvPenaltyModal(false)
                  setSelectedKid('')
                  setMinutes(10)
                  setError(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleTvPenalty}
                disabled={isSubmitting || !selectedKid}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Adding...' : 'Add Penalty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
