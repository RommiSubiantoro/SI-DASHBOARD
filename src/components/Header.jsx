import React from 'react';

const Header = ({ selectedUnit, setSelectedUnit, units, title = "Selamat Datang Didashboard" }) => {
  return (
    <div className="header">
      <h1 className="title-header">{title}</h1>
      <div className="unit-selector">
        <label htmlFor="unitSelect">Pilih Unit Bisnis: </label>
        <select
          id="unitSelect"
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="dropdown-unit"
        >
          {units.map((unit) => (
            <option key={unit} value={unit}>{unit}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Header;