import React, { useEffect } from 'react'
import Login from '../components/Login'

const LoginPage = () => {
    useEffect(() => {
        document.title = 'Login - SI-Dashboard'
    }, [])

    return (
        <div>
            <Login />
        </div>
    )
}

export default LoginPage
