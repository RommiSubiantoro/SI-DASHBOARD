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
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
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
  return isNeg ? -n : n;
}

export default function Linechart({
  data = [],
  selectedYear = "2025",
  selectedUnit = "",        // 🔥 WAJIB
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

  // ------------------------------------------------------------
  // 🔥 FILTER BUSINESS LINE (GEN99 / AGE11 / selain dua itu)
  // ------------------------------------------------------------
  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];

    const getBL = (row) =>
      row.businessLine ||
      row["Business Line"] ||
      row.business_line ||
      row.BL ||
      "";

    const unit = selectedUnit.toLowerCase();

    // GENA → hanya GEN99
    if (unit.includes("gena")) {
      return data.filter(
        (row) => String(getBL(row)).trim().toUpperCase() === "GEN99"
      );
    }

    // LOCAL → hanya AGE11
    if (unit.includes("local")) {
      return data.filter(
        (row) => String(getBL(row)).trim().toUpperCase() === "AGE11"
      );
    }

    // SAI / lainnya → selain GEN99 & AGE11
    return data.filter((row) => {
      const bl = String(getBL(row)).trim().toUpperCase();
      return bl !== "GEN99" && bl !== "AGE11";
    });
  }, [data, selectedUnit]);

  // 🔹 Kategori unik
  const categories = useMemo(() => {
    if (masterCode.length === 0) return ["ALL"];
    const unique = [...new Set(masterCode.map((m) => m.category))];
    return ["ALL", ...unique];
  }, [masterCode]);

  // 🔹 Hitung nilai per bulan
  const chartData = useMemo(() => {
    if (!Array.isArray(filtered) || filtered.length === 0 || masterCode.length === 0)
      return [];

    const monthlyTotals = Object.fromEntries(MONTHS.map((m) => [m, 0]));

    filtered.forEach((row) => {
      const code = String(row.accountCode)?.trim();
      const match = masterCode.find((m) => String(m.code).trim() === code);
      if (!match) return;

      const category = match.category || "Unknown";
      if (selectedCategory !== "ALL" && category !== selectedCategory) return;

      MONTHS.forEach((month) => {
        const val = parseNumber(row[month]);
        monthlyTotals[month] += val;
      });
    });

    return MONTHS.map((m) => ({
      month: m,
      value: monthlyTotals[m],
    }));
  }, [filtered, masterCode, selectedCategory]);

  // 🔹 Total keseluruhan
  const totalValue = useMemo(() => {
    return chartData.reduce((sum, item) => sum + (item.value || 0), 0);
  }, [chartData]);

  return (
    <div className="p-4 sm:p-6 bg-white shadow-lg rounded-2xl">
      {/* HEADER + FILTER */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 sm:items-center mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 text-center sm:text-left">
          📈 Line Chart Berdasarkan Kategori & Bulan
        </h3>

        {/* Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-gray-50 text-gray-700"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p className="text-center text-gray-500">⏳ Memuat data masterCode...</p>
      ) : chartData.length > 0 ? (
        <>
          <div className="w-full h-[280px] sm:h-[350px] md:h-[400px] bg-gray-50 rounded-lg p-2 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tickFormatter={(val) => val.toLocaleString()} />
                <Tooltip formatter={(v) => v.toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
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
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Total */}
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
