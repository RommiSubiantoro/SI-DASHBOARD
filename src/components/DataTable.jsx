import React, { useState, useMemo, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

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
  const [accountCodeFilter, setAccountCodeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // 🔹 State untuk masterCode dari Firestore
  const [masterCodeData, setMasterCodeData] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(false);

  // 🔹 Ambil masterCode dari Firestore
  useEffect(() => {
    const fetchMasterCode = async () => {
      try {
        setLoadingMaster(true);
        const snap = await getDocs(collection(db, "masterCode"));
        const docs = snap.docs.map((d) => ({
          ...d.data(),
          code: String(d.data().Code || d.data().code || "").trim(),
          category: d.data().Category || d.data().category || "Unknown",
        }));
        setMasterCodeData(docs);
      } catch (err) {
        console.error("❌ Gagal mengambil masterCode:", err);
      } finally {
        setLoadingMaster(false);
      }
    };
    fetchMasterCode();
  }, []);

  // 🔹 Ambil daftar kategori dari masterCode
  const categories = useMemo(() => {
    if (masterCodeData.length === 0) return [];
    const unique = [
      ...new Set(
        masterCodeData
          .map((m) => m.category?.trim())
          .filter((c) => c && c !== "")
      ),
    ];
    return unique;
  }, [masterCodeData]);

  // 🔹 Ambil daftar Business Line dari data transaksi
  const businessLines = useMemo(() => {
    return [...new Set(data.map((item) => item.businessLine))].filter(Boolean);
  }, [data]);

  // 🔹 Filter data sesuai dropdown & input teks
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchCategory =
        !categoryFilter ||
        masterCodeData.some(
          (m) =>
            m.category === categoryFilter &&
            String(m.code).trim() === String(item.accountCode).trim()
        );

      const matchBusinessLine =
        !businessLineFilter || item.businessLine === businessLineFilter;

      const matchAccountCode =
        !accountCodeFilter ||
        String(item.accountCode)
          .toLowerCase()
          .includes(accountCodeFilter.toLowerCase());

      return matchCategory && matchBusinessLine && matchAccountCode;
    });
  }, [
    data,
    categoryFilter,
    businessLineFilter,
    accountCodeFilter,
    masterCodeData,
  ]);

  // 🔹 Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = showPagination
    ? filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      )
    : filteredData;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      </div>

      {/* 🔹 Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 mb-4">
          {/* 🔹 Category (dropdown) */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">📋 All Categories</option>
            {loadingMaster ? (
              <option>⏳ Loading...</option>
            ) : (
              categories.map((cat, i) => (
                <option key={`cat-${i}`} value={cat}>
                  📂 {cat}
                </option>
              ))
            )}
          </select>

          {/* 🔹 Business Line (dropdown) */}
          <select
            value={businessLineFilter}
            onChange={(e) => {
              setBusinessLineFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">🏢 All Business Lines</option>
            {businessLines.map((line, i) => (
              <option key={`bl-${i}`} value={line}>
                {line}
              </option>
            ))}
          </select>

          {/* 🔹 Account Code (input teks) */}
          <input
            type="text"
            placeholder="🔍 Search Account Code..."
            value={accountCodeFilter}
            onChange={(e) => {
              setAccountCodeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* 🔹 Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 border-b">
              {Object.keys(data[0] || {}).map((key) => (
                <th key={key} className="px-3 py-2 text-left border">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 border-b">
                {Object.values(row).map((val, j) => (
                  <td key={j} className="px-3 py-2 border">
                    {String(val)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🔹 Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            ◀
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;
