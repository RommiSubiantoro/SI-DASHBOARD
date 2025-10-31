// src/components/DashboardMultiUnit.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DashboardMultiUnit = ({ selectedYear: initialYear }) => {
  const [unitList, setUnitList] = useState([]);
  const [masterCode, setMasterCode] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedMonth, setSelectedMonth] = useState("ALL");
  const [categoryList, setCategoryList] = useState(["ALL"]);

  // 🔹 Ambil daftar unit
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const snap = await getDocs(collection(db, "units"));
        const units = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUnitList(units);
      } catch (error) {
        console.error("❌ Gagal ambil units:", error);
      }
    };
    fetchUnits();
  }, []);

  // 🔹 Ambil masterCode (kategori & code)
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        const codes = snap.docs.map((doc) => doc.data());
        setMasterCode(codes);
        const uniqueCats = ["ALL", ...new Set(codes.map((c) => c.category))];
        setCategoryList(uniqueCats);
      } catch (error) {
        console.error("❌ Gagal ambil masterCode:", error);
      }
    };
    fetchMaster();
  }, []);

  // 🔹 Ambil data semua unit
  useEffect(() => {
    if (!unitList.length || !selectedYear) return;

    const fetchSummary = async () => {
      setLoading(true);
      const result = [];

      for (const unit of unitList) {
        try {
          const path = `unitData/${unit.name}/${selectedYear}/data/items`;
          const snap = await getDocs(collection(db, path));
          const docs = snap.docs.map((doc) => doc.data());

          // Filter hanya tipe Debit
          let filtered = docs.filter((d) => d.type === "Debit");

          // Filter kategori
          if (selectedCategory !== "ALL") {
            const codes = masterCode
              .filter((m) => m.category === selectedCategory)
              .map((m) => String(m.code).trim());
            filtered = filtered.filter((d) => codes.includes(String(d.accountCode).trim()));
          }

          // Hitung total per bulan
          const monthlyTotals = MONTHS.map((month) => {
            const total = filtered
              .filter((d) => d.month === month)
              .reduce((sum, d) => sum + (parseFloat(d.docValue) || 0), 0);
            return total;
          });

          const totalAll = monthlyTotals.reduce((a, b) => a + b, 0);

          result.push({
            unit: unit.name,
            months: monthlyTotals,
            total: totalAll,
          });
        } catch (error) {
          console.error(`❌ Gagal ambil data ${unit.name}:`, error);
        }
      }

      setSummaryData(result);
      setLoading(false);
    };

    fetchSummary();
  }, [unitList, selectedYear, selectedCategory, masterCode]);

  // 🔹 Tentukan bulan yang ditampilkan
  const displayedMonths =
    selectedMonth === "ALL" ? MONTHS : [selectedMonth];

  return (
    <div className="p-6 bg-white rounded-xl shadow-md w-full max-w-4xl mx-auto mt-10">
      <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">
        📊 Ringkasan Unit Bisnis per Bulan & Kategori
      </h2>

      {/* 🔹 Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Tahun</label>
          <select
            className="border px-2 py-1.5 rounded-md w-full text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Kategori</label>
          <select
            className="border px-2 py-1.5 rounded-md w-full text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categoryList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">Bulan</label>
          <select
            className="border px-2 py-1.5 rounded-md w-full text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="ALL">Semua Bulan</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 🔹 Tabel Data */}
      {loading ? (
        <p className="text-center text-gray-500 py-4">⏳ Memuat data...</p>
      ) : (
        <div className="overflow-x-auto max-h-[480px] border rounded-lg">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-blue-100 sticky top-0 z-10">
              <tr>
                <th className="border px-3 py-2 text-left text-gray-700 font-semibold w-40">
                  Unit Bisnis
                </th>
                {displayedMonths.map((m) => (
                  <th
                    key={m}
                    className="border px-3 py-2 text-right text-gray-700 font-semibold w-20"
                  >
                    {m}
                  </th>
                ))}
                <th className="border px-3 py-2 text-right text-gray-700 font-semibold w-24">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((row) => (
                <tr key={row.unit} className="hover:bg-gray-50 transition duration-150">
                  <td className="border px-3 py-1.5 font-medium text-gray-800 truncate">
                    {row.unit}
                  </td>
                  {displayedMonths.map((m) => {
                    const idx = MONTHS.indexOf(m);
                    const val = row.months[idx] || 0;
                    return (
                      <td key={m} className="border px-3 py-1.5 text-right text-gray-700">
                        {val.toLocaleString("id-ID")}
                      </td>
                    );
                  })}
                  <td className="border px-3 py-1.5 text-right font-semibold text-gray-900">
                    {row.total.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
              {summaryData.length === 0 && (
                <tr>
                  <td
                    colSpan={displayedMonths.length + 2}
                    className="text-center py-4 text-gray-500"
                  >
                    Tidak ada data untuk filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardMultiUnit;
