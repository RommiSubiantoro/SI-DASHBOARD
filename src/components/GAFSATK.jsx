// src/pages/GAFSATK.jsx
import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

import Piechart from "../components/Piechart";

const GAFSATK = ({ onEdit, onDelete }) => {
  // ====================== STATE ======================
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedDepartment, setSelectedDepartment] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [fetchedData, setFetchedData] = useState([]);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 10;

  // ====================== UPLOAD EXCEL ======================
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      if (!workbook.Sheets["ATKRTG Report"]) {
        alert("❌ Sheet 'ATKRTG Report' tidak ditemukan!");
        return;
      }

      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets["ATKRTG Report"]);
      if (sheet.length === 0) {
        alert("⚠️ Sheet kosong.");
        return;
      }

      setLoading(true);
      let success = 0;

      for (const row of sheet) {
        try {
          await addDoc(collection(db, "atk_rtg_report"), {
            ID_Detail: row["ID_Detail"] || "",
            ID_Permintaan_Induk: row["ID_Permintaan_Induk"] || "",
            Barang_yang_Diminta: row["Barang_yang_Diminta"] || "",
            Department: row["Department"] || "",
            Kategori: row["Kategori"] || "",
            Satuan: row["Satuan"] || "",
            Jumlah_Diminta: row["Jumlah_Diminta"] || "",
            year: selectedYear,
            createdAt: new Date(),
          });
          success++;
        } catch (err) {
          console.error("❌ Error:", err);
        }
      }

      setLoading(false);
      alert(
        `✅ Berhasil! ${success} data disimpan untuk tahun ${selectedYear}.`
      );
    };

    reader.readAsArrayBuffer(file);
  };

  // ====================== FETCH DATA ======================
  useEffect(() => {
    const q = query(
      collection(db, "atk_rtg_report"),
      where("year", "==", selectedYear)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFetchedData(fetched);
    });
    return () => unsubscribe();
  }, [selectedYear]);

  // ====================== FILTER ======================
  const filteredData = useMemo(() => {
    return fetchedData.filter((item) => {
      const matchesDepartment =
        selectedDepartment === "ALL" || item.Department === selectedDepartment;
      const matchesCategory =
        selectedCategory === "ALL" || item.Kategori === selectedCategory;
      const matchesSearch = [item.Department, item.Kategori]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesDepartment && matchesCategory && matchesSearch;
    });
  }, [fetchedData, selectedDepartment, selectedCategory, searchTerm]);

  const departments = useMemo(() => {
    const unique = [
      ...new Set(fetchedData.map((d) => d.Department).filter(Boolean)),
    ];
    return ["ALL", ...unique];
  }, [fetchedData]);

  const categories = useMemo(() => {
    const unique = [
      ...new Set(fetchedData.map((d) => d.Kategori).filter(Boolean)),
    ];
    return ["ALL", ...unique];
  }, [fetchedData]);

  // ====================== PAGINATION ======================
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ====================== RENDER ======================
  return (
    <div className="space-y-4 p-4">
      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow border">
        <h1 className="text-xl font-bold">ATK/RTG Report</h1>
        <button
          onClick={() => document.getElementById("atkUpload").click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Upload Excel
        </button>
        <input
          id="atkUpload"
          type="file"
          accept=".xlsx, .xls"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {/* ===== FILTER ===== */}
      <div className="flex gap-5">
        <div>
          <label className="block mb-1 font-medium">Filter Departemen</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Filter Kategori</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Tahun</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* ===== PIECHART ===== */}
      <div className="bg-white p-4 rounded-lg shadow border">
        <h2 className="text-lg font-semibold mb-2">
          📊 Piechart
        </h2>
        <Piechart data={filteredData} mode="atk" />
      </div>

      {/* ===== TABLE ===== */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border">
        {loading ? (
          <div className="p-6 text-center text-gray-500">
            Sedang memproses...
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-red-500 text-white">
              <tr>
                <th className="px-4 py-2">No</th>
                <th className="px-4 py-2">ID Detail</th>
                <th className="px-4 py-2">ID Permintaan Induk</th>
                <th className="px-4 py-2">Barang</th>
                <th className="px-4 py-2">Departemen</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Satuan</th>
                <th className="px-4 py-2">Jumlah</th>
                <th className="px-4 py-2 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
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
                    <td className="px-4 py-2">{item.ID_Detail}</td>
                    <td className="px-4 py-2">{item.ID_Permintaan_Induk}</td>
                    <td className="px-4 py-2">{item.Barang_yang_Diminta}</td>
                    <td className="px-4 py-2">{item.Department}</td>
                    <td className="px-4 py-2">{item.Kategori}</td>
                    <td className="px-4 py-2">{item.Satuan}</td>
                    <td className="px-4 py-2">{item.Jumlah_Diminta}</td>
                    <td className="px-4 py-2 flex gap-2 justify-center">
                      <button
                        onClick={() => onEdit(item)}
                        className="px-2 py-1 bg-blue-200 text-blue-800 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="px-2 py-1 bg-red-200 text-red-800 rounded"
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

      {/* ===== PAGINATION ===== */}
      <div className="flex justify-between items-center px-4 py-2">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
        >
          &lt; Prev
        </button>

        <span>
          Halaman {currentPage} dari {totalPages || 1}
        </span>

        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
        >
          Next &gt;
        </button>
      </div>
    </div>
  );
};

export default GAFSATK;
