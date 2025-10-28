import React, { useState, useEffect, useMemo } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const COLORS = [
  "#4facfe",
  "#ff6b6b",
  "#3ddb97",
  "#ffa726",
  "#8b5cf6",
  "#f59e0b",
  "#60a5fa",
  "#ef4444",
  "#10b981",
  "#6366f1",
];

const MONTHS = [
  "ALL",
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

export default function Piechart({
  data = [],
  selectedYear,
  selectedMonth,
  setSelectedMonth,
}) {
  const [masterCode, setMasterCode] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // 🔹 loading state

  // 🔹 Ambil masterCode dari Firestore setiap kali data berubah (atau tahun berubah)
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        setIsLoading(true);
        const snap = await getDocs(collection(db, "masterCode"));
        const data = snap.docs.map((doc) => doc.data());
        setMasterCode(data);
      } catch (error) {
        console.error("❌ Gagal ambil masterCode:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaster();
  }, [selectedYear, data]); // 🔧 ambil ulang setiap tahun/unit/data berubah

  // 🔹 Ambil kategori unik
  const categories = useMemo(() => {
    const unique = [...new Set(masterCode.map((m) => m.category))];
    return unique;
  }, [masterCode]);

  // 🔹 Hitung data berdasarkan dropdown
  useEffect(() => {
    if (data.length === 0 || masterCode.length === 0) {
      setChartData([]);
      return;
    }

    const getValue = (item) => {
      if (selectedMonth === "ALL") {
        return MONTHS.slice(1).reduce(
          (sum, m) => sum + (Number(item[m]) || 0),
          0
        );
      }
      return Number(item[selectedMonth]) || 0;
    };

    if (selectedCategory === "ALL") {
      const groupedByCategory = {};
      masterCode.forEach((m) => {
        groupedByCategory[m.category] = 0;
      });

      data.forEach((item) => {
        const match = masterCode.find(
          (m) => String(m.code).trim() === String(item.accountCode).trim()
        );
        if (match) {
          groupedByCategory[match.category] += Math.abs(getValue(item));
        }
      });

      const result = Object.entries(groupedByCategory)
        .map(([category, value]) => ({ name: category, value }))
        .filter((d) => d.value > 0);

      setChartData(result);
    } else {
      const codes = masterCode
        .filter((m) => m.category === selectedCategory)
        .map((m) => String(m.code).trim());

      const filtered = data.filter((row) =>
        codes.includes(String(row.accountCode)?.trim())
      );

      const grouped = {};
      filtered.forEach((item) => {
        const match = masterCode.find(
          (m) => String(m.code).trim() === String(item.accountCode).trim()
        );
        const name =
          match?.description ||
          match?.accountName ||
          item.accountName ||
          "Unknown Account";
        const value = getValue(item);
        grouped[name] = (grouped[name] || 0) + Math.abs(value);
      });

      const result = Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0);

      setChartData(result);
    }
  }, [selectedCategory, selectedMonth, data, masterCode]);

  // 🔹 RENDER
  return (
    <div className="p-6 bg-white rounded-2xl shadow-md w-full max-w-5xl mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">
        📊 Pie Chart: Perbandingan Kategori & Detail
      </h2>

      {/* Dropdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-1 font-medium">Pilih Kategori</label>
          <select
            className="border px-3 py-2 rounded-lg w-full"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Pilih Bulan</label>
          <select
            className="border px-3 py-2 rounded-lg w-full"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m === "ALL" ? "Semua Bulan" : m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart */}
      {isLoading ? (
        <p className="text-gray-500 text-center mt-6">⏳ Memuat data...</p>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={150}
              label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
            >
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `Rp ${value.toLocaleString()}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <p className="text-gray-500 text-center mt-6">
          Tidak ada data untuk pilihan ini.
        </p>
      )}

      {selectedCategory === "ALL" && (
        <p className="text-sm text-gray-500 text-center mt-4">
          💡 Pilih kategori untuk melihat rincian akun di dalamnya.
        </p>
      )}
    </div>
  );
}
