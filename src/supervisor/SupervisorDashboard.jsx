import React, { useState } from "react";
import Header from "../components/Header";
import StatsCards from "../components/StatsCards";
import DataTable from "../components/DataTable";

const SupervisorDashboard = () => {
  const [stats] = useState([
    { title: "Total Karyawan", value: 120 },
    { title: "Proyek Aktif", value: 8 },
    { title: "Laporan Bulan Ini", value: 45 },
  ]);

  const [rows] = useState([
    { name: "Andi", unit: "Produksi", status: "Selesai" },
    { name: "Budi", unit: "Gudang", status: "Proses" },
    { name: "Citra", unit: "Admin", status: "Selesai" },
  ]);

  const handleLogout = () => {
    alert("Logout berhasil!");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header title="Supervisor Dashboard" onLogout={handleLogout} />
      <main className="p-6">
        <StatsCards stats={stats} />
        <DataTable rows={rows} />
      </main>
    </div>
  );
};

export default SupervisorDashboard;
