import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// 🔹 Helper parsing angka
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

export default function Linechart({
  data = [],
  selectedYear = "2025",
  setSelectedYear = () => {},
}) {
  const [masterCode, setMasterCode] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [loading, setLoading] = useState(false);

  // 🔹 Ambil masterCode
  useEffect(() => {
    const fetchMasterCode = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "masterCode"));
        const docs = snap.docs.map((d) => d.data());
        setMasterCode(docs);
      } catch (err) {
        console.error("❌ Gagal ambil masterCode:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMasterCode();
  }, [selectedYear]);

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

    const monthlyTotals = Object.fromEntries(MONTHS.map((m) => [m, 0]));

    data.forEach((row) => {
      const code = String(row.accountCode)?.trim();
      const match = masterCode.find(
        (m) => String(m.code).trim() === code
      );
      if (!match) return;

      const category = match.category || "Unknown";
      if (selectedCategory !== "ALL" && category !== selectedCategory) return;

      MONTHS.forEach((month) => {
        const val = parseNumber(row[month]);
        monthlyTotals[month] += (val);
      });
    });

    return MONTHS.map((m) => ({
      month: m,
      value: monthlyTotals[m],
    }));
  }, [data, masterCode, selectedCategory]);

  // 🔹 Total keseluruhan
  const totalValue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [chartData]);

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          📈 Line Chart Berdasarkan Kategori & Bulan
        </h3>

        {/* Filter */}
        <div className="flex gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">⏳ Memuat data masterCode...</p>
      ) : chartData.length > 0 ? (
        <>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 50, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(val) => val.toLocaleString()} />
              <Tooltip formatter={(v) => v.toLocaleString()} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name={
                  selectedCategory === "ALL"
                    ? "Total Semua Kategori"
                    : selectedCategory
                }
                stroke="#4f46e5"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>

          {/* 🔹 Total Keseluruhan */}
          <p className="text-center mt-4 font-semibold text-gray-700">
            Total Keseluruhan: {totalValue.toLocaleString()}
          </p>
        </>
      ) : (
        <p className="text-center text-gray-500">
          Tidak ada data untuk kategori ini.
        </p>
      )}
    </div>
  );
}
