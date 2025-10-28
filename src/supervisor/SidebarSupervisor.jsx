import React from "react";

const SidebarSupervisor = ({ activePage, handlePageChange, handleLogout }) => (
  <div className="w-64 fixed bg-red-500 shadow-lg border-r border-gray-100 min-h-screen flex flex-col justify-between">
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-8 px-7">
        Supervisor Panel
      </h2>
      <nav className="space-y-2">
        {[
          { key: "dashboard", label: "📊 Dashboard" },
          { key: "unit", label: "🏢 Manage Unit Bisnis" },
          { key: "user", label: "👥 Manage User" },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handlePageChange(item.key)}
            className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
              activePage === item.key
                ? "text-white bg-red-600 shadow-md"
                : "text-white hover:bg-red-400"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>

    <div className="p-6 border-t border-red-400">
      <button
        onClick={handleLogout}
        className="w-full text-left px-4 py-3 rounded-lg font-medium text-sm text-white hover:bg-red-400 transition-all duration-200"
      >
        🚪 Logout
      </button>
    </div>
  </div>
);

export default SidebarSupervisor;
