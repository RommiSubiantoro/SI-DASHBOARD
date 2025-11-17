import React, { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
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
  mode = "default",
}) {
  const [masterCode, setMasterCode] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // =======================================
  // FORMAT RUPIAH
  // =======================================
  const formatRupiah = (value) =>
    "Rp " + Number(value).toLocaleString("id-ID");

  // =======================================
  // MODE ATK (langsung proses data)
  // =======================================
  useEffect(() => {
    if (mode !== "atk") return;

    const grouped = {};

    data.forEach((item) => {
      const name =
        item.Barang_yang_Diminta ||
        item.nama_barang ||
        item.Barang ||
        "Unknown";

      const value =
        Number(item.Jumlah_Diminta) ||
        Number(item.jumlah) ||
        Number(item.total) ||
        0;

      if (value > 0) {
        grouped[name] = (grouped[name] || 0) + value;
      }
    });

    const result = Object.entries(grouped).map(([name, value]) => ({
      name,
      value,
    }));

    setChartData(result);
  }, [data, mode]);

  // =======================================
  // MODE LAMA — MASTER CODE
  // =======================================
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

  const categories = useMemo(() => {
    if (mode === "atk") return [];
    return [...new Set(masterCode.map((m) => m.category))];
  }, [masterCode, mode]);

  // =======================================
  // PROSES DATA PIE — MODE LAMA
  // =======================================
  useEffect(() => {
    if (mode === "atk") return;

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
        grouped[name] = (grouped[name] || 0) + Math.abs(value);
      });

      const result = Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0);

      setChartData(result);
    }
  }, [selectedCategory, selectedMonth, data, masterCode, mode]);

  const showFilters = mode !== "atk";

  const renderLabel = ({ name, percent }) => {
    return `${name} (${(percent * 100).toFixed(0)}%)`;
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-md w-full max-w-5xl mx-auto">
      {showFilters && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-1 font-medium">Pilih Kategori</label>
            <select
              className="border px-3 py-2 rounded-lg w-full text-sm"
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
              className="border px-3 py-2 rounded-lg w-full text-sm"
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
      )}

      {/* ======================== CHART ======================== */}
      <ResponsiveContainer width="100%" height={500}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={150}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>

          {/* Tooltip format rupiah */}
          <Tooltip formatter={(value) => formatRupiah(value)} />

          {/* Legend format rupiah + kecil */}
          <Legend
            formatter={(value, entry) =>
              `${value} (${formatRupiah(entry.payload.value)})`
            }
            wrapperStyle={{
              fontSize: "6px",
              marginBottom: "1px",
              paddingTop: "7px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {chartData.length === 0 && (
        <p className="text-gray-500 text-center mt-4">
          Tidak ada data untuk pilihan ini.
        </p>
      )}
    </div>
  );
}
