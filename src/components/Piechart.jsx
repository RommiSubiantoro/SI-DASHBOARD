// src/components/Piechart.jsx
import React, { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const COLORS = [
  "#4facfe","#ff6b6b","#3ddb97","#ffa726","#8b5cf6","#f59e0b","#60a5fa","#ef4444","#10b981",
];

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
    let s = String(raw).replace(/\s+/g, "").replace(/,/g, "");
    let isNeg = false;
    if (/^\(.+\)$/.test(s)) { isNeg = true; s = s.replace(/^\(|\)$/g, ""); }
    let n = Number(s);
    if (Number.isNaN(n)) n = 0;
    return isNeg ? -Math.abs(n) : n;
  }
  return 0;
}

// detects whether incoming data is already aggregated [{name, value, rawValue?}]
function isAggregatedData(arr) {
  return Array.isArray(arr) && arr.length > 0 && arr[0] && Object.prototype.hasOwnProperty.call(arr[0], "value") && Object.prototype.hasOwnProperty.call(arr[0], "name");
}

export default function Piechart({
  data = [],                // can be raw rows OR aggregated [{name,value}]
  selectedMonth = "All",
  setSelectedMonth = () => {},
  selectedYear = "2025",
  setSelectedYear = () => {},
}) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  // jika data sudah aggregated -> gunakan langsung; kalau raw -> aggregate
  const pieData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];

    if (isAggregatedData(data)) {
      // ensure numbers + rawValue
      return data
        .map((d) => ({
          name: d.name ?? "Unknown",
          value: Math.abs(Number(d.value) || 0),
          rawValue: Number(d.rawValue ?? d.value ?? 0),
        }))
        .filter((d) => d.value !== 0)
        .sort((a,b)=> b.value - a.value);
    }

    // RAW rows -> aggregate by category using selectedMonth
    const normalizedMonth = (selectedMonth || "All").toString().trim().slice(0,3).toUpperCase();
    const acc = {};
    data.forEach((row) => {
      const category = row.CATEGORY ?? row.category ?? row.Category ?? row["ACCOUNT NAME"] ?? row["ACCOUNT NAME "] ?? "Unknown";
      let value = 0;
      if (!selectedMonth || selectedMonth.toLowerCase() === "all") {
        MONTHS.forEach((m) => {
          value += getNumericValue(row, [m.key, m.label, m.key.toUpperCase(), m.key.toLowerCase(), m.label.toUpperCase(), m.label.toLowerCase()]);
        });
      } else {
        // try candidate keys
        value = getNumericValue(row, [normalizedMonth, normalizedMonth.toUpperCase(), normalizedMonth.toLowerCase(), normalizedMonth[0] + normalizedMonth.slice(1).toLowerCase()]);
      }
      acc[category] = (acc[category] || 0) + value;
    });

    const arr = Object.entries(acc).map(([name, rawValue]) => ({
      name,
      value: Math.abs(Number(rawValue) || 0),
      rawValue: Number(rawValue) || 0,
    })).filter(d => d.value !== 0).sort((a,b)=> b.value - a.value);

    return arr;
  }, [data, selectedMonth]);

  // categories for filter
  const categories = useMemo(() => ["All", ...new Set(pieData.map(d => d.name))], [pieData]);

  const filteredPie = selectedCategory === "All" ? pieData : pieData.filter(p => p.name === selectedCategory);

  // total used for percent (use absolute totals to avoid zero due to sign cancellation)
  const totalAbs = pieData.reduce((s, p) => s + (Number(p.value) || 0), 0);
  const selAbs = filteredPie.reduce((s,p) => s + (Number(p.value)||0), 0);
  const selPercent = totalAbs > 0 ? ((selAbs / totalAbs) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-6 bg-white shadow-lg rounded-2xl">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Pie Chart Kategori</h3>

      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 border rounded">
          <option value="All">All</option>
          {MONTHS.map(m => <option key={m.key} value={m.label}>{m.label}</option>)}
        </select>

        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-3 py-2 border rounded">
          <option value="2024">2024</option>
          <option value="2025">2025</option>
        </select>

        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-3 py-2 border rounded">
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="w-full bg-gray-50 p-4 rounded mb-4 border">
        <div className="flex justify-between items-center">
          <div>
            {selectedCategory === "All" ? (
              <>
                <div>Total kategori: {pieData.length}</div>
                <div className="mt-1">Total (abs): Rp {Number(totalAbs).toLocaleString()}</div>
              </>
            ) : (
              <>
                <div>{selectedCategory} - {selPercent}%</div>
                <div className="mt-1">Rp {Number(selAbs).toLocaleString()}</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <div className="flex-1 h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={filteredPie}
                dataKey="value"
                nameKey="name"
                cx="50%" cy="50%"
                outerRadius={100}
                labelLine={false}
                minAngle={5}
              >
                {filteredPie.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} fillOpacity={entry.rawValue < 0 ? 0.6 : 1} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name, props) => {
                const idx = props && props.dataIndex;
                const item = typeof filteredPie[idx] !== "undefined" ? filteredPie[idx] : null;
                return item ? item.rawValue.toLocaleString() : val;
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-48 flex flex-col gap-2">
          {filteredPie.map((item, i) => (
            <div key={i} className="flex items-center text-sm">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-gray-700">{item.name}: {item.rawValue.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
