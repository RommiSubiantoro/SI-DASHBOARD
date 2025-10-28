import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
import Linechart from "../components/Linechart";
import ExporttableChart from "../components/ExporttableChart";
import { collection, getDocs, onSnapshot} from "firebase/firestore";
import { db } from "../firebase";

const DashboardOverview = ({
  selectedUnit,
  setSelectedUnit,
  selectedYear,
  setSelectedYear,
  selectedMonth,
  setSelectedMonth,
  units,
}) => {
  const [currentData, setCurrentData] = useState([]);
 

  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;
    const unsub = onSnapshot(
      collection(db, `unitData/${selectedUnit}/${selectedYear}/data/items`),
      (snap) =>
        setCurrentData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [selectedUnit, selectedYear]);

  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;

    const colRef = collection(
      db,
      `unitData/${selectedUnit}/${selectedYear}/data/items`
    );

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());

      // 🔹 Hanya ambil Debit
      const debitData = rawData.filter((item) => item.type === "Debit");

      // 🔹 Kelompokkan berdasarkan account dan bulan
      const grouped = {};

      debitData.forEach((item) => {
        const key = `${item.accountCode}-${item.category}-${item.area}-${item.businessLine}`;
        if (!grouped[key]) {
          grouped[key] = {
            accountName: item.accountName,
            accountCode: item.accountCode,
            category: item.category,
            area: item.area,
            businessLine: item.businessLine,
            Jan: 0,
            Feb: 0,
            Mar: 0,
            Apr: 0,
            May: 0,
            Jun: 0,
            Jul: 0,
            Aug: 0,
            Sep: 0,
            Oct: 0,
            Nov: 0,
            Dec: 0,
          };
        }
        grouped[key][item.month] += item.docValue;
      });

      setCurrentData(Object.values(grouped)); // untuk DataTable
    });

    return () => unsubscribe();
  }, [selectedUnit, selectedYear]);
  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;

    const colRef = collection(
      db,
      `unitData/${selectedUnit}/${selectedYear}/data/items`
    );

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());

      // 🔹 Hanya ambil Debit
      const debitData = rawData.filter((item) => item.type === "Debit");

      // 🔹 Kelompokkan berdasarkan account dan bulan
      const grouped = {};

      debitData.forEach((item) => {
        const key = `${item.accountCode}-${item.category}-${item.area}-${item.businessLine}`;
        if (!grouped[key]) {
          grouped[key] = {
            accountName: item.accountName,
            accountCode: item.accountCode,
            category: item.category,
            area: item.area,
            businessLine: item.businessLine,
            Jan: 0,
            Feb: 0,
            Mar: 0,
            Apr: 0,
            May: 0,
            Jun: 0,
            Jul: 0,
            Aug: 0,
            Sep: 0,
            Oct: 0,
            Nov: 0,
            Dec: 0,
          };
        }
        grouped[key][item.month] += item.docValue;
      });

      setCurrentData(Object.values(grouped)); // untuk DataTable
    });

    return () => unsubscribe();
  }, [selectedUnit, selectedYear]);

  return (
    <div className="space-y-6 pt-16">
      <Header
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        units={units.map((u) => u.name)}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        title="Supervisor Dashboard"
      />

      <div className="w-full flex flex-col gap-6">
        <ExporttableChart
          currentData={currentData}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        >
          <div className="w-full flex flex-col lg:flex-row gap-6">
            <div className="flex-1 p-2 shadow rounded-lg bg-white">
              <Piechart
                data={currentData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            </div>
            <div className="flex-1 p-2 shadow rounded-lg bg-white">
              <Barchart data={currentData} selectedYear={selectedYear} />
            </div>
          </div>

          <div className="w-full mt-6">
            <div className="p-2 shadow rounded-lg bg-white">
              <Linechart data={currentData} />
            </div>
          </div>
        </ExporttableChart>
      </div>
    </div>
  );
};

export default DashboardOverview;
