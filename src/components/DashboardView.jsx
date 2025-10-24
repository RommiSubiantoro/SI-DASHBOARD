import React, { useEffect, useState, useMemo } from "react"; // 1. Tambahkan useMemo
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const DashboardView = ({ currentData = [], selectedYear }) => {
  const [masterCode, setMasterCode] = useState([]);

  // 🔹 Ambil masterCode (Ini sudah benar ✅)
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

  // 🔥 2. BUAT LOOKUP MAP (KAMUS)
  // Ini untuk mencari (lookup) kategori berdasarkan accountCode
  const codeMap = useMemo(() => {
    const map = new Map();
    masterCode.forEach((m) => {
      // 'm.code' adalah kuncinya (e.g., "00201")
      // 'm' adalah nilainya (e.g., {code: "00201", category: "Service Revenue", ...})
      map.set(String(m.code).trim(), m);
    });
    return map;
  }, [masterCode]); // Dibuat ulang hanya jika masterCode berubah

  // 🔹 Ambil kategori unik (DESCRIPTION) - Ini sudah benar ✅
  const categories = [
    ...new Set(masterCode.map((item) => item.category)),
  ];

  // Daftar bulan untuk dijumlahkan
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  // 🔥 3. PERBAIKI LOGIKA 'summary'
  const summary = categories.map((cat) => {
    // 'cat' adalah nama kategori, e.g., "Service Revenue"

    // Filter 'currentData' dengan cara yang BENAR
    const total = currentData
      .filter((item) => {
        // A. Ambil accountCode dari data Excel/unitData
        // (Tambahkan jaring pengaman untuk ejaan)
        const rowCodeValue = item.accountCode || item.AccountCode || item.account_code || "";
        const rowAccountCode = String(rowCodeValue).trim();

        // B. Cari kodenya di 'codeMap'
        const match = codeMap.get(rowAccountCode);

        // C. Jika ditemukan, cek apakah kategorinya = 'cat'
        return match && match.category === cat;
      })
      .reduce((sum, row) => {
        // Total ALL bulan Jan–Dec (Logika ini sudah benar ✅)
        const totalAllMonths = months.reduce(
          (acc, month) => acc + (Number(row[month]) || 0), 0
        );
        return sum + totalAllMonths;
      }, 0);

    return {
      description: cat,
      act2024: "-",
      bdgt2025: "-",
      act2025: total.toLocaleString("en-US") || "-", // 'en-US' untuk format koma
      aVsC: "-",
      bVsC: "-",
    };
  });

  // ... Sisa JSX Anda (return, table, dll) sudah benar ...
  return (
    <div className="bg-white p-6 rounded-xl shadow mt-10">
      <h2 className="text-lg font-bold mb-4">Summary Dashboard</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">DESCRIPTION</th>
            <th className="border p-2">ACT 2024</th>
            <th className="border p-2">BDGT 2025</th>
            <th className="border p-2">ACT 2025</th>
            <th className="border p-2">A VS C</th>
            <th className="border p-2">B VS C</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row, idx) => (
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
    </div>
  );
};

export default DashboardView;