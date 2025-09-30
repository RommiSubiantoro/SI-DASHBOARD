import React, { useState, useEffect, useRef } from "react";
import Select from "react-select"; // Diperlukan untuk multi-select di modal user

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, signOut, onAuthStateChanged } from 'firebase/auth'; // Tambahkan onAuthStateChanged
import { db } from '../firebase';

// Import untuk Export PDF Gabungan
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

// Import komponen yang sudah dipecah
import Header from '../components/Header';
import StatsCards from '../components/StatsCards';
import Navbar from "../components/navbar";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
// Import ExporttableChart dihapus karena kita akan menggunakan Refs

// Import custom hooks yang sudah diupdate dengan Firebase
import { useDataManagement } from '../hooks/useDataManagement';


function SupervisorDashboard() {
  const [activePage, setActivePage] = useState("dashboard");

  // State untuk unit bisnis
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [supervisorUnits, setSupervisorUnits] = useState([]); // Unit yang dipegang Supervisor

  // State untuk users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [currentUser, setCurrentUser] = useState(null); // Data user Supervisor yang login

  // State untuk form modal (Diambil dari Manager Dashboard)
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [unitForm, setUnitForm] = useState({ name: "" });
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "", unitBisnis: [] }); // Diperbaiki ke Array
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard states
  const [selectedUnit, setSelectedUnit] = useState("");

  // Refs untuk Export PDF Gabungan
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);

  // State untuk search dan filter di Manage User
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");

  const auth = getAuth();

  // --- LOGIC: AMBIL DATA USER DAN UNIT SUPERVISOR & INIT ---
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("uid", "==", user.uid));

        const unsubscribeUser = onSnapshot(q, (snapshot) => {
          if (!snapshot.empty) {
            const userData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            setCurrentUser(userData);

            const unitsArray = Array.isArray(userData.unitBisnis) ? userData.unitBisnis : (userData.unitBisnis ? [userData.unitBisnis] : []);
            setSupervisorUnits(unitsArray);

            if (unitsArray.length > 0 && selectedUnit === "") {
              setSelectedUnit(unitsArray[0]);
            }
          } else {
            setCurrentUser(null);
          }
          setLoadingUsers(false);
        }, (error) => {
          console.error("Error fetching supervisor user data:", error);
          setLoadingUsers(false);
        });

        return () => unsubscribeUser();

      } else {
        setCurrentUser(null);
        setSupervisorUnits([]);
        setLoadingUsers(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);


  // Listener untuk ALL units (Diperlukan untuk Manage Unit)
  useEffect(() => {
    const unsubscribeUnits = onSnapshot(
      collection(db, 'units'),
      (snapshot) => {
        const unitsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUnits(unitsList);
        setLoadingUnits(false);
      },
      (error) => {
        console.error('Error listening to units:', error);
        setLoadingUnits(false);
      }
    );
    return () => unsubscribeUnits();
  }, []);

  // Listener untuk ALL users (Diperlukan untuk Manage User)
  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
        // setLoadingUsers(false); Dihapus karena sudah ada di listener auth
      },
      (error) => {
        console.error('Error listening to all users:', error);
      }
    );
    return () => unsubscribeUsers();
  }, []);

  // Map unit Supervisor untuk hook data (Menggunakan unit yang ditugaskan)
  const initialDataMap = supervisorUnits.reduce((acc, unitName) => {
    acc[unitName] = [];
    return acc;
  }, {});
  
  const {
    data,
    isLoading: dataLoading,
    calculateStats,
    exportToExcel,
    importFromExcelToFirebase
  } = useDataManagement(initialDataMap);

  const currentData = data[selectedUnit] || [];
  const stats = calculateStats(currentData);


  // --- USER/UNIT FILTERING ---
  const getFilteredUsers = () => {
    return users.filter(user => {
      // Hanya tampilkan user yang terdaftar di unit yang diawasi Supervisor
      const userUnitsArray = Array.isArray(user.unitBisnis) ? user.unitBisnis : (user.unitBisnis ? [user.unitBisnis] : []);
      const isInSupervisorUnit = supervisorUnits.some(unit => userUnitsArray.includes(unit));
      
      if (!isInSupervisorUnit) return false;

      // Filter lanjutan (search, role, unit filter)
      const matchesSearch = searchTerm === "" ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === "" || user.role === roleFilter;

      const matchesUnit = unitFilter === "" ||
        userUnitsArray.includes(unitFilter);

      return matchesSearch && matchesRole && matchesUnit;
    });
  };

  const filteredUsers = getFilteredUsers();

  // Fungsi untuk reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setUnitFilter("");
  };


  // --- STATS PERHITUNGAN ---
  const calculateAllUnitsStats = () => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalAct2025 = 0;
    let totalRecords = 0;
    let totalTargets = 0;

    // Hanya iterasi di unit yang dipegang Supervisor
    supervisorUnits.forEach(unitName => {
      const unitData = data[unitName] || [];
      if (unitData && unitData.length > 0) {
        const unitStats = calculateStats(unitData);
        totalRevenue += unitStats.totalRevenue;
        totalExpenses += unitStats.totalExpenses;
        totalAct2025 += unitStats.totalAct2025;
        totalRecords += unitData.length;
        totalTargets += unitStats.avgTarget * unitData.length;
      }
    });

    return {
      totalRevenue,
      totalExpenses,
      totalAct2025,
      avgTarget: totalRecords > 0 ? totalTargets / totalRecords : 0
    };
  };

  const allUnitsStats = calculateAllUnitsStats();

  // --- HANDLERS DARI MANAGER DASHBOARD (Diimplementasi ulang) ---

  // Export PDF Gabungan
  const handleExportCombinedPDF = async () => {
    if (!selectedUnit || currentData.length === 0) {
        alert("Pilih unit bisnis dan pastikan ada data untuk membuat laporan PDF.");
        return;
    }
    if (!pieChartRef.current || !barChartRef.current) {
        alert("Gagal menemukan elemen chart. Pastikan chart sudah dirender.");
        return;
    }

    setIsLoading(true);
    const doc = new jsPDF('p', 'mm', 'a4'); 
    let y_position = 10;
    const page_width = doc.internal.pageSize.getWidth();
    const unitName = selectedUnit;

    doc.setFontSize(16);
    doc.text(`LAPORAN DASHBOARD SUPERVISOR - ${unitName}`, page_width / 2, y_position, { align: 'center' });
    y_position += 15;

    const exportElements = [
        { ref: pieChartRef, title: "1. Pie Chart Distribusi Data" },
        { ref: barChartRef, title: "2. Bar Chart Perbandingan Bulanan" }
    ];

    for (const element of exportElements) {
        try {
            const dataUrl = await toPng(element.ref.current, { quality: 0.95, pixelRatio: 2 });
            const imgProps = doc.getImageProperties(dataUrl);
            const ratio = (page_width - 20) / imgProps.width;
            const imgHeight = imgProps.height * ratio;
            
            if (y_position + imgHeight + 20 > doc.internal.pageSize.getHeight()) {
                doc.addPage();
                y_position = 10;
            }

            doc.setFontSize(12);
            doc.text(element.title, 15, y_position);
            y_position += 5; 

            doc.addImage(dataUrl, 'PNG', 10, y_position, page_width - 20, imgHeight);
            y_position += imgHeight + 10;
            
        } catch (err) {
            console.error(`Gagal mengkonversi ${element.title}:`, err);
            alert(`Gagal membuat PDF untuk ${element.title}. Cek console.`);
            break;
        }
    }

    doc.save(`Supervisor_Report_${selectedUnit}_${new Date().toLocaleDateString('id-ID')}.pdf`);
    setIsLoading(false);
  };
  
  // Export/Import Data
  const handleExportExcel = () => {
    exportToExcel(selectedUnit, currentData);
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (file && selectedUnit) {
      try {
        const message = await importFromExcelToFirebase(selectedUnit, file);
        alert("✅ " + message);
        event.target.value = '';
      } catch (error) {
        alert("❌ " + error);
      }
    }
  };

  // Logout handler (Sudah ada, tapi kita buatkan setIsLoading)
  const handleLogout = async () => {
    try {
        setIsLoading(true);
        await signOut(auth);
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
    } catch (error) {
        alert("❌ Error logout: " + error.message);
    } finally {
        setIsLoading(false);
    }
  };


