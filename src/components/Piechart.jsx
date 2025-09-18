import React, { useMemo, useState } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import "../css/Piechart.css";

const COLORS = ["#4facfe", "#ff6b6b", "#3ddb97", "#ffa726", "#8b5cf6", "#f59e0b", "#60a5fa", "#ef4444", "#10b981"];

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

function normalizeMonthInput(val) {
  if (!val) return "ALL";
  const s = String(val).trim();
  if (s.toUpperCase() === "ALL") return "ALL";
  return s.slice(0, 3).toUpperCase();
}

function getNumericValue(row, keys) {
  for (const k of keys) {
    if (!(k in row)) continue;
    const raw = row[k];
    if (raw === null || raw === undefined || raw === "") continue;

    // Normalisasi string: hapus spasi & koma
    let s = String(raw).replace(/\s+/g, "").replace(/,/g, "");

    // Tangani format (1,000) sebagai negative
    let isNeg = false;
    if (/^\(.+\)$/.test(s)) {
      isNeg = true;
      s = s.replace(/^\(|\)$/g, "");
    }

    let n = Number(s);
    if (Number.isNaN(n)) n = 0;
    if (isNeg) n = -Math.abs(n);
    return n;
  }
  return 0;
}

export default function Piechart({ data = [], selectedMonth = "All", setSelectedMonth = () => {}, selectedYear = "2025", setSelectedYear = () => {} }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const normalizedMonth = normalizeMonthInput(selectedMonth);

  // Agregasi data berdasarkan kategori (menggunakan nilai absolut)
  const aggregatedData = useMemo(() => {
    const acc = {};

    data.forEach((row) => {
      // cari nama kategori di beberapa kemungkinan header
      const category = row.CATEGORY ?? row.category ?? row.Category ?? row['ACCOUNT NAME'] ?? row['ACCOUNT NAME '] ?? "Unknown";

      let value = 0;

      if (normalizedMonth === "ALL") {
        // jumlahkan semua bulan
        MONTHS.forEach((m) => {
          const n = getNumericValue(row, [m.key, m.label, m.key.toUpperCase(), m.key.toLowerCase(), m.label.toUpperCase(), m.label.toLowerCase()]);
          value += Math.abs(n);
        });
      } else {
        // ambil satu bulan saja
        const n = getNumericValue(row, [normalizedMonth, normalizedMonth.toUpperCase(), normalizedMonth.toLowerCase(), normalizedMonth[0] + normalizedMonth.slice(1).toLowerCase()]);
        value = Math.abs(n);
      }

      if (!acc[category]) acc[category] = 0;
      acc[category] += value;
    });

    return acc;
  }, [data, normalizedMonth]);

  // Ubah jadi array untuk pie chart dan hapus kategori dengan nilai 0
  let pieData = Object.entries(aggregatedData)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  // Daftar kategori untuk dropdown filter (ambil dari aggregated hasil sekarang)
  const categories = ["All", ...Object.keys(aggregatedData)];

  // Jika user memilih 1 kategori -> filter data pie
  if (selectedCategory !== "All") {
    pieData = pieData.filter((p) => p.name === selectedCategory);
  }

  const totalValue = Object.values(aggregatedData).reduce((a, b) => a + b, 0);
  const selectedValue = selectedCategory === "All" ? (pieData.reduce((s, p) => s + p.value, 0)) : (pieData.length > 0 ? pieData[0].value : 0);
  const selectedPercent = totalValue > 0 ? ((selectedValue / totalValue) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-4 bg-white shadow rounded-2xl">
      <h3 className="text-lg font-semibold mb-3">Pie Chart Kategory</h3>

      {/* Kontrol */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="All">All</option>
          {MONTHS.map((m) => (
            <option key={m.key} value={m.label}>{m.label}</option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="p-2 border rounded-lg"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Chart */}
        <div className="flex-1 w-full lg:w-3/4" style={{ height: 360 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                nameKey="name"
                labelLine={false}
                label={({ name, percent }) => (
                  selectedCategory === "All" ? `${name} ${(percent * 100).toFixed(0)}%` : null
                )}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>

              <Tooltip formatter={(val) => Number(val).toLocaleString()} />

              {selectedCategory === "All" && (
                <Legend layout="vertical" align="right" verticalAlign="middle" />
              )}
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Info detail */}
        <div className="w-full lg:w-1/4">
          {selectedCategory !== "All" ? (
            <div className="text-sm font-medium">
              <p>{selectedCategory} ({normalizedMonth === 'ALL' ? 'All Months' : normalizedMonth} {selectedYear})</p>
              <p className="mt-2 text-lg font-semibold">{selectedPercent}% dari total</p>
              <p className="mt-1">Rp {Number(selectedValue).toLocaleString()}</p>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p>Total kategori: {pieData.length}</p>
              <p className="mt-2">Total (abs): Rp {Number(totalValue).toLocaleString()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
