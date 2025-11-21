import React from "react";

const Sidebar = ({ activePage, onChangePage, onLogout, userRoles = [], isOpen, onClose }) => {
  const rolesArray = Array.isArray(userRoles)
    ? userRoles.map((r) => String(r).trim().toLowerCase())
    : [String(userRoles || "").trim().toLowerCase()].filter(Boolean);

  const canAccessGA = rolesArray.includes("ga/fs");
  const canAccessSuperAdmin = rolesArray.includes("super admin");
  const canAccessGAFSSection = canAccessGA && canAccessSuperAdmin;

  // Sidebar class: desktop fixed, mobile slide-in
  const sidebarBase = "fixed top-0 left-0 h-screen bg-red-500 text-white flex flex-col z-50 transition-transform duration-300 ease-in-out";
  const sidebarPosition = isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0";
  const sidebarWidth = "w-64";

  return (
    <>
      {/* Sidebar */}
      <aside className={`${sidebarBase} ${sidebarPosition} ${sidebarWidth}`}>
        <div className="p-4 border-b border-red-600 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          {/* Close button only on mobile */}
          <button
            className="md:hidden text-white p-2"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Dashboard */}
          <button
            onClick={() => onChangePage("dashboard")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "dashboard" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
          >
            📊 Dashboard
          </button>

          {/* Tabel */}
          <button
            onClick={() => onChangePage("dashboardView")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "dashboardView" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
          >
            Tabel View
          </button>

          {/* Unit Bisnis */}
          <button
            onClick={() => onChangePage("unit")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "unit" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
          >
            🏢 Unit Bisnis
          </button>

          {/* User Management */}
          <button
            onClick={() => onChangePage("user")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "user" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
          >
            👥 User Management
          </button>

          {/* Master Category */}
          <button
            onClick={() => onChangePage("masterCategory")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "masterCategory" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
          >
            📂 Master Category
          </button>

          {/* Master Code */}
          <button
            onClick={() => onChangePage("masterCode")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "masterCode" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
          >
            🧾 Master Code
          </button>

          {/* Library Code */}
          <button
            onClick={() => onChangePage("libraryCode")}
            className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "libraryCode" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
          >
            📚 Library Code
          </button>

          {/* GA/FS Section */}
          {canAccessGAFSSection && (
            <>
              <div className="mt-4 border-t border-red-600 pt-2">
                <p className="text-sm uppercase tracking-wide text-red-200 font-semibold px-4">
                  GA / FS Section
                </p>
              </div>

              <button
                onClick={() => onChangePage("gafs_daily")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "gafs_daily" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
              >
                🗓️ Daily OB/CS
              </button>

              <button
                onClick={() => onChangePage("gafs_driver")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "gafs_driver" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
              >
                🚗 Driver Report
              </button>

              <button
                onClick={() => onChangePage("gafs_atk")}
                className={`w-full text-left px-4 py-2 rounded-lg transition-all ${activePage === "gafs_atk" ? "bg-red-600" : "hover:bg-red-400 text-white"}`}
              >
                📦 ATK/RTG Report
              </button>
            </>
          )}
        </nav>
      </aside>

      {/* BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
};

export default Sidebar;
