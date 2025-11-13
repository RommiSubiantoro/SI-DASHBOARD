import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import Header from "../components/Header";

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
  const [selectedUnit, setSelectedUnit] = useState("");
  const [units, setUnits] = useState([]);
  const [selectedYear, setSelectedYear] = useState("2025");
  const itemsPerPage = 10;

  // 🟢 Upload handler (khusus sheet "Driver Report")
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return alert("❌ Tidak ada file dipilih.");

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheet = workbook.Sheets["Driver Report"];
        if (!sheet) {
          alert("❌ Sheet 'Driver Report' tidak ditemukan di file Excel!");
          return;
        }

        const rows = XLSX.utils.sheet_to_json(sheet);

        if (rows.length === 0) {
          alert("❌ Sheet kosong atau format header salah!");
          return;
        }

        for (const row of rows) {
          const docRef = await addDoc(collection(db, "driver_report"), {
            NamaDriver: row["Nama Driver"] || "",
            Kendaraan: row["Kendaraan (No. Polisi)"] || "",
            Tanggal: row["Tanggal"] || "",
            JamBerangkat: row["Jam Berangkat"] || "",
            JamKembali: row["Jam Kembali"] || "",
            KMAwal: row["KM Awal"] || "",
            KMAkhir: row["KM Akhir"] || "",
            TujuanPerjalanan: row["Tujuan Perjalanan"] || "",
            UnitBisnis: row["Unit Bisnis"] || "",
            Catatan: row["Catatan"] || "",
            createdAt: new Date(),
          });
        }

        alert(
          "✅ Upload berhasil! Data dari 'Driver Report' tersimpan ke Firestore."
        );
      } catch (error) {
        console.error("❌ Gagal upload:", error);
        alert("Gagal upload! Cek console untuk detail error.");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // 🔄 Ambil data unit dari Firestore
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

  // 🔍 Filter berdasarkan nama driver, kendaraan, atau tujuan
  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        item.NamaDriver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.Kendaraan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.TujuanPerjalanan?.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        item.UnitBisnis?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

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
        title="Driver Report"
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        units={units}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        showUpload={true}
        onUpload={() => document.getElementById("driverUpload").click()}
      />

      {/* 🔹 Input file tersembunyi */}
      <input
        id="driverUpload"
        type="file"
        accept=".xlsx, .xls"
        onChange={handleUpload}
        className="hidden"
      />

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
                  <td
                    colSpan="12"
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
                    <td className="px-4 py-2">{item.NamaDriver || "-"}</td>
                    <td className="px-4 py-2">{item.Kendaraan || "-"}</td>
                    <td className="px-4 py-2">{item.Tanggal || "-"}</td>
                    <td className="px-4 py-2">{item.JamBerangkat || "-"}</td>
                    <td className="px-4 py-2">{item.JamKembali || "-"}</td>
                    <td className="px-4 py-2">{item.KMAwal || "-"}</td>
                    <td className="px-4 py-2">{item.KMAkhir || "-"}</td>
                    <td className="px-4 py-2">
                      {item.TujuanPerjalanan || "-"}
                    </td>
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
