import React, { useState, useEffect } from "react";
import { LogOut } from 'lucide-react';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import { db } from '../firebase';

// Import komponen yang sudah dipecah
import Header from '../components/Header';
import StatsCards from '../components/StatsCards';
import DataTable from '../components/DataTable';
import Navbar from "../components/navbar";
import Piechart from "../components/Piechart";

// Import custom hooks yang sudah diupdate dengan Firebase
import { useDataManagement } from '../hooks/useDataManagement';

import "../css/AdminDashboard.css";

function SupervisorDashboard() {
  const [activePage, setActivePage] = useState("dashboard");

  // State untuk unit bisnis
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  // State untuk users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // State untuk form modal (hanya untuk edit)
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
  const [selectedUnit, setSelectedUnit] = useState("");

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
    "Samudera Agencies Indoensia": [],
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

  // Firebase functions untuk Units (fetch only - no add)
  const fetchUnits = async () => {
    try {
      setLoadingUnits(true);
      const unitsCollection = collection(db, 'units');
      const unitsSnapshot = await getDocs(unitsCollection);
      const unitsList = unitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUnits(unitsList);
    } catch (error) {
      console.error('Error fetching units:', error);
      alert('Error loading units from database');
    } finally {
      setLoadingUnits(false);
    }
  };

  // Real-time listeners
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

  // Unit management functions (EDIT ONLY - NO ADD)
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
      alert(`✅ Semua records di "${unitName}" berhasil dihapus!`);
    } catch (error) {
      console.error("Error deleting records:", error);
      alert("❌ Gagal menghapus records: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // User management functions (EDIT ONLY - NO ADD)
  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email || "",
      password: "",
      role: user.role,
      unitBisnis: user.unitBisnis || ""
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (userForm.name.trim() === "" || userForm.role.trim() === "" || userForm.unitBisnis.trim() === "") {
      alert("Nama, role, dan unit bisnis harus diisi!");
      return;
    }

    try {
      setIsLoading(true);

      if (editingUser) {
        const userRef = doc(db, 'users', editingUser.id);
        const updateData = {
          name: userForm.name,
          role: userForm.role,
          unitBisnis: userForm.unitBisnis,
          updatedAt: new Date()
        };
        if (userForm.email.trim() !== "") {
          updateData.email = userForm.email;
        }

        await updateDoc(userRef, updateData);
        alert('User berhasil diupdate!');
      }

      setShowUserModal(false);
      setUserForm({ name: "", email: "", password: "", role: "", unitBisnis: "" });
      setEditingUser(null);
    } catch (error) {
      console.error('Error saving user:', error);
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

  // Export functions
  const handleExportUnits = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "No,Nama Unit,Jumlah User\n"
      + units.map((unit, index) => {
        const userCount = users.filter(user => user.unitBisnis === unit.name).length;
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
        `${index + 1},"${user.name}","${user.email || '-'}","${user.role}","${user.unitBisnis || '-'}"`
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
          <h2 className="h1">Supervisor Panel</h2>
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
                title="Dashboard"
              />

              {/* Loading indicator */}
              {dataLoading && (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading real-time data...</p>
                </div>
              )}

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
              <Piechart
                data={currentData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            </div>
          )}

          {/* Unit Management Page - NO ADD BUTTON */}
          {activePage === "unit" && (
            <div className="unit-page">
              <div className="isian">
                {/* REMOVED: Add Unit button */}
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
                        <td colSpan="5" className="text-center-placeholder">
                          Tidak ada unit bisnis dalam database.
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

          {/* User Management Page - NO ADD BUTTON */}
          {activePage === "user" && (
            <div>
              <div className="isian">
                {/* REMOVED: Add User button */}
                <button className="button-3" onClick={handleExportUsers} disabled={users.length === 0}>
                  Ekspor Data
                </button>
              </div>

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
                      <th>Status Unit</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center-placeholder">
                          Tidak ada user dalam database.
                        </td>
                      </tr>
                    ) : (
                      users.map((user, index) => {
                        const unitExists = units.some(unit => unit.name === user.unitBisnis);
                        return (
                          <tr key={user.id}>
                            <td>{index + 1}</td>
                            <td>{user.name}</td>
                            <td>{user.email || '-'}</td>
                            <td>
                              <span className={`role-badge ${user.role === 'Super Admin' ? 'super-admin' :
                                user.role === 'Manager' ? 'manager' :
                                  user.role === 'Supervisor' ? 'supervisor' :
                                    'user'
                                }`}>
                                {user.role}
                              </span>
                            </td>
                            <td>{user.unitBisnis || '-'}</td>
                            <td>
                              {unitExists ? (
                                <span className="unit-status-active">✓ Aktif</span>
                              ) : (
                                <span className="unit-status-inactive">⚠ Unit dihapus</span>
                              )}
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

      {/* Edit Unit Modal */}
      {showUnitModal && (
        <div className="modal-overlay" onClick={() => setShowUnitModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit Unit Bisnis</h2>
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
                {isLoading ? 'Saving...' : "Update"}
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

      {/* Edit User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Edit User</h2>
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
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="Email (opsional untuk edit)"
                disabled={isLoading}
              />
            </div>
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
              <label>Unit Bisnis:</label>
              <select
                value={userForm.unitBisnis}
                onChange={(e) => setUserForm({ ...userForm, unitBisnis: e.target.value })}
                disabled={isLoading}
              >
                <option value="">Pilih Unit Bisnis</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.name}>
                    {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-buttons">
              <button onClick={handleSaveUser} className="btn-save" disabled={isLoading}>
                {isLoading ? 'Saving...' : "Update"}
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

export default SupervisorDashboard;