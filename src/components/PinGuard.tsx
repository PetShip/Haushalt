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
  const [readOnly, setReadOnly] = useState(false)

  useEffect(() => {
    if (!pinRequired) {
      setPin('authorized')
      return
    }

    const storedPin = sessionStorage.getItem('haushalt_pin')
    if (storedPin) {
      setPin(storedPin)
    } else {
      setShowModal(true)
    }
  }, [pinRequired])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Store in sessionStorage (validation happens server-side)
    sessionStorage.setItem('haushalt_pin', inputPin)
    setPin(inputPin)
    setShowModal(false)
  }

  const handleReadOnly = () => {
    setReadOnly(true)
    setShowModal(false)
  }

  if (!pin && !readOnly) {
    return (
      <>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Enter PIN</h2>
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
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={handleReadOnly}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    View Read-Only
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    )
  }

  if (readOnly) {
    return (
      <div>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p className="font-medium">Read-Only Mode</p>
          <p className="text-sm">You can view data but cannot make changes.</p>
        </div>
        {children}
      </div>
    )
  }

  return <>{children}</>
}
