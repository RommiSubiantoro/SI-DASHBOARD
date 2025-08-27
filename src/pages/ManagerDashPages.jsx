import React, { useEffect } from 'react'
import ManagerDashboard from '../manager/ManagerDashboard'

const ManagerDashPage = () => {
    useEffect(() => {
        document.title = 'Manager-Home'
    }, [])

    return (
        <div>
            <ManagerDashboard />
        </div>
    )
}

export default ManagerDashPage