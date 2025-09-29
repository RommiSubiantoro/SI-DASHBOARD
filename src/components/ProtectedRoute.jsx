import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const userRole = (localStorage.getItem("userRole") || "").toLowerCase();
  const allowed = allowedRoles.map(r => r.toLowerCase());

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!allowed.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
