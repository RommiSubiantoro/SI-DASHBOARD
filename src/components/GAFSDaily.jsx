import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";

const GAFSDaily = ({
  loading = false,
  onAdd,
  onEdit,
  onDelete,
  onExport,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchedData, setFetchedData] = useState([]);
  const [selectedYear, setSelectedYear] = useState("2025");
  const itemsPerPage = 10;

  // 🔄 Ambil data dari Firestore (koleksi daily_obcs)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "daily_obcs"), (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFetchedData(fetched);
    });
    return () => unsubscribe();
  }, []);

  // 🟢 Upload File Excel ke Firestore
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // ✅ Pastikan nama sheet sesuai
      const sheetName = "Daily OBCS";
      if (!workbook.Sheets[sheetName]) {
        alert(`❌ Sheet '${sheetName}' tidak ditemukan di file Excel!`);
        return;
      }

      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      // 🔹 Simpan setiap baris ke Firestore
      for (const row of sheet) {
        await addDoc(collection(db, "daily_obcs"), {
          namaPetugas: row["Nama Petugas"] || "",
          areaTugas: row["Area Tugas"] || "",
          tanggal: row["Tanggal"] || "",
          checklist: row["Checklist Aktivitas Rutin"] || "",
          createdAt: new Date(),
        });
      }

      alert("✅ Upload berhasil! Data dari sheet 'Daily OB/CS' telah disimpan.");
    };

    reader.readAsArrayBuffer(file);
  };

  // 🔍 Filter data berdasarkan pencarian
  const filteredData = useMemo(() => {
    return fetchedData.filter(
      (item) =>
        item.namaPetugas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.areaTugas?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tanggal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.checklist?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [fetchedData, searchTerm]);

  // 📄 Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      {/* 🔹 Header dengan filter Tahun dan Upload */}
      <Header
        title="Daily OB/CS Report"
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        showUpload={true}
        onUpload={handleUpload}
      />

      {/* 🔹 Input pencarian */}
      <div className="flex justify-end px-4">
        <input
          type="text"
          placeholder="Cari data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:outline-none"
        />
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
                <th className="px-4 py-2">Nama Petugas</th>
                <th className="px-4 py-2">Area Tugas</th>
                <th className="px-4 py-2">Tanggal</th>
                <th className="px-4 py-2">Checklist Aktivitas Rutin</th>
                <th className="px-4 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </td>
                    <td className="px-4 py-2">{item.namaPetugas || "-"}</td>
                    <td className="px-4 py-2">{item.areaTugas || "-"}</td>
                    <td className="px-4 py-2">{item.tanggal || "-"}</td>
                    <td className="px-4 py-2">{item.checklist || "-"}</td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit && onEdit(item)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete && onDelete(item.id)}
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

export default GAFSDaily;
