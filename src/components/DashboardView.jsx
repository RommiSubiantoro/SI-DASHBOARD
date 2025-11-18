// src/components/DashboardView.jsx
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowUp, ArrowDown, RefreshCcw } from "lucide-react";

// 🔹 Helper parse angka sama seperti chart
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
  return isNeg ? -Math.abs(n) : n;
}

const DashboardView = ({ currentData = [], selectedYear, selectedUnit }) => {
  const [masterCode, setMasterCode] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [budgetData, setBudgetData] = useState({});
  const [actData2024, setActData2024] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadingReload, setLoadingReload] = useState(false);

  const months = useMemo(
    () => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    []
  );

  // Ambil masterCode
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMasterCode(data);
      } catch (error) {
        console.error("❌ Gagal ambil masterCode:", error);
      }
    };
    fetchMaster();
  }, []);

  const codeMap = useMemo(() => {
    const map = new Map();
    masterCode.forEach((m) => {
      if (m.code) map.set(String(m.code).trim(), m);
    });
    return map;
  }, [masterCode]);

  const categories = useMemo(
    () => [...new Set(masterCode.map((item) => item.category))],
    [masterCode]
  );

  // Ambil budget semua tahun
  useEffect(() => {
    const fetchAllBudgets = async () => {
      if (!selectedUnit || masterCode.length === 0) return;

      try {
        const years = ["2024", "2025"];
        const validCodes = new Set(masterCode.map((m) => String(m.code).toLowerCase().trim()));

        const extractCode = (item) =>
          String(
            item.accountCode || item["ACCOUNT CODE"] || item["AccountCode"] || item["account_code"] || item["Code"] || ""
          ).toLowerCase().trim();

        const getMonthValue = (item, m) => Math.abs(parseNumber(item[m]));

        let allBudgets = {};
        for (const year of years) {
          const colRef = collection(db, `unitData/${selectedUnit}/${year}/budget/items`);
          const snap = await getDocs(colRef);
          let data = snap.docs.map((doc) => doc.data());
          data = data.filter((item) => validCodes.has(extractCode(item)));

          const grouped = {};
          data.forEach((item) => {
            const code = extractCode(item);
            if (!grouped[code]) grouped[code] = { accountCode: code, totalBudget: 0 };

            const monthsUpper = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
            grouped[code].totalBudget += monthsUpper.reduce((sum, m) => sum + Math.abs(parseNumber(item[m])), 0);
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

  // Filter data actual
  const filteredData = useMemo(() => {
    if (!currentData.length || !selectedUnit) return [];
    return currentData;
  }, [currentData, selectedUnit]);

  useEffect(() => {
    if (selectedYear === "2024") setActData2024(filteredData);
  }, [filteredData, selectedYear]);

  // 🔹 Hitung summary (termasuk Gross Profit, Operation Income, NIBT)
  useEffect(() => {
    if (!masterCode.length) return setSummaryData([]);
    setLoadingReload(true);
    const timeout = setTimeout(() => setLoadingReload(false), 800);

    const budgetForYear = budgetData[selectedYear] || [];
    const actPrev = actData2024 || [];

    const formatNumber = (num) =>
      num ? num.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "-";

    const summary = categories.map((cat) => {
      const matchCat = (row) => {
        const rowCode = String(row.accountCode || row.AccountCode || "").trim();
        const match = codeMap.get(rowCode);
        return match && match.category === cat;
      };

      const totalActPrev = actPrev
        .filter(matchCat)
        .reduce(
          (sum, row) =>
            sum + months.reduce((acc, m) => acc + Math.abs(parseNumber(row[m])), 0),
          0
        );

      const totalActNow = filteredData
        .filter(matchCat)
        .reduce(
          (sum, row) =>
            sum + months.reduce((acc, m) => acc + Math.abs(parseNumber(row[m])), 0),
          0
        );

      const totalBdgt = budgetForYear
        .filter(matchCat)
        .reduce((sum, row) => sum + Math.abs(parseNumber(row.totalBudget)), 0);

      const aVsCValue = totalActNow - totalActPrev;
      const bVsCValue = totalActNow - totalBdgt;

      const aVsCPercent = totalActPrev ? (totalActNow / totalActPrev - 1) * 100 : null;
      const bVsCPercent = totalBdgt ? (totalActNow / totalBdgt - 1) * 100 : null;

      return {
        description: cat,
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

    // 🔹 Gross Profit
    const service = summary.find((r) => r.description === "Service Revenue");
    const cost = summary.find((r) => r.description === "Cost Of Service");
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

    // 🔹 Operation Income = Gross Profit - G&A Expense
    const gpa = summary.find((r) => r.description === "Gross Profit");
    const gae = summary.find((r) => r.description === "General & Administration Expense");
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
          percent: opIncomeAct2024 ? (opIncomeAct2025 / opIncomeAct2024 - 1) * 100 : null,
          text: opIncomeAct2024
            ? ((opIncomeAct2025 / opIncomeAct2024 - 1) * 100).toFixed(1) +
              "% (" +
              formatNumber(opIncomeAct2025 - opIncomeAct2024) +
              ")"
            : "-",
        },
        bVsC: {
          value: opIncomeAct2025 - opIncomeBdgt2025,
          percent: opIncomeBdgt2025 ? (opIncomeAct2025 / opIncomeBdgt2025 - 1) * 100 : null,
          text: opIncomeBdgt2025
            ? ((opIncomeAct2025 / opIncomeBdgt2025 - 1) * 100).toFixed(1) +
              "% (" +
              formatNumber(opIncomeAct2025 - opIncomeBdgt2025) +
              ")"
            : "-",
        },
      });

      // 🔹 NIBT = Operation Income - Other Income (Expenses)
      const oie = summary.find((r) => r.description === "Other Income (Expenses)");
      if (oie) {
        const nibtAct2024 = opIncomeAct2024 - num(oie.act2024);
        const nibtAct2025 = opIncomeAct2025 - num(oie.act2025);
        const nibtBdgt2025 = opIncomeBdgt2025 - num(oie.bdgt2025);

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
            percent: nibtBdgt2025 ? (nibtAct2025 / nibtBdgt2025 - 1) * 100 : null,
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

    // 🔹 Sort urutan
    const order = [
      "Service Revenue",
      "Cost Of Service",
      "Gross Profit",
      "General & Administration Expense",
      "Operation Income",
      "Other Income (Expenses)",
      "NIBT",
      "Pajak",
    ];
    summary.sort((a, b) => order.indexOf(a.description) - order.indexOf(b.description));

    setSummaryData(summary);
    return () => clearTimeout(timeout);
  }, [filteredData, budgetData, actData2024, masterCode, selectedYear, categories, codeMap, reloadKey]);

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
    <div className="bg-white p-6 rounded-xl shadow mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          Summary Dashboard — <span className="text-blue-600">{selectedYear || "Pilih Tahun"}</span>
        </h2>
        <button
          onClick={() => setReloadKey(Date.now())}
          disabled={loadingReload}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition ${loadingReload ? "bg-gray-400 cursor-not-allowed text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
        >
          <RefreshCcw className={`w-4 h-4 ${loadingReload ? "animate-spin" : ""}`} />
          {loadingReload ? "Loading..." : "Reload Data"}
        </button>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-red-500 text-left">
            <th className="border p-2 text-white">DESCRIPTION</th>
            <th className="border p-2 text-right text-white">ACT 2024</th>
            <th className="border p-2 text-right text-white">BDGT {selectedYear}</th>
            <th className="border p-2 text-right text-white">ACT {selectedYear}</th>
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
              <td className="border p-2 text-right font-bold">{row.act2025}</td>
              <td className="border p-2 text-right">
                {row.aVsC === "-" ? "-" : (
                  <div className={`flex items-center justify-end gap-1 ${row.aVsC.percent >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <span>{row.aVsC.text}</span>
                    {row.aVsC.percent >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  </div>
                )}
              </td>
              <td className="border p-2 text-right">
                {row.bVsC === "-" ? "-" : (
                  <div className={`flex items-center justify-end gap-1 ${row.bVsC.percent >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <span>{row.bVsC.text}</span>
                    {row.bVsC.percent >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {summaryData.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          Tidak ada data untuk ditampilkan.
        </p>
      )}
    </div>
  );
};

export default DashboardView;
