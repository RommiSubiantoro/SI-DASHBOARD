// src/components/UserModal.jsx
import React from "react";
import Select from "react-select";

const UserModal = ({
  show,
  onClose,
  onSave,
  form,
  setForm,
  loading,
  editing,
  units,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {editing ? "Edit User" : "Tambah User"}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama:
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Masukkan nama user"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>

            {!editing && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email:
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="Masukkan email"
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password:
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Masukkan password"
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role:
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">Pilih Role</option>
                <option value="GA/FS">GA/FS</option>
                <option value="Operation">Operation</option>
                <option value="User">User</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
                <option value="Super Admin">Super Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Unit Bisnis:
              </label>
              <Select
                isMulti
                options={units.map((unit) => ({
                  value: unit.name,
                  label: unit.name,
                }))}
                value={(form.unitBisnis || []).map((u) => ({
                  value: u,
                  label: u,
                }))}
                onChange={(selected) =>
                  setForm({ ...form, unitBisnis: selected.map((s) => s.value) })
                }
                isDisabled={loading}
                className="text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : editing ? "Update" : "Simpan"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserModal;
