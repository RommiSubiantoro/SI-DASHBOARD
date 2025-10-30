import React, { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import { collection, query, where, onSnapshot, getDocs } from "firebase/firestore";

// Import komponen
import Header from "../components/Header";
import ControlButtons from "../components/ControlButtons";
import DataTable from "../components/DataTable";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
import Linechart from "../components/Linechart";
import Navbar from "../components/navbar";
import DashboardView from "../components/DashboardView";

// Custom hook
import { useDataManagement } from "../hooks/useDataManagement";

const UserDashboard = () => {
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [masterCode, setMasterCode] = useState([]);
  const [activeMenu, setActiveMenu] = useState("dashboard"); // 🔹 Menu aktif

  // 🔹 Ambil unit bisnis user berdasarkan auth
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
            if (units.length > 0 && !selectedUnit) setSelectedUnit(units[0]);
          }
        });

        return () => unsubscribeUser();
      }
    });

    return () => unsubscribeAuth();
  }, [selectedUnit]);

  // 🔹 Ambil daftar semua unit
  useEffect(() => {
    const unsubscribeUnits = onSnapshot(collection(db, "units"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUnits(list);
    });
    return () => unsubscribeUnits();
  }, []);

  // 🔹 Ambil masterCode
  useEffect(() => {
    const fetchMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        const data = snap.docs.map((doc) => doc.data());
        setMasterCode(data);
      } catch (error) {
        console.error("❌ Gagal ambil masterCode di UserDashboard:", error);
      }
    };
    fetchMaster();
  }, []);

  // 🔹 Import & Export dari hook custom
  const { exportToExcel, importFromExcelToFirebase } = useDataManagement({});

  // 🔹 Listener realtime Firestore
  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;

    const colRef = collection(
      db,
      `unitData/${selectedUnit}/${selectedYear}/data/items`
    );

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());
      const debitData = rawData.filter((item) => item.type === "Debit");

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

      setCurrentData(Object.values(grouped));
    });

    return () => unsubscribe();
  }, [selectedUnit, selectedYear]);

  // ====== HANDLERS ======
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      alert("Berhasil logout!");
      window.location.href = "/";
    } catch (error) {
      alert("Error logout: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { Header: "Account Name", accessor: "accountName" },
    { Header: "Account Code", accessor: "accountCode" },
    { Header: "Category", accessor: "category" },
    { Header: "Area", accessor: "area" },
    { Header: "Business Line", accessor: "businessLine" },
    { Header: "Jan", accessor: "Jan" },
    { Header: "Feb", accessor: "Feb" },
    { Header: "Mar", accessor: "Mar" },
    { Header: "Apr", accessor: "Apr" },
    { Header: "May", accessor: "May" },
    { Header: "Jun", accessor: "Jun" },
    { Header: "Jul", accessor: "Jul" },
    { Header: "Aug", accessor: "Aug" },
    { Header: "Sep", accessor: "Sep" },
    { Header: "Oct", accessor: "Oct" },
    { Header: "Nov", accessor: "Nov" },
    { Header: "Dec", accessor: "Dec" },
  ];

  const handleExportExcel = () => {
    if (!selectedUnit || !selectedYear) {
      alert("⚠️ Pilih Unit Bisnis dan Tahun terlebih dahulu sebelum export!");
      return;
    }
    exportToExcel(selectedUnit, currentData);
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!selectedUnit || !selectedYear) {
      alert("⚠️ Pilih Unit Bisnis dan Tahun terlebih dahulu sebelum import!");
      return;
    }
    if (file) {
      try {
        setIsLoading(true);
        await importFromExcelToFirebase(selectedUnit, file, selectedYear);
        console.log("🔥 Import selesai, data Firestore akan update otomatis");
        alert("✅ Data berhasil diimport dan chart diperbarui!");
        event.target.value = "";
      } catch (error) {
        console.error("Import failed:", error);
        alert("❌ Gagal import data: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // ====== RENDER ======
  return (
    <div className="grid grid-cols-[16rem_1fr] min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="h-screen bg-red-500 border-r shadow-lg flex flex-col">
        <div className="p-4">
          <h2 className="text-2xl font-bold text-white mb-3 px-12 pt-3">
            User Panel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveMenu("dashboard")}
            className={`w-full text-left px-4 py-2 rounded-lg text-white font-medium text-sm transition-all ${
              activeMenu === "dashboard" ? "bg-red-600" : "hover:bg-red-600"
            }`}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => setActiveMenu("viewTable")}
            className={`w-full text-left px-4 py-2 rounded-lg text-white font-medium text-sm transition-all ${
              activeMenu === "viewTable" ? "bg-red-600" : "hover:bg-red-600"
            }`}
          >
            📑 View Table
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col h-screen overflow-auto">
        <header className="fixed top-0 left-0 w-full z-50">
          <Navbar onLogout={handleLogout} />
        </header>

        <main className="flex-1 p-6 space-y-6 pt-20">
          <Header
            selectedUnit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
            units={assignedUnits}
            title={
              activeMenu === "dashboard" ? "User Dashboard" : "View Table"
            }
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />

          <ControlButtons
            onImportData={handleImportData}
            onExportExcel={handleExportExcel}
            showImportButton
            showExportButtons
          />

          {activeMenu === "dashboard" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Piechart
                  data={currentData}
                  masterCodeData={masterCode}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  selectedYear={selectedYear}
                />
                <Barchart data={currentData} selectedYear={selectedYear} />
                <Linechart data={currentData} />
              </div>
            </>
          )}

          {activeMenu === "viewTable" && (
            <>
              {/* 🔹 DashboardView dipindah ke sini */}
              <DashboardView
                currentData={currentData}
                masterCodeData={masterCode}
                selectedYear={selectedYear}
                selectedUnit={selectedUnit}
              />

              <div className="bg-white p-6 rounded-xl shadow">
                <DataTable
                  data={currentData}
                  columns={columns}
                  title={`Data ${selectedUnit} - ${selectedYear}`}
                  showFilters
                  showPagination
                  rowsPerPage={25}
                />
              </div>
            </>
          )}
        </main>
        
      </div>
    </div>
  );
};

export default UserDashboard;
