import React, { useEffect } from 'react'
import UserDashboard from '../user/UserDashboard'

const UserDashPage = () => {
    useEffect(() => {
        document.title = 'User-Home'
    }, [])

    return (
        <div>
            <UserDashboard/>
        </div>
    )
}

export default UserDashPage