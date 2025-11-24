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

// 🔹 parseNumber sama seperti di BarChart
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
  return isNeg ? -n : n;
}

export default function Piechart({
  data = [],
  selectedYear,
  selectedMonth = "ALL",
  setSelectedMonth,
  mode = "default",
}) {
  const [masterCode, setMasterCode] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const formatRupiah = (value) => "Rp " + Number(value).toLocaleString("id-ID");

  // Ambil masterCode
  useEffect(() => {
    if (mode === "atk") return;
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
  }, [selectedYear, data, mode]);

  useEffect(() => {
  if (mode !== "atk") return;

  // Ringkas data berdasarkan kategori
  const map = {};

  data.forEach((item) => {
    const key = item.Barang_yang_Diminta || "Unknown";

    // Convert jumlah ke number
    const value = parseInt(item.Jumlah_Diminta) || 0;

    map[key] = (map[key] || 0) + value;
  });

  const result = Object.entries(map).map(([name, value]) => ({
    name,
    value,
  }));

  setChartData(result);
}, [data, mode]);


  // Hitung chartData
  useEffect(() => {
    if (mode === "atk") return;
    if (data.length === 0 || masterCode.length === 0) {
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
      masterCode.forEach((m) => {
        groupedByCategory[m.category] = 0;
      });

      data.forEach((item) => {
        const match = masterCode.find(
          (m) => String(m.code).trim() === String(item.accountCode).trim()
        );
        if (match) {
          groupedByCategory[match.category] += getValue(item);
        }
      });

      const total = Object.values(groupedByCategory).reduce(
        (sum, val) => sum + val,
        0
      );

      const result = Object.entries(groupedByCategory)
        .map(([category, value]) => ({
          name: category,
          value,
          percentage:
            total > 0 ? ((value / total) * 100).toFixed(1) + "%" : "0%",
        }))
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
          "Unknown";
        const value = getValue(item);
        grouped[name] = (grouped[name] || 0) + value;
      });

      const result = Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0);

      setChartData(result);
    }
  }, [selectedCategory, selectedMonth, data, masterCode, mode]);

  // Total untuk tampil di bawah chart
  const totalValue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [chartData]);

  const showFilters = mode !== "atk";

  return (
    <div className="p-4 sm:p-6 bg-white rounded-2xl shadow-md w-full max-w-5xl mx-auto">
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Kategori */}
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
              {[...new Set(masterCode.map((m) => m.category))].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Bulan */}
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

      {/* Chart Container Responsive */}
      <div className="w-full h-[300px] sm:h-[400px] md:h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="70%" // responsive radius
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip
              formatter={(value) =>
                "Rp " + Number(value).toLocaleString("id-ID")
              }
            />

            <Legend
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: "10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <p className="text-center mt-4 font-semibold text-gray-700 text-sm sm:text-base">
        Total Keseluruhan: Rp {totalValue.toLocaleString("id-ID")}
      </p>

      {chartData.length === 0 && (
        <p className="text-gray-500 text-center mt-4 text-sm">
          Tidak ada data untuk pilihan ini.
        </p>
      )}
    </div>
  );
}
