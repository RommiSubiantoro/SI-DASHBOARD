import React, { useState } from "react";
import Select from "react-select";

const UserModal = ({ setShowUserModal, units }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    unitBisnis: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.role || form.unitBisnis.length === 0) {
      alert("Semua field wajib diisi!");
      return;
    }
    setIsLoading(true);
    alert(`User "${form.name}" disimpan (dummy).`);
    setIsLoading(false);
    setShowUserModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tambah / Edit User</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Nama"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">Pilih Role</option>
            <option value="User">User</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Manager">Manager</option>
            <option value="Super Admin">Super Admin</option>
          </select>
          <Select
            isMulti
            options={units.map((u) => ({ value: u.name, label: u.name }))}
            value={form.unitBisnis.map((u) => ({ value: u, label: u }))}
            onChange={(sel) =>
              setForm({ ...form, unitBisnis: sel.map((s) => s.value) })
            }
            className="text-sm"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            {isLoading ? "Saving..." : "Simpan"}
          </button>
          <button
            onClick={() => setShowUserModal(false)}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
