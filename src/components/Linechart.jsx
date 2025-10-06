import React, { useMemo, useState } from "react";
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

const MONTHS = [
  { key: "JAN", label: "Jan" },
  { key: "FEB", label: "Feb" },
  { key: "MAR", label: "Mar" },
  { key: "APR", label: "Apr" },
  { key: "MAY", label: "May" },
  { key: "JUN", label: "Jun" },
  { key: "JUL", label: "Jul" },
  { key: "AUG", label: "Aug" },
  { key: "SEP", label: "Sep" },
  { key: "OCT", label: "Oct" },
  { key: "NOV", label: "Nov" },
  { key: "DEC", label: "Dec" },
];

function getNumericValue(row, keys) {
  for (const k of keys) {
    if (!(k in row)) continue;
    const raw = row[k];
    if (raw === null || raw === undefined || raw === "") continue;
    let s = String(raw).trim().replace(/,/g, "");
    let isNeg = false;
    if (/^\(.+\)$/.test(s)) {
      isNeg = true;
      s = s.replace(/^\(|\)$/g, "");
    }
    const n = Number(s);
    if (!Number.isNaN(n)) return isNeg ? -n : n;
  }
  return 0;
}

export default function Linechart({ data = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // 🔹 Ambil daftar kategori unik dari data
  const categories = useMemo(() => {
    if (!Array.isArray(data)) return ["All"];
    const unique = new Set(
      data.map(
        (row) =>
          row.CATEGORY ??
          row.category ??
          row.Category ??
          row["ACCOUNT NAME"] ??
          "Unknown"
      )
    );
    return ["All", ...Array.from(unique)];
  }, [data]);

  // 🔹 Filter data sesuai kategori yang dipilih
  const filteredData = useMemo(() => {
    if (selectedCategory === "All") return data;
    return data.filter((row) => {
      const cat =
        row.CATEGORY ??
        row.category ??
        row.Category ??
        row["ACCOUNT NAME"] ??
        "Unknown";
      return cat === selectedCategory;
    });
  }, [data, selectedCategory]);

  // 🔹 Agregasi total per bulan
  const chartData = useMemo(() => {
    if (!Array.isArray(filteredData) || filteredData.length === 0) return [];

    const monthTotals = MONTHS.map((m) => {
      const total = filteredData.reduce((sum, row) => {
        const val = getNumericValue(row, [
          m.key,
          m.label,
          m.key.toUpperCase(),
          m.label.toUpperCase(),
          m.label.toLowerCase(),
          m.key.toLowerCase(),
        ]);
        return sum + val;
      }, 0);
      return { month: m.label, value: total };
    });

    console.log("✅ Final chartData for chart:", monthTotals);
    return monthTotals;
  }, [filteredData]);

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Line Chart Bulanan
        </h3>

        {/* 🔹 Dropdown filter kategori */}
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

      <ResponsiveContainer width="100%" height={380}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
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
              selectedCategory === "All"
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
    </div>
  );
}
