import React, { useState, useMemo } from "react";

const GAFSDriver = ({
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

  // 🔍 Filter berdasarkan nama driver, kendaraan, atau tujuan
  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.NamaDriver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Kendaraan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.TujuanPerjalanan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.UnitBisnis?.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder="Cari driver / kendaraan / tujuan..."
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
                <th className="px-4 py-2">Nama Driver</th>
                <th className="px-4 py-2">Kendaraan (No. Polisi)</th>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Jam Berangkat</th>
                <th className="px-4 py-2">Jam Kembali</th>
                <th className="px-4 py-2">KM Awal</th>
                <th className="px-4 py-2">KM Akhir</th>
                <th className="px-4 py-2">Tujuan Perjalanan</th>
                <th className="px-4 py-2">Unit Bisnis</th>
                <th className="px-4 py-2">Catatan</th>
                <th className="px-4 py-2">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="12" className="px-4 py-6 text-center text-gray-500">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-2">{item.NamaDriver || "-"}</td>
                    <td className="px-4 py-2">{item.Kendaraan || "-"}</td>
                    <td className="px-4 py-2">{item.Tanggal || "-"}</td>
                    <td className="px-4 py-2">{item.JamBerangkat || "-"}</td>
                    <td className="px-4 py-2">{item.JamKembali || "-"}</td>
                    <td className="px-4 py-2">{item.KMAwal || "-"}</td>
                    <td className="px-4 py-2">{item.KMAkhir || "-"}</td>
                    <td className="px-4 py-2">{item.TujuanPerjalanan || "-"}</td>
                    <td className="px-4 py-2">{item.UnitBisnis || "-"}</td>
                    <td className="px-4 py-2">{item.Catatan || "-"}</td>
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

export default GAFSDriver;
