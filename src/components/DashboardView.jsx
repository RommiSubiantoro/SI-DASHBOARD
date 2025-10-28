import React, { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const DashboardView = ({ currentData = [], selectedYear }) => {
  const [masterCode, setMasterCode] = useState([]);
  const [summaryData, setSummaryData] = useState([]);

  // 🔹 Ambil masterCode
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

  // 🔹 Lookup map
  const codeMap = useMemo(() => {
    const map = new Map();
    masterCode.forEach((m) => map.set(String(m.code).trim(), m));
    return map;
  }, [masterCode]);

  // 🔹 Kategori unik
  const categories = useMemo(
    () => [...new Set(masterCode.map((item) => item.category))],
    [masterCode]
  );

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // 🔹 Hitung summary
  useEffect(() => {
    if (!masterCode.length || !currentData.length) return;

    const newSummary = categories.map((cat) => {
      // Hitung total berdasarkan kategori
      const total = currentData
        .filter((item) => {
          const rowCodeValue =
            item.accountCode || item.AccountCode || item.account_code || "";
          const rowAccountCode = String(rowCodeValue).trim();
          const match = codeMap.get(rowAccountCode);
          return match && match.category === cat;
        })
        .reduce((sum, row) => {
          const totalAllMonths = months.reduce(
            (acc, month) => acc + (Number(row[month]) || 0),
            0
          );
          return sum + totalAllMonths;
        }, 0);

      // Ambil data sebelumnya (agar data lain tetap tersimpan)
      const prev = summaryData.find((s) => s.description === cat);

      // Pastikan semuanya angka
      const prevAct2024 = Number((prev?.act2024 || "").toString().replace(/,/g, "")) || 0;
      const prevAct2025 = Number((prev?.act2025 || "").toString().replace(/,/g, "")) || 0;
      const prevBdgt2025 = Number((prev?.bdgt2025 || "").toString().replace(/,/g, "")) || 0;

      let act2024 = prevAct2024;
      let act2025 = prevAct2025;
      let bdgt2025 = prevBdgt2025;

      // Simpan ke tahun yang sedang aktif
      if (selectedYear === "2024") act2024 = total;
      if (selectedYear === "2025") act2025 = total;

      // 🔹 Hitung perbandingan (pastikan angka valid)
      const aVsC =
        act2024 > 0 && act2025 > 0
          ? (((act2025 - act2024) / act2024) * 100).toFixed(2) + "%"
          : "-";

      const bVsC =
        bdgt2025 > 0 && act2025 > 0
          ? (((act2025 - bdgt2025) / bdgt2025) * 100).toFixed(2) + "%"
          : "-";

      return {
        description: cat,
        act2024: act2024 ? act2024.toLocaleString("en-US") : "-",
        bdgt2025: bdgt2025 ? bdgt2025.toLocaleString("en-US") : "-",
        act2025: act2025 ? act2025.toLocaleString("en-US") : "-",
        aVsC,
        bVsC,
      };
    });

    setSummaryData(newSummary);
  }, [masterCode, currentData, selectedYear]);

  return (
    <div className="bg-white p-6 rounded-xl shadow mt-10">
      <h2 className="text-lg font-bold mb-4">
        Summary Dashboard —{" "}
        <span className="text-blue-600">{selectedYear || "Pilih Tahun"}</span>
      </h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">DESCRIPTION</th>
            <th className="border p-2 text-right">ACT 2024</th>
            <th className="border p-2 text-right">BDGT 2025</th>
            <th className="border p-2 text-right">ACT 2025</th>
            <th className="border p-2 text-right">A VS C</th>
            <th className="border p-2 text-right">B VS C</th>
          </tr>
        </thead>
        <tbody>
          {summaryData.map((row, idx) => (
            <tr
              key={idx}
              className={`hover:bg-gray-50 ${
                selectedYear === "2024" && row.act2024 !== "-"
                  ? "bg-blue-50"
                  : selectedYear === "2025" && row.act2025 !== "-"
                  ? "bg-green-50"
                  : ""
              }`}
            >
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
    </div>
  );
};

export default DashboardView;
