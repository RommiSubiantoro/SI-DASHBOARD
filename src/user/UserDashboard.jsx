import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Sesuaikan dengan path Anda

// Import komponen yang sudah dipecah
import Header from '../components/Header';
import ControlButtons from '../components/ControlButtons';
import StatsCards from '../components/StatsCards';
import DataTable from '../components/DataTable';
import Piechart from '../components/Piechart';
import Navbar from "../components/navbar";


// Import custom hooks yang sudah diupdate dengan Firebase
import { useDataManagement, useFormManagement } from '../hooks/useDataManagement';

// Import CSS
import "../css/UserDashboard.css";

const UserDashboard = () => {
  const [selectedUnit, setSelectedUnit] = useState("SML");
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [isLoading, setIsLoading] = useState(false);

  // Menggunakan Firebase-enabled custom hooks
  const {
    data,
    isLoading: dataLoading,
    calculateStats,
    addDataToFirebase,
    exportToExcel,
    importFromExcelToFirebase,
    getPieChartData
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

  const {
    showAddModal,
    setShowAddModal,
    newRecord,
    resetForm,
    updateField
  } = useFormManagement();

  // Units mapping untuk dropdown
  const units = [
    { key: "Samudera Makassar Logistik", label: "Samudera Makassar Logistik" },
    { key: "Makassar Jaya Samudera", label: "Makassar Jaya Samudera" },
    { key: "Samudera Perdana", label: "Samudera Perdana" },
    { key: "Masaji Kargosentra Utama", label: "Masaji Kargosentra Utama" },
    { key: "Kendari Jaya Samudera", label: "Kendari Jaya Samudera" },
    { key: "Silkargo Indonesia", label: "Silkargo Indonesia" },
    { key: "Samudera Agencies Indonesia", label: "Samudera Agencies Indonesia" },
     { key: "Samudera Kendari Logistik", label: "Samudera Kendari Logistik" }
  ];

  // Data untuk unit yang dipilih
  const currentData = data[selectedUnit] || [];
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
      alert('Berhasil logout!');
      window.location.href = "/";
    } catch (error) {
      console.error('Error during logout:', error);
      alert('Error during logout: ' + error.message);
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
      alert('✅ ' + result.message);
    } else {
      alert('❌ ' + result.message);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(selectedUnit, currentData);
  };

  const handleExportPDF = () => {
    alert(`Exporting ${selectedUnit} data to PDF...`);
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const message = await importFromExcelToFirebase(selectedUnit, file);
        alert("✅ " + message);
        // Reset file input
        event.target.value = '';
      } catch (error) {
        alert("❌ " + error);
      }
    }
  };

  return (

    <div>
      <Navbar onLogout={handleLogout} />
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="h1">User Panel</h2>
        <button
          className='button-1'
        >
          Dashboard
        </button>
      </div>

      <div className="dashboard-layout">

        <div className="dashboard-content">
          {/* isi utama UserDashboard yang sudah kamu buat */}
        </div>
      </div>

      <div className="Container-usr">

        <div className="body">
          {/* Header dengan unit selector */}
          <Header
            selectedUnit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
            units={units.map(u => u.key)}
            title="User Dashboard"
          />

          {/* Control buttons */}
          <ControlButtons
            onAddData={handleAddData}
            onImportData={handleImportData}
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            showAddButton={true}
            showImportButton={true}
            showExportButtons={true}
          />

          {/* Loading indicator */}
          {dataLoading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading data...</p>
            </div>
          )}

          {/* Stats cards */}
          <StatsCards
            totalRevenue={stats.totalRevenue}
            totalExpenses={stats.totalExpenses}
            totalAct2025={stats.totalAct2025}
            avgTarget={stats.avgTarget}
            labels={{
              revenue: "Total ACT 2024",
              expenses: "Total BDGT 2025",
              act2025: "Total ACT 2025",
              avgTarget: "Avg Target"
            }}
          />

          {/* Data table */}
          <DataTable
            data={currentData}
            title="Data Table"
            showFilters={true}
            showPagination={true}
            rowsPerPage={25}
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

        {/* Add Data Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Tambah Data Baru</h3>
              <div className="form-group">
                <label>Bulan:</label>
                <select
                  value={newRecord.month}
                  onChange={(e) => updateField('month', e.target.value)}
                >
                  <option value="">Pilih Bulan</option>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Revenue:</label>
                <input
                  type="number"
                  value={newRecord.revenue}
                  onChange={(e) => updateField('revenue', e.target.value)}
                  placeholder="Masukkan revenue"
                />
              </div>
              <div className="form-group">
                <label>Expenses:</label>
                <input
                  type="number"
                  value={newRecord.expenses}
                  onChange={(e) => updateField('expenses', e.target.value)}
                  placeholder="Masukkan expenses"
                />
              </div>
              <div className="form-group">
                <label>Target:</label>
                <input
                  type="number"
                  value={newRecord.target}
                  onChange={(e) => updateField('target', e.target.value)}
                  placeholder="Masukkan target"
                />
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={dataLoading}
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmitData}
                  disabled={dataLoading}
                >
                  {dataLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;