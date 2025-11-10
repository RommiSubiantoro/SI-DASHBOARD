// src/components/DashboardView.jsx
import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { ArrowUp, ArrowDown } from "lucide-react";

const DashboardView = ({ currentData = [], selectedYear, selectedUnit }) => {
  const [masterCode, setMasterCode] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [budgetData, setBudgetData] = useState({});
  const [actData2024, setActData2024] = useState([]);

  // 🟢 Ambil masterCode sekali
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

  // 📅 Bulan tetap, tidak perlu dalam dependency
  const months = useMemo(
    () => ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    []
  );

  // 🧩 Map kode untuk pencocokan cepat
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

  // 🟢 Ambil data budget (1x per perubahan unit/tahun/masterCode)
  useEffect(() => {
    const fetchBudget = async () => {
      if (!selectedUnit || !selectedYear || masterCode.length === 0) return;

      try {
        const colRef = collection(db, `unitData/${selectedUnit}/${selectedYear}/budget/items`);
        const snap = await getDocs(colRef);
        let data = snap.docs.map((doc) => doc.data());

        // Filter hanya kode yang valid
        const validCodes = new Set(masterCode.map((m) => String(m.code).toLowerCase().trim()));
        data = data.filter((item) => {
          const rowCode = String(item.accountCode || item["ACCOUNT CODE"] || "").toLowerCase().trim();
          return validCodes.has(rowCode);
        });

        const grouped = {};
        const monthsUpper = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
        data.forEach((item) => {
          const code = String(item.accountCode || item["ACCOUNT CODE"] || "").trim();
          if (!grouped[code]) grouped[code] = { accountCode: code, totalBudget: 0 };

          const total = monthsUpper.reduce((sum, m) => sum + (Number(item[m]) || 0), 0);
          grouped[code].totalBudget += total;
        });

        setBudgetData((prev) => ({
          ...prev,
          [selectedYear]: Object.values(grouped),
        }));
      } catch (error) {
        console.error("❌ Gagal ambil data budget:", error);
      }
    };
    fetchBudget();
  }, [selectedUnit, selectedYear, masterCode]);

  // 🔹 Filter data actual berdasarkan unit bisnis
  const filteredData = useMemo(() => {
    if (!currentData.length || !selectedUnit) return [];

    const normalize = (v) => String(v || "").toLowerCase().trim();

    if (normalize(selectedUnit).includes("samudera agencies indonesia gena")) {
      return currentData.filter((i) => i.businessLine && normalize(i.businessLine).includes("age06"));
    }
    if (normalize(selectedUnit).includes("samudera agencies indonesia local")) {
      return currentData.filter((i) => i.businessLine && normalize(i.businessLine).includes("age11"));
    }
    if (normalize(selectedUnit).includes("samudera agencies indonesia")) {
      return currentData.filter(
        (i) =>
          i.businessLine &&
          !normalize(i.businessLine).includes("age06") &&
          !normalize(i.businessLine).includes("age11")
      );
    }
    return currentData;
  }, [currentData, selectedUnit]);

  // 🔹 Simpan ACT 2024 hanya saat data tahun 2024
  useEffect(() => {
    if (selectedYear === "2024" && filteredData.length > 0) {
      setActData2024(filteredData);
    }
  }, [filteredData, selectedYear]);

  // 🧮 Hitung summary
  useEffect(() => {
    if (!masterCode.length) return setSummaryData([]);

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
          (sum, row) => sum + months.reduce((acc, m) => acc + (Number(row[m]) || 0), 0),
          0
        );

      const totalActNow = filteredData
        .filter(matchCat)
        .reduce(
          (sum, row) => sum + months.reduce((acc, m) => acc + (Number(row[m]) || 0), 0),
          0
        );

      const totalBdgt = budgetForYear
        .filter(matchCat)
        .reduce((sum, row) => sum + (Number(row.totalBudget) || 0), 0);

      const aVsCValue = totalActNow - totalActPrev;
      const bVsCValue = totalActNow - totalBdgt;

      const aVsCPercent = totalActPrev ? ((totalActNow / totalActPrev) - 1) * 100 : null;
      const bVsCPercent = totalBdgt ? ((totalActNow / totalBdgt) - 1) * 100 : null;

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

    // 🧮 Tambah Gross Profit manual
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
          percent: act2024 ? ((act2025 / act2024) - 1) * 100 : null,
          text: `${act2024 ? ((act2025 / act2024 - 1) * 100).toFixed(1) + "%" : "-"} (${formatNumber(act2025 - act2024)})`,
        },
        bVsC: {
          value: act2025 - bdgt2025,
          percent: bdgt2025 ? ((act2025 / bdgt2025) - 1) * 100 : null,
          text: `${bdgt2025 ? ((act2025 / bdgt2025 - 1) * 100).toFixed(1) + "%" : "-"} (${formatNumber(act2025 - bdgt2025)})`,
        },
      });
    }

    const order = [
      "Service Revenue",
      "Cost Of Service",
      "Gross Profit",
      "General & Administration Expense",
      "Other Income (Expenses)",
      "Pajak",
    ];
    summary.sort((a, b) => order.indexOf(a.description) - order.indexOf(b.description));

    setSummaryData(summary);
  }, [filteredData, budgetData, actData2024, masterCode, selectedYear, categories, codeMap]);

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          Summary Dashboard —{" "}
          <span className="text-blue-600">{selectedYear || "Pilih Tahun"}</span>
        </h2>
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
                {row.aVsC === "-" ? (
                  "-"
                ) : (
                  <div
                    className={`flex items-center justify-end gap-1 ${
                      row.aVsC.percent >= 0 ? "text-green-600" : "text-red-600"
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
                      row.bVsC.percent >= 0 ? "text-green-600" : "text-red-600"
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

      {summaryData.length === 0 && (
        <p className="text-center text-gray-500 mt-4">
          Tidak ada data untuk ditampilkan.
        </p>
      )}
    </div>
  );
};

export default DashboardView;
