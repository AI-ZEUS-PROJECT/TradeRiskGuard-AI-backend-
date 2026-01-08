"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface User {
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name: string) => Promise<boolean>
  signOut: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for stored auth on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("auth_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem("auth_user")
      }
    }
    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - just check if credentials are provided
    if (email && password) {
      const mockUser: User = {
        email,
        name: email.split("@")[0], // Simple name extraction
      }
      setUser(mockUser)
      localStorage.setItem("auth_user", JSON.stringify(mockUser))
      return true
    }
    return false
  }

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    // Mock authentication - just check if all fields are provided
    if (email && password && name) {
      const mockUser: User = {
        email,
        name,
      }
      setUser(mockUser)
      localStorage.setItem("auth_user", JSON.stringify(mockUser))
      return true
    }
    return false
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("auth_user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
