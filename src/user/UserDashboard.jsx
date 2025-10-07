import React, { useState, useEffect, useMemo } from "react";
import { signOut, getAuth, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

// Import komponen yang sudah dipecah
import Header from "../components/Header";
import ControlButtons from "../components/ControlButtons";
import StatsCards from "../components/StatsCards";
import DataTable from "../components/DataTable";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
import Linechart from "../components/Linechart";
import Navbar from "../components/navbar";

// Import custom hooks yang sudah diupdate dengan Firebase
import { useDataManagement } from "../hooks/useDataManagement";

const UserDashboard = () => {
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [isLoading, setIsLoading] = useState(false);
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(false);

  useEffect(() => {
    if (!selectedUnit) return;

    // 🔥 Dengarkan data realtime per unit
    const q = query(collection(db, "data"), where("unit", "==", selectedUnit));

    const unsubscribeData = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Asumsikan kamu ingin update ke state `data` milik useDataManagement
      // Pastikan kamu punya setData dari hook tersebut
      setData((prev) => ({
        ...prev,
        [selectedUnit]: docs,
      }));

      console.log("Realtime update:", docs);
    });

    return () => unsubscribeData();
  }, [selectedUnit]);

  // 🔹 Fetch semua unit bisnis
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));

        const unsubscribeUser = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userData = snapshot.docs[0].data();

            const units = Array.isArray(userData.unitBisnis)
              ? userData.unitBisnis
              : [];

            setAssignedUnits(units);

            // kalau belum ada selectedUnit, pilih default
            if (units.length > 0 && !selectedUnit) setSelectedUnit(units[0]);
          } else {
            console.warn("Tidak ditemukan user dengan UID:", user.uid);
          }
        });

        return () => unsubscribeUser();
      } else {
        console.warn("User belum login");
      }
    });

    return () => unsubscribeAuth();
  }, [auth, selectedUnit]);

  const initialDataMap = useMemo(() => {
    return assignedUnits.reduce((acc, unit) => {
      acc[unit] = [];
      return acc;
    }, {});
  }, [assignedUnits]);

  useEffect(() => {
    const unsubscribeUnits = onSnapshot(
      collection(db, "units"),
      (snapshot) => {
        const unitsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUnits(unitsList);
        setLoadingUnits(false);
      },
      (error) => {
        console.error("Error listening to units:", error);
        setLoadingUnits(false);
      }
    );
    return () => unsubscribeUnits();
  }, []);

  // Menggunakan Firebase-enabled custom hooks
  const {
    data,
    isLoading: dataLoading,
    calculateStats,
    addDataToFirebase,
    exportToExcel,
    importFromExcelToFirebase,
    getPieChartData,
  } = useDataManagement(initialDataMap);

  // 🔹 Pastikan currentData aman
  const currentData = selectedUnit ? data[selectedUnit] || [] : [];
  const stats = calculateStats(currentData);
  // Pie chart data
  const pieData = getPieChartData(currentData, selectedMonth);

  // Handler functions
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      alert("Berhasil logout!");
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Error during logout: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddData = () => {
    setShowAddModal(true);
  };

  const handleSubmitData = async () => {
    const result = await addDataToFirebase(selectedUnit, newRecord);
    if (result.success) {
      resetForm();
      setShowAddModal(false);
      console.log("Data added successfully:", result.message);
    } else {
      console.error("Failed to add data:", result.message);
    }
  };

  const handleExportExcel = () => {
    if (!selectedUnit) {
      alert("⚠️ Pilih Unit Bisnis dulu sebelum export!");
      return;
    }
    exportToExcel(selectedUnit, currentData);
  };

  const handleExportPDF = () => {
    if (!selectedUnit) {
      alert("⚠️ Silakan pilih Unit Bisnis terlebih dahulu sebelum export PDF!");
      return;
    }
    alert(`Exporting ${selectedUnit} data to PDF...`);
  };
  const [importFile, setImportFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUnit, setImportUnit] = useState("");
  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!selectedUnit) {
      alert("⚠️ Pilih Unit Bisnis dulu sebelum import!");
      return;
    }
    if (file) {
      try {
        await importFromExcelToFirebase(selectedUnit, file);
        alert("✅ Data berhasil diimport!");
        event.target.value = ""; // reset input file
      } catch (error) {
        console.error("Import failed:", error);
        alert("❌ Gagal import data: " + error.message);
      }
    }
  };

  // useEffect(() => {
  //   const savedPage = localStorage.getItem("activePage");
  //   if (savedPage) {
  //     setActivePage(savedPage); // kalau ada, pakai halaman terakhir
  //   } else {
  //     setActivePage("dashboard"); // kalau belum pernah, default ke dashboard
  //   }
  // }, []);

  // // Simpan ke localStorage setiap kali ganti halaman
  // const handlePageChange = (page) => {
  //   setActivePage(page);
  //   localStorage.setItem("activePage", page);
  // };

  return (
    <div className="grid grid-cols-[16rem_1fr] min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="h-screen bg-red-500 border-r shadow-lg flex flex-col">
        <div className="p-4 ">
          <h2 className="text-2xl font-bold text-white mb-3 px-12 pt-3">
            User Panel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button className="w-full text-left px-4 py-2 rounded-lg text-white font-medium text-sm hover:bg-red-600 transition-all">
            📊 Dashboard
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col h-screen overflow-auto">
        {/* Navbar */}
        <header className="fixed top-0 left-0 w-full z-50 ">
          <Navbar onLogout={handleLogout} />
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-6 pt-20">
          <Header
            selectedUnit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
            units={assignedUnits}
            title="User Dashboard"
          />

          <ControlButtons
            onAddData={handleAddData}
            onImportData={handleImportData}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            showAddButton
            showImportButton
            showExportButtons
          />

          <StatsCards
            totalRevenue={stats.totalRevenue}
            totalExpenses={stats.totalExpenses}
            totalAct2025={stats.totalAct2025}
            avgTarget={stats.avgTarget}
            labels={{
              revenue: "Total ACT 2024",
              expenses: "Total BDGT 2025",
              act2025: "Total ACT 2025",
              avgTarget: "Avg Target",
            }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Piechart
              data={currentData}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
            <Barchart data={currentData} selectedYear={selectedYear} />
            <Linechart data={currentData} />
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <DataTable
              data={currentData}
              title="Data Table"
              showFilters
              showPagination
              rowsPerPage={25}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
