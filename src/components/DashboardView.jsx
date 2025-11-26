// src/components/DashboardView.jsx
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowUp, ArrowDown, RefreshCcw } from "lucide-react";

// Helper parse angka
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

const altNames = {
  service: ["Service Revenue", "service revenue"],
  cost: ["Cost Of Service", "Cost of Service", "cost of service"],
  ga: [
    "General & Administration Expense",
    "General & Administration Expenses",
    "general & administration expense",
    "general & administration expenses",
  ],
  other: [
    "Other Income (Expenses)",
    "Other Income/Expense",
    "other income (expenses)",
    "other income/expense",
  ],
  pajak: ["Pajak", "pajak"],
};

const DashboardView = ({ currentData = [], selectedYear, selectedUnit }) => {
  const [masterCode, setMasterCode] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [budgetData, setBudgetData] = useState({});
  const [actData2024, setActData2024] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingReload, setLoadingReload] = useState(false);

  const months = useMemo(() => MONTHS, []);

  // Ambil masterCode
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMasterCode(data);
      } catch (error) {
        console.error("❌ Gagal ambil masterCode:", error);
      }
    };
    fetchMaster();
  }, []);

  // codeMap: normalisasi ke lowercase string
  const codeMap = useMemo(() => {
    const map = new Map();
    masterCode.forEach((m) => {
      if (m.code) map.set(String(m.code).toLowerCase().trim(), m);
    });
    return map;
  }, [masterCode]);

  const categories = useMemo(
    () => [...new Set(masterCode.map((item) => item.category).filter(Boolean))],
    [masterCode]
  );

  // Ambil budget semua tahun
  useEffect(() => {
    const fetchAllBudgets = async () => {
      if (!selectedUnit || masterCode.length === 0) return;

      try {
        const years = ["2024", "2025"];
        const validCodes = new Set(
          masterCode.map((m) => String(m.code).toLowerCase().trim())
        );

        const extractCode = (item) =>
          String(
            item.accountCode ||
              item["ACCOUNT CODE"] ||
              item["AccountCode"] ||
              item["account_code"] ||
              item["Code"] ||
              ""
          )
            .toLowerCase()
            .trim();

        let allBudgets = {};
        for (const year of years) {
          const colRef = collection(
            db,
            `unitData/${selectedUnit}/${year}/budget/items`
          );
          const snap = await getDocs(colRef);
          let data = snap.docs.map((doc) => doc.data());
          data = data.filter((item) => validCodes.has(extractCode(item)));

          const grouped = {};
          data.forEach((item) => {
            const code = extractCode(item);
            if (!grouped[code])
              grouped[code] = { accountCode: code, totalBudget: 0 };

            const monthsUpper = [
              "JAN",
              "FEB",
              "MAR",
              "APR",
              "MAY",
              "JUN",
              "JUL",
              "AUG",
              "SEP",
              "OCT",
              "NOV",
              "DEC",
            ];
            grouped[code].totalBudget += monthsUpper.reduce(
              (sum, m) =>
                sum + parseNumber(item[m] ?? item[m.toLowerCase()] ?? 0),
              0
            );
          });

          allBudgets[year] = Object.values(grouped);
        }

        setBudgetData(allBudgets);
      } catch (error) {
        console.error("❌ Gagal ambil data semua tahun:", error);
      }
    };

    fetchAllBudgets();
  }, [selectedUnit, masterCode]);

  // Filter data actual + special business-line logic
  const filteredData = useMemo(() => {
    if (!currentData || !currentData.length || !selectedUnit) return [];

    let filtered = currentData.slice();

    const businessLineField = (row) =>
      row.businessLine ||
      row["Business Line"] ||
      row.business_line ||
      row["BUSINESS LINE"] ||
      row.BL ||
      "";

    const unitName = String(selectedUnit).toLowerCase();

    const isGENA = unitName.includes("samudera agencies indonesia gena");
    const isLOCAL = unitName.includes("samudera agencies indonesia local");
    const isSAI = !isGENA && !isLOCAL; // unit utama

    if (isGENA) {
      // hanya ambil GEN99
      filtered = filtered.filter(
        (row) => String(businessLineField(row)).trim().toUpperCase() === "GEN99"
      );
    } else if (isLOCAL) {
      // hanya ambil AGE11
      filtered = filtered.filter(
        (row) => String(businessLineField(row)).trim().toUpperCase() === "AGE11"
      );
    } else if (isSAI) {
      // SAI ambil SEMUA kecuali GEN99 & AGE11
      filtered = filtered.filter((row) => {
        const bl = String(businessLineField(row)).trim().toUpperCase();
        return bl !== "GEN99" && bl !== "AGE11";
      });
    }

    return filtered;
  }, [currentData, selectedUnit]);

  useEffect(() => {
    if (String(selectedYear) === "2024") setActData2024(filteredData);
  }, [filteredData, selectedYear]);

  // helper: get month value tolerant to key case
  const getMonthValue = (row, m) => {
    if (!row) return 0;
    return (
      parseNumber(row[m]) ||
      parseNumber(row[m.toUpperCase()]) ||
      parseNumber(row[m.toLowerCase()]) ||
      0
    );
  };

  // helper: find summary entry by a set of alternative names (case-insensitive)
  const findByPossible = (arr, names) => {
    if (!Array.isArray(arr)) return undefined;
    return arr.find((r) => {
      const d = String(r.description || "").toLowerCase();
      return names.some((n) => d === n.toLowerCase());
    });
  };

  // 🔹 Hitung summary
  useEffect(() => {
    if (!masterCode.length) {
      setSummaryData([]);
      return;
    }
    setLoadingReload(true);
    const timeout = setTimeout(() => setLoadingReload(false), 800);

    const yearKey = String(selectedYear);
    const budgetForYear = budgetData[yearKey] || [];
    const actPrev = actData2024 || [];

    const formatNumber = (num) =>
      num || num === 0
        ? Number(num).toLocaleString("en-US", { maximumFractionDigits: 0 })
        : "-";

    // categories could be from masterCode; if empty, rely to-empty array
    const summary = (categories.length ? categories : []).map((cat) => {
      const matchCat = (row) => {
        const rowCode = String(
          row.accountCode || row.AccountCode || row.Account || ""
        )
          .toLowerCase()
          .trim();
        const match = codeMap.get(rowCode);
        return (
          match &&
          ((match.category || "").toString() === cat.toString() ||
            String(match.category).toLowerCase() === String(cat).toLowerCase())
        );
      };

      const totalActPrev = actPrev
        .filter(matchCat)
        .reduce(
          (sum, row) =>
            sum + months.reduce((acc, m) => acc + getMonthValue(row, m), 0),
          0
        );

      const totalActNow = filteredData
        .filter(matchCat)
        .reduce(
          (sum, row) =>
            sum + months.reduce((acc, m) => acc + getMonthValue(row, m), 0),
          0
        );

      const totalBdgt = budgetForYear
        .filter(matchCat)
        .reduce(
          (sum, row) =>
            sum + parseNumber(row.totalBudget || row.totalbudget || 0),
          0
        );

      const aVsCValue = totalActNow - totalActPrev;
      const bVsCValue = totalActNow - totalBdgt;

      const aVsCPercent = totalActPrev
        ? (totalActNow / totalActPrev - 1) * 100
        : null;
      const bVsCPercent = totalBdgt
        ? (totalActNow / totalBdgt - 1) * 100
        : null;

      return {
        description: String(cat),
        act2024: formatNumber(totalActPrev),
        bdgt2025: formatNumber(totalBdgt),
        act2025: formatNumber(totalActNow),
        aVsC:
          aVsCPercent === null
            ? "-"
            : {
                value: aVsCValue,
                percent: aVsCPercent,
                text: `${aVsCPercent >= 0 ? "+" : ""}${aVsCPercent.toFixed(
                  1
                )}% (${formatNumber(aVsCValue)})`,
              },
        bVsC:
          bVsCPercent === null
            ? "-"
            : {
                value: bVsCValue,
                percent: bVsCPercent,
                text: `${bVsCPercent >= 0 ? "+" : ""}${bVsCPercent.toFixed(
                  1
                )}% (${formatNumber(bVsCValue)})`,
              },
      };
    });

    // Derived rows -> use tolerant find for needed components
    const service =
      findByPossible(summary, altNames.service) ||
      summary.find((s) =>
        String(s.description).toLowerCase().includes("service revenue")
      );
    const cost =
      findByPossible(summary, altNames.cost) ||
      summary.find((s) => String(s.description).toLowerCase().includes("cost"));
    if (service && cost) {
      const num = (v) => Number(String(v).replace(/,/g, "")) || 0;
      const act2024 = num(service.act2024) - num(cost.act2024);
      const act2025 = num(service.act2025) - num(cost.act2025);
      const bdgt2025 = num(service.bdgt2025) - num(cost.bdgt2025);

      summary.push({
        description: "Gross Profit",
        act2024: formatNumber(act2024),
        bdgt2025: formatNumber(bdgt2025),
        act2025: formatNumber(act2025),
        aVsC: {
          value: act2025 - act2024,
          percent: act2024 ? (act2025 / act2024 - 1) * 100 : null,
          text: act2024
            ? ((act2025 / act2024 - 1) * 100).toFixed(1) +
              "% (" +
              formatNumber(act2025 - act2024) +
              ")"
            : "-",
        },
        bVsC: {
          value: act2025 - bdgt2025,
          percent: bdgt2025 ? (act2025 / bdgt2025 - 1) * 100 : null,
          text: bdgt2025
            ? ((act2025 / bdgt2025 - 1) * 100).toFixed(1) +
              "% (" +
              formatNumber(act2025 - bdgt2025) +
              ")"
            : "-",
        },
      });
    }

    // Operation Income = Gross Profit - G&A
    const gpa = summary.find(
      (r) => String(r.description).toLowerCase() === "gross profit"
    );
    const gae =
      findByPossible(summary, altNames.ga) ||
      summary.find((s) =>
        String(s.description).toLowerCase().includes("general")
      );
    if (gpa && gae) {
      const num = (v) => Number(String(v).replace(/,/g, "")) || 0;
      const opIncomeAct2024 = num(gpa.act2024) - num(gae.act2024);
      const opIncomeAct2025 = num(gpa.act2025) - num(gae.act2025);
      const opIncomeBdgt2025 = num(gpa.bdgt2025) - num(gae.bdgt2025);

      summary.push({
        description: "Operation Income",
        act2024: formatNumber(opIncomeAct2024),
        bdgt2025: formatNumber(opIncomeBdgt2025),
        act2025: formatNumber(opIncomeAct2025),
        aVsC: {
          value: opIncomeAct2025 - opIncomeAct2024,
          percent: opIncomeAct2024
            ? (opIncomeAct2025 / opIncomeAct2024 - 1) * 100
            : null,
          text: opIncomeAct2024
            ? ((opIncomeAct2025 / opIncomeAct2024 - 1) * 100).toFixed(1) +
              "% (" +
              formatNumber(opIncomeAct2025 - opIncomeAct2024) +
              ")"
            : "-",
        },
        bVsC: {
          value: opIncomeAct2025 - opIncomeBdgt2025,
          percent: opIncomeBdgt2025
            ? (opIncomeAct2025 / opIncomeBdgt2025 - 1) * 100
            : null,
          text: opIncomeBdgt2025
            ? ((opIncomeAct2025 / opIncomeBdgt2025 - 1) * 100).toFixed(1) +
              "% (" +
              formatNumber(opIncomeAct2025 - opIncomeBdgt2025) +
              ")"
            : "-",
        },
      });

      // NIBT = Operation Income - Other Income/Expense
      const oie =
        findByPossible(summary, altNames.other) ||
        summary.find((s) =>
          String(s.description).toLowerCase().includes("other")
        );
      if (oie) {
        const nibtAct2024 =
          opIncomeAct2024 -
          (Number(String(oie.act2024).replace(/,/g, "")) || 0);
        const nibtAct2025 =
          opIncomeAct2025 -
          (Number(String(oie.act2025).replace(/,/g, "")) || 0);
        const nibtBdgt2025 =
          opIncomeBdgt2025 -
          (Number(String(oie.bdgt2025).replace(/,/g, "")) || 0);

        summary.push({
          description: "NIBT",
          act2024: formatNumber(nibtAct2024),
          bdgt2025: formatNumber(nibtBdgt2025),
          act2025: formatNumber(nibtAct2025),
          aVsC: {
            value: nibtAct2025 - nibtAct2024,
            percent: nibtAct2024 ? (nibtAct2025 / nibtAct2024 - 1) * 100 : null,
            text: nibtAct2024
              ? ((nibtAct2025 / nibtAct2024 - 1) * 100).toFixed(1) +
                "% (" +
                formatNumber(nibtAct2025 - nibtAct2024) +
                ")"
              : "-",
          },
          bVsC: {
            value: nibtAct2025 - nibtBdgt2025,
            percent: nibtBdgt2025
              ? (nibtAct2025 / nibtBdgt2025 - 1) * 100
              : null,
            text: nibtBdgt2025
              ? ((nibtAct2025 / nibtBdgt2025 - 1) * 100).toFixed(1) +
                "% (" +
                formatNumber(nibtAct2025 - nibtBdgt2025) +
                ")"
              : "-",
          },
        });
      }
    }

    // Sort - normalize description comparison using FINAL_ORDER lowercased
    const order = FINAL_ORDER.map((s) => s.toLowerCase());
    summary.sort((a, b) => {
      const ia = order.indexOf(String(a.description).toLowerCase());
      const ib = order.indexOf(String(b.description).toLowerCase());
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    setSummaryData(summary);
    return () => clearTimeout(timeout);
  }, [
    filteredData,
    budgetData,
    actData2024,
    masterCode,
    selectedYear,
    categories,
    codeMap,
    reloadKey,
  ]);

  const totals = useMemo(() => {
    const sum = { act2024: 0, bdgt2025: 0, act2025: 0 };
    summaryData.forEach((r) => {
      const parse = (v) => Number(String(v).replace(/,/g, "")) || 0;
      sum.act2024 += parse(r.act2024);
      sum.bdgt2025 += parse(r.bdgt2025);
      sum.act2025 += parse(r.act2025);
    });
    return sum;
  }, [summaryData]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow mt-6 sm:mt-10 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-base sm:text-lg font-bold">
          Summary Dashboard —{" "}
          <span className="text-blue-600">{selectedYear || "Pilih Tahun"}</span>
        </h2>

        <button
          onClick={() => setReloadKey(Date.now())}
          disabled={loadingReload}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition ${
            loadingReload
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <RefreshCcw
            className={`w-4 h-4 ${loadingReload ? "animate-spin" : ""}`}
          />
          {loadingReload ? "Loading..." : "Reload Data"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-red-500 text-left">
              <th className="border p-2 text-white">DESCRIPTION</th>
              <th className="border p-2 text-right text-white">ACT 2024</th>
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
            {summaryData.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="border p-2">{row.description}</td>
                <td className="border p-2 text-right">{row.act2024}</td>
                <td className="border p-2 text-right">{row.bdgt2025}</td>
                <td className="border p-2 text-right font-bold">
                  {row.act2025}
                </td>

                {/* A VS C */}
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

                {/* B VS C */}
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

      {summaryData.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          Tidak ada data untuk ditampilkan.
        </p>
      )}
    </div>
  );
};

export default DashboardView;
