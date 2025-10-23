import React from "react";

const DashboardView = ({ currentData = [], selectedYear }) => {
  // Misal data summary per kategori
  const categories = ["Other Income (Expenses)", "Service Revenue", "Cost Of Service", "Gross Profit", "Operating Income", "NIBT"];

  // Ambil total per kategori berdasarkan currentData
  const summary = categories.map((cat) => {
    const total = currentData
      .filter((item) => item.category === cat)
      .reduce((sum, row) => sum + (row[selectedYear === "2025" ? "Dec" : "Jan"] || 0), 0);

    return { description: cat, act2024: "-", bdgt2025: "-", act2025: total || "-", aVsC: "-", bVsC: "-" };
  });

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-lg font-bold mb-4">Summary Dashboard</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">DESCRIPTION</th>
            <th className="border p-2">ACT 2024</th>
            <th className="border p-2">BDGT 2025</th>
            <th className="border p-2">ACT 2025</th>
            <th className="border p-2">A VS C</th>
            <th className="border p-2">B VS C</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="border p-2">{row.description}</td>
              <td className="border p-2 text-right">{row.act2024}</td>
              <td className="border p-2 text-right">{row.bdgt2025}</td>
              <td className="border p-2 text-right">{row.act2025}</td>
              <td className="border p-2 text-right">{row.aVsC}</td>
              <td className="border p-2 text-right">{row.bVsC}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DashboardView;
