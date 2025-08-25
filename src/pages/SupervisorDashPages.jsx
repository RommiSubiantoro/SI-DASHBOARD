import React, { useEffect } from 'react'
import SupervisorDashboard from '../components/SupervisorDashboard'

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