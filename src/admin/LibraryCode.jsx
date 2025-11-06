import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

const LibraryCode = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 🔹 Ambil data dari Firestore
  const fetchData = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "libraryCode"));
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setData(items);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Gagal memuat data dari Firestore.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 🔹 Upload dan simpan ke Firestore
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        console.log("Excel data:", jsonData);

        for (const row of jsonData) {
          const newData = {
            code: row["Code"]?.toString().trim() || "",
            name: row["Name"] || "",
            shortName: row["Short name"] || "",
            createdAt: new Date(),
          };
          if (newData.code && newData.name) {
            await addDoc(collection(db, "libraryCode"), newData);
          }
        }

        alert("✅ Data berhasil diupload dan disimpan ke Firestore!");
        fetchData();
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Gagal upload file: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Hapus semua data di Firestore
  const handleDeleteAll = async () => {
    if (!window.confirm("Yakin ingin menghapus semua data Library Code?")) return;
    try {
      const querySnapshot = await getDocs(collection(db, "libraryCode"));
      for (const d of querySnapshot.docs) {
        await deleteDoc(doc(db, "libraryCode", d.id));
      }
      setData([]);
      alert("🗑️ Semua data berhasil dihapus!");
    } catch (err) {
      console.error("Error deleting:", err);
      alert("Gagal menghapus semua data.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg mt-6 shadow-md">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">📚 Library Code</h2>

      <div className="flex gap-4 mb-6">
        <input
          type="file"
          accept=".xlsx, .xls"
          onChange={handleFileUpload}
          className="border border-gray-300 p-2 rounded"
        />
        <button
          onClick={handleDeleteAll}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Hapus Semua
        </button>
      </div>

      {uploading && <p className="text-blue-600">Sedang mengupload dan menyimpan data...</p>}
      {loading && <p className="text-gray-600">Memuat data dari Firestore...</p>}

      <div className="overflow-x-auto mt-4">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-red-500 text-white">
            <tr>
              <th className="border px-3 py-2">Code</th>
              <th className="border px-3 py-2">Name</th>
              <th className="border px-3 py-2">Short Name</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan="3" className="text-center text-gray-500 py-4">
                  Tidak ada data tersimpan.
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id}>
                  <td className="border px-3 py-2">{item.code}</td>
                  <td className="border px-3 py-2">{item.name}</td>
                  <td className="border px-3 py-2">{item.shortName}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LibraryCode;
