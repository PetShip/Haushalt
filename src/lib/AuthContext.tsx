'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  isReadOnly: boolean
  showPinModal: () => void
  authenticate: (pin: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children, pinRequired }: { children: ReactNode; pinRequired: boolean }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isReadOnly, setIsReadOnly] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!pinRequired) {
      setIsAuthenticated(true)
      setIsReadOnly(false)
      setIsInitialized(true)
      return
    }

    const storedPin = sessionStorage.getItem('haushalt_pin')
    if (storedPin) {
      setIsAuthenticated(true)
      setIsReadOnly(false)
    } else {
      // Start in read-only mode by default
      setIsReadOnly(true)
      setIsAuthenticated(false)
    }
    setIsInitialized(true)
  }, [pinRequired])

  const showPinModal = () => {
    // This will be handled by the component that renders the modal
    setIsReadOnly(false)
  }

  const authenticate = (pin: string) => {
    sessionStorage.setItem('haushalt_pin', pin)
    setIsAuthenticated(true)
    setIsReadOnly(false)
  }

  const logout = () => {
    sessionStorage.removeItem('haushalt_pin')
    setIsAuthenticated(false)
    setIsReadOnly(true)
  }

  if (!isInitialized) {
    return null
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isReadOnly, showPinModal, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
