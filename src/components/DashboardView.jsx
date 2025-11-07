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

  // 🔹 Ambil masterCode
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

  // 🔹 Ambil data budget
  useEffect(() => {
    const fetchBudget = async () => {
      if (!selectedUnit || !selectedYear || masterCode.length === 0) return;

      try {
        const colRef = collection(
          db,
          `unitData/${selectedUnit}/${selectedYear}/budget/items`
        );
        const snap = await getDocs(colRef);
        let data = snap.docs.map((doc) => doc.data());

        const validCodes = new Set(
          masterCode.map((m) => String(m.code).toLowerCase().trim())
        );

        data = data.filter((item) => {
          const rowCode = String(
            item.accountCode ||
              item.AccountCode ||
              item.account_code ||
              item["ACCOUNT CODE"] ||
              ""
          )
            .toLowerCase()
            .trim();
          return validCodes.has(rowCode);
        });

        const months = [
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

        const grouped = {};
        data.forEach((item) => {
          const code = String(
            item.accountCode ||
              item.AccountCode ||
              item.account_code ||
              item["ACCOUNT CODE"] ||
              ""
          ).trim();

          if (!grouped[code])
            grouped[code] = { accountCode: code, totalBudget: 0 };

          const total = months.reduce(
            (sum, m) => sum + (Number(item[m]) || 0),
            0
          );
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

  // 🔹 Filter data actual
  const filteredData = useMemo(() => {
    if (!currentData.length || !selectedUnit) return [];
    const normalize = (v) =>
      String(v || "")
        .toLowerCase()
        .trim();

    if (normalize(selectedUnit).includes("samudera agencies indonesia gena")) {
      return currentData.filter(
        (item) =>
          item.businessLine && normalize(item.businessLine).includes("age06")
      );
    }
    if (normalize(selectedUnit).includes("samudera agencies indonesia local")) {
      return currentData.filter(
        (item) =>
          item.businessLine && normalize(item.businessLine).includes("age11")
      );
    }
    if (normalize(selectedUnit).includes("samudera agencies indonesia")) {
      return currentData.filter(
        (item) =>
          item.businessLine &&
          !normalize(item.businessLine).includes("age06") &&
          !normalize(item.businessLine).includes("age11")
      );
    }
    return currentData;
  }, [currentData, selectedUnit]);

  // 🔹 Simpan actual 2024
  useEffect(() => {
    if (selectedYear === "2024" && filteredData.length > 0) {
      setActData2024(filteredData);
    }
  }, [filteredData, selectedYear]);

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

  const months = [
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

  // 🔹 Hitung summary
  useEffect(() => {
    if (!masterCode.length) {
      setSummaryData([]);
      return;
    }

    const budgetForYear = budgetData[selectedYear] || [];

    let newSummary = categories.map((cat) => {
      const totalAct2024 = actData2024
        .filter((item) => {
          const rowCode = String(
            item.accountCode || item.AccountCode || item.account_code || ""
          ).trim();
          const match = codeMap.get(rowCode);
          return match && match.category === cat;
        })
        .reduce(
          (sum, row) =>
            sum + months.reduce((acc, m) => acc + (Number(row[m]) || 0), 0),
          0
        );

      const totalActThisYear = filteredData
        .filter((item) => {
          const rowCode = String(
            item.accountCode || item.AccountCode || item.account_code || ""
          ).trim();
          const match = codeMap.get(rowCode);
          return match && match.category === cat;
        })
        .reduce(
          (sum, row) =>
            sum + months.reduce((acc, m) => acc + (Number(row[m]) || 0), 0),
          0
        );

      const totalBudget = budgetForYear
        .filter((item) => {
          const rowCode = String(item.accountCode || "").trim();
          const match = codeMap.get(rowCode);
          return match && match.category === cat;
        })
        .reduce((sum, row) => sum + (Number(row.totalBudget) || 0), 0);

      const aVsCValue = totalActThisYear - totalAct2024;
      const aVsCPercent =
        totalAct2024 !== 0 ? (totalActThisYear / totalAct2024 - 1) * 100 : null;

      const bVsCValue = totalActThisYear - totalBudget;
      const bVsCPercent =
        totalBudget !== 0 ? (totalActThisYear / totalBudget - 1) * 100 : null;

      return {
        description: cat,
        act2024: totalAct2024 ? totalAct2024.toLocaleString("en-US") : "-",
        bdgt2025: totalBudget ? totalBudget.toLocaleString("en-US") : "-",
        act2025: totalActThisYear
          ? totalActThisYear.toLocaleString("en-US")
          : "-",
        aVsC:
          aVsCPercent === null
            ? "-"
            : {
                value: aVsCValue,
                percent: aVsCPercent,
                text: `${aVsCPercent >= 0 ? "+" : ""}${aVsCPercent.toFixed(
                  1
                )}% (${aVsCValue.toLocaleString("en-US")})`,
              },
        bVsC:
          bVsCPercent === null
            ? "-"
            : {
                value: bVsCValue,
                percent: bVsCPercent,
                text: `${bVsCPercent >= 0 ? "+" : ""}${bVsCPercent.toFixed(
                  1
                )}% (${bVsCValue.toLocaleString("en-US")})`,
              },
      };
    });

    // 🔹 Tambahkan Gross Profit manual = Service Revenue - Cost Of Service
    const serviceRevRow = newSummary.find(
      (r) => r.description === "Service Revenue"
    );
    const costServiceRow = newSummary.find(
      (r) => r.description === "Cost Of Service"
    );

    if (serviceRevRow && costServiceRow) {
      const grossAct2024 =
        Number(serviceRevRow.act2024.replace(/,/g, "")) -
        Number(costServiceRow.act2024.replace(/,/g, ""));
      const grossAct2025 =
        Number(serviceRevRow.act2025.replace(/,/g, "")) -
        Number(costServiceRow.act2025.replace(/,/g, ""));
      const grossBdgt =
        Number(serviceRevRow.bdgt2025.replace(/,/g, "")) -
        Number(costServiceRow.bdgt2025.replace(/,/g, ""));

      newSummary.push({
        description: "Gross Profit",
        act2024: grossAct2024.toLocaleString("en-US"),
        bdgt2025: grossBdgt.toLocaleString("en-US"),
        act2025: grossAct2025.toLocaleString("en-US"),
        aVsC: {
          value: grossAct2025 - grossAct2024,
          percent:
            grossAct2024 !== 0 ? (grossAct2025 / grossAct2024 - 1) * 100 : null,
          text: `${
            grossAct2024 !== 0
              ? ((grossAct2025 / grossAct2024 - 1) * 100 >= 0 ? "+" : "") +
                ((grossAct2025 / grossAct2024 - 1) * 100).toFixed(1) +
                "%"
              : "-"
          } (${(grossAct2025 - grossAct2024).toLocaleString("en-US")})`,
        },
        bVsC: {
          value: grossAct2025 - grossBdgt,
          percent:
            grossBdgt !== 0 ? (grossAct2025 / grossBdgt - 1) * 100 : null,
          text: `${
            grossBdgt !== 0
              ? ((grossAct2025 / grossBdgt - 1) * 100 >= 0 ? "+" : "") +
                ((grossAct2025 / grossBdgt - 1) * 100).toFixed(1) +
                "%"
              : "-"
          } (${(grossAct2025 - grossBdgt).toLocaleString("en-US")})`,
        },
      });
    }

    // 🔹 Tambah urutan manual (tanpa ubah data)
    const order = [
      "Service Revenue",
      "Cost Of Service",
      "Gross Profit",
      "General & Administration Expense",
      "Other Income (Expenses)",
    ];
    newSummary.sort((a, b) => {
      const idxA = order.indexOf(a.description);
      const idxB = order.indexOf(b.description);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    setSummaryData(newSummary);
  }, [
    filteredData,
    budgetData,
    actData2024,
    masterCode,
    selectedYear,
    categories,
    codeMap,
    months,
  ]);

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-10">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          Summary Dashboard —{" "}
          <span className="text-blue-600">{selectedYear || "Pilih Tahun"}</span>
        </h2>
      </div>

      <table className="w-full border-collapse">
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
          {summaryData.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="border p-2">{row.description}</td>
              <td className="border p-2 text-right">{row.act2024}</td>
              <td className="border p-2 text-right">{row.bdgt2025}</td>
              <td className="border p-2 text-right font-bold">{row.act2025}</td>

              {/* A VS C */}
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

              {/* B VS C */}
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
