import React from "react";
import { Download, Upload, FileText } from "lucide-react";

const ControlButtons = ({
  onImportData,
  onImportBudget, // ✅ tombol tambahan
  onExportExcel,
  onExportPDF,
  showImportButton = true,
  showExportButtons = true,
}) => {
  // Handle Import Data
  const handleFileChangeData = (e) => {
    onImportData(e);
    e.target.value = ""; // reset input supaya bisa upload file yang sama lagi
  };

  // Handle Import Budget
  const handleFileChangeBudget = (e) => {
    onImportBudget(e);
    e.target.value = ""; // reset input supaya bisa upload file yang sama lagi
  };

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-md border border-gray-100 p-5 mb-6">
      <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
        {/* 🔹 Tombol Import Data (Actual) */}
        {showImportButton && (
          <>
            <label className="flex items-center gap-3 px-6 py-3 bg-green-50 hover:bg-green-100 text-green-700 font-semibold text-sm rounded-lg transition-all duration-300 border border-green-200 hover:border-green-300 shadow-sm hover:shadow-md cursor-pointer">
              <Upload size={22} className="text-green-600" />
              Import Act
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChangeData}
                className="hidden"
              />
            </label>

            {/* 🔹 Tombol Import Budget */}
            <label className="flex items-center gap-3 px-6 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-lg transition-all duration-300 border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md cursor-pointer">
              <Upload size={22} className="text-blue-600" />
              Import Budget
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChangeBudget}
                className="hidden"
              />
            </label>
          </>
        )}

        {/* 🔹 Tombol Export */}
        {showExportButtons && (
          <>
            <button
              onClick={onExportExcel}
              className="flex items-center gap-3 px-6 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm rounded-lg transition-all duration-300 border border-emerald-200 hover:border-emerald-300 shadow-sm hover:shadow-md"
            >
              <Download size={22} className="text-emerald-600" />
              Export Excel
            </button>

            <button
              onClick={onExportPDF}
              className="flex items-center gap-3 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm rounded-lg transition-all duration-300 border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md"
            >
              <FileText size={22} className="text-red-600" />
              Export PDF
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ControlButtons;
