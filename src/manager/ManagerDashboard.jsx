import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";

// Komponen utama
import Sidebar from "./Sidebar";
import Navbar from "../components/navbar";
import DashboardPage from "./DashboardPage";
import UnitManagement from "./UnitManagement";
import UserManagement from "./UserManagement";
import UnitModal from "./UnitModal";
import UserModal from "./UserModal";

function ManagerDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [unitUploads, setUnitUploads] = useState({});
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("Jan");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [currentData, setCurrentData] = useState([]);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [codes, setCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();

  // Ambil data Units (realtime)
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

  // Ambil data Users (realtime)
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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "masterCode"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCodes(list);
        setLoadingCodes(false);
      },
      (err) => {
        console.error("listen masterCode err:", err);
        setLoadingCodes(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Unit uploads counts per year
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
        } catch (err) {
          console.warn(`can't fetch ${unitName} 2024`, err);
        }
        try {
          const snap2025 = await getDocs(
            collection(db, `unitData/${unitName}/2025/data/items`)
          );
          total2025 = snap2025.size;
        } catch (err) {
          console.warn(`can't fetch ${unitName} 2025`, err);
        }
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

  // Ambil data realtime untuk dashboard
  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;
    const unsub = onSnapshot(
      collection(db, `unitData/${selectedUnit}/${selectedYear}/data/items`),
      (snap) =>
        setCurrentData(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, [selectedUnit, selectedYear]);

  // Realtime chart data for selectedUnit + selectedYear
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

  // Logout
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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar
        activePage={activePage}
        onChangePage={setActivePage}
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

        {activePage === "unit" && (
          <UnitManagement
            units={units}
            users={users}
            unitUploads={unitUploads}
            loadingUnits={loadingUnits}
            loadingUploads={loadingUploads}
            setShowUnitModal={setShowUnitModal}
            setEditingUnit={setEditingUnit}
            fetchUnitUploads={fetchUnitUploads}
            isLoading={isLoading}
          />
        )}

        {activePage === "user" && (
          <UserManagement
            users={users}
            units={units}
            isLoading={isLoading}
            setShowUserModal={setShowUserModal}
            setEditingUser={setEditingUser}
          />
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

export default ManagerDashboard;
