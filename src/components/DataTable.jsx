import React, { useState, useMemo } from "react";

const DataTable = ({
  data = [],
  months = [],
  showFilters = true,
  showPagination = true,
  rowsPerPage = 25,
  title = "Data Table",
}) => {
  const [categoryFilter, setCategoryFilter] = useState("");
  const [businessLineFilter, setBusinessLineFilter] = useState("");
  const [accountCodeFilter, setAccountCodeFilter] = useState(""); // 🔹 NEW: filter account code
  const [currentPage, setCurrentPage] = useState(1);

  const defaultMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthList = months.length > 0 ? months : defaultMonths;

  const safeData = Array.isArray(data) ? data : [];

  // 🔹 Filter berdasarkan Category, BusinessLine, dan AccountCode
  const filteredData = useMemo(() => {
    return safeData.filter((row) => {
      const matchCategory = categoryFilter
        ? row.category === categoryFilter
        : true;
      const matchBusiness = businessLineFilter
        ? row.businessLine === businessLineFilter
        : true;
      const matchAccount = accountCodeFilter
        ? row.accountCode === accountCodeFilter
        : true;
      return matchCategory && matchBusiness && matchAccount;
    });
  }, [safeData, categoryFilter, businessLineFilter, accountCodeFilter]);

  // 🔹 Ambil unique category, business line, dan account code
  const categories = useMemo(() => {
    return [...new Set(data.map((item) => item.category))].filter(Boolean);
  }, [data]);

  const businessLines = useMemo(() => {
    return [...new Set(data.map((item) => item.businessLine))].filter(Boolean);
  }, [data]);

  const accountCodes = useMemo(() => {
    return [...new Set(data.map((item) => item.accountCode))].filter(Boolean);
  }, [data]);

  // 🔹 Pagination logic
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirstRow, indexOfLastRow);

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* 🔹 FILTER SECTION */}
      {showFilters && (
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-wrap">
            {/* Category Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Category:
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">📋 All Categories</option>
                {categories.map((cat, i) => (
                  <option key={`cat-${i}`} value={cat}>
                    📂 {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Business Line Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Business Line:
              </label>
              <select
                value={businessLineFilter}
                onChange={(e) => {
                  setBusinessLineFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">🏢 All Business Lines</option>
                {businessLines.map((bl, i) => (
                  <option key={`bl-${i}`} value={bl}>
                    🏢 {bl}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔹 NEW: Account Code Filter */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Account Code:
              </label>
              <select
                value={accountCodeFilter}
                onChange={(e) => {
                  setAccountCodeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">🔢 All Account Codes</option>
                {accountCodes.map((code, i) => (
                  <option key={`acc-${i}`} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            {/* Info Jumlah Data */}
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredData.length} records
            </div>
          </div>
        </div>
      )}

      {/* 🔹 TABLE SECTION */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Area</th>
              <th className="px-4 py-3 text-left">Business Line</th>
              {monthList.map((m) => (
                <th key={`head-${m}`} className="px-4 py-3 text-right">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {currentRows.length === 0 ? (
              <tr>
                <td colSpan={4 + monthList.length} className="text-center py-8">
                  <div className="text-gray-500">Tidak ada data</div>
                </td>
              </tr>
            ) : (
              currentRows.map((row, i) => (
                <tr key={`row-${i}`} className="hover:bg-blue-50">
                  <td className="px-4 py-2">{row.category}</td>
                  <td className="px-4 py-2 font-mono text-xs">
                    {row.accountCode}
                  </td>
                  <td className="px-4 py-2">{row.area}</td>
                  <td className="px-4 py-2">{row.businessLine}</td>
                  {monthList.map((m) => (
                    <td key={`cell-${i}-${m}`} className="px-4 py-2 text-right">
                      {typeof row[m] === "number"
                        ? row[m].toLocaleString()
                        : row[m] || "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 🔹 PAGINATION SECTION */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t">
          <div className="text-sm text-gray-700">
            Halaman {currentPage} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-white border rounded disabled:opacity-50"
            >
              ◀
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-white border rounded disabled:opacity-50"
            >
              ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
