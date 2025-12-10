import React, { useState } from "react";

// FULL CRUD VERSION
// - Tampilan tetap sama seperti sebelumnya
// - Bisa INPUT data
// - Bisa EDIT data
// - Bisa HAPUS data
// - Bisa TAMBAH baris baru
// - State tersimpan di React (bisa disambungkan ke Firebase/API nanti)

export default function OperasionalDashboard() {
  // ===== STATE DATA (BISA DIGANTI API/FIREBASE) =====
  const [header, setHeader] = useState({
    jobNo: "2794/25-11/JO",
    code: "3916CJSB01001",
    customer: "PT JAMBI SEMESTA BIOMASSA",
    principalAddress:
      "EQUITY TOWER LANTAI 40 SCBD JL. JEND SUDIRMAN KAV 52-53",
    commodity: "PALM KERNEL SHELL IN BULK",
    service: "OTHER SERVICE",
    description: "HANDLING CLEARANCE DOCUMENT",
    startDate: "27-Nov-25",
    endDate: "29-Nov-25",
    vessel: "MV KEIO CORAL",
    destination: "BELANG-BELANG, MAMUJU",
    bookingNo: "-",
    buyer: "",
  });

  const [revenue, setRevenue] = useState([
    {
      no: 1,
      desc: "HANDLING PEB AT MAMUJU 10.500,612MT @ RP 2500/MT",
      vendor: "",
      unit: "CBM",
      price: "2500",
      amount: "26251530",
    },
    {
      no: 2,
      desc: "HANDLING COO AT MAMUJU",
      vendor: "",
      unit: "DOC",
      price: "3000000",
      amount: "3000000",
    },
  ]);

  const [newRevenue, setNewRevenue] = useState({
    desc: "",
    vendor: "",
    unit: "",
    price: "",
    amount: "",
  });

  // ===== FUNGSI CRUD REVENUE =====
  const addRevenue = () => {
    if (!newRevenue.desc || !newRevenue.price) return alert("Isi minimal keterangan dan harga");
    setRevenue([
      ...revenue,
      {
        no: revenue.length + 1,
        ...newRevenue,
      },
    ]);
    setNewRevenue({ desc: "", vendor: "", unit: "", price: "", amount: "" });
  };

  const updateRevenue = (index, key, value) => {
    setRevenue((prev) => {
      const updated = [...prev];
      updated[index][key] = value;
      return updated;
    });
  };

  const deleteRevenue = (index) => {
    setRevenue((prev) => prev.filter((_, i) => i !== index));
  };

  const totalRevenue = revenue.reduce((sum, r) => sum + Number(r.amount || 0), 0).toLocaleString();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-semibold">JOB ORDER</h1>

        {/* ================= HEADER EDITABLE ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {Object.keys(header).map((key) => (
            <div key={key}>
              <p className="text-sm font-medium uppercase">{key}</p>
              <input
                value={header[key]}
                onChange={(e) => setHeader({ ...header, [key]: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>
          ))}
        </div>

        {/* ===================== R E V E N U E ===================== */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">A. REVENUE (EXCLUDE PPN)</h2>
          <table className="w-full text-sm border">
            <thead className="bg-slate-100">
              <tr>
                <th className="border p-2">NO</th>
                <th className="border p-2">KETERANGAN</th>
                <th className="border p-2">VENDOR</th>
                <th className="border p-2">SATUAN</th>
                <th className="border p-2">HARGA</th>
                <th className="border p-2">JUMLAH</th>
                <th className="border p-2">AKSI</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((r, index) => (
                <tr key={index}>
                  <td className="border p-2 text-center">{index + 1}</td>
                  <td className="border p-2">
                    <input
                      value={r.desc}
                      onChange={(e) => updateRevenue(index, "desc", e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      value={r.vendor}
                      onChange={(e) => updateRevenue(index, "vendor", e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="border p-2">
                    <input
                      value={r.unit}
                      onChange={(e) => updateRevenue(index, "unit", e.target.value)}
                      className="w-full"
                    />
                  </td>
                  <td className="border p-2 text-right">
                    <input
                      value={r.price}
                      onChange={(e) => updateRevenue(index, "price", e.target.value)}
                      className="w-full text-right"
                    />
                  </td>
                  <td className="border p-2 text-right">
                    <input
                      value={r.amount}
                      onChange={(e) => updateRevenue(index, "amount", e.target.value)}
                      className="w-full text-right"
                    />
                  </td>
                  <td className="border p-2 text-center">
                    <button
                      className="px-2 py-1 bg-red-500 text-white rounded"
                      onClick={() => deleteRevenue(index)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="border p-2 text-right font-semibold">
                  TOTAL PENDAPATAN
                </td>
                <td className="border p-2 text-right font-semibold">{totalRevenue}</td>
                <td className="border"></td>
              </tr>
            </tbody>
          </table>

          {/* ================= ADD NEW ROW ================= */}
          <div className="mt-4 p-4 bg-slate-100 rounded">
            <h3 className="font-semibold mb-2">Tambah Revenue Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                placeholder="Keterangan"
                value={newRevenue.desc}
                onChange={(e) => setNewRevenue({ ...newRevenue, desc: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                placeholder="Unit"
                value={newRevenue.unit}
                onChange={(e) => setNewRevenue({ ...newRevenue, unit: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                placeholder="Harga"
                value={newRevenue.price}
                onChange={(e) => setNewRevenue({ ...newRevenue, price: e.target.value })}
                className="p-2 border rounded"
              />
              <input
                placeholder="Jumlah"
                value={newRevenue.amount}
                onChange={(e) => setNewRevenue({ ...newRevenue, amount: e.target.value })}
                className="p-2 border rounded"
              />
              <button
                onClick={addRevenue}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>

        {/* PROFIT (HANYA DISPLAY) */}
        <div className="mt-6 text-right">
          <p className="text-xl font-semibold">PROFIT otomatis dihitung setelah biaya dimasukkan nanti</p>
        </div>
      </div>
    </div>
  );
}