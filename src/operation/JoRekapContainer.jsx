import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import JoRekapTable from "./JoRekapTable";

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

          const volumeItem = d.lineItems?.find((item) => item.mt || item.cbm);

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
    // MERGE + FILTER DATA
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
      // FILTER BULAN & TAHUN
      // ===============================
      const filtered = merged.filter((item) => {
        if (!selectedMonth && !selectedYear) return true;

        const parsed = parseDate(item.tglMulai);

        // ✅ JIKA FORMAT TANGGAL TIDAK VALID, JANGAN DIBUANG
        if (!parsed) return true;

        const matchMonth = selectedMonth
          ? parsed.month === Number(selectedMonth)
          : true;

        const matchYear = selectedYear
          ? parsed.year === Number(selectedYear)
          : true;

        return matchMonth && matchYear;
      });

      setRekapData(filtered);
    }

    return () => {
      unsubEstimasi();
      unsubActual();
    };
  }, [selectedMonth, selectedYear]);

  return (
    <div>
      {/* FILTER */}
      <div className="flex gap-3 mb-4">
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
      </div>

      <JoRekapTable data={rekapData} />
    </div>
  );
}

export default JoRekapContainer;
