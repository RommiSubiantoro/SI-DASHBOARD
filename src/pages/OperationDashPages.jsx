import React, { useEffect } from 'react'
import OperationDashboard from './../operation/OperationDashboard';

const AdminDashPage = () => {
    useEffect(() => {
        document.title = 'Operation-Home'
    }, [])

    return (
        <div>
            <OperationDashboard/>

        </div>
    )
}

export default AdminDashPage