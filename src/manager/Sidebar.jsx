import React from "react";

const Sidebar = ({ activePage, onChangePage, onLogout }) => {
  return (
    <div className="w-64 fixed bg-red-500 shadow-lg border-r border-gray-100 min-h-screen flex flex-col justify-between">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-white mb-8 px-7">
          Management Report
        </h2>
        <nav className="space-y-2">
          {[
            { id: "dashboard", label: "📊 Dashboard" },
            { id: "TableView", label: "Table" },
             { id: "Performance", label: "Performance" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => onChangePage(item.id)}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                activePage === item.id
                  ? "text-white bg-red-600 shadow-md"
                  : "text-white hover:bg-red-400"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
