// src/manager/ManagerDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { collection, getDocs, onSnapshot, doc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

// Komponen utama
import Sidebar from "./Sidebar";
import Navbar from "../components/navbar";
import DashboardPage from "./DashboardPage";
import DataTable from "../components/DataTable";
import Header from "../components/Header";
import DashboardView from "../components/DashboardView";
import DashboardMultiUnit from "../components/DashboardMultiUnit";

function ManagerDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarOpen, setsidebarOpen] = useState(true);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [unitUploads, setUnitUploads] = useState({});
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [currentData, setCurrentData] = useState([]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [viewData, setViewData] = useState([]);
  const [masterCode, setMasterCode] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  // CACHED DATA (GLOBAL, TIDAK HILANG KETIKA PAGE PINDAH)
  const cacheCurrentData = useRef({});
  const cacheViewData = useRef({});
  const cacheMasterCode = useRef(null);

  const auth = getAuth();

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

  // 🟢 Ambil data Units (realtime)
  useEffect(() => {
    const fetchUnits = async () => {
      const snap = await getDocs(collection(db, "units"));
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUnits(list);
      setLoadingUnits(false);

      if (list.length > 0 && !selectedUnit) {
        setSelectedUnit(list[0].name);
      }
    };

    fetchUnits();
  }, []);

  // 🟢 Ambil data Users (realtime)
  useEffect(() => {
    const fetchUsers = async () => {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
      setLoadingUsers(false);
    };
    fetchUsers();
  }, []);

  // 🟢 Ambil masterCode
  useEffect(() => {
    const fetchMasterCode = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCodes(list);
        setMasterCode(list);
        setLoadingCodes(false);
      } catch (err) {
        console.error("masterCode error:", err);
      }
    };

    fetchMasterCode();
  }, []);

  // 🟢 Hitung jumlah upload per unit per tahun
  const fetchUnitUploads = async () => {
    setLoadingUploads(true);
    try {
      const unitsSnap = await getDocs(collection(db, "units"));
      const unitNames = unitsSnap.docs.map((d) => d.data().name);
      const counts = {};
      for (const unitName of unitNames) {
        let total2024 = 0;
        let total2025 = 0;
        try {
          const snap2024 = await getDocs(
            collection(db, `unitData/${unitName}/2024/data/items`)
          );
          total2024 = snap2024.size;
        } catch (_) {}
        try {
          const snap2025 = await getDocs(
            collection(db, `unitData/${unitName}/2025/data/items`)
          );
          total2025 = snap2025.size;
        } catch (_) {}
        counts[unitName] = { 2024: total2024, 2025: total2025 };
      }
      setUnitUploads(counts);
    } catch (err) {
      console.error("fetchUnitUploads err:", err);
    } finally {
      setLoadingUploads(false);
    }
  };

  useEffect(() => {
    fetchUnitUploads();
  }, [units]);

  // 🟢 Ambil data untuk DashboardView (2025 default)
  useEffect(() => {
    if (!selectedUnit) return;

    const cacheKey = `${selectedUnit}-view`;

    if (cacheViewData[cacheKey]) {
      setViewData(cacheViewData[cacheKey]);
    }

    const colRef = collection(db, `unitData/${selectedUnit}/2025/data/items`);

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());
      const grouped = {};

      rawData.forEach((item) => {
        const key = `${item.accountCode}-${item.category}-${item.area}-${item.businessLine}-${item.type}`;

        if (!grouped[key]) {
          grouped[key] = {
            accountName: item.accountName,
            accountCode: item.accountCode,
            category: item.category,
            area: item.area,
            businessLine: item.businessLine,
            type: item.type,
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

        const signedValue = parseFloat(item.docValue) || 0;
        grouped[key][item.month] += signedValue;
      });

      const result = Object.values(grouped);

      cacheViewData[cacheKey] = result;

      setViewData(result);
    });

    return () => unsubscribe();
  }, [selectedUnit]);

  // 🟢 Realtime currentData (FIXED, gabungan dari efek duplikat)
  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;

    const cacheKey = `${selectedUnit}-${selectedYear}`;

    // 🟢 Jika data sudah pernah diambil → langsung pakai tanpa nunggu
    if (cacheCurrentData[cacheKey]) {
      setCurrentData(cacheCurrentData[cacheKey]);
    }

    const colRef = collection(
      db,
      `unitData/${selectedUnit}/${selectedYear}/data/items`
    );

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());
      let data = rawData;

      if (masterCode.length > 0) {
        const validCodes = new Set(
          masterCode.map((m) => String(m.code).toLowerCase().trim())
        );

        data = data.filter((item) =>
          validCodes.has(
            String(item.accountCode || "")
              .toLowerCase()
              .trim()
          )
        );
      }

      const grouped = {};

      data.forEach((item) => {
        const key = `${item.accountCode}-${item.category}-${item.area}-${item.businessLine}-${item.type}`;

        if (!grouped[key]) {
          grouped[key] = {
            accountName: item.accountName,
            accountCode: item.accountCode,
            category: item.category,
            area: item.area,
            businessLine: item.businessLine,
            type: item.type,
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

        const signedValue = parseFloat(item.docValue) || 0;
        grouped[key][item.month] += signedValue;
      });

      const finalData = Object.values(grouped);

      // 🟢 CACHE DISINI
      cacheCurrentData[cacheKey] = finalData;

      setCurrentData(finalData);
    });

    return () => unsubscribe();
  }, [selectedUnit, selectedYear, masterCode]);

  // 🟢 Logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (e) {
      alert("Gagal logout: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Simpan halaman terakhir
  useEffect(() => {
    const saved = localStorage.getItem("dashboard");
    if (saved) setActivePage(saved);
  }, []);

  const handlePageChange = (page) => {
    setActivePage(page);
    localStorage.setItem("dashboard", page);
  };

  // 🧱 UI
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar fixed */}
      <div className="fixed inset-y-0 left-0 z-50 h-screen overflow-y-auto bg-red-500">
        <Sidebar
          activePage={activePage}
          onChangePage={handlePageChange}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Backdrop untuk mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div
        className={`flex-1 transition-all duration-300 pl-0 md:pl-64 ${
          isSidebarOpen ? "blur-sm md:blur-none" : ""
        }`}
      >
        {/* Navbar */}
        <div className="sticky top-0 z-50">
          <Navbar
            onLogout={handleLogout}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          />
        </div>

        {/* Content */}
        <div className="pt-4 px-4 sm:px-6 md:px-8">
          {activePage === "dashboard" && (
            <DashboardPage
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              units={units}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              currentData={currentData}
            />
          )}

          {activePage === "TableView" && (
            <DashboardMultiUnit
              selectedYear={selectedYear}
              currentData={currentData}
            />
          )}

          {activePage === "Performance" && (
            <div className="space-y-6">
              <Header
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                units={units.map((u) => u.name)}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                title="View Table"
              />

              <DashboardView
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                title={`Sumarry Dashboard ${selectedUnit || ""}`}
                units={units}
                currentData={currentData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
              />

              <div
                className="bg-white p-2 rounded-xl shadow overflow-x-auto mx-auto"
                style={{ maxWidth: "1000px" }}
              >
                <DataTable
                  data={currentData}
                  columns={columns}
                  title={`Data ${selectedUnit || ""} - ${selectedYear}`}
                  showFilters
                  showPagination
                  rowsPerPage={25}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ManagerDashboard;
