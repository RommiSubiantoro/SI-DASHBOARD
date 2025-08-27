import React, { useEffect } from 'react'
import SupervisorDashboard from '../supervisor/SupervisorDashboard'

const SupervisorDashPage = () => {
    useEffect(() => {
        document.title = 'Supervisor-Home'
    }, [])

    return (
        <div>
            <SupervisorDashboard />
        </div>
    )
}

export default SupervisorDashPage