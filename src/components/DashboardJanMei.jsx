import React, { useState } from "react";
import * as XLSX from "xlsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

function DashboardJanMei() {
  const [chartData, setChartData] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Ambil sheet "Data Act 2025"
      const sheet = workbook.Sheets["Data Act 2025"];
      const parsedData = XLSX.utils.sheet_to_json(sheet);

      // Ambil hanya kolom JAN - MAY
      const filteredData = parsedData.map((row, index) => ({
        name: row["ACCOUNT NAME"] || `Row ${index + 1}`,
        JAN: row["JAN"] || 0,
        FEB: row["FEB"] || 0,
        MAR: row["MAR"] || 0,
        APR: row["APR"] || 0,
        MAY: row["MAY"] || 0,
      }));

      setChartData(filteredData);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">📊 Dashboard Jan–Mei</h1>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />

      {chartData.length > 0 && (
        <div className="mt-6">
          <BarChart width={900} height={400} data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />

            {/* Bar per bulan */}
            <Bar dataKey="JAN" fill="#8884d8" />
            <Bar dataKey="FEB" fill="#82ca9d" />
            <Bar dataKey="MAR" fill="#ffc658" />
            <Bar dataKey="APR" fill="#ff7300" />
            <Bar dataKey="MAY" fill="#00c49f" />
          </BarChart>
        </div>
      )}
    </div>
  );
}

export default DashboardJanMei;
