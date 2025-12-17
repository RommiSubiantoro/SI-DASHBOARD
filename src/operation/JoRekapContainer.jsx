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
  const [selectedUnit, setSelectedUnit] = useState("");
  const [unitOptions, setUnitOptions] = useState([]);

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
      </div>

      <JoRekapTable data={rekapData} />
    </div>
  );
}

export default JoRekapContainer;
