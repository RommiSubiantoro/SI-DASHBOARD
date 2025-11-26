import React, { useEffect } from 'react'
import MarketingDashboard from '../marketing/MarketingDashboard';

const AdminDashPage = () => {
    useEffect(() => {
        document.title = 'Marketing-Home'
    }, [])

    return (
        <div>
            <MarketingDashboard/>

        </div>
    )
}

export default AdminDashPage