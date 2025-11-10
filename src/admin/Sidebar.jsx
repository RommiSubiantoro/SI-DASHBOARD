import React from "react";

const Sidebar = ({ activePage, onChangePage, onLogout, userRoles = [] }) => {
  // 🔹 Normalisasi data role supaya selalu dalam bentuk array lowercase
  const rolesArray = Array.isArray(userRoles)
    ? userRoles.map((r) => String(r).trim().toLowerCase())
    : [String(userRoles || "").trim().toLowerCase()].filter(Boolean);

  // 🔹 Cek apakah user punya kedua role: GA/FS dan Super Admin
  const canAccessGA = rolesArray.includes("ga/fs");
  const canAccessSuperAdmin = rolesArray.includes("super admin");
  const canAccessGAFSSection = canAccessGA && canAccessSuperAdmin;

  return (
    <aside className="fixed top-0 left-0 w-64 h-screen bg-red-500 text-white flex flex-col">
      <div className="p-4 border-b border-red-600">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {/* Dashboard */}
        <button
          onClick={() => onChangePage("dashboard")}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            activePage === "dashboard"
              ? "bg-red-600"
              : "hover:bg-red-400 text-white"
          }`}
        >
          📊 Dashboard
        </button>

        {/* Tabel */}
        <button
          onClick={() => onChangePage("dashboardView")}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            activePage === "dashboardView"
              ? "bg-red-600"
              : "hover:bg-red-400 text-white"
          }`}
        >
          Tabel View
        </button>

        {/* Unit Bisnis */}
        <button
          onClick={() => onChangePage("unit")}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            activePage === "unit" ? "bg-red-600" : "hover:bg-red-400 text-white"
          }`}
        >
          🏢 Unit Bisnis
        </button>

        {/* User Management */}
        <button
          onClick={() => onChangePage("user")}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            activePage === "user" ? "bg-red-600" : "hover:bg-red-400 text-white"
          }`}
        >
          👥 User Management
        </button>

        {/* Master Category */}
        <button
          onClick={() => onChangePage("masterCategory")}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            activePage === "masterCategory"
              ? "bg-red-600"
              : "hover:bg-red-400 text-white"
          }`}
        >
          📂 Master Category
        </button>

        {/* Master Code */}
        <button
          onClick={() => onChangePage("masterCode")}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            activePage === "masterCode"
              ? "bg-red-600"
              : "hover:bg-red-400 text-white"
          }`}
        >
          🧾 Master Code
        </button>

        {/* Library Code */}
        <button
          onClick={() => onChangePage("libraryCode")}
          className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
            activePage === "libraryCode"
              ? "bg-red-600"
              : "hover:bg-red-400 text-white"
          }`}
        >
          📚 Library Code
        </button>

        {/* === GA/FS Section (Hanya tampil jika punya dua role) === */}
        {canAccessGAFSSection && (
          <>
            <div className="mt-4 border-t border-red-600 pt-2">
              <p className="text-sm uppercase tracking-wide text-red-200 font-semibold px-4">
                GA / FS Section
              </p>
            </div>

            <button
              onClick={() => onChangePage("gafs_daily")}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                activePage === "gafs_daily"
                  ? "bg-red-600"
                  : "hover:bg-red-400 text-white"
              }`}
            >
              🗓️ Daily OB/CS
            </button>

            <button
              onClick={() => onChangePage("gafs_driver")}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                activePage === "gafs_driver"
                  ? "bg-red-600"
                  : "hover:bg-red-400 text-white"
              }`}
            >
              🚗 Driver Report
            </button>

            <button
              onClick={() => onChangePage("gafs_atk")}
              className={`w-full text-left px-4 py-2 rounded-lg transition-all ${
                activePage === "gafs_atk"
                  ? "bg-red-600"
                  : "hover:bg-red-400 text-white"
              }`}
            >
              📦 ATK/RTG Report
            </button>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
