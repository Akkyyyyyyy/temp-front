import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface PublicRouteProps {
    children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const token = localStorage.getItem('auth-token');
    const navigate = useNavigate()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        if (token) {
            navigate('/dashboard')
        } else {
            setIsChecking(false)
        }
    }, [navigate, token])

    if (isChecking) {
        return null
    }

    return <>{children}</>
}
