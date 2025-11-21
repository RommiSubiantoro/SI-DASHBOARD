import React, { useRef } from "react";

const Header = ({
  title = "Selamat Datang di Dashboard",
  selectedUnit,
  setSelectedUnit,
  units = [],
  selectedYear,
  setSelectedYear,
  showUpload = false,
  onUpload, // handler untuk upload file
}) => {
  const availableYears = ["2025", "2024"];
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    if (onUpload) onUpload(e);
    e.target.value = ""; // reset agar bisa upload file yang sama dua kali
  };

  const triggerUpload = () => fileInputRef.current?.click();

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white shadow p-4 rounded-lg mb-6 gap-4">
      {/* 🏷️ Title */}
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h1>

      {/* 🔧 Filter Section */}
      <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
        {/* 🏢 Unit Selector */}
        {units.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <label
              htmlFor="unitSelect"
              className="text-sm font-medium text-gray-700"
            >
              Unit Bisnis:
            </label>
            <select
              id="unitSelect"
              value={selectedUnit || ""}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="" disabled>
                Pilih unit...
              </option>
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 📅 Year Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          <label
            htmlFor="yearSelect"
            className="text-sm font-medium text-gray-700"
          >
            Tahun:
          </label>
          <select
            id="yearSelect"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* ⬆️ Upload Excel Button */}
        {showUpload && (
          <div className="w-full sm:w-auto">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              onClick={triggerUpload}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition"
            >
              ⬆️ Upload Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
