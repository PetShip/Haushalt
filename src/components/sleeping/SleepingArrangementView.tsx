'use client'

import { useState, useEffect } from 'react'
import { toggleSleepingArrangement } from '@/actions/sleeping'
import { useRouter } from 'next/navigation'

interface SleepingArrangementViewProps {
  arrangement: {
    combination: string
    pairs: Array<{ pair1: string; pair2: string }>
  }
  pinRequired?: boolean
}

export default function SleepingArrangementView({
  arrangement,
  pinRequired = false,
}: SleepingArrangementViewProps) {
  const router = useRouter()
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const handleToggle = async () => {
    if (!isAuthenticated) {
      setError('Please unlock first')
      return
    }

    const pin = sessionStorage.getItem('haushalt_pin')
    if (!pin) {
      setError('PIN not found. Please unlock again.')
      return
    }

    setIsToggling(true)
    setError(null)

    try {
      await toggleSleepingArrangement({ pin })
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle arrangement')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Next Sleeping Arrangement</h2>
        <p className="text-gray-600">These children will sleep together next time</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {arrangement.pairs.map((pair, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 border-2 border-blue-200"
          >
            <div className="flex items-center justify-center space-x-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                  {pair.pair1[0]}
                </div>
                <p className="font-semibold text-gray-900">{pair.pair1}</p>
              </div>
              <div className="text-3xl text-gray-400">+</div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-2">
                  {pair.pair2[0]}
                </div>
                <p className="font-semibold text-gray-900">{pair.pair2}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {isAuthenticated && (
        <div className="text-center">
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isToggling ? 'Switching...' : 'Switch to Next Arrangement'}
          </button>
          <p className="text-sm text-gray-500 mt-2">
            This will alternate the sleeping pairs for the next time
          </p>
        </div>
      )}

      {!isAuthenticated && (
        <div className="text-center">
          <p className="text-gray-500">Unlock to change the arrangement</p>
        </div>
      )}
    </div>
  )
}
