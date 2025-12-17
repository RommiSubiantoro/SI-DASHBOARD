import React, { useState } from "react";

const JoRekapTable = ({ data = [] }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const formatNumber = (value) => {
    if (value === undefined || value === null) return "-";
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const mainColumns = [
    { key: "no", label: "NO." },
    { key: "CodeJo", label: "CODE JO" },
    { key: "noJoSheet", label: "NO. JO SHEET" },
    { key: "tglMulai", label: "TGL MULAI" },
    { key: "tglSelesai", label: "TGL SELESAI" },
    { key: "namaPerusahaan", label: "NAMA PERUSAHAAN" },
    { key: "service", label: "SERVICE" },
    { key: "uraianPekerjaan", label: "URAIAN PEKERJAAN" },
    { key: "vessel", label: "VESSEL" },
    { key: "nomorContainer", label: "NO. CONTAINER" },
    { key: "lokasiPekerjaan", label: "LOKASI" },
    { key: "volume", label: "VOLUME" },
    { key: "jenisCargo", label: "JENIS CARGO" },
    { key: "terminTax", label: "Termin TAX", type: "text" },
    { key: "revenue", label: "REVENUE", align: "right" },
    { key: "tax", label: "TAX", align: "right" },
    { key: "totalRevenueAfterTax", label: "TOTAL AFTER TAX", align: "right" },
    { key: "estimasiCost", label: "Estimasi Cost", align: "right" },
    { key: "actualCost", label: "Actual Cost", align: "right" },
    { key: "gpm", label: "GPM", align: "right" },
    { key: "persentaseGpm", label: "% GPM", align: "right" },
  ];

  const detailFields = [
    { label: "NO. JO SHEET", key: "noJoSheet" },
    { label: "URAIAN PEKERJAAN", key: "uraianPekerjaan" },
    { label: "VESSEL", key: "vessel" },
    { label: "NOMOR CONTAINER", key: "nomorContainer" },
    { label: "LOKASI PEKERJAAN", key: "lokasiPekerjaan" },
    { label: "VOLUME", key: "volume" },
    { label: "JENIS CARGO", key: "jenisCargo" },
    { label: "ESTIMASI COST", key: "estimasiCost" },
  ];

  // ===============================
  // HITUNG TOTAL
  // ===============================
  const totals = data.reduce(
    (acc, row) => {
      acc.revenue += Number(row.revenue || 0);
      acc.tax += Number(row.tax || 0);
      acc.totalRevenueAfterTax += Number(row.totalRevenueAfterTax || 0);
      acc.estimasiCost += Number(row.estimasiCost || 0);
      acc.actualCost += Number(row.actualCost || 0);
      acc.gpm += Number(row.gpm || 0);
      return acc;
    },
    {
      revenue: 0,
      tax: 0,
      totalRevenueAfterTax: 0,
      estimasiCost: 0,
      actualCost: 0,
      gpm: 0,
    }
  );
  const totalPersentaseGpm =
    totals.revenue > 0
      ? (((totals.revenue - totals.actualCost) / totals.revenue) * 100).toFixed(
          2
        )
      : 0;

  return (
    <div className="bg-white rounded shadow p-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border p-2 w-6">▼</th>
              {mainColumns.map((col) => (
                <th
                  key={col.key}
                  className={`border p-2 whitespace-nowrap ${
                    col.align === "right" ? "text-right" : "text-center"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && (
              <tr>
                <td
                  colSpan={mainColumns.length + 1}
                  className="text-center py-6 text-gray-400"
                >
                  Belum ada data
                </td>
              </tr>
            )}

            {data.map((row, index) => (
              <React.Fragment key={index}>
                {/* ROW UTAMA */}
                <tr
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() =>
                    setExpandedRow(expandedRow === index ? null : index)
                  }
                >
                  <td className="border text-center">
                    {expandedRow === index ? "▲" : "▼"}
                  </td>

                  {mainColumns.map((col) => (
                    <td
                      key={col.key}
                      className={`border px-2 py-1 ${
                        col.align === "right" ? "text-right" : "text-center"
                      }`}
                    >
                      {col.key === "no"
                        ? index + 1
                        : col.key === "persentaseGpm"
                        ? `${row[col.key] || 0}%`
                        : col.align === "right"
                        ? formatNumber(row[col.key])
                        : row[col.key] || "-"}
                    </td>
                  ))}
                </tr>

                {/* DETAIL */}
                {expandedRow === index && (
                  <tr className="bg-gray-100">
                    <td colSpan={mainColumns.length + 1} className="p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {detailFields.map((f) => (
                          <div key={f.key}>
                            <div className="font-semibold text-gray-600">
                              {f.label}
                            </div>
                            <div className="text-gray-800">
                              {row[f.key] || "-"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {/* ===============================
                BARIS TOTAL DI BAWAH
            =============================== */}
            {data.length > 0 && (
              <tr className="font-bold bg-yellow-100">
                <td className="border px-2 py-2 text-center" colSpan={15}>
                  TOTAL
                </td>
                <td className="border px-2 py-2 text-right">
                  {formatNumber(totals.revenue)}
                </td>
                <td className="border px-2 py-2 text-right">
                  {formatNumber(totals.tax)}
                </td>
                <td className="border px-2 py-2 text-right">
                  {formatNumber(totals.totalRevenueAfterTax)}
                </td>
                <td className="border px-2 py-2 text-right">
                  {formatNumber(totals.estimasiCost)}
                </td>
                <td className="border px-2 py-2 text-right">
                  {formatNumber(totals.actualCost)}
                </td>
                <td className="border px-2 py-2 text-right">
                  {formatNumber(totals.gpm)}
                </td>
                <td className="border px-2 py-2 text-right">
                  {totalPersentaseGpm}%
                </td>
              
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.length > 0 && (
        <div className="mt-3 text-xs text-gray-500">
          💡 Klik baris untuk melihat detail
        </div>
      )}
    </div>
  );
};

export default JoRekapTable;
