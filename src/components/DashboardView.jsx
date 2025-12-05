// src/components/DashboardView.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowUp, ArrowDown } from "lucide-react";

/* -------------------------
   Helper: parseNumber
   ------------------------- */
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

/* -------------------------
   Config
   ------------------------- */
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
  "Cost Of Service",
  "Gross Profit",
  "General & Administration Expense",
  "Operating Income",
  "Other Income (Expense)",
  "NIBT",
  "Pajak",
];

const CATEGORY_CANON = {
  "Service Revenue": "Service Revenue",
  "service revenue": "Service Revenue",
  "Cost Of Service": "Cost Of Service",
  "Cost of Service": "Cost Of Service",
  "General & Administration Expense": "General & Administration Expense",
  "General & Administration Expenses": "General & Administration Expense",
  "Other Income (Expense)": "Other Income (Expense)",
  "Other Income (Expenses)": "Other Income (Expense)",
  Pajak: "Pajak",
  pajak: "Pajak",
  PAJAK: "Pajak",
};

const shouldBePositive = (cat) => {
  const low = String(cat).toLowerCase();
  return low.includes("service revenue") || low.includes("other income");
};

const cacheKey = (unit, year) => `${unit}#${year}`;

const getBusinessLine = (row) =>
  row.businessLine ||
  row["Business Line"] ||
  row.business_line ||
  row["BUSINESS LINE"] ||
  row.BL ||
  "";

/* -------------------------
   Component
   ------------------------- */
