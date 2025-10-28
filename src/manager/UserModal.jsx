import React, { useState } from "react";
import Select from "react-select";

const UserModal = ({
  show,
  setShow,
  editingUser,
  setEditingUser,
  units,
  isLoading,
}) => {
  const [userForm, setUserForm] = useState({
    name: editingUser?.name || "",
    email: editingUser?.email || "",
    password: "",
    role: editingUser?.role || "",
    unitBisnis: editingUser?.unitBisnis || [],
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {editingUser ? "Edit User" : "Tambah User"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama:
              </label>
              <input
                type="text"
                value={userForm.name}
                onChange={(e) =>
                  setUserForm({ ...userForm, name: e.target.value })
                }
                placeholder="Masukkan nama user"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {!editingUser && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email:
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    placeholder="Masukkan email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password:
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm({ ...userForm, password: e.target.value })
                    }
                    placeholder="Masukkan password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role:
              </label>
              <select
                value={userForm.role}
                onChange={(e) =>
                  setUserForm({ ...userForm, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Pilih Role</option>
                <option>User</option>
                <option>Supervisor</option>
                <option>Manager</option>
                <option>Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Unit Bisnis:
              </label>
              <Select
                isMulti
                options={units.map((u) => ({ value: u.name, label: u.name }))}
                value={userForm.unitBisnis.map((u) => ({
                  value: u,
                  label: u,
                }))}
                onChange={(selected) =>
                  setUserForm({
                    ...userForm,
                    unitBisnis: selected.map((s) => s.value),
                  })
                }
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShow(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Batal
            </button>
            <button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              {isLoading ? "Saving..." : editingUser ? "Update" : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
