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

import Header from '../components/Header';
import StatsCards from '../components/StatsCards';
import Navbar from "../components/navbar";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
import { useDataManagement } from '../hooks/useDataManagement';


function ManagerDashboard() {
  const [activePage, setActivePage] = useState("dashboard");

  // Units
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  // Users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Filter/search
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");

  // Modals
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  // Form states
  const [unitForm, setUnitForm] = useState({ name: "" });
  const [userForm, setUserForm] = useState({ name: "", role: "", unitBisnis: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard
  const [selectedUnit, setSelectedUnit] = useState("Samudera Makassar Logistik");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("2025");

  const auth = getAuth();

  const dashboardUnits = [
    "Samudera Makassar Logistik",
    "Makassar Jaya Samudera",
    "Samudera Perdana",
    "Masaji Kargosentra Utama",
    "Kendari Jaya Samudera",
    "Silkargo Indonesia",
    "Samudera Agencies Indonesia",
    "Samudera Kendari Logistik"
  ];

  const { data, isLoading: dataLoading, calculateStats } = useDataManagement({
    "Samudera Makassar Logistik": [],
    "Makassar Jaya Samudera": [],
    "Samudera Perdana": [],
    "Masaji Kargosentra Utama": [],
    "Kendari Jaya Samudera": [],
    "Silkargo Indonesia": [],
    "Samudera Agencies Indonesia": [],
    "Samudera Kendari Logistik": []
  });

  const currentData = data[selectedUnit] || [];
  const stats = calculateStats(currentData);

  // Fetch units & users real-time
  useEffect(() => {
    const unsubscribeUnits = onSnapshot(
      collection(db, 'units'),
      snapshot => setUnits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      error => console.error(error)
    );
    const unsubscribeUsers = onSnapshot(
      collection(db, 'users'),
      snapshot => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      error => console.error(error)
    );
    return () => {
      unsubscribeUnits();
      unsubscribeUsers();
    };
  }, []);

  // Logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error(error);
      alert('Error during logout: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered users
  const getFilteredUsers = () => {
    return users.filter(user => {
      const matchesSearch = searchTerm === "" ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === "" || user.role === roleFilter;
      const matchesUnit = unitFilter === "" || user.unitBisnis === unitFilter;
      return matchesSearch && matchesRole && matchesUnit;
    });
  };
  const filteredUsers = getFilteredUsers();
  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setUnitFilter("");
  };

  // Unit & User edit/delete
  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setUnitForm({ name: unit.name });
    setShowUnitModal(true);
  };
  const handleSaveUnit = async () => {
    if (!editingUnit || unitForm.name.trim() === "") return;
    try {
      setIsLoading(true);
      const unitRef = doc(db, 'units', editingUnit.id);
      await updateDoc(unitRef, { name: unitForm.name, updatedAt: new Date() });
      setShowUnitModal(false);
      setEditingUnit(null);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };
  const handleDeleteUnit = async (unit) => {
    if (!unit) return;
    if (!window.confirm(`Hapus unit "${unit.name}"?`)) return;
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, 'units', unit.id));
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ name: user.name, role: user.role, unitBisnis: user.unitBisnis });
    setShowUserModal(true);
  };
  const handleSaveUser = async () => {
    if (!editingUser) return;
    try {
      setIsLoading(true);
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, { ...userForm, updatedAt: new Date() });
      setShowUserModal(false);
      setEditingUser(null);
    } catch (error) { console.error(error); } finally { setIsLoading(false); }
  };
  const handleDeleteUser = async (id) => {
    if (!window.confirm("Hapus user ini?")) return;
    try { setIsLoading(true); await deleteDoc(doc(db, 'users', id)); } 
    catch (error) { console.error(error); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="admin">
      <Navbar onLogout={handleLogout} />
      <div className="admin-body">
        <div className="sidebar">
          <h2 className="h1">Manager Panel</h2>
          <button className={`button-1 ${activePage==="dashboard"?"active":""}`} onClick={()=>setActivePage("dashboard")}>Dashboard</button>
          <button className={`button-1 ${activePage==="unit"?"active":""}`} onClick={()=>setActivePage("unit")}>Manage Unit Bisnis</button>
          <button className={`button-1 ${activePage==="user"?"active":""}`} onClick={()=>setActivePage("user")}>Manage User</button>
        </div>

        <div className="Konten">
          {/* Dashboard */}
          {activePage==="dashboard" && (
            <div className="dashboard-content">
              <Header selectedUnit={selectedUnit} setSelectedUnit={setSelectedUnit} units={dashboardUnits} title="Manager Dashboard"/>
              <div className="unit-specific-stats">
                <h3>Detail Unit: {selectedUnit}</h3>
                <StatsCards
                  totalRevenue={stats.totalRevenue}
                  totalExpenses={stats.totalExpenses}
                  totalAct2025={stats.totalAct2025}
                  avgTarget={stats.avgTarget}
                  labels={{
                    revenue:`Act 2024 ${selectedUnit}`,
                    expenses:`Budget ${selectedUnit}`,
                    act2025:`Act 2025 ${selectedUnit}`,
                    avgTarget:`VAR YTD ${selectedUnit}`
                  }}
                />
              </div>
              <div className="charts-row">
                <Piechart data={currentData} selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} selectedYear={selectedYear} setSelectedYear={setSelectedYear}/>
                <Barchart data={currentData} selectedYear={selectedYear}/>
              </div>
            </div>
          )}

          {/* Unit Management */}
          {activePage==="unit" && (
            <div className="unit-page">
              <h1 className="title">Manage Unit Bisnis</h1>
            
                <table className="tabel-3">
                  <thead><tr><th>No</th><th>Nama Unit</th><th>Jumlah User</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {units.map((unit,index)=>{
                      const userCount = users.filter(u=>u.unitBisnis===unit.name).length;
                      return (
                        <tr key={unit.id}>
                          <td>{index+1}</td>
                          <td>{unit.name}</td>
                          <td>{userCount}</td>
                          <td>
                            <button className="edit-button" onClick={()=>handleEditUnit(unit)}>Edit</button>
                            <button className="delete-button" onClick={()=>handleDeleteUnit(unit)}>Delete</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              
            </div>
          )}

          {/* User Management */}
          {activePage==="user" && (
            <div>
              <div className="search-section">
                <input type="text" placeholder="Cari..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)}>
                  <option value="">Semua Role</option>
                  <option value="User">User</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Manager">Manager</option>
                  <option value="Super Admin">Super Admin</option>
                </select>
                <select value={unitFilter} onChange={e=>setUnitFilter(e.target.value)}>
                  <option value="">Semua Unit</option>
                  {units.map(u=><option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
                <button onClick={handleResetFilters}>Reset Filter</button>
              </div>
              
                <table className="tabel-3">
                  <thead><tr><th>No</th><th>Nama</th><th>Role</th><th>Unit Bisnis</th><th>Aksi</th></tr></thead>
                  <tbody>
                    {filteredUsers.map((user,index)=>(
                      <tr key={user.id}>
                        <td>{index+1}</td>
                        <td>{user.name}</td>
                        <td>{user.role}</td>
                        <td>{user.unitBisnis}</td>
                        <td>
                          <button className="edit-button" onClick={()=>handleEditUser(user)}>Edit</button>
                          <button className="delete-button" onClick={()=>handleDeleteUser(user.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              
            </div>
          )}
        </div>
      </div>

      {/* Unit Modal */}
      {showUnitModal && (
        <div className="modal-overlay" onClick={()=>setShowUnitModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <h2>Edit Unit Bisnis</h2>
            <input type="text" value={unitForm.name} onChange={e=>setUnitForm({name:e.target.value})}/>
            <button onClick={handleSaveUnit}>Save</button>
            <button onClick={()=>setShowUnitModal(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={()=>setShowUserModal(false)}>
          <div className="modal-content" onClick={e=>e.stopPropagation()}>
            <h2>Edit User</h2>
            <input type="text" value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})} placeholder="Nama"/>
            <select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}>
              <option value="">Pilih Role</option>
              <option value="User">User</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Manager">Manager</option>
              <option value="Super Admin">Super Admin</option>
            </select>
            <select value={userForm.unitBisnis} onChange={e=>setUserForm({...userForm,unitBisnis:e.target.value})}>
              <option value="">Pilih Unit</option>
              {units.map(u=><option key={u.id} value={u.name}>{u.name}</option>)}
            </select>
            <button onClick={handleSaveUser}>Save</button>
            <button onClick={()=>setShowUserModal(false)}>Cancel</button>
          </div>
        </div>
      )}

    </div>
  )
}

export default ManagerDashboard;
