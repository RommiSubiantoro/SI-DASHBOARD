import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/* Helper parse angka */
function parseNumber(raw) {
  if (!raw) return 0;
  let s = String(raw).replace(/\s+/g, "").replace(/\./g, "").replace(/,/g, "");
  let isNeg = false;
  if (/^\(.+\)$/.test(s)) {
    isNeg = true;
    s = s.replace(/^\(|\)$/g, "");
  }
  let n = Number(s);
  if (Number.isNaN(n)) n = 0;
  return isNeg ? -n : n;
}

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
const FINAL_ORDER = [
  "Service Revenue",
  "Cost of Service",
  "Gross Profit",
  "General & Administration Expenses",
  "Operation Income",
  "Other Income/Expense",
  "NIBT",
  "Pajak",
];
const CATEGORY_CANON = {
  "Service Revenue": "Service Revenue",
  "service revenue": "Service Revenue",
  "Cost Of Service": "Cost of Service",
  "Cost of Service": "Cost of Service",
  "General & Administration Expense": "General & Administration Expenses",
  "General & Administration Expenses": "General & Administration Expenses",
  "Other Income (Expenses)": "Other Income/Expense",
  "Other Income/Expense": "Other Income/Expense",
  Pajak: "Pajak",
};
const SUMMARY_CACHE = {};

