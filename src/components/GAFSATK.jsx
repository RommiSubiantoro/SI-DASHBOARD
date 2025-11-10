import React, { useState, useMemo } from "react";

const GAFSATK = ({
  data = [],
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onExport,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔍 Filter data berdasarkan beberapa kolom penting
  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.ID_Detail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ID_Permintaan_Induk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Barang_yang_Diminta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Kategori?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* 🔹 Filter & Tombol Aksi */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Cari data ATK/RTG..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          ➕ Tambah
        </button>
        <button
          onClick={onExport}
          disabled={data.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          📊 Ekspor
        </button>
      </div>

      {/* 🔹 Tabel Data */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-red-500 text-white">
              <tr>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">ID Detail</th>
                <th className="px-4 py-2">ID Permintaan Induk</th>
                <th className="px-4 py-2">Barang yang Diminta</th>
                <th className="px-4 py-2">Department</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Satuan</th>
                <th className="px-4 py-2">Jumlah Diminta</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-4 py-6 text-center text-gray-500">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-2">{item.ID_Detail || "-"}</td>
                    <td className="px-4 py-2">{item.ID_Permintaan_Induk || "-"}</td>
                    <td className="px-4 py-2">{item.Barang_yang_Diminta || "-"}</td>
                    <td className="px-4 py-2">{item.Department || "-"}</td>
                    <td className="px-4 py-2">{item.Kategori || "-"}</td>
                    <td className="px-4 py-2">{item.Satuan || "-"}</td>
                    <td className="px-4 py-2">{item.Jumlah_Diminta || "-"}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 🔹 Pagination */}
      <div className="flex justify-between items-center px-4 py-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          &lt; Prev
        </button>
        <span className="text-sm">
          Halaman {currentPage} dari {totalPages || 1}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
};

export default GAFSATK;
