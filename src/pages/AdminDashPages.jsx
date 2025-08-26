import React, { useEffect } from 'react'
import AdminDashboard from '../admin/AdminDashboard'

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