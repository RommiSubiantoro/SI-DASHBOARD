import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Login from './pages/LoginPages';
import AdminDashPage from './pages/AdminDashPages';
import ManagerDashPage from './pages/ManagerDashPages';
import SupervisorDashPage from './pages/SupervisorDashPages';
import UserDashPage from './pages/UserDash.Pages';
function App() {
    return (
        <>
            <Router>
                <Routes>
                    {/* <Route path="/" element={<Login />} /> */}
                    <Route path="/" element={<AdminDashPage />} />
                    {/* <Route path="/" element={<ManagerDashPage />} /> */}
                    {/* <Route path="/" element={<SupervisorDashPage />} /> */}
                 
                       {/* <Route path="/" element={<UserDashPage />} />  */}
                </Routes>
            </Router>
        </>
    );
}

export default App;