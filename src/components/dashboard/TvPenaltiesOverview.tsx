'use client'

import { useEffect, useState } from 'react'
import { logTvPenalty, reduceTvPenalty } from '@/actions/logs'
import { useRouter } from 'next/navigation'

interface TvPenalty {
  kidId: string
  kidName: string
  totalMinutes: number
  count: number
}

interface TvPenaltiesOverviewProps {
  penalties: TvPenalty[]
  kids: { id: string; firstName: string }[]
  pinRequired?: boolean
}

export default function TvPenaltiesOverview({ penalties, kids, pinRequired = false }: TvPenaltiesOverviewProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'reduce'>('add')
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

  // Prevent background scroll on Chrome iOS when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showModal])

  const openModal = (mode: 'add' | 'reduce') => {
    setModalMode(mode)
    setMinutes(10)
    setSelectedKid('')
    setError(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedKid('')
    setMinutes(10)
    setError(null)
  }

  const handleSubmit = async () => {
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
      if (modalMode === 'add') {
        await logTvPenalty({ kidId: selectedKid, minutes, pin })
      } else {
        await reduceTvPenalty({ kidId: selectedKid, minutes, pin })
      }
      closeModal()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update penalty')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate total penalties per kid
  const kidPenalties = kids.map((kid) => {
    const penalty = penalties.find((p) => p.kidId === kid.id)
    return {
      kidId: kid.id,
      kidName: kid.firstName,
      totalMinutes: penalty?.totalMinutes || 0,
      count: penalty?.count || 0,
    }
  })

  // Sort by total minutes descending
  const sortedPenalties = [...kidPenalties].sort((a, b) => b.totalMinutes - a.totalMinutes)

  const maxMinutes = Math.max(...sortedPenalties.map((p) => p.totalMinutes), 1)

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <span>📺</span>
            TV Penalties
          </h2>
          {isAuthenticated && (
            <div className="flex gap-2">
              <button
                onClick={() => openModal('reduce')}
                aria-label="Reduce TV penalty"
                className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                − Reduce
              </button>
              <button
                onClick={() => openModal('add')}
                className="px-3 py-1 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
              >
                + Add
              </button>
            </div>
          )}
        </div>
        <p className="text-gray-600 mb-6 text-sm">
          Total TV time penalties (all time)
        </p>

        <div className="space-y-4">
          {sortedPenalties.map((penalty) => {
            const percentage = maxMinutes > 0 ? (penalty.totalMinutes / maxMinutes) * 100 : 0
            const hasNoPenalties = penalty.totalMinutes === 0

            return (
              <div
                key={penalty.kidId}
                className={`p-4 rounded-lg border-2 transition-all ${
                  hasNoPenalties
                    ? 'bg-green-50 border-green-200'
                    : penalty.totalMinutes >= maxMinutes && maxMinutes > 0
                    ? 'bg-red-50 border-red-300'
                    : 'bg-orange-50 border-orange-200'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      {penalty.kidName}
                    </span>
                    {hasNoPenalties && (
                      <span className="text-sm text-green-600" title="No penalties!">
                        ✅
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {penalty.totalMinutes}
                    </div>
                    <div className="text-xs text-gray-600">
                      min ({penalty.count} {penalty.count === 1 ? 'penalty' : 'penalties'})
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      hasNoPenalties
                        ? 'bg-green-500'
                        : 'bg-gradient-to-r from-orange-500 to-red-600'
                    }`}
                    style={{ width: `${Math.max(percentage, penalty.totalMinutes > 0 ? 10 : 0)}%` }}
                  />
                </div>
              </div>
            )
          })}

          {kidPenalties.length === 0 && (
            <p className="text-gray-500 text-center py-8">No data available</p>
          )}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {sortedPenalties.reduce((sum, p) => sum + p.totalMinutes, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Penalty Minutes (All Time)</div>
          </div>
        </div>
      </div>

      {/* Add / Reduce TV Penalty Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {modalMode === 'add' ? 'Add TV Penalty' : 'Reduce TV Penalty'}
            </h3>

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
                  {modalMode === 'add' ? 'Penalty Duration' : 'Reduction Amount'}
                </label>
                <div className="flex gap-2">
                  {([5, 10] as const).map((value) => {
                    const isSelected = minutes === value
                    const activeClass = modalMode === 'add' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                    return (
                      <button
                        key={value}
                        onClick={() => setMinutes(value)}
                        className={`flex-1 px-4 py-2 rounded-md transition-colors ${
                          isSelected ? activeClass : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {value} min
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedKid}
                className={`flex-1 px-4 py-2 text-white rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${
                  modalMode === 'add'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting
                  ? modalMode === 'add' ? 'Adding...' : 'Reducing...'
                  : modalMode === 'add' ? 'Add Penalty' : 'Reduce Penalty'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
