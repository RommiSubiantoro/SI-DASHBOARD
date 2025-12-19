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
  getDoc,
  setDoc,
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

function JoEstimasi() {
  const [mode, setMode] = useState("estimasi");
  const [header, setHeader] = useState({
    CodeJo: "",
    noJobOrder: "",
    namaCustomer: "",
    unitBisnis: "", // Tambahan untuk pilih unit bisnis
    alamatPrincipal: "",
    commodity: "",
    service: "",
    serviceItems: [], // Array untuk menyimpan multiple service
    uraianPekerjaan: "",
    tglMulai: "",
    tglSelesai: "",
    namaKapal: "",
    tujuan: "",
    noContainer: "",
    bookingNo: "",
    buyer: "",
    terminTax: "exclude",
  });

  // Daftar unit bisnis (sama dengan di JoVolume)
  const unitBisnisList = [
    "PT Makassar Jaya Samudera",
    "PT Samudera Makassar Logistik",
    "PT Samudera Agencies Indonesia",
    "PT Masaji Kargosentra Tama",
    "PT Kendari Jaya Samudera",
    "PT Samudera Kendari Logistik",
    "PT Silkargo Indonesia",
    "PT Samudera Perdana",
  ];

  // Temporary state untuk form tambah service
  const [tempService, setTempService] = useState({
    kategori: "",
    detail: "",
    satuan: "",
    jumlah: "",
  });

  const serviceOptions = {
    "Steve Doring": [
      { label: "Break Bulk", satuan: "Ton" },
      { label: "Break Bulk", satuan: "Ft" },
      { label: "Break Bulk", satuan: "Cbm" },
      { label: "Container 20Ft", satuan: "Boxes" },
      { label: "Container 40Ft", satuan: "Boxes" },
      { label: "Curah", satuan: "KM" },
      { label: "Curah", satuan: "Ft" },
      { label: "Curah", satuan: "Cbm" },
    ],
    "Cargo Doring": [
      { label: "Break Bulk", satuan: "Ton" },
      { label: "Break Bulk", satuan: "Ft" },
      { label: "Break Bulk", satuan: "Cbm" },
      { label: "Container 20Ft", satuan: "Boxes" },
      { label: "Container 40Ft", satuan: "Boxes" },
    ],
    "Equipment Provider": [{ label: "Equipment Provider", satuan: "" }],
    "Receving Delivery": [
      { label: "Break Bulk", satuan: "Ton" },
      { label: "Break Bulk", satuan: "Ft" },
      { label: "Break Bulk", satuan: "Cbm" },
      { label: "Container 20Ft", satuan: "Boxes" },
      { label: "Container 40Ft", satuan: "Boxes" },
    ],
    "Warehousing": [{ label: "Warehousing", satuan: "Cbm" }],
    "Tally": [{ label: "Tally", satuan: "" }],
    "Erection On Base": [{ label: "Erection On Base", satuan: "" }],
    "Container MDF/RPR": [
      { label: "Repair & Cleaning", satuan: "Boxes" },
      { label: "Modifikasi Ctnr", satuan: "Boxes" },
    ],
    "Stuffing / Stripping": [{ label: "Stuffing / Stripping", satuan: "" }],
    "Other Service": [
      { label: "Project Logistic", satuan: "" },
      { label: "FCL Shipment", satuan: "" },
      { label: "LCL Shipment", satuan: "Kg" },
      { label: "Management Fee", satuan: "Doc" },
      { label: "Custom Clearance", satuan: "BL/Doc" },
      { label: "Handling Supervisi", satuan: "Project" },
      { label: "Forklit", satuan: "unit" },
      { label: "FCL Shipment", satuan: "Doc" },
      { label: "Clearance/Ops Expenses & Agency Fee", satuan: "Doc" },
    ],
  };

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

  // Fungsi untuk menambah service item
  const addServiceItem = () => {
    if (!tempService.kategori || !tempService.detail || !tempService.jumlah) {
      alert("Kategori, Detail, dan Jumlah harus diisi!");
      return;
    }

    const newItem = {
      id: Date.now(), // unique ID
      kategori: tempService.kategori,
      detail: tempService.detail,
      satuan: tempService.satuan,
      jumlah: tempService.jumlah,
    };

    setHeader((prev) => ({
      ...prev,
      serviceItems: [...(prev.serviceItems || []), newItem],
    }));

    // Reset temp form
    setTempService({
      kategori: "",
      detail: "",
      satuan: "",
      jumlah: "",
    });
  };

  // Fungsi untuk hapus service item
  const removeServiceItem = (id) => {
    setHeader((prev) => ({
      ...prev,
      serviceItems: (prev.serviceItems || []).filter((item) => item.id !== id),
    }));
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
        const nilai = parseNumberInput(item.jumlah);
        return sum + (nilai || 0);
      }, 0);
  };

  const totalA = getTotalByKategori("A");
  const totalB = getTotalByKategori("B");
  const totalC = getTotalByKategori("C");
  const totalProfit = totalA + totalB - totalC;

  const saveToFirestore = async () => {
    if (!header.noJobOrder || header.noJobOrder.trim() === "") {
      alert("No Job Order wajib diisi!");
      return;
    }

    // Validasi termin tax
    if (!header.terminTax) {
      alert("Termin Tax harus dipilih (Include atau Exclude)!");
      return;
    }

    const totals =
      mode === "estimasi"
        ? {
            totalRevenue: totalA + totalB,
            estimasiCost: totalC,
            profitEstimasi: totalProfit,
          }
        : {
            actualCost: totalC,
            profitActual: totalProfit,
          };

    const payload = {
      header,
      lineItems,
      totals,
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

      // Update JoVolume jika ada serviceItems
      if (header.serviceItems && header.serviceItems.length > 0) {
        await updateJoVolume();
      }

      resetForm();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Gagal menyimpan data: " + error.message);
    }
  };

  // Fungsi untuk update JoVolume otomatis
  const updateJoVolume = async () => {
    try {
      // Mapping dari kategori service ke kategori di JoVolume
      const categoryMapping = {
        "Steve Doring": "SteveDoring",
        "Cargo Doring": "CargoDoring",
        "Equipment Provider": "equipmentProvider",
        "Receving Delivery": "RecevingDelivery",
        "Warehousing": "warehousing",
        "Tally": "tally",
        "Erection On Base": "erection",
        "Container MDF/RPR": "containerMDF",
        "Stuffing / Stripping": "stuffing",
        "Other Service": "otherService",
      };

      // Mapping dari detail + satuan ke index row di JoVolume
      const rowMapping = {
        SteveDoring: {
          "Break Bulk-Ton": 0,
          "Break Bulk-Ft": 1,
          "Break Bulk-Cbm": 2,
          "Container 20Ft-Boxes": 3,
          "Container 40Ft-Boxes": 4,
          "Curah-KM": 5,
          "Curah-Ft": 6,
          "Curah-Cbm": 7,
        },
        CargoDoring: {
          "Break Bulk-Ton": 0,
          "Break Bulk-Ft": 1,
          "Break Bulk-Cbm": 2,
          "Container 20Ft-Boxes": 3,
          "Container 40Ft-Boxes": 4,
        },
        RecevingDelivery: {
          "Break Bulk-Ton": 0,
          "Break Bulk-Ft": 1,
          "Break Bulk-Cbm": 2,
          "Container 20Ft-Boxes": 3,
          "Container 40Ft-Boxes": 4,
        },
        equipmentProvider: {
          "Equipment Provider-": 0,
        },
        warehousing: {
          "Warehousing-Cbm": 0,
        },
        tally: {
          "Tally-": 0,
        },
        erection: {
          "Erection On Base-": 0,
        },
        containerMDF: {
          "Repair & Cleaning-Boxes": 0,
          "Modifikasi Ctnr-Boxes": 1,
        },
        stuffing: {
          "Stuffing / Stripping-": 0,
        },
        otherService: {
          "Project Logistic-": 0,
          "FCL Shipment-": 1,
          "LCL Shipment-Kg": 2,
          "Management Fee-Doc": 3,
          "Custom Clearance-BL/Doc": 4,
          "Handling Supervisi-Project": 5,
          "Forklit-unit": 6,
          "FCL Shipment-Doc": 7,
          "Clearance/Ops Expenses & Agency Fee-Doc": 8,
        },
      };

      // Ambil bulan dari tanggal mulai
      const tglMulai = header.tglMulai; // Format: DD-Mmm-YY
      let monthIndex = -1;

      if (tglMulai) {
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const parts = tglMulai.split("-");
        if (parts.length >= 2) {
          monthIndex = monthNames.indexOf(parts[1]);
        }
      }

      if (monthIndex === -1) {
        console.log("Tidak dapat menentukan bulan dari tanggal mulai");
        return;
      }

      // Tentukan unit bisnis dan tahun dari header
      const unitBisnis = header.unitBisnis; // Ambil dari pilihan unit bisnis

      if (!unitBisnis) {
        console.log("Unit Bisnis belum dipilih");
        alert(
          "⚠️ Silakan pilih Unit Bisnis terlebih dahulu untuk sync ke JoVolume"
        );
        return;
      }

      const year = new Date().getFullYear().toString();

      // Load data JoVolume yang ada
      const docId = `${unitBisnis}_${year}`;
      const docRef = doc(db, "jo_volume", docId);
      const docSnap = await getDoc(docRef);

      let volumeData;
      if (docSnap.exists()) {
        volumeData = docSnap.data().data;
      } else {
        // Inisialisasi struktur data baru jika belum ada
        volumeData = {
          SteveDoring: [
            {
              desc: "Break Bulk",
              unit: "Ton",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Break Bulk",
              unit: "Ft",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Break Bulk",
              unit: "Cbm",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Container 20Ft",
              unit: "Boxes",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Container 40Ft",
              unit: "Boxes",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Curah",
              unit: "KM",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Curah",
              unit: "Ft",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Curah",
              unit: "Cbm",
              values: Array(12).fill(""),
              total: "0",
            },
          ],
          CargoDoring: [
            {
              desc: "Break Bulk",
              unit: "Ton",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Break Bulk",
              unit: "Ft",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Break Bulk",
              unit: "Cbm",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Container 20Ft",
              unit: "Boxes",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Container 40Ft",
              unit: "Boxes",
              values: Array(12).fill(""),
              total: "0",
            },
          ],
          equipmentProvider: [
            { desc: "Equipment Provider", unit: "", values: Array(12).fill(""), total: "0" },
          ],
          RecevingDelivery: [
            {
              desc: "Break Bulk",
              unit: "Ton",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Break Bulk",
              unit: "Ft",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Break Bulk",
              unit: "Cbm",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Container 20Ft",
              unit: "Boxes",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Container 40Ft",
              unit: "Boxes",
              values: Array(12).fill(""),
              total: "0",
            },
          ],
          warehousing: [
            {
              desc: "Warehousing",
              unit: "Cbm",
              values: Array(12).fill(""),
              total: "0",
            },
          ],
          tally: [
            { desc: "Tally", unit: "", values: Array(12).fill(""), total: "0" },
          ],
          erection: [
            {
              desc: "Erection On Base",
              unit: "",
              values: Array(12).fill(""),
              total: "0",
            },
          ],
          containerMDF: [
            {
              desc: "Repair&Cleaning",
              unit: "Boxes",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Modifikasi Ctnr",
              unit: "Boxes",
              values: Array(12).fill(""),
              total: "0",
            },
          ],
          stuffing: [
            {
              desc: "Stuffing / Stripping",
              unit: "",
              values: Array(12).fill(""),
              total: "0",
            },
          ],
          otherService: [
            {
              desc: "Project Logistic",
              unit: "",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "FCL Shipment",
              unit: "",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "LCL Shipment",
              unit: "Kg",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Management Fee",
              unit: "Doc",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Custom Clearance",
              unit: "BL/Doc",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Handling Supervisi",
              unit: "Project",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Forklit",
              unit: "unit",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "FCL Shipment",
              unit: "Doc",
              values: Array(12).fill(""),
              total: "0",
            },
            {
              desc: "Clearance/Ops Expenses & Agency Fee",
              unit: "Doc",
              values: Array(12).fill(""),
              total: "0",
            },
          ],
        };
      }

      // Update data berdasarkan serviceItems
      header.serviceItems.forEach((serviceItem) => {
        const category = categoryMapping[serviceItem.kategori];
        if (!category) return;

        const key = `${serviceItem.detail}-${serviceItem.satuan}`;
        const rowIndex = rowMapping[category]?.[key];

        if (rowIndex !== undefined && volumeData[category][rowIndex]) {
          // Ambil nilai yang ada
          const currentValue =
            parseFloat(volumeData[category][rowIndex].values[monthIndex]) || 0;
          const newValue =
            parseFloat(serviceItem.jumlah.replace(/,/g, ".")) || 0;

          // Tambahkan nilai baru ke nilai yang ada
          volumeData[category][rowIndex].values[monthIndex] = (
            currentValue + newValue
          ).toString();

          // Hitung ulang total
          const total = volumeData[category][rowIndex].values.reduce(
            (sum, val) => {
              return sum + (parseFloat(val) || 0);
            },
            0
          );
          volumeData[category][rowIndex].total =
            total > 0 ? total.toFixed(2) : "0";
        }
      });

      // Simpan ke Firestore
      await setDoc(docRef, {
        unitBisnis: unitBisnis,
        year: year,
        data: volumeData,
        lastUpdated: new Date().toISOString(),
      });

      console.log("✓ Data JoVolume berhasil diupdate");
    } catch (error) {
      console.error("Error updating JoVolume:", error);
      // Tidak perlu alert agar tidak mengganggu user
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
      // Pastikan serviceItems selalu ada, jika tidak ada set ke array kosong
      setHeader({
        ...docData.header,
        serviceItems: docData.header?.serviceItems || [],
      });
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
      CodeJo: "",
      noJobOrder: "",
      namaCustomer: "",
      unitBisnis: "",
      alamatPrincipal: "",
      commodity: "",
      service: "",
      serviceItems: [],
      uraianPekerjaan: "",
      tglMulai: "",
      tglSelesai: "",
      namaKapal: "",
      tujuan: "",
      noContainer: "",
      bookingNo: "",
      buyer: "",
      terminTax: "exclude",
    });
    setLineItems([emptyLineItem()]);
    setEditingId(null);
    setEditingMode(null);
    setTempService({
      kategori: "",
      detail: "",
      satuan: "",
      jumlah: "",
    });
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
            {editingId ? "Update Data" : "Simpan Data"}
          </button>
        </div>
      </div>

      {/* Header Information */}
      <div className="mb-6 border border-gray-400 p-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="flex">
            <div className="font-semibold w-32">Code Jo</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.CodeJo}
              onChange={(e) => updateHeader("CodeJo", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            />
          </div>
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

          <div className="flex">
            <div className="font-semibold w-32">UNIT BISNIS</div>
            <div className="text-gray-600">:</div>
            <select
              value={header.unitBisnis}
              onChange={(e) => updateHeader("unitBisnis", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
            >
              <option value="">-- Pilih Unit Bisnis --</option>
              {unitBisnisList.map((unit, idx) => (
                <option key={idx} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div className="flex">
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

          {/* SERVICE - Input manual tetap ada */}
          <div className="flex">
            <div className="font-semibold w-32">SERVICE</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.service}
              onChange={(e) => updateHeader("service", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
              placeholder="Ketik manual atau pilih dropdown di bawah"
            />
          </div>

          {/* DROPDOWN SERVICE - Fitur tambahan dengan multiple select */}
          <div className="col-span-2 bg-blue-50 p-3 rounded border border-blue-200">
            <div className="font-semibold text-xs mb-2">PILIH SERVICE</div>

            {/* Form Input Service */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              <select
                value={tempService.kategori}
                onChange={(e) => {
                  setTempService({
                    kategori: e.target.value,
                    detail: "",
                    satuan: "",
                    jumlah: "",
                  });
                }}
                className="border border-gray-300 bg-white outline-none px-2 py-1 text-xs"
              >
                <option value="">-- Kategori --</option>
                {Object.keys(serviceOptions).map((service) => (
                  <option key={service} value={service}>
                    {service}
                  </option>
                ))}
              </select>

              {tempService.kategori && (
                <select
                  value={tempService.detail}
                  onChange={(e) => {
                    const selected = serviceOptions[tempService.kategori].find(
                      (opt) => opt.label === e.target.value
                    );
                    setTempService((prev) => ({
                      ...prev,
                      detail: e.target.value,
                      satuan: selected?.satuan || "",
                    }));
                  }}
                  className="border border-gray-300 bg-white outline-none px-2 py-1 text-xs"
                >
                  <option value="">-- Detail --</option>
                  {serviceOptions[tempService.kategori].map((opt, idx) => (
                    <option key={idx} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {tempService.detail && (
                <>
                  <div className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded px-2 text-xs font-semibold text-gray-700">
                    {tempService.satuan || "-"}
                  </div>
                  <input
                    type="text"
                    value={tempService.jumlah}
                    onChange={(e) =>
                      setTempService((prev) => ({
                        ...prev,
                        jumlah: e.target.value,
                      }))
                    }
                    placeholder="Jumlah"
                    className="border border-gray-300 bg-white outline-none px-2 py-1 text-xs"
                  />
                  <button
                    onClick={addServiceItem}
                    className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-600"
                  >
                    + Tambah
                  </button>
                </>
              )}
            </div>

            {/* Tabel Service Items */}
            {header.serviceItems && header.serviceItems.length > 0 && (
              <div className="bg-white border border-gray-300 rounded">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 p-1 text-left">
                        Kategori
                      </th>
                      <th className="border border-gray-300 p-1 text-left">
                        Detail
                      </th>
                      <th className="border border-gray-300 p-1 text-center">
                        Satuan
                      </th>
                      <th className="border border-gray-300 p-1 text-center">
                        Jumlah
                      </th>
                      <th className="border border-gray-300 p-1 text-center">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {header.serviceItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-1">
                          {item.kategori}
                        </td>
                        <td className="border border-gray-300 p-1">
                          {item.detail}
                        </td>
                        <td className="border border-gray-300 p-1 text-center font-semibold">
                          {item.satuan || "-"}
                        </td>
                        <td className="border border-gray-300 p-1 text-center">
                          {item.jumlah}
                        </td>
                        <td className="border border-gray-300 p-1 text-center">
                          <button
                            onClick={() => removeServiceItem(item.id)}
                            className="text-red-600 font-bold hover:text-red-800"
                          >
                            X
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex">
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
            <div className="font-semibold w-32">NO CONTAINER</div>
            <div className="text-gray-600">:</div>
            <input
              type="text"
              value={header.noContainer || ""}
              onChange={(e) => updateHeader("noContainer", e.target.value)}
              className="ml-2 flex-1 border border-gray-300 bg-white outline-none px-2 py-1"
              placeholder="Cth: CONT123"
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

          <div className="flex col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200">
            <div className="font-semibold w-32">TERMIN TAX</div>
            <div className="text-gray-600">:</div>
            <div className="ml-2 flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="terminTax"
                  value="include"
                  checked={header.terminTax === "include"}
                  onChange={(e) => updateHeader("terminTax", e.target.value)}
                  className="w-4 h-4 mr-2"
                />
                <span className="text-xs font-medium">Include</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="terminTax"
                  value="exclude"
                  checked={header.terminTax === "exclude"}
                  onChange={(e) => updateHeader("terminTax", e.target.value)}
                  className="w-4 h-4 mr-2"
                />
                <span className="text-xs font-medium">Exclude</span>
              </label>
              <span className="text-xs text-gray-600 ml-2 italic">
                Terpilih:{" "}
                <strong>{header.terminTax?.toUpperCase() || "-"}</strong>
              </span>
            </div>
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
                  <th className="border border-gray-400 p-1 text-center">
                    US$
                  </th>
                  <th className="border border-gray-400 p-1 text-center">Rp</th>
                  <th className="border border-gray-400 p-1 text-center"></th>
                  <th className="border border-gray-400 p-1"></th>
                </tr>
              </thead>
              <tbody>
                {renderSection(
                  "A",
                  "A. REVENUE",
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
                  <td
                    colSpan={7}
                    className="border border-gray-400 p-1 text-center"
                  >
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
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(doc.createdAt).toLocaleDateString("id-ID")}
                  </div>
                  <div className="text-xs text-yellow-700 font-semibold mb-2 bg-yellow-50 px-2 py-1 rounded">
                    Tax: {doc.header?.terminTax?.toUpperCase() || "N/A"}
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

export default JoEstimasi;
