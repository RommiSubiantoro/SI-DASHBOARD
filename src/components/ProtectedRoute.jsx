import React from "react";
import { Navigate, useNavigate } from "react-router-dom";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  // 🔹 Ambil roles dari localStorage (bisa array atau string lama)
  let userRoles = [];
  const storedRoles = localStorage.getItem("userRoles");
  const singleRole = localStorage.getItem("userRole");

  if (storedRoles) {
    try {
      userRoles = JSON.parse(storedRoles);
    } catch {
      userRoles = [];
    }
  } else if (singleRole) {
    userRoles = [singleRole.toLowerCase()];
  }

  const allowed = allowedRoles.map((r) => r.toLowerCase());
  const hasAccess = userRoles.some((r) => allowed.includes(r.toLowerCase()));

  // 🔐 Jika belum login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // 🚫 Jika tidak punya izin
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold text-red-600 mb-2">
          Akses Ditolak ❌
        </h1>
        <p className="text-gray-700 mb-6 text-center max-w-md">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>

        <button
          onClick={() => navigate("/")}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition duration-200"
        >
          🔙 Kembali ke Halaman Login
        </button>
      </div>
    );
  }

  // ✅ Izinkan akses
  return children;
};

export default ProtectedRoute;
