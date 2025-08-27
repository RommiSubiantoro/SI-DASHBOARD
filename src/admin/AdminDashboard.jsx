import React, { useState } from "react";
import "../css/AdminDashboard.css"

function AdminDashboard() {
  const [activePage, setActivePage] = useState("dashboard");

  // Data dummy untuk unit bisnis
  const [units, setUnits] = useState([
    { id: 1, name: "Makassar Jaya Samudera" },
    { id: 2, name: "Samudera Makassar Logistik" },
    { id: 3, name: "Kendari Jaya Samudera" },
    { id: 4, name: "Samudera Kendari Logistik" },
    { id: 5, name: "Samudera Agenci Indonesia" },
    { id: 6, name: "Samudera Perdana" },
    { id: 7, name: "Masaji Kargosentra Tama" },
    { id: 8, name: "Silkargo Indonesia" },
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: "Admin", role: "Super Admin" },
    { id: 2, name: "Budi", role: "user" },
    { id: 3, name: "Siti", role: "supervisor" },
    { id: 4, name: "Siti", role: "Manager" },
  ]);

  // State untuk form modal
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [unitForm, setUnitForm] = useState({ name: "" });
  const [userForm, setUserForm] = useState({ name: "", role: "" });

  // Fungsi untuk Unit Bisnis
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

  const handleSaveUnit = () => {
    if (unitForm.name.trim() === "") {
      alert("Nama unit tidak boleh kosong!");
      return;
    }

    if (editingUnit) {
      // Update unit yang sudah ada
      setUnits(units.map(unit => 
        unit.id === editingUnit.id 
          ? { ...unit, name: unitForm.name }
          : unit
      ));
    } else {
      // Tambah unit baru
      const newId = Math.max(...units.map(u => u.id)) + 1;
      setUnits([...units, { id: newId, name: unitForm.name }]);
    }
    
    setShowUnitModal(false);
    setUnitForm({ name: "" });
    setEditingUnit(null);
  };

  const handleDeleteUnit = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus unit ini?")) {
      setUnits(units.filter((u) => u.id !== id));
    }
  };

  // Fungsi untuk User
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({ name: "", role: "" });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ name: user.name, role: user.role });
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    if (userForm.name.trim() === "" || userForm.role.trim() === "") {
      alert("Nama dan role tidak boleh kosong!");
      return;
    }

    if (editingUser) {
      // Update user yang sudah ada
      setUsers(users.map(user => 
        user.id === editingUser.id 
          ? { ...user, name: userForm.name, role: userForm.role }
          : user
      ));
    } else {
      // Tambah user baru
      const newId = Math.max(...users.map(u => u.id)) + 1;
      setUsers([...users, { 
        id: newId, 
        name: userForm.name, 
        role: userForm.role 
      }]);
    }
    
    setShowUserModal(false);
    setUserForm({ name: "", role: "" });
    setEditingUser(null);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="Container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2 className="h1">Admin Panel</h2>
        <button
          className="button-1"
          onClick={() => setActivePage("dashboard")}
        >
          Home
        </button>
        <button
          className="button-1"
          onClick={() => setActivePage("unit")}
        >
          Manage Unit Bisnis
        </button>
        
        <button
          className="button-1"
          onClick={() => setActivePage("user")}
        >
          Manage User
        </button>
      </div>

      {/* Konten */}
      <div className="Konten">
        {activePage === "dashboard" && (
          <div>
            <h1 className="judul">Dashboard</h1>
            <p>Selamat datang di dashboard admin </p>
          </div>
        )}

        {activePage === "unit" && (
          <div>
            <h1 className="judul-1">Manage Unit Bisnis</h1>
            <div className="isian">
              <button className="button-2" onClick={handleAddUnit}>
                + Tambah Unit
              </button>
              <button className="button-3">
                Ekspor Data
              </button>
            </div>
            <table className="tabel-3">
              <thead className="thead">
                <tr>
                  <th className="p-2">No</th>
                  <th className="p-2">Nama Unit</th>
                  <th className="p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, index) => (
                  <tr key={unit.id} className="border-b">
                    <td className="p-2 text-center">{index + 1}</td>
                    <td className="p-2">{unit.name}</td>
                    <td className="p-2 space-x-2 text-center">
                      <button 
                        onClick={() => handleEditUnit(unit)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activePage === "user" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Manage User</h1>
            <button 
              onClick={handleAddUser}
              className="bg-green-600 text-white px-4 py-2 rounded mb-3"
            >
              + Tambah User
            </button>
            <table className="w-full bg-white shadow rounded">
              <thead className="bg-gray-800 text-white">
                <tr>
                  <th className="p-2">No</th>
                  <th className="p-2">Nama</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className="border-b">
                    <td className="p-2 text-center">{index + 1}</td>
                    <td className="p-2">{user.name}</td>
                    <td className="p-2">{user.role}</td>
                    <td className="p-2 space-x-2 text-center">
                      <button 
                        onClick={() => handleEditUser(user)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                onChange={(e) => setUnitForm({...unitForm, name: e.target.value})}
                placeholder="Masukkan nama unit bisnis"
              />
            </div>
            <div className="modal-buttons">
              <button onClick={handleSaveUnit} className="btn-save">
                {editingUnit ? "Update" : "Simpan"}
              </button>
              <button onClick={() => setShowUnitModal(false)} className="btn-cancel">
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
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                placeholder="Masukkan nama user"
              />
            </div>
            <div className="form-group">
              <label>Role:</label>
              <select
                value={userForm.role}
                onChange={(e) => setUserForm({...userForm, role: e.target.value})}
              >
                <option value="">Pilih Role</option>
                <option value="user">User</option>
                <option value="supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>
            <div className="modal-buttons">
              <button onClick={handleSaveUser} className="btn-save">
                {editingUser ? "Update" : "Simpan"}
              </button>
              <button onClick={() => setShowUserModal(false)} className="btn-cancel">
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