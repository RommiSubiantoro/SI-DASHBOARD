import React, { useRef } from "react";

const Header = ({
  selectedUnit,
  setSelectedUnit,
  units,
  title = "Selamat Datang Didashboard",
  selectedYear,
  setSelectedYear,
  showUpload = false,
  onUpload, // handler upload file
}) => {
  const availableYears = ["2025", "2024"];
  const fileInputRef = useRef(null); // untuk trigger klik file input

  const handleButtonClick = () => {
    fileInputRef.current.click(); // buka file picker
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-white shadow p-4 rounded-lg mb-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>

      <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center gap-4">
        {/* Unit selector */}
        <div className="flex items-center space-x-2">
          <label
            htmlFor="unitSelect"
            className="text-sm font-medium text-gray-700"
          >
            Pilih Unit Bisnis:
          </label>
          <select
            id="unitSelect"
            value={selectedUnit || ""}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
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

        {/* Year selector */}
        <div className="flex items-center space-x-2">
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
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            {availableYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* 🔹 Tombol Upload untuk Daily OB/CS */}
        {showUpload && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx, .xls"
              onChange={onUpload}
              className="hidden"
            />
            <button
              onClick={handleButtonClick}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow transition"
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
