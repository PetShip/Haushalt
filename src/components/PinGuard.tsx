'use client'

import { ReactNode, useState, useEffect } from 'react'

interface PinGuardProps {
  children: ReactNode
  pinRequired: boolean
}

export default function PinGuard({ children, pinRequired }: PinGuardProps) {
  const [pin, setPin] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [inputPin, setInputPin] = useState('')
  const [error, setError] = useState('')
  const [readOnly, setReadOnly] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Store in sessionStorage (validation happens server-side)
    sessionStorage.setItem('haushalt_pin', inputPin)
    setPin(inputPin)
    setReadOnly(false)
    setShowModal(false)
  }

  const handleUnlock = () => {
    setShowModal(true)
  }

  // Initialize authentication state
  useEffect(() => {
    if (!pinRequired) {
      setPin('authorized')
      setReadOnly(false)
      setIsInitialized(true)
      return
    }

    const storedPin = sessionStorage.getItem('haushalt_pin')
    if (storedPin) {
      setPin(storedPin)
      setReadOnly(false)
    } else {
      // Start in read-only mode by default (no modal)
      setReadOnly(true)
    }
    setIsInitialized(true)
  }, [pinRequired])

  // Provide unlock function to children through global
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__haushalUnlock = handleUnlock
    }
  }, [])

  // Show loading state while initializing
  if (!isInitialized) {
    return null
  }

  if (!pin && showModal) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Enter PIN</h2>
            <p className="text-gray-600 mb-4">
              Enter your PIN to unlock full access to Kids and Tasks management.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  PIN
                </label>
                <input
                  type="password"
                  id="pin"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  autoFocus
                />
                {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Unlock
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
        {children}
      </>
    )
  }

  return <>{children}</>
}
