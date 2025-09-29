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

    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">

      {/* Header dengan Filter dan Info */}
      {showFilters && busLines.length > 0 && (
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Pilih Bus Line:
              </label>
              <select
                value={busLineFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm transition-all duration-200 hover:border-gray-400"
              >
                <option value="">📋 All Bus Lines</option>
                {busLines.map((line, idx) => (
                  <option key={idx} value={line}>🚌 {line}</option>
                ))}
              </select>
            </div>

            {/* Search atau filter tambahan bisa ditambah di sini */}
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {currentRows.length} records
            </div>
          </div>
        </div>
      )}

      {/* Title Section */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
            {title}
          </h3>
          <div className="hidden sm:block text-sm text-gray-500">
            Data Table
          </div>
        </div>
      </div>

      {/* Table Container - Mobile & Desktop Responsive */}
      <div className="overflow-x-auto bg-white">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full text-sm">

            {/* Desktop Header */}
            <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200 hidden md:table-header-group">
              <tr>
                <th className="px-4 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider text-left sticky left-0 bg-gray-100 z-20 border-r border-gray-200 min-w-[120px]">
                  Category
                </th>
                <th className="px-4 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider text-left sticky left-[120px] bg-gray-100 z-20 border-r border-gray-200 min-w-[100px]">
                  Code
                </th>
                <th className="px-4 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider text-left min-w-[80px]">
                  Area
                </th>
                <th className="px-4 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider text-left min-w-[100px]">
                  Bus Line
                </th>
                {months.map((month) => (
                  <th key={month} className="px-4 py-4 font-semibold text-gray-700 text-xs uppercase tracking-wider text-right min-w-[100px] hover:bg-gray-200 cursor-pointer transition-colors">
                    {month}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Desktop Body */}
            <tbody className="bg-white divide-y divide-gray-200 hidden md:table-row-group">
              {currentRows.length === 0 ? (
                <tr>
                  <td colSpan={4 + months.length} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <div className="text-4xl mb-3">📊</div>
                      <div className="text-lg font-medium">Tidak ada data</div>
                      <div className="text-sm">Silakan tambah data atau ubah filter</div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentRows.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <td className="px-4 py-4 text-gray-900 font-medium sticky left-0 bg-white group-hover:bg-blue-50 z-10 border-r border-gray-200">
                      <div className="truncate max-w-[110px]" title={row.category}>
                        {row.category}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-700 font-mono text-xs sticky left-[120px] bg-white group-hover:bg-blue-50 z-10 border-r border-gray-200">
                      {row.accountCode}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {row.area}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {row.busLine}
                      </span>
                    </td>
                    {months.map((month) => (
                      <td key={month} className="px-4 py-4 text-gray-900 text-right font-mono tabular-nums">
                        <span className={`inline-block ${row[month] > 0 ? 'text-green-700 font-semibold' : row[month] < 0 ? 'text-red-700 font-semibold' : 'text-gray-500'}`}>
                          {typeof row[month] === 'number' ? row[month].toLocaleString() : (row[month] || '—')}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-gray-200">
            {currentRows.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-3">📊</div>
                <div className="text-lg font-medium">Tidak ada data</div>
                <div className="text-sm">Silakan tambah data atau ubah filter</div>
              </div>
            ) : (
              currentRows.map((row, index) => (
                <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-gray-900">{row.category}</div>
                        <div className="text-xs text-gray-500 font-mono">{row.accountCode}</div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full mb-1">
                          {row.area}
                        </div>
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {row.busLine}
                        </div>
                      </div>
                    </div>

                    {/* Monthly data in mobile */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {months.map((month) => (
                        <div key={month} className="flex justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-600">{month}:</span>
                          <span className="font-mono font-medium">
                            {typeof row[month] === 'number' ? row[month].toLocaleString() : (row[month] || '—')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="bg-gradient-to-r from-gray-50 to-white border-t border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

            {/* Pagination Controls */}
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ⏮️
              </button>

              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ◀ Prev
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = Math.max(1, Math.min(currentPage - 2 + i, totalPages - 4 + i));
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next ▶
              </button>

              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ⏭️
              </button>
            </div>

            {/* Info */}
            <div className="text-center sm:text-right">
              <div className="text-sm text-gray-700 font-medium">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="text-xs text-gray-500">
                Total {currentRows.length} records
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;