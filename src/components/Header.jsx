import React from 'react';

const Header = ({ selectedUnit, setSelectedUnit, units, title = "Selamat Datang Didashboard" }) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between bg-white shadow p-4 rounded-lg mb-6">
      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-800">{title}</h1>

      {/* Unit selector */}
      <div className="mt-4 md:mt-0 flex items-center space-x-2">
        <label htmlFor="unitSelect" className="text-sm font-medium text-gray-700">
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
    </div>
  );
};

export default Header;
