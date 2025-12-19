import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import JoRekapTable from "./JoRekapTable";
import { Table2 } from "lucide-react";

const TAX_RATE = 0.11;

// ===============================
// HELPER PARSE TANGGAL "17-Nov-2025"
// ===============================
const monthMap = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== "string") return null;

  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;

  const day = Number(parts[0]);
  const month = monthMap[parts[1]];
  const year = Number(parts[2]);

  if (!day || !month || !year) return null;
  return { day, month, year };
};

function JoRekapContainer() {
  const [rekapData, setRekapData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [unitOptions, setUnitOptions] = useState([]);

  // ===============================
  // FUNGSI EXPORT EXCEL
  // ===============================
  const exportToExcel = async () => {
    try {
      const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
      
      const wb = XLSX.utils.book_new();
      const wsData = [];

      // Header - sama seperti di web
      wsData.push([
        'NO.',
        'CODE JO',
        'NO. JO SHEET',
        'TGL MULAI',
        'TGL SELESAI',
        'NAMA PERUSAHAAN',
        'SERVICE',
        'URAIAN PEKERJAAN',
        'VESSEL',
        'NO. CONTAINER',
        'LOKASI',
        'VOLUME',
        'JENIS CARGO',
        'Termin TAX',
        'REVENUE',
        'TAX',
        'TOTAL AFTER TAX',
        'Estimasi Cost',
        'Actual Cost',
        'GPM',
        '% GPM'
      ]);

      // Data rows
      rekapData.forEach(row => {
        wsData.push([
          row.no,
          row.CodeJo,
          row.noJoSheet,
          row.tglMulai,
          row.tglSelesai,
          row.namaPerusahaan,
          row.service,
          row.uraianPekerjaan,
          row.vessel,
          row.nomorContainer,
          row.lokasiPekerjaan,
          row.volume,
          row.jenisCargo,
          row.terminTax,
          typeof row.revenue === 'number' ? row.revenue.toFixed(2) : row.revenue,
          typeof row.tax === 'number' ? row.tax.toFixed(2) : row.tax,
          typeof row.totalRevenueAfterTax === 'number' ? row.totalRevenueAfterTax.toFixed(2) : row.totalRevenueAfterTax,
          typeof row.estimasiCost === 'number' ? row.estimasiCost.toFixed(2) : row.estimasiCost,
          typeof row.actualCost === 'number' ? row.actualCost.toFixed(2) : row.actualCost,
          typeof row.gpm === 'number' ? row.gpm.toFixed(2) : row.gpm,
          row.persentaseGpm + '%'
        ]);
      });

      // TOTAL row
      const totalRevenue = rekapData.reduce((sum, r) => sum + (r.revenue || 0), 0);
      const totalTax = rekapData.reduce((sum, r) => sum + (r.tax || 0), 0);
      const totalRevenueAfterTax = rekapData.reduce((sum, r) => sum + (r.totalRevenueAfterTax || 0), 0);
      const totalEstimasiCost = rekapData.reduce((sum, r) => sum + (r.estimasiCost || 0), 0);
      const totalActualCost = rekapData.reduce((sum, r) => sum + (r.actualCost || 0), 0);
      const totalGpm = rekapData.reduce((sum, r) => sum + (r.gpm || 0), 0);
      const avgGpmPercent = totalRevenue > 0 ? ((totalGpm / totalRevenue) * 100).toFixed(2) : '0.00';

      wsData.push([
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'TOTAL',
        totalRevenue.toFixed(2),
        totalTax.toFixed(2),
        totalRevenueAfterTax.toFixed(2),
        totalEstimasiCost.toFixed(2),
        totalActualCost.toFixed(2),
        totalGpm.toFixed(2),
        avgGpmPercent + '%'
      ]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // NO.
        { wch: 12 },  // CODE JO
        { wch: 15 },  // NO. JO SHEET
        { wch: 12 },  // TGL MULAI
        { wch: 12 },  // TGL SELESAI
        { wch: 30 },  // NAMA PERUSAHAAN
        { wch: 20 },  // SERVICE
        { wch: 35 },  // URAIAN PEKERJAAN
        { wch: 20 },  // VESSEL
        { wch: 15 },  // NO. CONTAINER
        { wch: 25 },  // LOKASI
        { wch: 12 },  // VOLUME
        { wch: 20 },  // JENIS CARGO
        { wch: 12 },  // Termin TAX
        { wch: 15 },  // REVENUE
        { wch: 15 },  // TAX
        { wch: 18 },  // TOTAL AFTER TAX
        { wch: 15 },  // Estimasi Cost
        { wch: 15 },  // Actual Cost
        { wch: 15 },  // GPM
        { wch: 12 }   // % GPM
      ];
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Rekap JO');

      // Generate filename
      let filename = 'Rekap_JO';
      if (selectedMonth) {
        const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        filename += `_${monthNames[Number(selectedMonth)]}`;
      }
      if (selectedYear) filename += `_${selectedYear}`;
      if (selectedUnit) filename += `_${selectedUnit.replace(/\s+/g, '_').substring(0, 20)}`;
      filename += '.xlsx';

      // Generate Excel file and download
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('❌ Gagal export ke Excel: ' + error.message);
    }
  };

  useEffect(() => {
    let estimasiList = [];
    let actualMap = {};

    // ===============================
    // LISTEN ACTUAL
    // ===============================
    const unsubActual = onSnapshot(
      collection(db, "joOperasional_actual"),
      (snap) => {
        const map = {};

        snap.docs.forEach((doc) => {
          const d = doc.data();
          const noJO = d.header?.noJobOrder;

          const volumeItem = d.lineItems?.find(
            (item) => item.mt || item.cbm
          );

          if (noJO) {
            map[noJO] = {
              actualCost: d.totals?.actualCost || 0,
              volume: volumeItem
                ? `${volumeItem.mt || ""}${volumeItem.cbm || ""}`
                : "-",
            };
          }
        });

        actualMap = map;
        mergeData();
      }
    );

    // ===============================
    // LISTEN ESTIMASI
    // ===============================
    const unsubEstimasi = onSnapshot(
      collection(db, "joOperasional_estimasi"),
      (snap) => {
        estimasiList = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        mergeData();
      }
    );

    // ===============================
    // MERGE + FILTER
    // ===============================
    function mergeData() {
      if (!estimasiList.length) return;

      const merged = estimasiList.map((d, idx) => {
        const revenue = d.totals?.totalRevenue || 0;
        const estimasiCost = d.totals?.estimasiCost || 0;

        const actual = actualMap[d.header?.noJobOrder] || {};
        const actualCost = actual.actualCost || 0;

        return {
          no: idx + 1,
          CodeJo: d.header?.CodeJo || "-",
          noJoSheet: d.header?.noJobOrder || "-",
          tglMulai: d.header?.tglMulai || "-",
          tglSelesai: d.header?.tglSelesai || "-",
          namaPerusahaan: d.header?.namaCustomer || "-",

          unitBisnis: d.header?.unitBisnis || "-",

          service: d.header?.service || "-",
          uraianPekerjaan: d.header?.uraianPekerjaan || "-",
          vessel: d.header?.namaKapal || "-",
          nomorContainer: "-",
          lokasiPekerjaan: d.header?.tujuan || "-",
          volume: actual.volume || "-",
          jenisCargo: d.header?.commodity || "-",
          terminTax: d.header?.terminTax || "-",
          revenue,
          tax: revenue * TAX_RATE,
          totalRevenueAfterTax: revenue - revenue * TAX_RATE,
          estimasiCost,
          actualCost,
          gpm: revenue - actualCost,
          persentaseGpm:
            revenue > 0
              ? (((revenue - actualCost) / revenue) * 100).toFixed(2)
              : 0,
        };
      });

      // ===============================
      // AMBIL LIST UNIT BISNIS UNIK
      // ===============================
      const units = [
        ...new Set(
          merged
            .map((i) => i.unitBisnis)
            .filter((u) => u && u !== "-")
        ),
      ];
      setUnitOptions(units);

      // ===============================
      // FILTER BULAN, TAHUN, UNIT
      // ===============================
      const filtered = merged.filter((item) => {
        // BULAN & TAHUN
        let matchDate = true;
        const parsed = parseDate(item.tglMulai);

        if (parsed) {
          const matchMonth = selectedMonth
            ? parsed.month === Number(selectedMonth)
            : true;
          const matchYear = selectedYear
            ? parsed.year === Number(selectedYear)
            : true;

          matchDate = matchMonth && matchYear;
        }

        // UNIT BISNIS
        const matchUnit = selectedUnit
          ? item.unitBisnis === selectedUnit
          : true;

        return matchDate && matchUnit;
      });

      setRekapData(filtered);
    }

    return () => {
      unsubActual();
      unsubEstimasi();
    };
  }, [selectedMonth, selectedYear, selectedUnit]);

  return (
    <div>
      {/* ===============================
          FILTER DROPDOWN
      =============================== */}
      <div className="flex gap-3 mb-4">
        {/* BULAN */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Semua Bulan</option>
          <option value="1">Januari</option>
          <option value="2">Februari</option>
          <option value="3">Maret</option>
          <option value="4">April</option>
          <option value="5">Mei</option>
          <option value="6">Juni</option>
          <option value="7">Juli</option>
          <option value="8">Agustus</option>
          <option value="9">September</option>
          <option value="10">Oktober</option>
          <option value="11">November</option>
          <option value="12">Desember</option>
        </select>

        {/* TAHUN */}
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Semua Tahun</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>

        {/* UNIT BISNIS */}
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="border px-2 py-1 rounded min-w-[200px]"
        >
          <option value="">Semua Unit Bisnis</option>
          {unitOptions.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>

        {/* TOMBOL EXPORT */}
        <button
          onClick={exportToExcel}
          className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Table2 size={16} /> Export Excel
        </button>
      </div>

      <JoRekapTable data={rekapData} />
    </div>
  );
}

export default JoRekapContainer;