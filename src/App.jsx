import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/LoginPages";
import AdminDashPages from "./pages/AdminDashPages";
import ManagerDashPages from "./pages/ManagerDashPages";
import SupervisorDashPages from "./pages/SupervisorDashPages";
import UserDashPages from "./pages/UserDashPages";
import MarketingDashPages from "./pages/MarketingDashPages";
import OperationDashPages from "./pages/OperationDashPages";


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
          path="/marketing"
          element={
            <ProtectedRoute allowedRoles={["marketing"]}>
              <MarketingDashPages />
            </ProtectedRoute>
          }
        />

         <Route
          path="/operation"
          element={
            <ProtectedRoute allowedRoles={["operation"]}>
              <OperationDashPages />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
