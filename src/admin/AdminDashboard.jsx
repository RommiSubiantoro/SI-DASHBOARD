import React, { useState, useEffect } from "react";
import Select from "react-select";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { LogOut } from 'lucide-react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth';
import { db } from '../firebase';

// Import komponen yang sudah dipecah
import Header from '../components/Header';
import ControlButtons from '../components/ControlButtons';
import StatsCards from '../components/StatsCards';
import DataTable from '../components/DataTable';
import Navbar from "../components/navbar";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";

// Import custom hooks yang sudah diupdate dengan Firebase
import { useDataManagement } from '../hooks/useDataManagement';

import "../css/AdminDashboard.css";

function AdminDashboard() {
  const [activePage, setActivePage] = useState("dashboard");

  // State untuk unit bisnis
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  // State untuk users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // State untuk form modal
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [unitForm, setUnitForm] = useState({ name: "" });
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "", unitBisnis: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard states
  const [selectedUnit, setSelectedUnit] = useState([]);

  // Tambahkan state untuk search di AdminDashboard
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");

  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = searchTerm === "" ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === "" || user.role === roleFilter;

      const matchesUnit = unitFilter === "" ||
        (Array.isArray(user.unitBisnis)
          ? user.unitBisnis.includes(unitFilter)
          : user.unitBisnis === unitFilter);

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

  // Menggunakan Firebase-enabled custom hooks untuk dashboard data
  const {
    data,
    isLoading: dataLoading,
    calculateStats,
    exportToExcel,
    importFromExcelToFirebase
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

  // Dapatkan instance autentikasi
  const auth = getAuth();

  // Units mapping untuk dashboard
  const dashboardUnits = ["Samudera Makassar Logistik", "Makassar Jaya Samudera", "Samudera Perdana", "Masaji Kargosentra Utama", "Kendari Jaya Samudera",
    "Silkargo Indonesia", "Samudera Agencies Indonesia", "Samudera Kendari Logistik"];

  // Data untuk dashboard
  const currentData = data[selectedUnit] || [];
  const stats = calculateStats(currentData);

  // Firebase functions untuk Units (existing code)
  const fetchUnits = async () => {
    try {
      setLoadingUnits(true);
      const unitsCollection = collection(db, 'units');
      const unitsSnapshot = await getDocs(unitsCollection);
      const unitsList = unitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (unitsList.length === 0) {
        const defaultUnits = [
          { name: "Samudera Makassar Logistik" },
          { name: "Makassar Jaya Samudera" },
          { name: "Kendari Jaya Samudera" },
          { name: "Samudera Kendari Logistik" },
          { name: "Samudera Agencies Indonesia" },
          { name: "Samudera Perdana" },
          { name: "Masaji Kargosentra Utama" },
          { name: "Silkargo Indonesia" }
        ];


        for (const unit of defaultUnits) {
          await addDoc(collection(db, 'units'), {
            ...unit,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        await fetchUnits();
        return;
      }

      setUnits(unitsList);
    } catch (error) {
      console.error('Error fetching units:', error);
      alert('Error loading units from database');
    } finally {
      setLoadingUnits(false);
    }
  };

  // Real-time listeners (existing code)
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

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const usersList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
        setLoadingUsers(false);
      },
      (error) => {
        console.error('Error listening to users:', error);
        setLoadingUsers(false);
      }
    );
    return () => unsubscribeUsers();
  }, []);

  // Logout handler
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

  // Dashboard handlers menggunakan komponen baru dengan Firebase
  const handleExportExcel = () => {
    exportToExcel(selectedUnit, currentData);
  };

  const handleExportPDF = () => {
    alert(`Admin exporting ${selectedUnit} data to PDF...`);
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

  // Fungsi untuk menghitung total stats dari semua unit
  const calculateAllUnitsStats = () => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalAct2025 = 0;
    let totalRecords = 0;
    let totalTargets = 0;

    Object.values(data).forEach(unitData => {
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

  // Unit management functions (existing code)
  const handleAddUnit = () => {
    setEditingUnit(null);
    setUnitForm({ name: "" });
    setShowUnitModal(true);
  };

  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setUnitForm({ name: unit.name });
    setShowUnitModal(true);
  };

  const handleSaveUnit = async () => {
    if (unitForm.name.trim() === "") {
      alert("Nama unit tidak boleh kosong!");
      return;
    }

    try {
      setIsLoading(true);

      if (editingUnit) {
        const unitRef = doc(db, 'units', editingUnit.id);
        await updateDoc(unitRef, {
          name: unitForm.name,
          updatedAt: new Date()
        });
        alert('Unit bisnis berhasil diupdate!');
      } else {
        await addDoc(collection(db, 'units'), {
          name: unitForm.name,
          createdAt: new Date(),
          updatedAt: new Date()
        });
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

  const handleDeleteUnit = async (unitToDelete) => {
    const usersUsingUnit = users.filter(user => user.unitBisnis === unitToDelete.name);

    if (usersUsingUnit.length > 0) {
      alert(`Tidak dapat menghapus unit "${unitToDelete.name}" karena masih ada ${usersUsingUnit.length} user yang menggunakannya.`);
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus unit "${unitToDelete.name}"?`)) {
      try {
        setIsLoading(true);
        await deleteDoc(doc(db, 'units', unitToDelete.id));
        alert('Unit bisnis berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting unit:', error);
        alert('Error deleting unit from database');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Tambahkan setelah handleDeleteUnit
  const handleDeleteAllRecords = async (unitName) => {
    if (!unitName) {
      alert("Unit bisnis tidak valid!");
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus semua records di ${unitName}?`)) {
      return;
    }

    try {
      setIsLoading(true);
      const recordsRef = collection(db, "unitData", unitName, "records");
      const snapshot = await getDocs(recordsRef);

      const deletePromises = snapshot.docs.map((record) =>
        deleteDoc(doc(db, "unitData", unitName, "records", record.id))
      );

      await Promise.all(deletePromises);
      console.log(`All records in "${unitName}" deleted successfully`);

    } catch (error) {
      console.error("Error deleting records:", error);
      alert("❌ Gagal menghapus records: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // User management functions (existing code)
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: "", email: "", password: "", role: "", unitBisnis: [] });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email || "",
      password: "",
      role: user.role,
      unitBisnis: user.unitBisnis || []
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (
      userForm.name.trim() === "" ||
      userForm.role.trim() === "" ||
      userForm.unitBisnis.length === 0 || // harus ada minimal 1 unit
      (!editingUser && (userForm.email.trim() === "" || userForm.password.trim() === ""))
    ) {
      alert("Semua field harus diisi dan pilih minimal 1 unit bisnis!");
      return;
    }

    try {
      setIsLoading(true);

      if (editingUser) {
        const userRef = doc(db, "users", editingUser.id);
        const updateData = {
          name: userForm.name,
          role: userForm.role,
          unitBisnis: userForm.unitBisnis, // simpan array
          updatedAt: new Date(),
        };
        if (userForm.email.trim() !== "") {
          updateData.email = userForm.email;
        }

        await updateDoc(userRef, updateData);
        alert("User berhasil diupdate!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userForm.email,
          userForm.password
        );
        const uid = userCredential.user.uid;

        await addDoc(collection(db, "users"), {
          uid,
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          unitBisnis: userForm.unitBisnis, // simpan array
          createdAt: new Date(),
          updatedAt: new Date(),
        });
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


  const handleDeleteUser = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      try {
        setIsLoading(true);
        await deleteDoc(doc(db, 'users', id));
        alert('User berhasil dihapus!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user from database');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Export functions (existing code)
  const handleExportUnits = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "No,Nama Unit,Jumlah User\n"
      + units.map((unit, index) => {
        const userCount = users.filter(user =>
          Array.isArray(user.unitBisnis) && user.unitBisnis.includes(unit.name)
        ).length;

        return `${index + 1},"${unit.name}",${userCount}`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "unit_bisnis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUsers = () => {
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

  return (
    <div className="admin">
      <Navbar onLogout={handleLogout} />

      <div className="admin-body">
        {/* Sidebar */}
        <div className="sidebar">
          <h2 className="h1">Admin Panel</h2>
          <button
            className={`button-1 ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`button-1 ${activePage === "unit" ? "active" : ""}`}
            onClick={() => setActivePage("unit")}
          >
            Manage Unit Bisnis
          </button>
          <button
            className={`button-1 ${activePage === "user" ? "active" : ""}`}
            onClick={() => setActivePage("user")}
          >
            Manage User
          </button>
        </div>

        {/* Konten */}
        <div className="Konten">
          {activePage === "dashboard" && (
            <div className="dashboard-content">
              {/* Header menggunakan komponen baru */}
              <Header
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                units={dashboardUnits}
                title="Admin Dashboard"
              />

              {/* Stats overview untuk semua unit */}
              <div className="admin-overview">
                <h3>Overview Semua Unit</h3>
                <StatsCards
                  totalRevenue={allUnitsStats.totalRevenue}
                  totalExpenses={allUnitsStats.totalExpenses}
                  totalAct2025={allUnitsStats.totalAct2025}
                  avgTarget={allUnitsStats.avgTarget}
                  labels={{
                    revenue: "Total Act 2024 (All Units)",
                    expenses: "Total Budget (All Units)",
                    act2025: "Total Act 2025 (All Units)",
                    avgTarget: "VAR YTD (All Units)"
                  }}
                />
              </div>

              {/* Stats cards untuk unit terpilih */}
              <div className="unit-specific-stats">
                <h3>Detail Unit: {selectedUnit}</h3>
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
              {/* Pie Chart */}
              <div className="charts-row">
                <Piechart
                  data={currentData}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                />
                <Barchart
                  data={currentData}
                  selectedYear={selectedYear}
                />
              </div>


            </div>
          )}

          {/* Unit Management Page - existing code */}
          {activePage === "unit" && (
            <div className="unit-page">
              <h1 className="title">Manage Unit Bisnis</h1>
              <div className="isian">
                <button className="button-2" onClick={handleAddUnit} disabled={isLoading}>
                  + Tambah Unit
                </button>
                <button className="button-3" onClick={handleExportUnits}>
                  Ekspor Data
                </button>
              </div>

              {loadingUnits ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading units...</p>
                </div>
              ) : (
                <table className="tabel-3">
                  <thead className="thead">
                    <tr>
                      <th>No</th>
                      <th>Nama Unit</th>
                      <th>Jumlah User</th>
                      <th>Data Records</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center-placeholder">
                          Belum ada unit bisnis. Tambahkan unit bisnis pertama Anda!
                        </td>
                      </tr>
                    ) : (
                      units.map((unit, index) => {
                        const userCount = users.filter(user => user.unitBisnis === unit.name).length;
                        const unitKey = Object.keys(data).find(key =>
                          key === "Samudera Makassar Logistik" && unit.name.includes("Samudera Makassar Logistik") ||
                          key === "Makassar Jaya Samudera" && unit.name.includes("Makassar Jaya Samudera") ||
                          key === "Samudera Perdana" && unit.name.includes("Samudera Perdana") ||
                          key === "Kendari Jaya Samudera" && unit.name.includes("Kendari Jaya Samudera") ||
                          key === "Masaji Kargosentra Utama" && unit.name.includes("Masaji Kargosentra Utama") ||
                          key === "Samudera Agencies Indonesia" && unit.name.includes("Samudera Agencies Indonesia") ||
                          key === "Silkargo Indonesia" && unit.name.includes("Silkargo Indonesia") ||
                          key === "Samudera Kendari Logistik" && unit.name.includes("Samudera Kendari Logistik")
                        );
                        const recordCount = unitKey && data[unitKey] ? data[unitKey].length : 0;

                        return (
                          <tr key={unit.id}>
                            <td>{index + 1}</td>
                            <td>{unit.name}</td>
                            <td>
                              <span className={userCount > 0 ? "user-count-active" : "user-count-inactive"}>
                                {userCount} user
                              </span>
                            </td>
                            <td>
                              <span className={recordCount > 0 ? "record-count-active" : "record-count-inactive"}>
                                {recordCount} records
                              </span>
                            </td>
                            <td className="action-buttons">
                              <button
                                onClick={() => handleEditUnit(unit)}
                                className="edit-button"
                                disabled={isLoading}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUnit(unit)}
                                className="delete-button"
                                disabled={isLoading}
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => handleDeleteAllRecords(unit.name)}
                                className="danger-button"
                                disabled={isLoading}
                              >
                                Hapus Records
                              </button>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* User Management Page - existing code */}
          {activePage === "user" && (
            <div>

              {/* Search and Filter Section */}
              <div className="search-section">
                <div className="search-controls">
                  {/* Search Input */}
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan nama atau email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="search-input"
                    />
                    <span className="search-icon">🔍</span>
                  </div>

                  {/* Role Filter */}
                  <div className="filter-wrapper">
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">Semua Role</option>
                      <option value="User">User</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Manager">Manager</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>
                  </div>

                  {/* Unit Filter */}
                  <div className="filter-wrapper">
                    <select
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">Semua Unit</option>
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.name}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Reset Button */}
                  <button
                    onClick={handleResetFilters}
                    className="reset-filters-btn"
                    disabled={!searchTerm && !roleFilter && !unitFilter}
                  >
                    Reset Filter
                  </button>
                </div>

                {/* Search Results Info */}
                <div className="search-info">
                  <span className="results-count">
                    Menampilkan {filteredUsers.length} dari {users.length} user
                  </span>
                  {(searchTerm || roleFilter || unitFilter) && (
                    <div className="active-filters">
                      {searchTerm && (
                        <span className="filter-tag">
                          Pencarian: "{searchTerm}"
                          <button onClick={() => setSearchTerm("")} className="remove-filter">×</button>
                        </span>
                      )}
                      {roleFilter && (
                        <span className="filter-tag">
                          Role: {roleFilter}
                          <button onClick={() => setRoleFilter("")} className="remove-filter">×</button>
                        </span>
                      )}
                      {unitFilter && (
                        <span className="filter-tag">
                          Unit: {unitFilter}
                          <button onClick={() => setUnitFilter("")} className="remove-filter">×</button>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="isian">
                <button
                  onClick={handleAddUser}
                  className="button-2"
                  disabled={isLoading || units.length === 0}
                >
                  + Tambah User
                </button>
                <button
                  className="button-3"
                  onClick={handleExportUsers}
                  disabled={users.length === 0}
                >
                  Ekspor Data
                </button>
              </div>

              {units.length === 0 && (
                <div className="warning-box">
                  <strong>Peringatan:</strong> Anda perlu membuat unit bisnis terlebih dahulu sebelum menambahkan user.
                </div>
              )}

              {loadingUsers ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : (
                <table className="tabel-3">
                  <thead className="thead">
                    <tr>
                      <th>No</th>
                      <th>Nama</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Unit Bisnis</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center-placeholder">
                          {users.length === 0
                            ? "Belum ada user. Tambahkan user pertama Anda!"
                            : "Tidak ada user yang sesuai dengan pencarian."
                          }
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => {
                        const unitExists = units.some(unit => unit.name === user.unitBisnis);
                        return (
                          <tr key={user.id}>
                            <td>{index + 1}</td>
                            <td>
                              <span className={searchTerm && user.name.toLowerCase().includes(searchTerm.toLowerCase()) ? "highlight-text" : ""}>
                                {user.name}
                              </span>
                            </td>
                            <td>
                              <span className={searchTerm && user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()) ? "highlight-text" : ""}>
                                {user.email || '-'}
                              </span>
                            </td>
                            <td>
                              <span className={`role-badge ${user.role === 'Super Admin' ? 'super-admin' :
                                user.role === 'Manager' ? 'manager' :
                                  user.role === 'Supervisor' ? 'supervisor' : 'user'
                                } ${roleFilter === user.role ? 'filter-match' : ''}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>
                              <span className={unitFilter === user.unitBisnis ? "highlight-text" : ""}>
                                {Array.isArray(user.unitBisnis) ? user.unitBisnis.join(", ") : (user.unitBisnis || "-")}

                              </span>
                            </td>
                            <td className="action-buttons">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="edit-button"
                                disabled={isLoading}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="delete-button"
                                disabled={isLoading}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals - existing code with slight updates */}
      {showUnitModal && (
        <div className="modal-overlay" onClick={() => setShowUnitModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingUnit ? "Edit Unit Bisnis" : "Tambah Unit Bisnis"}</h2>
            <div className="form-group">
              <label>Nama Unit:</label>
              <input
                type="text"
                value={unitForm.name}
                onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                placeholder="Masukkan nama unit bisnis"
                disabled={isLoading}
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleSaveUnit} className="btn-save" disabled={isLoading}>
                {isLoading ? 'Saving...' : (editingUnit ? "Update" : "Simpan")}
              </button>
              <button
                onClick={() => setShowUnitModal(false)}
                className="btn-cancel"
                disabled={isLoading}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editingUser ? "Edit User" : "Tambah User"}</h2>
            <div className="form-group">
              <label>Nama:</label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                placeholder="Masukkan nama user"
                disabled={isLoading}
              />
            </div>
            {!editingUser && (
              <>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="Masukkan email"
                    disabled={isLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Masukkan password"
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
            <div className="form-group">
              <label>Role:</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                disabled={isLoading}
              >
                <option value="">Pilih Role</option>
                <option value="User">User</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
            <div className="form-group">
              <label>Pilih Unit Bisnis:</label>
              <Select
                isMulti
                options={units.map((unit) => ({ value: unit.name, label: unit.name }))}
                value={userForm.unitBisnis.map((u) => ({ value: u, label: u }))}
                onChange={(selected) =>
                  setUserForm({ ...userForm, unitBisnis: selected.map((s) => s.value) })
                }
                isDisabled={isLoading}
              />
            </div>

            <div className="modal-buttons">
              <button onClick={handleSaveUser} className="btn-save" disabled={isLoading}>
                {isLoading ? 'Saving...' : (editingUser ? "Update" : "Simpan")}
              </button>
              <button
                onClick={() => setShowUserModal(false)}
                className="btn-cancel"
                disabled={isLoading}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;