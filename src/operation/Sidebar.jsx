import React from "react";
import { LayoutDashboard, FileText, LogOut, Menu } from "lucide-react";

const Sidebar = ({ activePage, onChangePage, onLogout, isOpen, onClose }) => {
  const menuItems = [
    {
      id: "jo-estimasi",
      label: "JO Input",
      icon: <FileText size={18} />,
    },
    {
      id: "jo-rekap",
      label: "JO Rekap",
      icon: <FileText size={18} />,
    },
    {
      id: "jo-volume",
      label: "JO Volume",
      icon: <FileText size={18} />,
    },
  ];

  return (
    <div
      className={`fixed inset-y-0 left-0 w-64 bg-red-600 text-white z-50
      transform transition-transform duration-300
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
      md:translate-x-0`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-red-500">
        <h2 className="text-lg font-bold">Operation</h2>

        {/* Close button (mobile) */}
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded hover:bg-red-500"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              onChangePage(item.id);
              onClose && onClose();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition
              ${
                activePage === item.id
                  ? "bg-white text-red-600 shadow"
                  : "hover:bg-red-500"
              }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
