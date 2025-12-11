import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const emptyLineItem = () => ({
  kategori: "",
  keterangan: "",
  vendor: "",
  mt: "",
  cbm: "",
  satuan: "",
  hargaUsd: "",
  hargaRp: "",
  jumlah: "",
});

function formatNumber(n) {
  if (!n && n !== 0) return "";
  return Number(n).toLocaleString("id-ID");
}

function OperationalDashboard() {
  const [mode, setMode] = useState("estimasi");
  const [header, setHeader] = useState({
    noJobOrder: "",
    namaCustomer: "",
    alamatPrincipal: "",
    commodity: "",
    service: "",
    uraianPekerjaan: "",
    tglMulai: "",
    tglSelesai: "",
    namaKapal: "",
    tujuan: "",
    bookingNo: "",
    buyer: "",
  });

  const [lineItems, setLineItems] = useState([emptyLineItem()]);
  const [documents, setDocuments] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingMode, setEditingMode] = useState(null);

  // Listen to Firestore
  useEffect(() => {
    const unsubEstimasi = onSnapshot(
      collection(db, "joOperasional_estimasi"),
      (snapshot) => {
        const est = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDocuments((prev) => ({
          ...prev,
          estimasi: est,
        }));
      }
    );

    const unsubActual = onSnapshot(
      collection(db, "joOperasional_actual"),
      (snapshot) => {
        const act = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDocuments((prev) => ({
          ...prev,
          actual: act,
        }));
      }
    );

    return () => {
      unsubEstimasi();
      unsubActual();
    };
  }, []);

  useEffect(() => {
    setDocuments({ estimasi: [], actual: [] });
  }, []);

  const updateHeader = (field, value) => {
    setHeader((prev) => ({ ...prev, [field]: value }));
  };

  // Mengubah teks input menjadi angka murni
  function parseNumberInput(value) {
    if (!value) return 0;
    return Number(value.replace(/\./g, "")); // hapus titik sebelum convert
  }

  // Format angka jadi format Indonesia
  function formatNumberInput(value) {
    if (!value && value !== 0) return "";
    return Number(value).toLocaleString("id-ID");
  }

  const updateLineItem = (idx, field, rawValue) => {
    setLineItems((prev) => {
      const copy = [...prev];

      let value = rawValue;

      // Jika field numeric → parsing & formatting
      if (["mt", "hargaUsd", "hargaRp"].includes(field)) {
        const parsed = parseNumberInput(rawValue);
        value = formatNumberInput(parsed);
        copy[idx][field] = value;

        // --- Perhitungan yang benar ---
        const mt = parseNumberInput(copy[idx].mt) || 0;
        const rp = parseNumberInput(copy[idx].hargaRp) || 0;

        const total = mt * rp; // HITUNG DULU sebagai angka
        copy[idx].jumlah = formatNumberInput(total); // BARU diformat ke 1.000 dst
      } else {
        copy[idx][field] = rawValue;
      }

      return copy;
    });
  };

  const addLineItem = (kategori) => {
    const newItem = emptyLineItem();
    newItem.kategori = kategori;
    setLineItems((p) => [...p, newItem]);
  };

  const removeLineItem = (idx) => {
    setLineItems((p) => p.filter((_, i) => i !== idx));
  };

  const getTotalByKategori = (kategori) => {
    return lineItems
      .filter((item) => item.kategori === kategori)
      .reduce((sum, item) => {
        const nilai = parseNumberInput(item.jumlah); // gunakan parser yg sudah ada
        return sum + (nilai || 0);
      }, 0);
  };

  const totalA = getTotalByKategori("A");
  const totalB = getTotalByKategori("B");
  const totalC = getTotalByKategori("C");
  const totalProfit = (totalA + totalB) - totalC;

  const saveToFirestore = async () => {
    if (!header.noJobOrder || header.noJobOrder.trim() === "") {
      alert("No Job Order wajib diisi!");
      return;
    }

    const payload = {
      header,
      lineItems,
      totals: {
        totalRevenue: totalA + totalB,
        totalBiaya: totalC,
        profit: totalProfit,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const collectionName =
        mode === "estimasi" ? "joOperasional_estimasi" : "joOperasional_actual";

      if (editingId && editingMode === mode) {
        await updateDoc(doc(db, collectionName, editingId), payload);
        alert("Data berhasil diperbarui!");
        setEditingId(null);
        setEditingMode(null);
      } else {
        await addDoc(collection(db, collectionName), payload);
        alert("Data berhasil disimpan!");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  const loadForEdit = async (docId, docMode) => {
    const collectionName =
      docMode === "estimasi"
        ? "joOperasional_estimasi"
        : "joOperasional_actual";
    const docList = documents[docMode] || [];
    const docData = docList.find((d) => d.id === docId);

    if (docData) {
      setMode(docMode);
      setHeader(docData.header);
      setLineItems(docData.lineItems || [emptyLineItem()]);
      setEditingId(docId);
      setEditingMode(docMode);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const deleteDocument = async (docId, docMode) => {
    if (!window.confirm("Yakin ingin menghapus dokumen ini?")) return;

    try {
      const collectionName =
        docMode === "estimasi"
          ? "joOperasional_estimasi"
          : "joOperasional_actual";
      await deleteDoc(doc(db, collectionName, docId));
      alert("Data berhasil dihapus!");
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Gagal menghapus data: " + error.message);
    }
  };

  const resetForm = () => {
    setHeader({
      noJobOrder: "",
      namaCustomer: "",
      alamatPrincipal: "",
      commodity: "",
      service: "",
      uraianPekerjaan: "",
      tglMulai: "",
      tglSelesai: "",
      namaKapal: "",
      tujuan: "",
      bookingNo: "",
      buyer: "",
    });
    setLineItems([emptyLineItem()]);
    setEditingId(null);
    setEditingMode(null);
  };

  const renderSection = (kategori, label, bgColor, totalLabel, totalColor) => {
    const sectionItems = lineItems.filter((item) => item.kategori === kategori);
    const rows = [];

    rows.push(
      <tr key={`header-${kategori}`} className={`${bgColor} font-bold`}>
        <td colSpan={9} className="border border-gray-400 p-2">
          {label}
        </td>
      </tr>
    );

    sectionItems.forEach((item, i) => {
      const actualIdx = lineItems.indexOf(item);
      rows.push(
        <tr key={`${kategori}-${i}`} className="hover:bg-gray-50">
          <td className="border border-gray-400 p-1 text-center text-xs">
            {i + 1}
          </td>
          <td className="border border-gray-400 p-1">
            <input
              value={item.keterangan}
              onChange={(e) =>
                updateLineItem(actualIdx, "keterangan", e.target.value)
              }
              className="w-full border-0 text-xs p-0 bg-transparent outline-none"
            />
          </td>
          <td className="border border-gray-400 p-1">
            <input
              value={item.vendor}
              onChange={(e) =>
                updateLineItem(actualIdx, "vendor", e.target.value)
              }
              className="w-full border-0 text-xs p-0 bg-transparent outline-none"
            />
          </td>
          <td className="border border-gray-400 p-1 text-center">
            <input
              type="text"
              value={item.mt}
              onChange={(e) => updateLineItem(actualIdx, "mt", e.target.value)}
              className="w-full border-0 text-right text-xs p-0 bg-transparent outline-none"
            />
          </td>
          <td className="border border-gray-400 p-1 text-center">
            <input
              type="text"
              value={item.cbm}
              onChange={(e) => updateLineItem(actualIdx, "cbm", e.target.value)}
              className="w-full border-0 text-right text-xs p-0 bg-transparent outline-none"
            />
          </td>
          <td className="border border-gray-400 p-1 text-right">
            <input
              type="text"
              value={item.hargaUsd}
              onChange={(e) =>
                updateLineItem(actualIdx, "hargaUsd", e.target.value)
              }
              className="w-full border-0 text-right text-xs p-0 bg-transparent outline-none"
            />
          </td>
          <td className="border border-gray-400 p-1 text-right">
            <input
              type="text"
              value={item.hargaRp}
              onChange={(e) =>
                updateLineItem(actualIdx, "hargaRp", e.target.value)
              }
              className="w-full border-0 text-right text-xs p-0 bg-transparent outline-none"
            />
          </td>
          <td className="border border-gray-400 p-1 text-right">
            <input
              type="text"
              value={item.jumlah}
              disabled
              className="w-full border-0 text-right text-xs p-0 bg-gray-100 outline-none font-semibold cursor-not-allowed"
            />
          </td>
          <td className="border border-gray-400 p-1 text-center">
            <button
              onClick={() => removeLineItem(actualIdx)}
              className="text-red-600 text-xs font-bold hover:text-red-800"
            >
              X
            </button>
          </td>
        </tr>
      );
    });

    const total = getTotalByKategori(kategori);
    rows.push(
      <tr
        key={`total-${kategori}`}
        className={`${totalColor} font-bold text-xs`}
      >
        <td colSpan={7} className="border border-gray-400 p-1 text-center">
          {totalLabel}
        </td>
        <td className="border border-gray-400 p-1 text-right">
          {total > 0 ? formatNumber(total) : ""}
        </td>
        <td className="border border-gray-400 p-1"></td>
      </tr>
    );

    return rows;
  };

  const docList = documents[mode] || [];

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Mode & Buttons */}
      <div className="mb-4 flex gap-4 items-center justify-between">
        <div>
          <label className="font-semibold text-xs mr-2">Mode:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="border border-gray-400 rounded p-2 text-xs"
          >
            <option value="estimasi">ESTIMASI</option>
            <option value="actual">ACTUAL</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button
            onClick={resetForm}
            className="px-4 py-2 bg-gray-400 text-white rounded text-xs font-semibold hover:bg-gray-500"
          >
            Reset Form
          </button>
          <button
            onClick={saveToFirestore}
            className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700"
          >
            {editingId ? "Update & Simpan" : "Simpan ke Firestore"}
          </button>
        </div>
      </div>

      {/* Header Information */}
      <div className="mb-6 border border-gray-400 p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex">
            <div className="font-semibold w-32">NO. JOB ORDER</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.noJobOrder}
              onChange={(e) => updateHeader("noJobOrder", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>
          <div className="flex">
            <div className="font-semibold w-32">NAMA CUSTOMER</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.namaCustomer}
              onChange={(e) => updateHeader("namaCustomer", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>

          <div className="flex col-span-2">
            <div className="font-semibold w-32">ALAMAT PRINCIPAL</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.alamatPrincipal}
              onChange={(e) => updateHeader("alamatPrincipal", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>

          <div className="flex">
            <div className="font-semibold w-32">COMMODITY</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.commodity}
              onChange={(e) => updateHeader("commodity", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>
          <div className="flex">
            <div className="font-semibold w-32">SERVICE</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.service}
              onChange={(e) => updateHeader("service", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>

          <div className="flex col-span-2">
            <div className="font-semibold w-32">URAIAN PEKERJAAN</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.uraianPekerjaan}
              onChange={(e) => updateHeader("uraianPekerjaan", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>

          <div className="flex">
            <div className="font-semibold w-32">TGL MULAI KEGIATAN</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.tglMulai}
              onChange={(e) => updateHeader("tglMulai", e.target.value)}
              placeholder="DD-Mmm-YY"
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>
          <div className="flex">
            <div className="font-semibold w-32">TGL SELESAI KEGIATAN</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.tglSelesai}
              onChange={(e) => updateHeader("tglSelesai", e.target.value)}
              placeholder="DD-Mmm-YY"
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>

          <div className="flex">
            <div className="font-semibold w-32">NAMA KAPAL</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.namaKapal}
              onChange={(e) => updateHeader("namaKapal", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>
          <div className="flex">
            <div className="font-semibold w-32">TUJUAN</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.tujuan}
              onChange={(e) => updateHeader("tujuan", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>

          <div className="flex">
            <div className="font-semibold w-32">BOOKING NO</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.bookingNo}
              onChange={(e) => updateHeader("bookingNo", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>
          <div className="flex">
            <div className="font-semibold w-32">BUYER</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.buyer}
              onChange={(e) => updateHeader("buyer", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table - 2 columns */}
        <div className="lg:col-span-2">
          <div className="overflow-x-auto border border-gray-400 mb-4">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-gray-300">
                  <th className="border border-gray-400 p-1">NO</th>
                  <th className="border border-gray-400 p-1 text-center">
                    KETERANGAN
                  </th>
                  <th className="border border-gray-400 p-1 text-center">
                    VENDOR
                  </th>
                  <th
                    className="border border-gray-400 p-1 text-center"
                    colSpan={2}
                  >
                    SATUAN
                  </th>
                  <th
                    className="border border-gray-400 p-1 text-center"
                    colSpan={2}
                  >
                    HARGA
                  </th>
                  <th className="border border-gray-400 p-1 text-center">
                    JUMLAH
                  </th>
                  <th className="border border-gray-400 p-1 text-center">
                    Aksi
                  </th>
                </tr>
                <tr className="bg-gray-300">
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1"></th>
                  <th className="border border-gray-400 p-1 text-center">MT</th>
                  <th className="border border-gray-400 p-1 text-center">
                    CBM
                  </th>
                  <th className="border border-gray-400 p-1 text-center">US$</th>
                  <th className="border border-gray-400 p-1 text-center">Rp</th>
                  <th className="border border-gray-400 p-1 text-center"></th>
                  <th className="border border-gray-400 p-1"></th>
                </tr>
              </thead>
              <tbody>
                {renderSection(
                  "A",
                  "A. REVENUE (EXCLUDE PPN )",
                  "bg-cyan-200",
                  "TOTAL PENERIMAAN",
                  "bg-yellow-100"
                )}
                {renderSection(
                  "B",
                  "B. REIMBURSE",
                  "bg-cyan-200",
                  "TOTAL REIMBURSE",
                  "bg-yellow-100"
                )}
                {renderSection(
                  "C",
                  "C. BIAYA ACTUAL OPERASIONAL",
                  "bg-cyan-200",
                  "TOTAL BIAYA OPERASIONAL",
                  "bg-red-100"
                )}
                {/* PROFIT ROW */}
                <tr className="bg-green-200 font-bold text-xs">
                  <td colSpan={7} className="border border-gray-400 p-1 text-center">
                    PROFIT
                  </td>
                  <td className="border border-gray-400 p-1 text-right">
                    {formatNumber(totalProfit)}
                  </td>
                  <td className="border border-gray-400 p-1"></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Simplified Add Row Buttons */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => addLineItem("A")}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded text-xs font-bold hover:bg-blue-600"
            >
              + Tambah kolom revenue
            </button>
            <button
              onClick={() => addLineItem("B")}
              className="flex-1 px-4 py-2 bg-purple-500 text-white rounded text-xs font-bold hover:bg-purple-600"
            >
              + Tambah kolom Reimburse
            </button>
            <button
              onClick={() => addLineItem("C")}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600"
            >
              + Tambah kolom operasional
            </button>
          </div>
        </div>

        {/* Document List - 1 column */}
        <div className="bg-gray-50 border border-gray-400 rounded p-4">
          <h3 className="font-bold text-xs mb-4 pb-2 border-b border-gray-400">
            DAFTAR DOKUMEN ({mode.toUpperCase()})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {docList.length === 0 ? (
              <div className="text-xs text-gray-500">Belum ada dokumen</div>
            ) : (
              docList.map((doc) => (
                <div
                  key={doc.id}
                  className="border border-gray-300 rounded p-2 bg-white"
                >
                  <div className="font-semibold text-xs text-gray-800">
                    {doc.header?.noJobOrder}
                  </div>
                  <div className="text-xs text-gray-600">
                    {doc.header?.namaCustomer}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(doc.createdAt).toLocaleDateString("id-ID")}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => loadForEdit(doc.id, mode)}
                      className="flex-1 px-2 py-1 bg-yellow-300 text-gray-800 rounded text-xs font-medium hover:bg-yellow-400"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id, mode)}
                      className="flex-1 px-2 py-1 bg-red-400 text-white rounded text-xs font-medium hover:bg-red-500"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OperationalDashboard;