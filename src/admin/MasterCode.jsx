// src/components/MasterCode.jsx
import React, { useState, useEffect } from "react";

const MasterCode = ({
  codes = [],
  categories = [],
  loading = false,
  onAddCode,
  onEditCode,
  onDeleteCode,
}) => {
  const [editing, setEditing] = useState(null);
  const [code, setCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [primaryCategory, setPrimaryCategory] = useState(""); // kategori utama
  const [description, setDescription] = useState(""); // deskripsi tambahan

  useEffect(() => {
    if (editing) {
      setCode(editing.code || "");
      setAccountName(editing.accountName || "");
      setPrimaryCategory(editing.category || "");
      setDescription(
        Array.isArray(editing.description)
          ? editing.description.join(", ")
          : editing.description || ""
      );
    } else {
      setCode("");
      setAccountName("");
      setPrimaryCategory("");
      setDescription("");
    }
  }, [editing]);

  const save = async () => {
    if (!primaryCategory) return alert("Pilih kategori utama");
    if (!code.trim()) return alert("Kode tidak boleh kosong");
    if (!accountName.trim()) return alert("Account Name tidak boleh kosong");
    if (!description.trim()) return alert("Deskripsi tidak boleh kosong");

    const payload = {
      category: primaryCategory,
      code: code.trim(),
      accountName: accountName.trim(),
      description: description.trim(),
    };

    if (editing) {
      await onEditCode({ ...editing, ...payload });
    } else {
      await onAddCode(payload);
    }

    setEditing(null);
    setCode("");
    setAccountName("");
    setPrimaryCategory("");
    setDescription("");
  };

  return (
    <div className="space-y-6 min-h-screen mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Master Code</h1>
        </div>

        {/* 🔹 Form input (Category di depan, Description di belakang) */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          {/* Category */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Description
            </label>
            <select
              value={primaryCategory}
              onChange={(e) => setPrimaryCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Pilih Description</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Code */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Kode (mis. 52101)"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Account Name
            </label>
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Nama akun (mis. Agency Fee)"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              CATEGORY
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi tambahan..."
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={save}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            {editing ? "Update Code" : "Simpan Code"}
          </button>
          {editing && (
            <button
              onClick={() => setEditing(null)}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg"
            >
              Batal
            </button>
          )}
        </div>

        {/* 🔹 Tabel daftar code (Category di depan, Description di belakang) */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-2 text-left">No</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-left">Account Name</th>
                <th className="px-4 py-2 text-left">CATEGORY</th>
                <th className="px-4 py-2 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center">
                    Loading...
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center">
                    Belum ada code.
                  </td>
                </tr>
              ) : (
                codes.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{c.category}</td>
                    <td className="px-4 py-3">{c.code}</td>
                    <td className="px-4 py-3">{c.accountName}</td>
                    <td className="px-4 py-3">
                      {Array.isArray(c.description)
                        ? c.description.join(", ")
                        : c.description || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(c)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Hapus code "${c.code}"?`))
                              onDeleteCode(c);
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

export default MasterCode;
