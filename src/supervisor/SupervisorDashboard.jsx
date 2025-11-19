// src/manager/ManagerDashboard.jsx
import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, getDocs, onSnapshot, doc } from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

// Komponen utama
import Sidebar from "./Sidebar";
import Navbar from "../components/navbar";
import DashboardPage from "./DashboardPage";
import DataTable from "../components/DataTable";
import UnitModal from "./UnitModal";
import UserModal from "./UserModal";
import Header from "../components/Header";
import DashboardView from "../components/DashboardView";
import DashboardMultiUnit from "../components/DashboardMultiUnit";

function SupervisorDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
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
    const unsubscribe = onSnapshot(collection(db, "units"), (snapshot) => {
      const unitsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUnits(unitsList);
      setLoadingUnits(false);

      if (unitsList.length > 0 && !selectedUnit) {
        setSelectedUnit(unitsList[0].name);
      }
    });
    return () => unsubscribe();
  }, []);

  // 🟢 Ambil data Users (realtime)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setLoadingUsers(false);
    });
    return () => unsubscribe();
  }, []);

  // 🟢 Ambil masterCode
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "masterCode"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCodes(list);
        setMasterCode(list);
        setLoadingCodes(false);
      },
      (err) => {
        console.error("listen masterCode err:", err);
        setLoadingCodes(false);
      }
    );
    return () => unsubscribe();
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

    const colRef = collection(db, `unitData/${selectedUnit}/2025/data/items`);

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());

      // ⛔ Tidak ada filter Debit lagi → Debit + Kredit akan diambil
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
            type: item.type, // ⬅️ Simpan jenis transaksi
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

      setViewData(Object.values(grouped));
    });

    return () => unsubscribe();
  }, [selectedUnit]);

  // 🟢 Realtime currentData (FIXED, gabungan dari efek duplikat)
  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;

    const colRef = collection(
      db,
      `unitData/${selectedUnit}/${selectedYear}/data/items`
    );

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());

      // ⛔ Tidak filter type → Debit + Kredit
      let data = rawData;

      // Jika ada masterCode → filter berdasarkan accountCode
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

      // Grouping
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
            type: item.type, // ⬅️ Penting supaya Debit & Kredit terpisah
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

      setCurrentData(Object.values(grouped));
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
      <Sidebar
        activePage={activePage}
        onChangePage={handlePageChange}
        onLogout={handleLogout}
      />

      <div className="flex-1 ml-64 p-6">
        <div className="fixed top-0 left-0 w-full z-50">
          <Navbar onLogout={handleLogout} />
        </div>

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
          <div style={{ marginTop: "70px" }}>
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
              units={units}
              currentData={currentData}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />

            {/* Wrapper untuk membatasi lebar tabel */}
            <div
              className="bg-white p-2 rounded-xl shadow"
              style={{
                maxWidth: "900px", // batasi lebar maksimum
                margin: "20px auto", // posisikan di tengah
                overflowX: "auto", // biar bisa digeser kalau kolom terlalu banyak
              }}
            >
              <DataTable
                data={currentData}
                columns={columns}
                title={`Data ${selectedUnit} - ${selectedYear}`}
                showFilters
                showPagination
                rowsPerPage={25}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showUnitModal && (
        <UnitModal
          show={showUnitModal}
          setShow={setShowUnitModal}
          editingUnit={editingUnit}
          setEditingUnit={setEditingUnit}
          isLoading={isLoading}
        />
      )}
      {showUserModal && (
        <UserModal
          show={showUserModal}
          setShow={setShowUserModal}
          editingUser={editingUser}
          setEditingUser={setEditingUser}
          units={units}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

export default SupervisorDashboard;
