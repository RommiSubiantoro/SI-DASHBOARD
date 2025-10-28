import React, { useState } from "react";

const UnitModal = ({ show, setShow, editingUnit, setEditingUnit, isLoading }) => {
  const [unitName, setUnitName] = useState(editingUnit?.name || "");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            {editingUnit ? "Edit Unit Bisnis" : "Tambah Unit Bisnis"}
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Unit:
            </label>
            <input
              type="text"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              placeholder="Masukkan nama unit bisnis"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShow(false)}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
            >
              Batal
            </button>
            <button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : editingUnit ? "Update" : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitModal;
