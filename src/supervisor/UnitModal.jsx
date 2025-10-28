import React, { useState } from "react";

const UnitModal = ({ setShowUnitModal }) => {
  const [unitName, setUnitName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!unitName.trim()) {
      alert("Nama unit tidak boleh kosong!");
      return;
    }
    setIsLoading(true);
    alert(`Unit "${unitName}" disimpan (dummy).`);
    setIsLoading(false);
    setShowUnitModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Tambah / Edit Unit
        </h2>
        <input
          type="text"
          value={unitName}
          onChange={(e) => setUnitName(e.target.value)}
          placeholder="Masukkan nama unit"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
        />
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            {isLoading ? "Saving..." : "Simpan"}
          </button>
          <button
            onClick={() => setShowUnitModal(false)}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnitModal;