const DashboardMultiUnit = ({ selectedYear: initialYear }) => {
  const [unitList, setUnitList] = useState([]);
  const [masterCode, setMasterCode] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(
    initialYear || new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedCategories, setSelectedCategories] = useState(FINAL_ORDER);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const savedYear = localStorage.getItem("multiUnitYear");
    const savedMonth = localStorage.getItem("multiUnitMonth");
    if (savedYear) setSelectedYear(savedYear);
    if (savedMonth) setSelectedMonth(savedMonth);
  }, []);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "units"));
      setUnitList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "masterCode"));
      setMasterCode(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  useEffect(() => {
    if (!unitList.length || !masterCode.length) return;

    const cacheKey = `${selectedYear}-${selectedMonth}`;
    if (SUMMARY_CACHE[cacheKey]) {
      setSummaryData(SUMMARY_CACHE[cacheKey]);
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const catMap = {};
      const codesByCategory = masterCode.reduce((acc, m) => {
        const cat = CATEGORY_CANON[m.category] || m.category;
        const code = String(m.code || "").trim();
        if (!acc[cat]) acc[cat] = new Set();
        acc[cat].add(code);
        return acc;
      }, {});

      await Promise.all(
        unitList.map(async (unit) => {
          const path = `unitData/${unit.name}/${selectedYear}/data/items`;
          const snap = await getDocs(collection(db, path));
          const docs = snap.docs.map((d) => d.data());

          // 1. Filter bulan
          let filtered =
            selectedMonth === "All"
              ? docs
              : docs.filter((d) => d.month === selectedMonth);

          // 2. Helper untuk baca business line dari data item
          const getBL = (row) =>
            row.businessLine ||
            row["Business Line"] ||
            row.business_line ||
            row["BUSINESS LINE"] ||
            row.BL ||
            "";

          // 3. Filter business line berdasarkan nama unit
          const unitName = unit.name.toLowerCase();

          // Samudera Agencies Indonesia GENA → hanya GEN99
          if (unitName.includes("samudera agencies indonesia gena")) {
            filtered = filtered.filter(
              (d) => String(getBL(d)).trim().toUpperCase() === "GEN99"
            );
          }

          // Samudera Agencies Indonesia Local → hanya AGE11
          else if (unitName.includes("samudera agencies indonesia local")) {
            filtered = filtered.filter(
              (d) => String(getBL(d)).trim().toUpperCase() === "AGE11"
            );
          }

          // Unit lain → buang GEN99 dan AGE11
          else {
            filtered = filtered.filter((d) => {
              const bl = String(getBL(d)).trim().toUpperCase();
              return bl !== "GEN99" && bl !== "AGE11";
            });
          }

          const perCodeSum = {};
          filtered.forEach((docItem) => {
            const code = String(docItem.accountCode || "").trim();
            perCodeSum[code] =
              (perCodeSum[code] || 0) + parseNumber(docItem.docValue);
          });

          for (const [cat, codes] of Object.entries(codesByCategory)) {
            let sum = 0;
            codes.forEach((c) => (sum += perCodeSum[c] || 0));
            if (!catMap[cat]) catMap[cat] = {};
            catMap[cat][unit.name] = (catMap[cat][unit.name] || 0) + sum;
          }
        })
      );

      const ensure = (k) => {
        if (!catMap[k]) catMap[k] = {};
      };

      ensure("Service Revenue");
      ensure("Cost of Service");
      ensure("General & Administration Expenses");
      ensure("Other Income/Expense");
      ensure("Pajak");

      ensure("Gross Profit");
      unitList.forEach((u) => {
        const r = catMap["Service Revenue"][u.name] || 0;
        const c = catMap["Cost of Service"][u.name] || 0;
        catMap["Gross Profit"][u.name] = r - c;
      });

      ensure("Operation Income");
      unitList.forEach((u) => {
        const gp = catMap["Gross Profit"][u.name] || 0;
        const ga = catMap["General & Administration Expenses"][u.name] || 0;
        catMap["Operation Income"][u.name] = gp - ga;
      });

      ensure("NIBT");
      unitList.forEach((u) => {
        const op = catMap["Operation Income"][u.name] || 0;
        const oie = catMap["Other Income/Expense"][u.name] || 0;
        catMap["NIBT"][u.name] = op - oie;
      });

      SUMMARY_CACHE[cacheKey] = catMap;
      setSummaryData(catMap);
      setLoading(false);
    };

    load();
  }, [unitList, masterCode, selectedYear, selectedMonth]);

  const getValue = (cat, unit) => summaryData[cat]?.[unit] || 0;
  const getTotal = (cat) =>
    Object.values(summaryData[cat] || {}).reduce((s, v) => s + (v || 0), 0);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleAllCategories = () => {
    setSelectedCategories(
      selectedCategories.length === FINAL_ORDER.length ? [] : FINAL_ORDER
    );
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md max-w-4xl mx-auto mt-5">
      <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">
        📊 Laporan Unit Bisnis – {selectedMonth} {selectedYear}
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {/* Tahun */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Tahun
          </label>
          <select
            value={selectedYear}
            onChange={(e) => {
              const y = e.target.value;
              setSelectedYear(y);
              localStorage.setItem("multiUnitYear", y);
            }}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Bulan */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Bulan
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => {
              const m = e.target.value;
              setSelectedMonth(m);
              localStorage.setItem("multiUnitMonth", m);
            }}
            className="border px-2 py-1.5 rounded-md w-full text-sm"
          >
            <option value="All">Semua Bulan</option>
            {MONTHS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Dropdown filter kategori */}
        <div className="relative">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Filter Description
          </label>
          <button
            className="w-full border px-2 py-1.5 rounded-md text-left text-sm bg-white flex justify-between items-center"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {selectedCategories.length === FINAL_ORDER.length
              ? "Semua"
              : selectedCategories.join(", ")}
            <span>▾</span>
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto border rounded-md bg-white shadow-lg p-2">
              <button
                className="text-xs mb-1 underline text-cyan-600"
                onClick={toggleAllCategories}
              >
                {selectedCategories.length === FINAL_ORDER.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              {FINAL_ORDER.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 text-sm py-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="accent-cyan-500"
                  />
                  {cat}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-gray-500 py-4">⏳ Memuat data...</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm text-center border-collapse">
            <thead>
              <tr className="bg-yellow-400">
                <th className="border px-3 py-2 text-left" rowSpan="2">
                  Description
                </th>
                <th colSpan={unitList.length} className="border px-3 py-2">
                  {selectedMonth} {selectedYear}
                </th>
                <th className="border px-3 py-2" rowSpan="2">
                  Total
                </th>
              </tr>
              <tr>
                {unitList.map((u) => (
                  <th key={u.id} className="border px-3 py-2 bg-cyan-300">
                    {u.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FINAL_ORDER.filter((cat) =>
                selectedCategories.includes(cat)
              ).map((cat) => (
                <tr key={cat} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 text-left font-semibold">
                    {cat}
                  </td>
                  {unitList.map((u) => (
                    <td key={u.id} className="border px-3 py-2 text-right">
                      {getValue(cat, u.name).toLocaleString("id-ID")}
                    </td>
                  ))}
                  <td className="border px-3 py-2 text-right font-semibold">
                    {getTotal(cat).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DashboardMultiUnit;
