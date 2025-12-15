import React, { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import JoRekapTable from "./JoRekapTable";

const TAX_RATE = 0.11;

// 🔹 helper parsing angka "10.500.612" → 10500612
const parseNumber = (val) => {
  if (!val) return 0;
  return Number(String(val).replace(/\./g, "")) || 0;
};

function JoRekapContainer() {
  const [rekapData, setRekapData] = useState([]);

  useEffect(() => {
    let estimasiList = [];
    let actualMap = {};

    // =========================
    // 🔹 LISTEN ACTUAL
    // =========================
    const unsubActual = onSnapshot(
      collection(db, "joOperasional_actual"),
      (snap) => {
        const map = {};

        snap.docs.forEach((doc) => {
          const d = doc.data();
          const noJO = d.header?.noJobOrder;

          // 🔥 CARI LINE ITEM YANG ADA MT / CBM
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

    // =========================
    // 🔹 LISTEN ESTIMASI
    // =========================
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

    // =========================
    // 🔹 MERGE DATA
    // =========================
    function mergeData() {
      if (!estimasiList.length) return;

      const merged = estimasiList.map((d, idx) => {
        const revenue = d.totals?.totalRevenue || 0;
        const estimasiCost = d.totals?.estimasiCost || 0;

        const actual = actualMap[d.header?.noJobOrder] || {};
        const actualCost = actual.actualCost || 0;

        return {
          no: idx + 1,
          noJoSheet: d.header?.noJobOrder || "-",
          tglMulai: d.header?.tglMulai || "-",
          tglSelesai: d.header?.tglSelesai || "-",
          namaPerusahaan: d.header?.namaCustomer || "-",
          service: d.header?.service || "-",
          uraianPekerjaan: d.header?.uraianPekerjaan || "-",
          vessel: d.header?.namaKapal || "-",
          nomorContainer: "-",
          lokasiPekerjaan: d.header?.tujuan || "-",
          volume: actual.volume || "-", // ✅ FINAL
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

      setRekapData(merged);
    }

    return () => {
      unsubEstimasi();
      unsubActual();
    };
  }, []);

  return <JoRekapTable data={rekapData} />;
}

export default JoRekapContainer;
