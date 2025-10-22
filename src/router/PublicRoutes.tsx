import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface PublicRouteProps {
    children: React.ReactNode
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        if (user && user.token) {
            navigate('/')
        } else {
            setIsChecking(false)
        }
    }, [navigate, user])

    if (isChecking) {
        return null
    }

    return <>{children}</>
}
