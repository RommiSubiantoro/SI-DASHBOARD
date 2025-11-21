import React from "react";

const Sidebar = ({ activePage, onChangePage, onLogout, isOpen, onClose }) => {
  const menuItems = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "TableView", label: "Table" },
    { id: "Performance", label: "Performance" },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 w-64 bg-red-500 shadow-lg z-50 transform transition-transform duration-300
      ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:inset-auto`}
    >
      <div className="p-6 flex flex-col h-full justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-8">Management Report</h2>
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onChangePage(item.id);
                  onClose && onClose();
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
                  ${activePage === item.id ? "bg-red-600 shadow-md text-white" : "hover:bg-red-400 text-white"}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <button
          onClick={onLogout}
          className="w-full px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
