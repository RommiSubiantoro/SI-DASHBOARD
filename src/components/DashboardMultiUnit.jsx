// src/components/DashboardMultiUnit.jsx (FINAL WITH MEMORY + DERIVED CATEGORIES)
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

/* Helper parse angka — sama seperti DashboardView */
function parseNumber(raw) {
  if (raw === null || raw === undefined || raw === "") return 0;
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
  "Jan","Feb","Mar","Apr","May","Jun",
  "Jul","Aug","Sep","Oct","Nov","Dec",
];

/* Urutan final yang kamu minta */
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

/* Mapping kategori dari masterCode → canonical */
const CATEGORY_CANON = {
  "Service Revenue": "Service Revenue",
  "service revenue": "Service Revenue",

  "Cost Of Service": "Cost of Service",
  "Cost of Service": "Cost of Service",

  "General & Administration Expense": "General & Administration Expenses",
  "General & Administration Expenses": "General & Administration Expenses",

  "Other Income (Expenses)": "Other Income/Expense",
  "Other Income/Expense": "Other Income/Expense",

  "Pajak": "Pajak",
};

const SUMMARY_CACHE = {}; // cache global

const DashboardMultiUnit = ({ selectedYear: initialYear }) => {
  const [unitList, setUnitList] = useState([]);
  const [masterCode, setMasterCode] = useState([]);
  const [summaryData, setSummaryData] = useState({});
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState(
    initialYear || new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState("All");

  // 🔥 Load saved filter (bulan & tahun)
  useEffect(() => {
    const savedYear = localStorage.getItem("multiUnitYear");
    const savedMonth = localStorage.getItem("multiUnitMonth");

    if (savedYear) setSelectedYear(savedYear);
    if (savedMonth) setSelectedMonth(savedMonth);
  }, []);

  // > Fetch Units (1x)
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "units"));
      setUnitList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  // > Fetch masterCode (1x)
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "masterCode"));
      setMasterCode(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    })();
  }, []);

  // > Build categorized summary (CACHE + PARALLEL)
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

      // Map masterCode → canonical category → code list
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

          const filtered =
            selectedMonth === "All"
              ? docs
              : docs.filter((d) => d.month === selectedMonth);

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

      // Derived categories
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

  const getTotal = (cat) => {
    return Object.values(summaryData[cat] || {}).reduce(
      (s, v) => s + (v || 0),
      0
    );
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md w-full max-w-4xl mx-auto mt-10">
      <h2 className="text-lg font-semibold mb-4 text-center text-gray-800">
        📊 Laporan Unit Bisnis – {selectedMonth} {selectedYear}
      </h2>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-center text-gray-500 py-4">
          ⏳ Memuat data...
        </p>
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
                  <th
                    key={u.id}
                    className="border px-3 py-2 bg-cyan-300"
                  >
                    {u.name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {FINAL_ORDER.map((cat) => (
                <tr key={cat} className="hover:bg-gray-50">
                  <td className="border px-3 py-2 text-left font-semibold">
                    {cat}
                  </td>

                  {unitList.map((u) => (
                    <td
                      key={u.id}
                      className="border px-3 py-2 text-right"
                    >
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