// --- Unit Management Functions (CRUD) ---
  const handleAddUnit = () => { setEditingUnit(null); setUnitForm({ name: "" }); setShowUnitModal(true); };

  const handleEditUnit = (unit) => { setEditingUnit(unit); setUnitForm({ name: unit.name }); setShowUnitModal(true); };

  const handleSaveUnit = async () => {
    if (unitForm.name.trim() === "") { alert("Nama unit tidak boleh kosong!"); return; }
    try {
      setIsLoading(true);
      if (editingUnit) {
        const unitRef = doc(db, 'units', editingUnit.id);
        await updateDoc(unitRef, { name: unitForm.name, updatedAt: new Date() });
        alert('Unit bisnis berhasil diupdate!');
      } else {
        await addDoc(collection(db, 'units'), { name: unitForm.name, createdAt: new Date(), updatedAt: new Date() });
        alert('Unit bisnis berhasil ditambahkan!');
      }
      setShowUnitModal(false);
      setUnitForm({ name: "" });
      setEditingUnit(null);
    } catch (error) {
      console.error('Error saving unit:', error);
      alert('Error saving unit to database');
    } finally {
      setIsLoading(false);
    }
  };


// --- User Management Functions (CRUD) ---
  const handleAddUser = () => { setEditingUser(null); setUserForm({ name: "", email: "", password: "", role: "", unitBisnis: [] }); setShowUserModal(true); };

  const handleEditUser = (user) => { setEditingUser(user); setUserForm({ name: user.name, email: user.email || "", password: "", role: user.role, unitBisnis: user.unitBisnis || [] }); setShowUserModal(true); };

  const handleSaveUser = async () => {
    if (userForm.name.trim() === "" || userForm.role.trim() === "" || userForm.unitBisnis.length === 0 || (!editingUser && (userForm.email.trim() === "" || userForm.password.trim() === ""))) {
      alert("Semua field harus diisi dan pilih minimal 1 unit bisnis!"); return;
    }
    try {
      setIsLoading(true);
      if (editingUser) {
        const userRef = doc(db, "users", editingUser.id);
        const updateData = { name: userForm.name, role: userForm.role, unitBisnis: userForm.unitBisnis, updatedAt: new Date(), };
        if (userForm.email.trim() !== "") { updateData.email = userForm.email; }
        await updateDoc(userRef, updateData);
        alert("User berhasil diupdate!");
      } else {
        const userCredential = await createUserWithEmailAndPassword( auth, userForm.email, userForm.password );
        const uid = userCredential.user.uid;
        await addDoc(collection(db, "users"), { uid, name: userForm.name, email: userForm.email, role: userForm.role, unitBisnis: userForm.unitBisnis, createdAt: new Date(), updatedAt: new Date(), });
        alert("User berhasil ditambahkan!");
      }
      setShowUserModal(false);
      setUserForm({ name: "", email: "", password: "", role: "", unitBisnis: [] });
      setEditingUser(null);
    } catch (error) {
      console.error("Error saving user:", error);
      alert(`Error saving user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };


  
  const handleExportUsers = () => { /* ... (Logika export users) ... */ 
    const csvContent = "data:text/csv;charset=utf-8,"
    + "No,Nama,Email,Role,Unit Bisnis\n"
    + users.map((user, index) =>
        `${index + 1},"${user.name}","${user.email || '-'}","${user.role}","${Array.isArray(user.unitBisnis) ? user.unitBisnis.join("; ") : (user.unitBisnis || '-')}"`
    ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

   const isAppLoading = loadingUsers || dataLoading;

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="flex  ">
        {/* Sidebar */}
        <div className="w-64 fixed bg-red-500 shadow-lg border-r border-gray-100 min-h-screen flex flex-col justify-between ">
          {/* Bagian atas */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-8 px-7">Supervisor Panel</h2>

            <nav className="space-y-2">
              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${activePage === "dashboard"
                  ? "text-white bg-red-600 shadow-md"
                  : "text-white hover:bg-red-400"
                  }`}
                onClick={() => setActivePage("dashboard")}
              >
                📊 Dashboard
              </button>

              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${activePage === "unit"
                  ? "text-white bg-red-600 shadow-md"
                  : "text-white hover:bg-red-400"
                  }`}
                onClick={() => setActivePage("unit")}
              >
                🏢 Manage Unit Bisnis
              </button>

              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${activePage === "user"
                  ? "text-white bg-red-600 shadow-md"
                  : "text-white hover:bg-red-400"
                  }`}
                onClick={() => setActivePage("user")}
              >
                👥 Manage User
              </button>
            </nav>
          </div>

          {/* Bagian bawah (footer sidebar) */}
          <div className="p-6 border-t border-red-400">
            {/* Tombol Export PDF Gabungan */}
            <button
                onClick={handleExportCombinedPDF}
                disabled={isLoading || !selectedUnit || currentData.length === 0}
                className="w-full text-left px-4 py-3 mb-2 rounded-lg font-medium text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center"
            >
                {isLoading ? 'Processing PDF...' : '⬇️ Export Dashboard PDF'}
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg font-medium text-sm text-white hover:bg-red-400 transition-all duration-200"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 ml-64 ">
          {/* Navbar */}
          <div className="fixed top-0 left-0 w-full z-50">
            <Navbar onLogout={handleLogout} />
          </div>

          {/* Dashboard Page */}
          {activePage === "dashboard" && (
            <div className="space-y-6 pt-16">
              {/* Header Component */}
              <Header
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                units={supervisorUnits} // Hanya tampilkan unit yang diawasi
                title="Supervisor Dashboard"
              />

              {/* Tombol Export/Import Data */}
              <div className="flex flex-wrap gap-4 justify-start">
                  <label className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg shadow-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm cursor-pointer">
                    ⬆️ Import Data ({selectedUnit || 'Pilih Unit'})
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleImportData}
                      disabled={dataLoading || selectedUnit === ""}
                      className="hidden"
                    />
                  </label>
              </div>

              {/* Stats overview untuk semua unit */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Overview Semua Unit yang Diawasi</h3>
                <StatsCards
                  totalRevenue={allUnitsStats.totalRevenue}
                  totalExpenses={allUnitsStats.totalExpenses}
                  totalAct2025={allUnitsStats.totalAct2025}
                  avgTarget={allUnitsStats.avgTarget}
                  labels={{
                    revenue: "Total Act 2024 (All Supervised Units)",
                    expenses: "Total Budget (All Supervised Units)",
                    act2025: "Total Act 2025 (All Supervised Units)",
                    avgTarget: "VAR YTD (All Supervised Units)"
                  }}
                />
              </div>

              {/* Stats cards untuk unit terpilih */}
              {selectedUnit && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Detail Unit: {selectedUnit}</h3>
                <StatsCards
                  totalRevenue={stats.totalRevenue}
                  totalExpenses={stats.totalExpenses}
                  totalAct2025={stats.totalAct2025}
                  avgTarget={stats.avgTarget}
                  labels={{
                    revenue: `Act 2024 ${selectedUnit}`,
                    expenses: `Budget ${selectedUnit}`,
                    act2025: `Act 2025 ${selectedUnit}`,
                    avgTarget: `VAR YTD ${selectedUnit}`
                  }}
                />
              </div>
               )}

              {/* Charts */}
              {selectedUnit && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Piechart - Hubungkan dengan Ref */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" ref={pieChartRef}>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Pie Chart</h3>
                  <Piechart
                    data={currentData}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                    selectedYear={selectedYear}
                    setSelectedYear={setSelectedYear}
                  />
                </div>

                {/* Barchart - Hubungkan dengan Ref */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" ref={barChartRef}>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">Bar Chart</h3>
                  <Barchart
                    data={currentData}
                    selectedYear={selectedYear}
                  />
                </div>
              </div>
               )}

                {!selectedUnit && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-blue-800 font-medium">Silakan pilih **Unit Bisnis** di bagian atas untuk melihat detail statistik dan grafik.</p>
                </div>
              )}
              </div>
          )}

          {/* Unit Management Page */}
          {activePage === "unit" && (
            <div className="space-y-6 min-h-screen mt-12">
               <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                 <h1 className="text-2xl font-bold text-gray-800">Manage Unit Bisnis</h1>
                 <div className='flex gap-2'>
                    <button
                        onClick={handleAddUnit}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        ➕ Tambah Unit
                    </button>
                 </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {loadingUnits ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-sm">Loading units...</p>
                  </div>
                ) : (
                  /* Table */
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">No</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Nama Unit</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Jumlah User</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {units.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                              Belum ada unit bisnis.
                            </td>
                          </tr>
                        ) : (
                          units.map((unit, index) => {
                            const userCount = users.filter(user =>
                              Array.isArray(user.unitBisnis) && user.unitBisnis.includes(unit.name)
                            ).length;

                            return (
                              <tr key={unit.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                                <td className="px-4 py-3 text-gray-900 font-medium">{unit.name}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${userCount > 0
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                    }`}>
                                    {userCount} user
                                  </span>
                                </td>

                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditUnit(unit)}
                                      className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors disabled:opacity-50"
                                      disabled={isLoading}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Management Page */}
          {activePage === "user" && (
            <div className="space-y-6 min-h-screen mt-12">
               <div className="flex justify-between items-center bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                 <h1 className="text-2xl font-bold text-gray-800">Manage User</h1>
                 <div className='flex gap-2'>
                    <button
                        onClick={handleAddUser}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                        disabled={isLoading || units.length === 0}
                    >
                        ➕ Tambah User
                    </button>
                 </div>
              </div>

              {/* Search and Filter Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Cari berdasarkan nama atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>

                    {/* Role Filter */}
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Semua Role</option>
                      <option value="User">User</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Manager">Manager</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>

                    {/* Unit Filter (Hanya Unit Supervisor yang muncul) */}
                    <select
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Semua Unit (Diawasi)</option>
                      {supervisorUnits.map((unitName) => ( 
                        <option key={unitName} value={unitName}>
                          {unitName}
                        </option>
                      ))}
                    </select>

                    {/* Reset Button */}
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                      disabled={!searchTerm && !roleFilter && !unitFilter}
                    >
                      Reset Filter
                    </button>
                  </div>

                  {/* Search Results Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-gray-700 font-medium">
                      Menampilkan {filteredUsers.length} dari {users.length} user yang terdaftar di unit yang diawasi
                    </span>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-sm">Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">No</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Nama</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Unit Bisnis</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                              Tidak ada user yang sesuai dengan filter atau unit yang diawasi.
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user, index) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                              <td className="px-4 py-3">{user.name}</td>
                              <td className="px-4 py-3 text-gray-700">{user.email || '-'}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.role === 'Super Admin' ? 'bg-red-100 text-red-800' :
                                  user.role === 'Manager' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'Supervisor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                {Array.isArray(user.unitBisnis) ? user.unitBisnis.join(", ") : (user.unitBisnis || "-")}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors disabled:opacity-50"
                                    disabled={isLoading}
                                  >
                                    Edit
                                  </button>
                                 
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {/* --- MODAL UNIT BISNIS --- */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingUnit ? "Edit Unit Bisnis" : "Tambah Unit Bisnis"}
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nama Unit:</label>
                <input
                  type="text"
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="Masukkan nama unit bisnis"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveUnit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : (editingUnit ? "Update" : "Simpan")}
                </button>
                <button
                  onClick={() => setShowUnitModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL USER --- */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingUser ? "Edit User" : "Tambah User"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama:</label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="Masukkan nama user"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email:</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        placeholder="Masukkan email"
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password:</label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder="Masukkan password"
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role:</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Pilih Role</option>
                    <option value="User">User</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Unit Bisnis:</label>
                  <Select
                    isMulti
                    options={units.map((unit) => ({ value: unit.name, label: unit.name }))}
                    value={userForm.unitBisnis.map((u) => ({ value: u, label: u }))}
                    onChange={(selected) =>
                      setUserForm({ ...userForm, unitBisnis: selected.map((s) => s.value) })
                    }
                    isDisabled={isLoading}
                    className="text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : (editingUser ? "Update" : "Simpan")}
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SupervisorDashboard;