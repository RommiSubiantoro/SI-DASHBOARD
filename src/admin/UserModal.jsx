// src/components/UserModal.jsx
import React from "react";
import Select from "react-select";

const roleOptions = [
  { value: "GA/FS", label: "GA/FS" },
  { value: "Marketing", label: "Marketing" },
  { value: "Operation", label: "Operation" },
  { value: "User", label: "User" },
  { value: "Supervisor", label: "Supervisor" },
  { value: "Manager", label: "Manager" },
  { value: "Super Admin", label: "Super Admin" },
];

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
    <div className="fixed inset-0 bg-transparent bg-opacity-30 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          {editing ? "Edit User" : "Tambah User"}
        </h2>

        <div className="space-y-4">
          {/* Nama */}
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

          {/* Email dan Password hanya muncul saat tambah */}
          {!editing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email:
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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

          {/* Multi Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role:
            </label>
            <Select
              isMulti
              options={roleOptions}
              value={(form.role || []).map((r) => ({ value: r, label: r }))}
              onChange={(selected) =>
                setForm({ ...form, role: selected.map((s) => s.value) })
              }
              isDisabled={loading}
              className="text-sm"
            />
          </div>

          {/* Pilih Unit Bisnis */}
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

        {/* Tombol Aksi */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
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
  );
};

export default UserModal;
