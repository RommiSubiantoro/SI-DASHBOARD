import React, { useState, useMemo } from 'react';

const DataTable = ({ 
  data, 
  showFilters = true,
  showPagination = true,
  rowsPerPage = 25,
  title = "Data Table"
}) => {
  const [busLineFilter, setBusLineFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // Filter data berdasarkan bus line
  const filteredData = useMemo(() => {
    if (!showFilters || !busLineFilter) return data;
    return data.filter(row => row.busLine === busLineFilter);
  }, [data, busLineFilter, showFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  // Get unique bus lines untuk filter
  const busLines = useMemo(() => {
    return [...new Set(data.map(item => item.busLine))].filter(Boolean);
  }, [data]);

  const handleFilterChange = (value) => {
    setBusLineFilter(value);
    setCurrentPage(1); // Reset ke halaman pertama
  };

  return (
    <div className="body-datatable">
      {/* Filter Section */}
      {showFilters && busLines.length > 0 && (
        <div className="filter-section">
          <label>Pilih Bus Line: </label>
          <select
            value={busLineFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="">All</option>
            {busLines.map((line, idx) => (
              <option key={idx} value={line}>{line}</option>
            ))}
          </select>
        </div>
      )}

      <h3 className="text-datatable">{title}</h3>
      
      {/* Table */}
      <div className="body-table">
        <table className="table-datatable">
          <thead>
            <tr>
              <th>Category</th>
              <th>Account Code</th>
              <th>Area</th>
              <th>Bus Line</th>
              {months.map((month) => (
                <th key={month}>{month}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRows.map((row, index) => (
              <tr key={index}>
                <td>{row.category}</td>
                <td>{row.accountCode}</td>
                <td>{row.area}</td>
                <td>{row.busLine}</td>
                {months.map((month) => (
                  <td key={month}>{row[month] || 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ◀ Prev
          </button>
          <span>Halaman {currentPage} dari {totalPages}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;