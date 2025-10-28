import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

// Components
import SidebarSupervisor from "./SidebarSupervisor";
import Navbar from "../components/navbar";
import DashboardOverview from "./DashboardOverview";
import UnitManagement from "./UnitManagement";
import UserManagement from "./UserManagement";
import UnitModal from "./UnitModal";
import UserModal from "./UserModal";

// Hook custom
import { useDataManagement } from "../hooks/useDataManagement";

function SupervisorDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Firestore states
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [codes, setCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  // Data dashboard
  const { data } = useDataManagement({
    "Samudera Makassar Logistik": [],
    "Makassar Jaya Samudera": [],
    "Samudera Perdana": [],
    "Masaji Kargosentra Utama": [],
    "Kendari Jaya Samudera": [],
    "Silkargo Indonesia": [],
    "Samudera Agencies Indonesia": [],
    "Samudera Kendari Logistik": [],
  });

  const auth = getAuth();

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

  // 🔹 Listeners ke Firestore (units & users)
  useEffect(() => {
    const unsubUnits = onSnapshot(collection(db, "units"), (snapshot) => {
      setUnits(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingUnits(false);
    });
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoadingUsers(false);
    });
    return () => {
      unsubUnits();
      unsubUsers();
    };
  }, []);

  // 🔹 Logout handler
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      alert("Berhasil logout!");
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Simpan halaman aktif ke localStorage
  useEffect(() => {
    const saved = localStorage.getItem("activePage");
    if (saved) setActivePage(saved);
  }, []);

  const handlePageChange = (page) => {
    setActivePage(page);
    localStorage.setItem("activePage", page);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <SidebarSupervisor
          activePage={activePage}
          handlePageChange={handlePageChange}
          handleLogout={handleLogout}
        />

        {/* Konten Utama */}
        <div className="flex-1 p-6 ml-64">
          <div className="fixed top-0 left-0 w-full z-50">
            <Navbar onLogout={handleLogout} />
          </div>

          {activePage === "dashboard" && (
            <DashboardOverview
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              units={units}
            />
          )}

          {activePage === "unit" && (
            <UnitManagement
              units={units}
              users={users}
              isLoading={isLoading}
              loadingUnits={loadingUnits}
              setShowUnitModal={setShowUnitModal}
            />
          )}

          {activePage === "user" && (
            <UserManagement
              users={users}
              units={units}
              isLoading={isLoading}
              loadingUsers={loadingUsers}
              setShowUserModal={setShowUserModal}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showUnitModal && <UnitModal setShowUnitModal={setShowUnitModal} />}
      {showUserModal && (
        <UserModal setShowUserModal={setShowUserModal} units={units} />
      )}
    </div>
  );
}

export default SupervisorDashboard;
