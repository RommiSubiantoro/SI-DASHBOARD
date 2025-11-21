// src/components/UnitModal.jsx
import React from "react";

const UnitModal = ({
  show,
  onClose,
  onSave,
  form,
  setForm,
  loading,
  editing,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">
            {editing ? "Edit Unit Bisnis" : "Tambah Unit Bisnis"}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Unit:
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masukkan nama unit bisnis"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onSave}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : editing ? "Update" : "Simpan"}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              Batal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitModal;
