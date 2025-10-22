// src/components/Barchart.jsx
import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";

const COLORS = ["#4facfe","#ff6b6b","#3ddb97","#ffa726","#8b5cf6","#f59e0b","#60a5fa","#ef4444","#10b981"];

const MONTHS = [
  { key: "JAN", label: "Jan" }, { key: "FEB", label: "Feb" }, { key: "MAR", label: "Mar" },
  { key: "APR", label: "Apr" }, { key: "MAY", label: "May" }, { key: "JUN", label: "Jun" },
  { key: "JUL", label: "Jul" }, { key: "AUG", label: "Aug" }, { key: "SEP", label: "Sep" },
  { key: "OCT", label: "Oct" }, { key: "NOV", label: "Nov" }, { key: "DEC", label: "Dec" },
];

function getNumericValue(row, keys) {
  for (const k of keys) {
    if (!(k in row)) continue;
    const raw = row[k];
    if (raw === null || raw === undefined || raw === "") continue;
    let s = String(raw).replace(/\s+/g, "").replace(/,/g, "");
    let isNeg = false;
    if (/^\(.+\)$/.test(s)) { isNeg = true; s = s.replace(/^\(|\)$/g, ""); }
    let n = Number(s);
    if (Number.isNaN(n)) n = 0;
    return isNeg ? -Math.abs(n) : n;
  }
  return 0;
}

function isAggregatedData(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr[0] && 
         Object.prototype.hasOwnProperty.call(arr[0], "value") && 
         Object.prototype.hasOwnProperty.call(arr[0], "month");
}

export default function Barchart({ data = [], selectedYear = "2025", setSelectedYear = () => {} }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // ✅ Perbaikan: jaga agar selalu array
  const safeData = Array.isArray(data) ? data : [];

  // build chartData per month
  const chartData = useMemo(() => {
    if (isAggregatedData(safeData)) {
      return safeData.map(d => ({ month: d.month, value: Math.abs(Number(d.value) || 0) }));
    }

    const monthAcc = {};
    MONTHS.forEach(m => (monthAcc[m.label] = 0));

    safeData.forEach(row => {
      const category = row.CATEGORY ?? row.category ?? row.Category ?? row["ACCOUNT NAME"] ?? row["ACCOUNT NAME "] ?? "Unknown";
      if (selectedCategory !== "All" && category !== selectedCategory) return;

      MONTHS.forEach(m => {
        const n = getNumericValue(row, [m.key, m.label, m.key.toUpperCase(), m.key.toLowerCase(), m.label.toUpperCase(), m.label.toLowerCase()]);
        monthAcc[m.label] += Math.abs(n);
      });
    });

    return Object.entries(monthAcc).map(([month, value]) => ({ month, value }));
  }, [safeData, selectedCategory]);

  const categories = useMemo(() => [
    "All",
    ...new Set(
      safeData.map(r =>
        r.CATEGORY ?? r.category ?? r.Category ?? r["ACCOUNT NAME"] ?? r["ACCOUNT NAME "] ?? "Unknown"
      )
    ),
  ], [safeData]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
        Bar Chart Per Bulan
      </h3>

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
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="w-full h-120 bg-gray-50 rounded-lg p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="value">
              {chartData.map((entry, idx) => (
                <Cell key={`bar-${idx}`} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
