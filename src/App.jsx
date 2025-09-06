import React from 'react';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import Login from './pages/LoginPages';
import AdminDashPage from './pages/AdminDashPages';
import ManagerDashPage from './pages/ManagerDashPages';
import SupervisorDashPage from './pages/SupervisorDashPages';
import UserDashPage from './pages/UserDashPages';
import './App.css'; 
function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/admin" element={<AdminDashPage />} />
                    <Route path="/manager" element={<ManagerDashPage />} />
                    <Route path="/supervisor" element={<SupervisorDashPage />} />
                    <Route path="/user" element={<UserDashPage />} /> 
                </Routes>
            </Router>
        </>
    );
}

export default App;