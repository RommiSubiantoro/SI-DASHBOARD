import React, { useState } from "react";
import "./AdminDashboard.css"; // Impor file CSS

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
    { id: 8, name: "Silkargo Inodnesia" },
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: "Admin", role: "Super Admin" },
    { id: 2, name: "Budi", role: "user" },
    { id: 3, name: "Siti", role: "supervisor" },
    { id: 4, name: "Siti", role: "Manager" },
  ]);

  // Fungsi aksi
  const handleDeleteUnit = (id) => {
    setUnits(units.filter((u) => u.id !== id));
  };

  const handleDeleteUser = (id) => {
    setUsers(users.filter((u) => u.id !== id));
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-5 space-y-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>
        <button
          className="block w-full text-left hover:bg-gray-700 p-2 rounded"
          onClick={() => setActivePage("dashboard")}
        >
          Dashboard
        </button>
        <button
          className="block w-full text-left hover:bg-gray-700 p-2 rounded"
          onClick={() => setActivePage("unit")}
        >
          Manage Unit Bisnis
        </button>
        <button
          className="block w-full text-left hover:bg-gray-700 p-2 rounded"
          onClick={() => setActivePage("user")}
        >
          Manage User
        </button>
      </div>

      {/* Konten */}
      <div className="flex-1 p-6 bg-gray-100">
        {activePage === "dashboard" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p>Selamat datang di dashboard admin </p>
          </div>
        )}

        {activePage === "unit" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Manage Unit Bisnis</h1>
            <div className="flex gap-2 mb-3">
              <button className="bg-green-600 text-white px-4 py-2 rounded">
                + Tambah Unit
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded">
                Ekspor Data
              </button>
            </div>
            <table className="w-full bg-white shadow rounded">
              <thead className="bg-gray-800 text-white">
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
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded">
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
            <button className="bg-green-600 text-white px-4 py-2 rounded mb-3">
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
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded">
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
    </div>
  );
}


export default function AdminDashboard() {
  // ... kode komponen Anda yang sudah ada
}
