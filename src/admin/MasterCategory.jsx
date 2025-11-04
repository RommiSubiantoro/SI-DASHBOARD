// src/components/MasterCategory.jsx
import React, { useState, useMemo } from "react";

const MasterCategory = ({
  categories = [],
  codes = [], // 🔹 data dari MasterCode
  loading = false,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  maxCategories = 6,
}) => {
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");

  const startAdd = () => {
    setEditing(null);
    setName("");
  };

  const startEdit = (cat) => {
    setEditing(cat);
    setName(cat.name);
  };

  const save = async () => {
    if (!name.trim()) return alert("Nama kategori tidak boleh kosong");
    if (!editing && categories.length >= maxCategories) {
      return alert(`Maksimal ${maxCategories} kategori diperbolehkan.`);
    }

    if (editing) {
      await onEditCategory({ ...editing, name: name.trim() });
    } else {
      await onAddCategory({ name: name.trim() });
    }

    setName("");
    setEditing(null);
  };

  // 🔹 Gabungkan MasterCategory dengan kode & accountName yang sesuai
  const categoryWithCodes = useMemo(() => {
    return categories.map((cat) => {
      const relatedCodes = codes
        .filter((code) => code.category === cat.name)
        .map((c) => c.code)
        .join(", ");

      const relatedAccounts = codes
        .filter((code) => code.category === cat.name)
        .map((c) => c.accountName)
        .join(", ");

      return { ...cat, relatedCodes, relatedAccounts };
    });
  }, [categories, codes]);

  return (
    <div className="space-y-6 min-h-screen mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Master Category</h1>
        </div>

        {/* 🔹 Form input kategori */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kategori..."
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button
              onClick={save}
              className="px-4 py-2 bg-green-600 text-white rounded-lg"
            >
              {editing ? "Update" : "Simpan"}
            </button>
            {editing && (
              <button
                onClick={() => {
                  setEditing(null);
                  setName("");
                }}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Batal
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Jumlah kategori: {categories.length} / {maxCategories}
          </p>
        </div>

        {/* 🔹 Tabel dengan kolom tambahan Account Name */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-red-500 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-white">No</th>
                <th className="px-4 py-2 text-left text-white">Nama Kategori</th>
                <th className="px-4 py-2 text-left text-white">Daftar Code</th>
                <th className="px-4 py-2 text-left text-white">Account Name</th>
                <th className="px-4 py-2 text-left text-white">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : categoryWithCodes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-6 text-center">
                    Belum ada kategori.
                  </td>
                </tr>
              ) : (
                categoryWithCodes.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{c.name}</td>

                    {/* 🔸 Daftar Code */}
                    <td className="px-4 py-3">
                      {c.relatedCodes || (
                        <span className="text-gray-400">Belum ada code</span>
                      )}
                    </td>

                    {/* 🔸 Daftar Account Name */}
                    <td className="px-4 py-3">
                      {c.relatedAccounts || (
                        <span className="text-gray-400">
                          Belum ada account name
                        </span>
                      )}
                    </td>

                    {/* 🔸 Aksi */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(c)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus kategori "${c.name}"?`))
                              onDeleteCategory(c);
                          }}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MasterCategory;
