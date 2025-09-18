import React, { useState } from "react";
import UserDashboard from "../user/UserDashboard";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import "../css/ManagerDash.css";
import Navbar from "../components/navbar";
import Header from "../components/Header";
import StatsCards from "../components/StatsCards";
import Piechart from "../components/Piechart";
import { useDataManagement } from "../hooks/useDataManagement";

function ManagerDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("SML");
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [selectedYear, setSelectedYear] = useState("2025");

  const {
    data,
    isLoading: dataLoading,
    calculateStats,
    exportToExcel,
    importFromExcelToFirebase,
  } = useDataManagement({
    "Samudera Makassar Logistik": [],
    "Makassar Jaya Samudera": [],
    "Samudera Perdana": [],
    "Masaji Kargosentra Utama": [],
    "Kendari Jaya Samudera": [],
    "Silkargo Indonesia": [],
    "Samudera Agencies Indoensia": [],
    "Samudera Kendari Logistik": []
  });

  // Daftar unit bisnis
  const dashboardUnits = ["Samudera Makassar Logistik ", "Makassar Jaya Samudera", "Samudera Perdana", "Masaji Kargosentra Utama", "Kendari Jaya Samudera",
    "Silkargo Indonesia", "Samudera Agencies Indonesia", "Samudera Kendari Logistik"];

  // Data untuk unit terpilih
  const currentData = data[selectedUnit] || [];
  const stats = calculateStats(currentData);

  // Data agregat semua unit
  const allUnitsStats = calculateStats(Object.values(data).flat());

  // Fungsi logout
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

  return (
    <div className="Container">
      {/* Navbar */}
      <Navbar onLogout={handleLogout} />

      {/* Sidebar */}
      <div className="Sidebar">
        <h2 className="text">Manager Panel</h2>
        <button
          className="home-unit"
          onClick={() => setActivePage("dashboard")}
        >
          Home
        </button>
        <button className="button-unit" onClick={() => setActivePage("unit")}>
          Show Unit Bisnis
        </button>
        <button
          className="Btn-manager"
          onClick={() => setActivePage("user")}
        >
          Manage User
        </button>
      </div>

      {/* Konten utama */}
      <div className="kontendash">
        {activePage === "dashboard" && (
          <div className="dashboard-content">
            {/* Header */}
            <Header
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              units={dashboardUnits}
              title="Manager Dashboard"
            />

            {/* Loading indicator */}
            {dataLoading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading real-time data...</p>
              </div>
            )}

            {/* Stats overview semua unit */}
            <div className="admin-overview">
              <h3>Overview Semua Unit</h3>
              <StatsCards
                totalRevenue={allUnitsStats.totalRevenue}
                totalExpenses={allUnitsStats.totalExpenses}
                totalAct2025={allUnitsStats.totalAct2025}
                avgTarget={allUnitsStats.avgTarget}
                labels={{
                  revenue: "Total Revenue (All Units)",
                  expenses: "Total Budget (All Units)",
                  act2025: "Total Actual 2025 (All Units)",
                  avgTarget: "Average Target (All Units)",
                }}
              />
            </div>

            {/* Stats untuk unit terpilih */}
            <div className="unit-specific-stats">
              <h3>Detail Unit: {selectedUnit}</h3>
              <StatsCards
                totalRevenue={stats.totalRevenue}
                totalExpenses={stats.totalExpenses}
                totalAct2025={stats.totalAct2025}
                avgTarget={stats.avgTarget}
                labels={{
                  revenue: `Revenue ${selectedUnit}`,
                  expenses: `Budget ${selectedUnit}`,
                  act2025: `Actual 2025 ${selectedUnit}`,
                  avgTarget: `Avg Target ${selectedUnit}`,
                }}
              />
            </div>

            {/* Pie Chart */}
            <Piechart
              data={currentData}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
          </div>
        )}

        {activePage === "unit" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Manage Unit Bisnis</h1>
            {/* Tambahkan tabel atau grafik unit di sini */}
          </div>
        )}

        {activePage === "user" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Akses User</h1>
            {/* Tambahkan fitur CRUD user di sini */}
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagerDashboard;
