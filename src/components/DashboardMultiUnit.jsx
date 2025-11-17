// src/components/DashboardMultiUnit.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MONTH_MAP = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

// Urutan kategori tetap
const CUSTOM_ORDER = [
  "Service Revenue",
  "Cost of Service",
  "Gross Profit",
  "General & Administration Expenses",
  "Other Income/Expense",
  "Pajak",
];

// Mapping nama kategori Firestore → nama yang tampil
const CATEGORY_MAP = {
  "Service Revenue": "Service Revenue",
  "Cost Of Service": "Cost of Service",
  "General & Administration Expense": "General & Administration Expenses",
  "Other Income (Expenses)": "Other Income/Expense",
  "Pajak": "Pajak",
};

const DashboardMultiUnit = ({ selectedYear: initialYear }) => {
  const [unitList, setUnitList] = useState([]);
  const [masterCode, setMasterCode] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(initialYear || new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("All");

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

  // 🔹 Ambil masterCode
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        const codes = snap.docs.map((doc) => doc.data());
        setMasterCode(codes);
      } catch (error) {
        console.error("❌ Gagal ambil masterCode:", error);
      }
    };
    fetchMaster();
  }, []);

  // 🔹 Ambil dan olah data semua unit → berdasarkan kategori
  useEffect(() => {
    if (!unitList.length || !masterCode.length || !selectedYear) return;

    const fetchSummary = async () => {
      setLoading(true);
      const categoryMap = {}; // { kategori: { unitName: total } }

      for (const unit of unitList) {
        try {
          const path = `unitData/${unit.name}/${selectedYear}/data/items`;
          const snap = await getDocs(collection(db, path));
          const docs = snap.docs.map((doc) => doc.data());

          // 🔹 Filter hanya tipe Debit, dan bulan jika bukan "All"
          const filtered = docs.filter((d) => {
            if (d.type !== "Debit") return false;
            if (selectedMonth === "All") return true;
            const monthNumber = MONTH_MAP[selectedMonth];
            return Number(d.month) === monthNumber;
          });

          // 🔹 Loop tiap kategori di masterCode
          masterCode.forEach((m) => {
            const cat = CATEGORY_MAP[m.category] || m.category || "Lainnya";
            const code = String(m.code).trim();

            const catItems = filtered.filter(
              (d) => String(d.accountCode).trim() === code
            );

            const total = catItems.reduce(
              (sum, d) => sum + (parseFloat(d.docValue) || 0),
              0
            );

            if (!categoryMap[cat]) categoryMap[cat] = {};
            categoryMap[cat][unit.name] =
              (categoryMap[cat][unit.name] || 0) + total;
          });
        } catch (error) {
          console.error(`❌ Gagal ambil data ${unit.name}:`, error);
        }
      }

      setSummaryData(categoryMap);
      setLoading(false);
    };

    fetchSummary();
  }, [unitList, masterCode, selectedYear, selectedMonth]);

  // 🔹 Fungsi ambil nilai per kategori/unit
  const getValue = (cat, unitName) => {
    if (cat === "Gross Profit") {
      const revenue = summaryData["Service Revenue"]?.[unitName] || 0;
      const cost = summaryData["Cost of Service"]?.[unitName] || 0;
      return revenue - cost;
    }
    return summaryData[cat]?.[unitName] || 0;
  };

  // 🔹 Hitung total per kategori
  const getTotalPerCategory = (cat) => {
    if (cat === "Gross Profit") {
      const revenueData = summaryData["Service Revenue"] || {};
      const costData = summaryData["Cost of Service"] || {};
      return Object.keys(revenueData).reduce(
        (sum, unit) => sum + (revenueData[unit] || 0) - (costData[unit] || 0),
        0
      );
    }
    const catData = summaryData[cat] || {};
    return Object.values(catData).reduce((sum, val) => sum + val, 0);
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md w-full max-w-3xl mx-auto mt-10">
      <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">
        📊 Laporan Unit Bisnis per Kategori -{" "}
        {selectedMonth === "All" ? "Semua Bulan" : selectedMonth} {selectedYear}
      </h2>

      {/* Filter Tahun & Bulan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Tahun
          </label>
          <select
            className="border px-2 py-1.5 rounded-md w-full text-sm"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Bulan
          </label>
          <select
            className="border px-2 py-1.5 rounded-md w-full text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="All">Semua Bulan</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Data */}
      {loading ? (
        <p className="text-center text-gray-500 py-4">⏳ Memuat data...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full border-collapse text-sm text-center">
            <thead>
              <tr className="bg-yellow-400">
                <th rowSpan="2" className="border px-3 py-2 text-left font-semibold bg-yellow-400">Description</th>
                <th colSpan={unitList.length} className="border px-3 py-2 font-semibold bg-yellow-400">
                  {selectedMonth === "All" ? "Semua Bulan" : selectedMonth} {selectedYear}
                </th>
                <th rowSpan="2" className="border px-3 py-2 font-semibold bg-yellow-400">Total</th>
              </tr>
              <tr>
                {unitList.map((unit) => (
                  <th key={unit.id} className="border px-3 py-2 font-semibold bg-cyan-300">{unit.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CUSTOM_ORDER.map((cat) => (
                <tr key={cat} className="hover:bg-gray-50 transition duration-150">
                  <td className="border px-3 py-2 text-left font-semibold">{cat}</td>

                  {unitList.map((unit) => (
                    <td key={unit.id} className="border px-3 py-2 text-right text-gray-700">
                      {getValue(cat, unit.name).toLocaleString("id-ID")}
                    </td>
                  ))}

                  <td className="border px-3 py-2 font-semibold text-right text-gray-900">
                    {getTotalPerCategory(cat).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardMultiUnit;
