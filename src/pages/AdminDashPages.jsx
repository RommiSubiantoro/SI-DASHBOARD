import React, { useEffect } from 'react'
import AdminDashboard from '../components/AdminDashboard'

const AdminDashPage = () => {
    useEffect(() => {
        document.title = 'Admin-Home'
    }, [])

    return (
        <div>
            <AdminDashboard />
        </div>
    )
}

export default AdminDashPage