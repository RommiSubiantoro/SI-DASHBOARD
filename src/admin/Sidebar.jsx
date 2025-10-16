// src/components/Sidebar.jsx
import React from "react";

const Sidebar = ({ activePage, onChangePage, onLogout }) => {
  return (
    <div className="w-64 fixed bg-red-500 shadow-lg border-r border-gray-100 min-h-screen flex flex-col justify-between">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-8 px-7">Admin Panel</h2>

        <nav className="space-y-2">
          <button onClick={() => onChangePage("dashboard")} className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm ${activePage === "dashboard" ? "text-white bg-red-600" : "text-white hover:bg-red-400"}`}>📊 Dashboard</button>

          <button onClick={() => onChangePage("unit")} className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm ${activePage === "unit" ? "text-white bg-red-600" : "text-white hover:bg-red-400"}`}>🏢 Manage Unit Bisnis</button>

          <button onClick={() => onChangePage("user")} className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm ${activePage === "user" ? "text-white bg-red-600" : "text-white hover:bg-red-400"}`}>👥 Manage User</button>

          <button onClick={() => onChangePage("masterCategory")} className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm ${activePage === "masterCategory" ? "text-white bg-red-600" : "text-white hover:bg-red-400"}`}>🗂 Master Category</button>

          <button onClick={() => onChangePage("masterCode")} className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm ${activePage === "masterCode" ? "text-white bg-red-600" : "text-white hover:bg-red-400"}`}>🔢 Master Code</button>
        </nav>
      </div>

      <div className="p-6 border-t border-red-400">
        <button onClick={onLogout} className="w-full text-left px-4 py-3 rounded-lg font-medium text-sm text-white hover:bg-red-400">🚪 Logout</button>
      </div>
    </div>
  );
};

export default Sidebar;
