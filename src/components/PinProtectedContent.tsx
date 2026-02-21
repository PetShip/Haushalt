'use client'

import { ReactNode, useState, useEffect } from 'react'

interface PinProtectedContentProps {
  children: ReactNode
  readOnlyChildren?: ReactNode
  pinRequired: boolean
}

export default function PinProtectedContent({ 
  children, 
  readOnlyChildren,
  pinRequired 
}: PinProtectedContentProps) {
  const [pin, setPin] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [inputPin, setInputPin] = useState('')
  const [error, setError] = useState('')
  const [readOnly, setReadOnly] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

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

  useEffect(() => {
    if (!pinRequired) {
      setPin('authorized')
      setIsInitialized(true)
      return
    }

    const storedPin = sessionStorage.getItem('haushalt_pin')
    const storedReadOnly = sessionStorage.getItem('haushalt_readonly')
    
    if (storedPin) {
      setPin(storedPin)
      // If we have a PIN, we're not in read-only mode
      setReadOnly(false)
    } else if (storedReadOnly === 'true') {
      setReadOnly(true)
    } else {
      setShowModal(true)
    }
    setIsInitialized(true)
  }, [pinRequired])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Store PIN in sessionStorage. Server-side validation happens on every action.
    // Invalid PINs will be rejected by the server, causing user-facing errors.
    // This approach allows the user to access the UI while server validates on each request.
    sessionStorage.setItem('haushalt_pin', inputPin)
    sessionStorage.removeItem('haushalt_readonly') // Clear read-only mode when PIN is entered
    setPin(inputPin)
    setReadOnly(false)
    setShowModal(false)
  }

  const handleReadOnly = () => {
    sessionStorage.setItem('haushalt_readonly', 'true')
    setReadOnly(true)
    setShowModal(false)
  }

  // Show loading state while initializing
  if (!isInitialized) {
    return null
  }

  if (!pin && !readOnly) {
    return (
      <>
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Enter PIN</h2>
              <p className="text-gray-600 mb-4">
                Enter your PIN to manage tasks and kids, or view in read-only mode.
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
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Read-Only Mode</p>
              <p className="text-sm">You can view data but cannot make changes.</p>
            </div>
            <button
              onClick={() => {
                setReadOnly(false)
                sessionStorage.removeItem('haushalt_readonly')
                setShowModal(true)
              }}
              className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-md hover:bg-yellow-300 transition-colors text-sm font-medium"
            >
              Enter PIN
            </button>
          </div>
        </div>
        {readOnlyChildren || null}
      </div>
    )
  }

  return <>{children}</>
}
