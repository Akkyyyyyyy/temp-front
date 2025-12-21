// src/components/PublicRoute.tsx
import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface PublicRouteProps {
    children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (user && user.token) {
            navigate('/', { replace: true })
        }
    }, [navigate, user])

    // Don't render anything if user is authenticated
    if (user && user.token) {
        return null
    }

    return <>{children}</>
}