// components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  // if (!userRole) {
  //   return <Navigate to="/" replace />;
  // }

  // if (!allowedRoles.includes(userRole)) {
  //   return <Navigate to="/unauthorized" replace />;
  // }

  return children;
};

export default ProtectedRoute;
