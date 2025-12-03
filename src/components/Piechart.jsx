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

function parseNumber(raw) {
  if (!raw && raw !== 0) return 0;
  let s = String(raw).replace(/\s+/g, "").replace(/,/g, "");
  let isNeg = false;
  if (/^\(.+\)$/.test(s)) {
    isNeg = true;
    s = s.replace(/^\(|\)$/g, "");
  }
  let n = Number(s);
  if (Number.isNaN(n)) n = 0;
  return isNeg ? -n : n;
}

export default function Piechart({
  data = [],
  selectedYear,
  selectedMonth = "ALL",
  setSelectedMonth = () => {},
  selectedUnit,
  mode = "default",
}) {
  const [masterCode, setMasterCode] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [chartData, setChartData] = useState([]);

  const isDaily = mode === "daily";

  // 🔥 MODE DAILY
  useEffect(() => {
    if (!isDaily) return;
    setChartData(Array.isArray(data) ? data : []);
  }, [data, mode, isDaily]);

  // 🔥 FILTERED DATA
  const filteredData = useMemo(() => {
    if (isDaily) return Array.isArray(data) ? data : [];
    if (!Array.isArray(data) || !selectedUnit) return [];

    const unitLower = selectedUnit.toLowerCase();
    const getBL = (row) =>
      row.businessLine ||
      row["Business Line"] ||
      row.business_line ||
      row.BL ||
      "";

    if (unitLower.includes("samudera agencies indonesia gena")) {
      return data.filter(
        (row) => String(getBL(row)).trim().toUpperCase() === "AGE06"
      );
    }

    if (unitLower.includes("samudera agencies indonesia local")) {
      return data.filter(
        (row) => String(getBL(row)).trim().toUpperCase() === "AGE11"
      );
    }

    if (unitLower.includes("samudera agencies indonesia")) {
      return data.filter((row) => String(getBL(row)).trim() !== "");
    }

    return data.filter((row) => String(getBL(row)).trim() !== "");
  }, [data, selectedUnit, mode, isDaily]);

  // 🔥 FETCH masterCode
  useEffect(() => {
    if (isDaily || mode === "atk") return;

    const fetchMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        const master = snap.docs.map((doc) => doc.data());
        setMasterCode(Array.isArray(master) ? master : []);
      } catch (err) {
        console.error("Error fetching masterCode:", err);
        setMasterCode([]);
      }
    };

    fetchMaster();
  }, [selectedYear, data, mode, isDaily]);

  // 🔥 MODE ATK
  useEffect(() => {
    if (isDaily || mode !== "atk") return;

    const map = {};
    (Array.isArray(filteredData) ? filteredData : []).forEach((item) => {
      const key = item.Barang_yang_Diminta || "Unknown";
      const value = parseInt(item.Jumlah_Diminta) || 0;
      map[key] = (map[key] || 0) + value;
    });

    const result = Object.entries(map).map(([name, value]) => ({
      name,
      value: Math.abs(value), // slice pakai absolut
      originalValue: value, // simpan nilai asli
    }));

    setChartData(result);
  }, [filteredData, mode, isDaily]);

  // 🔥 MODE NON-ATK
  useEffect(() => {
    if (isDaily || mode === "atk") return;
    if (!Array.isArray(filteredData) || !Array.isArray(masterCode)) {
      setChartData([]);
      return;
    }

    const getValue = (item) => {
      if (selectedMonth === "ALL") {
        return MONTHS.reduce((sum, m) => sum + parseNumber(item[m]), 0);
      }
      return parseNumber(item[selectedMonth]);
    };

    if (selectedCategory === "ALL") {
      const groupedByCategory = {};
      masterCode.forEach((m) => (groupedByCategory[m.category] = 0));

      (Array.isArray(filteredData) ? filteredData : []).forEach((item) => {
        const match = masterCode.find(
          (m) => String(m.code).trim() === String(item.accountCode).trim()
        );
        if (match) groupedByCategory[match.category] += getValue(item);
      });

      const total = Object.values(groupedByCategory).reduce(
        (sum, val) => sum + val,
        0
      );

      const result = Object.entries(groupedByCategory)
        .map(([category, value]) => ({
          name: category,
          value: Math.abs(value),
          originalValue: value,
          percentage:
            total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%",
        }))
        .filter((d) => d.value !== null && d.value !== undefined);

      setChartData(result);
    } else {
      const codes = masterCode
        .filter((m) => m.category === selectedCategory)
        .map((m) => String(m.code).trim());

      const filtered = (Array.isArray(filteredData) ? filteredData : []).filter(
        (row) => codes.includes(String(row.accountCode)?.trim())
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
          "Unknown";
        const value = getValue(item);
        grouped[name] = (grouped[name] || 0) + value;
      });

      const result = Object.entries(grouped)
        .map(([name, value]) => ({
          name,
          value: Math.abs(value),
          originalValue: value,
        }))
        .filter((d) => d.value !== null && d.value !== undefined);

      setChartData(result);
    }
  }, [
    selectedCategory,
    selectedMonth,
    filteredData,
    masterCode,
    mode,
    isDaily,
  ]);

  const totalValue = useMemo(() => {
    return (Array.isArray(chartData) ? chartData : []).reduce(
      (sum, item) => sum + (item.originalValue || 0),
      0
    );
  }, [chartData]);

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-md w-full max-w-5xl mx-auto">
      {!isDaily && mode !== "atk" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-1 font-medium text-sm sm:text-base">
              Pilih Kategori
            </label>
            <select
              className="border px-3 py-2 rounded-lg w-full text-sm"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="ALL">Semua Kategori</option>
              {[...new Set(masterCode?.map((m) => m.category) || [])].map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm sm:text-base">
              Pilih Bulan
            </label>
            <select
              className="border px-3 py-2 rounded-lg w-full text-sm"
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
      )}

      <div className="w-full h-[300px] sm:h-[400px] md:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={Array.isArray(chartData) ? chartData : []}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="70%"
            >
              {(Array.isArray(chartData) ? chartData : []).map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.originalValue >= 0
                      ? COLORS[i % COLORS.length]
                      : "#661011"
                  }
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => {
                const original = props?.payload?.originalValue ?? value;
                return "Rp " + Number(original).toLocaleString("id-ID");
              }}
            />
            <Legend wrapperStyle={{ fontSize: "10px" }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {!isDaily && (
        <p className="text-center mt-4 font-semibold text-gray-700 text-sm sm:text-base">
          Total: Rp {totalValue.toLocaleString("id-ID")}
        </p>
      )}

      {(Array.isArray(chartData) ? chartData.length : 0) === 0 && (
        <p className="text-gray-500 text-center mt-4 text-sm">
          Tidak ada data untuk pilihan ini.
        </p>
      )}
    </div>
  );
}
