import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/LoginPages";
import AdminDashPages from "./pages/AdminDashPages";
import ManagerDashPages from "./pages/ManagerDashPages";
import SupervisorDashPages from "./pages/SupervisorDashPages";
import UserDashPages from "./pages/UserDashPages";
import GAFSDashPages from "./pages/GAFSDashPages";

function App() {
    return (
        <Router>
            <Routes>
                {/* Public route */}
                <Route path="/" element={<Login />} />


                {/* Role: super admin */}
                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute allowedRoles={["super admin"]}>
                            <AdminDashPages />
                        </ProtectedRoute>
                    }
                />

                {/* Role: manager */}
                <Route
                    path="/manager"
                    element={
                        <ProtectedRoute allowedRoles={["manager"]}>
                            <ManagerDashPages />
                        </ProtectedRoute>
                    }
                />

                {/* Role: supervisor */}
                <Route
                    path="/supervisor"
                    element={
                        <ProtectedRoute allowedRoles={["supervisor"]}>
                            <SupervisorDashPages />
                        </ProtectedRoute>
                    }
                />

                {/* Role: user */}
                <Route
                    path="/user"
                    element={
                        <ProtectedRoute allowedRoles={["user"]}>
                            <UserDashPages />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/gafs"
                    element={
                        <ProtectedRoute allowedRoles={["ga/fs"]}>
                            <GAFSDashPages />
                        </ProtectedRoute>
                    }
                /> 


            </Routes>
        </Router>
    );
}

export default App;
