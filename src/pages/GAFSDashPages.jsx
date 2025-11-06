import React, { useEffect } from 'react'
import GAFSDashboard from '../GaFs/GAFSDashboard'

const AdminDashPage = () => {
    useEffect(() => {
        document.title = 'GA/FS-Home'
    }, [])

    return (
        <div>
            <GAFSDashboard/>

        </div>
    )
}

export default AdminDashPage