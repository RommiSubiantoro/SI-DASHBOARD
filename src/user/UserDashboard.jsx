import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase'; // Sesuaikan dengan path Anda

// Import komponen yang sudah dipecah
import Header from '../components/Header';
import ControlButtons from '../components/ControlButtons';
import StatsCards from '../components/StatsCards';
import DataTable from '../components/DataTable';
import Piechart from '../components/Piechart';
import Barchart from "../components/Barchart";
import Navbar from "../components/navbar";

// Import custom hooks yang sudah diupdate dengan Firebase
import { useDataManagement, useFormManagement } from '../hooks/useDataManagement';


const UserDashboard = () => {
  const [selectedUnit, setSelectedUnit] = useState("Samudera Makassar Logistik");
  const [selectedMonth, setSelectedMonth] = useState("");
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
    "Samudera Agencies Indonesia": [],
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
      console.log('Data added successfully:', result.message);
    } else {
      console.error('Failed to add data:', result.message);
    }
  };
  const handleExportExcel = () => {
    if (!selectedUnit) {
      alert("⚠️ Silakan pilih Unit Bisnis terlebih dahulu sebelum export!");
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
    if (file) {
      try {
        await importFromExcelToFirebase(selectedUnit, file);
        // Silent success - tidak ada pesan
        event.target.value = '';
      } catch (error) {
        // Silent error - hanya console log
        console.error("Import failed:", error);
      }
    }
  };

  return (
    <div className="grid grid-cols-[16rem_1fr] min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="h-screen bg-red-500 border-r shadow-lg flex flex-col">
        <div className="p-4 ">
          <h2 className="text-2xl font-bold text-white mb-3 px-12 pt-3">User Panel</h2>
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
            units={units.map((u) => u.key)}
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

          <div className="bg-white p-6 rounded-xl shadow">
            <DataTable
              data={currentData}
              title="Data Table"
              showFilters
              showPagination
              rowsPerPage={25}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Piechart
              data={currentData}
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              selectedYear={selectedYear}
              setSelectedYear={setSelectedYear}
            />
            <Barchart data={currentData} selectedYear={selectedYear} />
          </div>
        </main>
      </div>



      {/* Add Data Modal */}
      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Tambah Data Baru</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bulan:</label>
                <select
                  value={newRecord.month}
                  onChange={(e) => updateField("month", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Pilih Bulan</option>
                  {[
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ].map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Revenue:</label>
                <input
                  type="number"
                  value={newRecord.revenue}
                  onChange={(e) => updateField("revenue", e.target.value)}
                  placeholder="Masukkan revenue"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Expenses:</label>
                <input
                  type="number"
                  value={newRecord.expenses}
                  onChange={(e) => updateField("expenses", e.target.value)}
                  placeholder="Masukkan expenses"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target:</label>
                <input
                  type="number"
                  value={newRecord.target}
                  onChange={(e) => updateField("target", e.target.value)}
                  placeholder="Masukkan target"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={dataLoading}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitData}
                disabled={dataLoading}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
              >
                {dataLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
};

export default UserDashboard;
