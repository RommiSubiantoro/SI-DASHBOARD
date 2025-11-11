// src/pages/GAFSATK.jsx
import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";

const GAFSATK = ({ onAdd, onEdit, onDelete, onExport }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [units, setUnits] = useState([]);
  const [selectedYear, setSelectedYear] = useState("2025");
  const [fetchedData, setFetchedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 10;

  // 🟢 Upload handler (khusus sheet "ATKRTG Report")
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      console.log("📄 Sheets ditemukan:", workbook.SheetNames);

      // ✅ Pastikan sheet "ATKRTG Report" ada
      if (!workbook.Sheets["ATKRTG Report"]) {
        alert("❌ Sheet 'ATKRTG Report' tidak ditemukan di file Excel!");
        return;
      }

      // 🔹 Ambil data dari sheet "ATKRTG Report"
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets["ATKRTG Report"]);
      console.log("📊 Data dari sheet:", sheet);

      if (sheet.length === 0) {
        alert("⚠️ Sheet 'ATKRTG Report' kosong, tidak ada data yang disimpan.");
        return;
      }

      setLoading(true);
      let success = 0;

      // 🔹 Simpan ke Firestore
      for (const row of sheet) {
        try {
          await addDoc(collection(db, "atk_rtg_report"), {
            ID_Detail: row["ID Detail"] || "",
            ID_Permintaan_Induk: row["ID Permintaan Induk"] || "",
            Barang_yang_Diminta: row["Barang yang Diminta"] || "",
            Department: row["Department"] || "",
            Kategori: row["Kategori"] || "",
            Satuan: row["Satuan"] || "",
            Jumlah_Diminta: row["Jumlah Diminta"] || "",
            createdAt: new Date(),
          });
          success++;
        } catch (err) {
          console.error("❌ Gagal menambah dokumen:", err);
        }
      }

      setLoading(false);
      alert(`✅ Upload berhasil! ${success} data disimpan ke Firestore.`);
    };

    reader.readAsArrayBuffer(file);
  };

  // 🔄 Ambil daftar unit dari Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "units"), (snapshot) => {
      const unitsList = snapshot.docs.map((doc) => doc.data().name);
      setUnits(unitsList);
      if (unitsList.length > 0 && !selectedUnit) {
        setSelectedUnit(unitsList[0]);
      }
    });
    return () => unsubscribe();
  }, [selectedUnit]);

  // 🔄 Ambil data dari Firestore (koleksi atk_rtg_report)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "atk_rtg_report"),
      (snapshot) => {
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("📥 Data dari Firestore:", fetched);
        setFetchedData(fetched);
      }
    );
    return () => unsubscribe();
  }, []);

  // 🔍 Filter data berdasarkan pencarian
  const filteredData = useMemo(() => {
    return fetchedData.filter(
      (item) =>
        item.ID_Detail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.ID_Permintaan_Induk?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Barang_yang_Diminta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Kategori?.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* 🔹 Header dengan tombol Upload */}
      <Header
        title="ATK/RTG Report"
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        units={units}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        showUpload={true}
        onUpload={() => document.getElementById("atkUpload").click()}
      />

      {/* 🔹 Input file tersembunyi */}
      <input
        id="atkUpload"
        type="file"
        accept=".xlsx, .xls"
        onChange={handleUpload}
        className="hidden"
      />

      {/* 🔹 Pencarian */}
      <div className="flex gap-3 items-center px-4">
        <input
          type="text"
          placeholder="Cari data ATK/RTG..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm"
        />
      </div>

      {/* 🔹 Tabel Data */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Sedang memproses...</div>
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
                <th className="px-4 py-2 text-center">Aksi</th>
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
                    <td className="px-4 py-2">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="px-4 py-2">{item.ID_Detail || "-"}</td>
                    <td className="px-4 py-2">{item.ID_Permintaan_Induk || "-"}</td>
                    <td className="px-4 py-2">{item.Barang_yang_Diminta || "-"}</td>
                    <td className="px-4 py-2">{item.Department || "-"}</td>
                    <td className="px-4 py-2">{item.Kategori || "-"}</td>
                    <td className="px-4 py-2">{item.Satuan || "-"}</td>
                    <td className="px-4 py-2">{item.Jumlah_Diminta || "-"}</td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
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