function DashboardView() {
  const [units, setUnits] = useState([]);
  const [masterCode, setMasterCode] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  // caches
  const [actCache, setActCache] = useState({}); // key: unit#year -> docs[]
  const [budgetCache, setBudgetCache] = useState({}); // key: unit#year -> { code: totalBudget }

  // selections
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState("All");

  /* -------------------------
     Load units
     ------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "units"));
        const data = snap.docs.map((d) => d.data());
        setUnits(data);
        if (data.length && !selectedUnit) setSelectedUnit(data[0].name);
      } catch (e) {
        console.error("Failed to load units", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* -------------------------
     Load masterCode
     ------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        setMasterCode(snap.docs.map((d) => d.data()));
      } catch (e) {
        console.error("Failed to load masterCode", e);
      }
    })();
  }, []);

  /* -------------------------
     Load ACT for (unit, year) with cache
     ------------------------- */
  const loadActForYear = async (unit, year) => {
    if (!unit || !year) return [];
    const key = cacheKey(unit, year);
    if (actCache[key]) return actCache[key];

    try {
      const path = `unitData/${unit}/${year}/data/items`;
      const snap = await getDocs(collection(db, path));
      const docs = snap.docs.map((d) => d.data());
      setActCache((prev) => ({ ...prev, [key]: docs }));
      return docs;
    } catch (e) {
      console.error("Failed to load ACT:", unit, year, e);
      setActCache((prev) => ({ ...prev, [key]: [] }));
      return [];
    }
  };

  /* -------------------------
     Load BUDGET for (unit, year) with cache
     ------------------------- */
  const loadBudgetForYear = async (unit, year) => {
    if (!unit || !year) return {};
    const key = cacheKey(unit, year);
    if (budgetCache[key]) return budgetCache[key];

    try {
      const path = `unitData/${unit}/${year}/budget/items`;
      const snap = await getDocs(collection(db, path));
      const raw = snap.docs.map((d) => d.data() || {});
      const grouped = {};
      raw.forEach((r) => {
        const code = String(
          r.accountCode || r["ACCOUNT CODE"] || r.Code || ""
        ).trim();
        if (!code) return;
        if (!grouped[code]) grouped[code] = 0;
        MONTHS.forEach((m) => {
          grouped[code] += parseNumber(r[m] ?? r[m.toUpperCase()] ?? 0);
        });
      });
      setBudgetCache((prev) => ({ ...prev, [key]: grouped }));
      return grouped;
    } catch (e) {
      console.error("Failed to load budget:", unit, year, e);
      setBudgetCache((prev) => ({ ...prev, [key]: {} }));
      return {};
    }
  };

  /* -------------------------
     Apply month and BL filters to docs
     (We cache raw docs and filter at compute time)
     ------------------------- */
  const applyFilters = (
    docs = [],
    unit = "",
    month = "All",
    limitMonth = "All"
  ) => {
    if (!Array.isArray(docs)) return [];
    let filtered = docs.slice();

    // -----------------------------
    // YTD FILTER JAN → limitMonth
    // -----------------------------
    if (limitMonth && limitMonth !== "All") {
      const limitIndex = MONTHS.findIndex(
        (m) => m.toLowerCase() === limitMonth.toLowerCase()
      );

      filtered = filtered.filter((d) => {
        const idx = MONTHS.findIndex(
          (m) => m.toLowerCase() === String(d.month || "").toLowerCase()
        );
        return idx !== -1 && idx <= limitIndex;
      });
    }

    // -----------------------------
    // BUSINESS LINE FILTER
    // -----------------------------
    const u = String(unit || "").toLowerCase();

    if (u.includes("samudera agencies indonesia gena") || u.includes("gena")) {
      filtered = filtered.filter(
        (d) => String(getBusinessLine(d)).trim().toUpperCase() === "AGE06"
      );
    } else if (
      u.includes("samudera agencies indonesia local") ||
      u.includes("local")
    ) {
      filtered = filtered.filter(
        (d) => String(getBusinessLine(d)).trim().toUpperCase() === "AGE11"
      );
    }

    return filtered;
  };

  /* -------------------------
     Build summary (uses caches)
     ------------------------- */
  useEffect(() => {
    const build = async () => {
      if (!selectedUnit || !masterCode.length) {
        setSummary([]);
        return;
      }
      setLoading(true);

      // Determine previous year (selectedYear - 1)
      const prevYear = Number(selectedYear) - 1;

      // Ensure caches (load if missing)
      const docsPrevYear = await loadActForYear(selectedUnit, prevYear);
      const docsSelectedYear = await loadActForYear(selectedUnit, selectedYear);
      const budgetForSelected = await loadBudgetForYear(
        selectedUnit,
        selectedYear
      );

      // Apply month & BL filters now
      let limitMonth = selectedMonth;

      // Jika user memilih ALL → otomatis mengikuti bulan terakhir di ACT tahun ini
      if (selectedMonth === "All") {
        const monthsInSelected = docsSelectedYear
          .map((d) => String(d.month || "").toLowerCase())
          .filter((m) => MONTHS.map((x) => x.toLowerCase()).includes(m));

        if (monthsInSelected.length > 0) {
          const lastMonthIndex = Math.max(
            ...monthsInSelected.map((m) =>
              MONTHS.findIndex((x) => x.toLowerCase() === m)
            )
          );
          limitMonth = MONTHS[lastMonthIndex]; // contoh: "Oct"
        }
      }

      const filteredPrev = applyFilters(
        docsPrevYear,
        selectedUnit,
        selectedMonth,
        limitMonth
      );

      const filteredSelected = applyFilters(
        docsSelectedYear,
        selectedUnit,
        selectedMonth,
        limitMonth
      );

      // Build codesByCategory
      const codesByCat = {};
      masterCode.forEach((m) => {
        const cat = CATEGORY_CANON[m.category] || m.category || "Uncategorized";
        if (!codesByCat[cat]) codesByCat[cat] = new Set();
        codesByCat[cat].add(String(m.code || "").trim());
      });

      // Sum per accountCode
      const perCodePrev = {};
      filteredPrev.forEach((r) => {
        const code = String(r.accountCode || r["ACCOUNT CODE"] || "").trim();
        if (!code) return;
        perCodePrev[code] = (perCodePrev[code] || 0) + parseNumber(r.docValue);
      });

      const perCodeNow = {};
      filteredSelected.forEach((r) => {
        const code = String(r.accountCode || r["ACCOUNT CODE"] || "").trim();
        if (!code) return;
        perCodeNow[code] = (perCodeNow[code] || 0) + parseNumber(r.docValue);
      });

      // Build summary rows in FINAL_ORDER
      const list = FINAL_ORDER.map((cat) => {
        const codes = Array.from(codesByCat[cat] || []);
        let actPrev = 0;
        let actNow = 0;
        let bdgt = 0;

        codes.forEach((c) => {
          actPrev += perCodePrev[c] || 0;
          actNow += perCodeNow[c] || 0;
          bdgt += budgetForSelected[c] || 0;
        });

        if (shouldBePositive(cat)) {
          actPrev = Math.abs(actPrev);
          actNow = Math.abs(actNow);
          bdgt = Math.abs(bdgt);
        }

        const aVsC =
          actPrev === 0
            ? "-"
            : {
                value: actNow - actPrev,
                percent: actPrev ? (actNow / actPrev - 1) * 100 : 0,
                text:
                  ((actNow / actPrev - 1) * 100).toFixed(1) +
                  "% (" +
                  (actNow - actPrev).toLocaleString("id-ID") +
                  ")",
              };

        const bVsC =
          bdgt === 0
            ? "-"
            : {
                value: actNow - bdgt,
                percent: bdgt ? (actNow / bdgt - 1) * 100 : 0,
                text:
                  ((actNow / bdgt - 1) * 100).toFixed(1) +
                  "% (" +
                  (actNow - bdgt).toLocaleString("id-ID") +
                  ")",
              };

        return {
          description: cat,
          // show previous year value and selected year value
          actPrev: actPrev.toLocaleString("id-ID"),
          bdgt: bdgt.toLocaleString("id-ID"),
          actNow: actNow.toLocaleString("id-ID"),
          aVsC,
          bVsC,
        };
      });

      setSummary(list);
      setLoading(false);
    };

    build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, selectedYear, selectedMonth, masterCode]);

  /* -------------------------
     Render
     ------------------------- */
  const prevYear = Number(selectedYear) - 1;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow mt-6 w-full">
      <h2 className="text-lg font-bold mb-4 text-center">
        Summary Dashboard — {selectedUnit || "Pilih Unit"}
      </h2>

      {/* FILTER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block mb-1 text-sm">Unit</label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          >
            {units.map((u) => (
              <option key={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm">Tahun</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border px-2 py-1 rounded w-full"
          >
            {[2023, 2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 text-sm">Bulan</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          >
            <option value="All">Semua Bulan</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE (structure preserved) */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-red-500 text-left">
              <th className="border p-2 text-white">DESCRIPTION</th>
              <th className="border p-2 text-right text-white">
                ACT {prevYear}
              </th>
              <th className="border p-2 text-right text-white">
                BDGT {selectedYear}
              </th>
              <th className="border p-2 text-right text-white">
                ACT {selectedYear}
              </th>
              <th className="border p-2 text-right text-white">A VS C</th>
              <th className="border p-2 text-right text-white">B VS C</th>
            </tr>
          </thead>

          <tbody>
            {summary.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border p-2">{row.description}</td>
                <td className="border p-2 text-right">{row.actPrev}</td>
                <td className="border p-2 text-right">{row.bdgt}</td>
                <td className="border p-2 text-right font-bold">
                  {row.actNow}
                </td>

                <td className="border p-2 text-right">
                  {row.aVsC === "-" ? (
                    "-"
                  ) : (
                    <div
                      className={`flex items-center justify-end gap-1 ${
                        row.aVsC.percent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      <span>{row.aVsC.text}</span>
                      {row.aVsC.percent >= 0 ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </td>

                <td className="border p-2 text-right">
                  {row.bVsC === "-" ? (
                    "-"
                  ) : (
                    <div
                      className={`flex items-center justify-end gap-1 ${
                        row.bVsC.percent >= 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      <span>{row.bVsC.text}</span>
                      {row.bVsC.percent >= 0 ? (
                        <ArrowUp className="w-4 h-4" />
                      ) : (
                        <ArrowDown className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <p className="text-center text-gray-500 mt-4">⏳ Memuat data…</p>
      )}
    </div>
  );
}

export default DashboardView;
