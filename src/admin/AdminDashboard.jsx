import React, { useState, useEffect } from "react";
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
import "../css/AdminDashboard.css"
import UserDashboard from '../user/UserDashboard';
import Navbar from "..\components\Navbar";

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
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [unitForm, setUnitForm] = useState({ name: "" });
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "", unitBisnis: "" });
  const [isLoading, setIsLoading] = useState(false);

  // Dapatkan instance autentikasi
  const auth = getAuth();

  // Firebase functions untuk Units
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
          { name: "Makassar Jaya Samudera" },
          { name: "Samudera Makassar Logistik" },
          { name: "Kendari Jaya Samudera" },
          { name: "Samudera Kendari Logistik" },
          { name: "Samudera Agenci Indonesia" },
          { name: "Samudera Perdana" },
          { name: "Masaji Kargosentra Tama" },
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

  // Real-time listener untuk units
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

  // Real-time listener untuk users
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

  // Updated logout function to work with Firebase Auth
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

  // Keep the simple logout for sidebar compatibility
  const handleSimpleLogout = () => {
    handleLogout();
  };

  // Functions untuk Unit Bisnis
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
      alert(`Tidak dapat menghapus unit "${unitToDelete.name}" karena masih ada ${usersUsingUnit.length} user yang menggunakannya. Silakan pindahkan atau hapus user tersebut terlebih dahulu.`);
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

  // Functions untuk User (menggunakan Firebase)
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: "", email: "", password: "", role: "", unitBisnis: "" });
    setShowUserModal(true);
  };

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
    if (userForm.name.trim() === "" || userForm.role.trim() === "" || userForm.unitBisnis.trim() === "" || (!editingUser && (userForm.email.trim() === "" || userForm.password.trim() === ""))) {
      alert("Semua field (Nama, Email, Password, Role, dan Unit Bisnis) harus diisi!");
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
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, userForm.email, userForm.password);
        const uid = userCredential.user.uid;

        await addDoc(collection(db, 'users'), {
          uid: uid,
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          unitBisnis: userForm.unitBisnis,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        alert('User berhasil ditambahkan!');
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

  // Function untuk export data
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
      {/* Add Navbar at the top */}
      <Navbar onLogout={handleLogout} />
      
      {/* Container untuk sidebar dan content */}
      <div className="admin-body">
        {/* Sidebar */}
        <div className="sidebar">
          <h2 className="h1">Admin Panel</h2>
          <button
            className={`button-1 ${activePage === "dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("dashboard")}
          >
            Home
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
          <button
            onClick={handleSimpleLogout}
            disabled={isLoading}
            className="button-logout"
          >
            {isLoading ? (
              <div className="loading-spinner"></div>
            ) : (
              <>
                <LogOut size={20} />
                Logout
              </>
            )}
          </button>
        </div>

        {/* Konten */}
        <div className="Konten">
          {activePage === "dashboard" && (
            <div>
              <h1>Dashboard</h1>
              <p>Selamat datang di dashboard admin</p>
              <UserDashboard></UserDashboard>
            </div>
          )}

          {activePage === "unit" && (
            <div>
              <h1>Manage Unit Bisnis</h1>
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
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center-placeholder">
                          Belum ada unit bisnis. Tambahkan unit bisnis pertama Anda!
                        </td>
                      </tr>
                    ) : (
                      units.map((unit, index) => {
                        const userCount = users.filter(user => user.unitBisnis === unit.name).length;
                        return (
                          <tr key={unit.id}>
                            <td>{index + 1}</td>
                            <td>{unit.name}</td>
                            <td>
                              <span className={userCount > 0 ? "user-count-active" : "user-count-inactive"}>
                                {userCount} user
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

          {activePage === "user" && (
            <div>
              <h1>Manage User</h1>
              <div className="isian">
                <button
                  onClick={handleAddUser}
                  className="button-2"
                  disabled={isLoading || units.length === 0}
                >
                  + Tambah User
                </button>
                <button className="button-3" onClick={handleExportUsers} disabled={users.length === 0}>
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
                      <th>Status Unit</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center-placeholder">
                          Belum ada user. Tambahkan user pertama Anda!
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
                              <span className={`role-badge ${
                                user.role === 'Super Admin' ? 'super-admin' :
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

      {/* Modal untuk Unit Bisnis */}
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

      {/* Modal untuk User */}
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
            {/* Field Email dan Password hanya tampil saat Tambah User */}
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