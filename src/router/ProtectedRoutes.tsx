// src/components/ProtectedRoutes.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface ProtectedRoutesProps {
  children: React.ReactNode
}

export const ProtectedRoutes: React.FC<ProtectedRoutesProps> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)


  useEffect(() => {
    // Check if user is authenticated
    if (!user || !user.token) {
      navigate('/login')
    } else {
      setIsChecking(false)
    }
  }, [navigate, user])

  // Show loading state while checking authentication
  if (isChecking) {
    return null
  }

  return <>{children}</>
}