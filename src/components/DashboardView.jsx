import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const DashboardView = ({ currentData = [], selectedYear, selectedUnit, budgetData: budgetDataProp = [] }) => {
  const [masterCode, setMasterCode] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [selectedBusinessLine, setSelectedBusinessLine] = useState("");
  const [budgetData, setBudgetData] = useState(budgetDataProp); // ✅ pakai state lokal

  // 🔹 Ambil masterCode dari Firestore
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        const data = snap.docs.map((doc) => doc.data());
        setMasterCode(data);
      } catch (error) {
        console.error("❌ Gagal ambil masterCode:", error);
      }
    };
    fetchMaster();
  }, []);

  // 🔹 Ambil data budget dari Firestore + filter berdasarkan masterCode
  useEffect(() => {
    const fetchBudget = async () => {
      if (!selectedUnit || !selectedYear || masterCode.length === 0) return;
      try {
        const colRef = collection(db, `unitData/${selectedUnit}/${selectedYear}/budget/items`);
        const snap = await getDocs(colRef);
        let data = snap.docs.map((doc) => doc.data());

        // ✅ Hanya ambil data yang accountCode-nya terdaftar di masterCode
        const validCodes = new Set(masterCode.map((m) => String(m.code).trim()));
        data = data.filter((item) => {
          const rowCode = String(
            item.accountCode ||
            item.AccountCode ||
            item.account_code ||
            item["ACCOUNT CODE"] ||
            ""
          ).trim();
          return validCodes.has(rowCode);
        });

        console.log("✅ Budget data fetched & filtered:", data);
        setBudgetData(data);
      } catch (error) {
        console.error("❌ Gagal ambil data budget:", error);
      }
    };
    fetchBudget();
  }, [selectedUnit, selectedYear, masterCode]);

  // 🔹 Buat peta kode → kategori dari masterCode
  const codeMap = useMemo(() => {
    const map = new Map();
    masterCode.forEach((m) => {
      if (m.code) map.set(String(m.code).trim(), m);
    });
    return map;
  }, [masterCode]);

  // 🔹 Daftar kategori unik dari masterCode
  const categories = useMemo(
    () => [...new Set(masterCode.map((item) => item.category))],
    [masterCode]
  );

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // 🔹 Filter data actual berdasarkan unit
  const initialFilteredData = useMemo(() => {
    if (!currentData.length || !selectedUnit) return [];

    const normalize = (v) => String(v || "").toLowerCase().trim();

    if (normalize(selectedUnit).includes("samudera agencies indonesia gena")) {
      return currentData.filter(
        (item) => item.businessLine && normalize(item.businessLine).includes("age06")
      );
    }

    if (normalize(selectedUnit).includes("samudera agencies indonesia local")) {
      return currentData.filter(
        (item) => item.businessLine && normalize(item.businessLine).includes("age11")
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

  // 🔹 Ambil daftar business line unik
  const businessLines = useMemo(() => {
    const list = initialFilteredData
      .map((item) => item.businessLine)
      .filter(Boolean);
    return [...new Set(list)];
  }, [initialFilteredData]);

  // 🔹 Filter berdasarkan business line yang dipilih
  const filteredData = useMemo(() => {
    if (!selectedBusinessLine) return initialFilteredData;
    return initialFilteredData.filter(
      (item) =>
        item.businessLine &&
        item.businessLine.toLowerCase() === selectedBusinessLine.toLowerCase()
    );
  }, [initialFilteredData, selectedBusinessLine]);

  // 🔹 Hitung summary ACTUAL dan BUDGET (hanya kode yang ada di masterCode)
  useEffect(() => {
    if (!masterCode.length || (!filteredData.length && !budgetData.length)) {
      setSummaryData([]);
      return;
    }

    const newSummary = categories.map((cat) => {
      // 🔸 ACTUAL
      const totalActual = filteredData
        .filter((item) => {
          const rowCode = String(
            item.accountCode ||
            item.AccountCode ||
            item.account_code ||
            item["ACCOUNT CODE"] ||
            ""
          ).trim();
          const match = codeMap.get(rowCode);
          return match && match.category === cat;
        })
        .reduce((sum, row) => {
          const totalAllMonths = months.reduce(
            (acc, m) => acc + (Number(row[m]) || 0),
            0
          );
          return sum + totalAllMonths;
        }, 0);

      // 🔸 BUDGET
      const totalBudget = budgetData
        .filter((item) => {
          const rowCode = String(
            item.accountCode ||
            item.AccountCode ||
            item.account_code ||
            item["ACCOUNT CODE"] ||
            ""
          ).trim();
          const match = codeMap.get(rowCode);
          return match && match.category === cat;
        })
        .reduce((sum, row) => {
          const totalAllMonths = months.reduce(
            (acc, m) => acc + (Number(row[m]) || 0),
            0
          );
          return sum + totalAllMonths;
        }, 0);

      return {
        description: cat,
        act2024: selectedYear === "2024" ? totalActual.toLocaleString("en-US") : "-",
        bdgt2025: totalBudget ? totalBudget.toLocaleString("en-US") : "-",
        act2025: selectedYear === "2025" ? totalActual.toLocaleString("en-US") : "-",
        aVsC: "-",
        bVsC: "-",
      };
    });

    setSummaryData(newSummary);
  }, [masterCode, filteredData, budgetData, selectedYear, categories, codeMap]);

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-10">
      {/* Header dan Filter */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">
          Summary Dashboard —{" "}
          <span className="text-blue-600">{selectedYear || "Pilih Tahun"}</span>
        </h2>

        {selectedUnit?.toLowerCase().includes("samudera agencies indonesia") && (
          <div className="flex items-center space-x-2">
            <label className="font-semibold">Business Line:</label>
            <select
              value={selectedBusinessLine}
              onChange={(e) => setSelectedBusinessLine(e.target.value)}
              className="border rounded-lg p-2 text-sm"
            >
              <option value="">Semua</option>
              {businessLines.length > 0 ? (
                businessLines.map((line, idx) => (
                  <option key={idx} value={line}>
                    {line}
                  </option>
                ))
              ) : (
                <option disabled>Business Line tidak ditemukan</option>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Tabel Summary */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-red-500 text-left">
            <th className="border p-2 text-white">DESCRIPTION</th>
            <th className="border p-2 text-right text-white">ACT 2024</th>
            <th className="border p-2 text-right text-white">BDGT 2025</th>
            <th className="border p-2 text-right text-white">ACT 2025</th>
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
              <td className="border p-2 text-right">{row.aVsC}</td>
              <td className="border p-2 text-right">{row.bVsC}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {summaryData.length === 0 && (
        <p className="text-center text-gray-500 mt-4">Tidak ada data untuk ditampilkan.</p>
      )}
    </div>
  );
};

export default DashboardView;
