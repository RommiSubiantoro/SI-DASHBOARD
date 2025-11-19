import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
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
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// 🔹 Helper untuk parsing number
function parseNumber(raw) {
  if (raw === null || raw === undefined || raw === "") return 0;
  let s = String(raw).replace(/\s+/g, "").replace(/,/g, "");
  let isNeg = false;
  if (/^\(.+\)$/.test(s)) {
    isNeg = true;
    s = s.replace(/^\(|\)$/g, "");
  }
  let n = Number(s);
  if (Number.isNaN(n)) n = 0;
  return isNeg ? -(n) : n;
}

export default function Barchart({
  data = [],
  selectedYear = "2025",
  setSelectedYear = () => {},
}) {
  const [masterCode, setMasterCode] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Ambil masterCode
  useEffect(() => {
    const fetchMasterCode = async () => {
      try {
        setIsLoading(true);
        const snap = await getDocs(collection(db, "masterCode"));
        const docs = snap.docs.map((d) => d.data());
        setMasterCode(docs);
      } catch (err) {
        console.error("Gagal ambil masterCode:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMasterCode();
  }, [selectedYear, data]);

  // 🔹 Kategori unik
  const categories = useMemo(() => {
    if (masterCode.length === 0) return ["ALL"];
    const unique = [...new Set(masterCode.map((m) => m.category))];
    return ["ALL", ...unique];
  }, [masterCode]);

  // 🔹 Hitung nilai per bulan
  const chartData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0 || masterCode.length === 0)
      return [];

    const monthTotals = Object.fromEntries(MONTHS.map((m) => [m, 0]));

    data.forEach((row) => {
      const code = String(row.accountCode)?.trim();
      const match = masterCode.find(
        (m) => String(m.code).trim() === code
      );
      if (!match) return;

      const category = match.category || "Unknown";
      if (selectedCategory !== "ALL" && category !== selectedCategory) return;

      MONTHS.forEach((month) => {
        const val = parseNumber(row[month]) || 0;
        monthTotals[month] += (val);
      });
    });

    return Object.entries(monthTotals).map(([month, value]) => ({
      month,
      value,
    }));
  }, [data, masterCode, selectedCategory]);

  // 🔹 Total keseluruhan
  const totalValue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [chartData]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        📊 Bar Chart Berdasarkan Kategori & Bulan
      </h3>

      {/* Filter */}
      <div className="flex gap-3 mb-4 justify-center items-center">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Chart */}
      {isLoading ? (
        <p className="text-center text-gray-500">⏳ Memuat data...</p>
      ) : chartData.length > 0 ? (
        <>
          <div className="w-full h-120 bg-gray-50 rounded-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="value" name={totalValue.toLocaleString()}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`bar-${idx}`}
                      fill={COLORS[idx % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
        </>
      ) : (
        <p className="text-center text-gray-500">
          Tidak ada data untuk kategori ini.
        </p>
      )}
    </div>
  );
}
