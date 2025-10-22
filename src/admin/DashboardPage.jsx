// src/components/DashboardPage.jsx
import React from "react";
import Header from "../components/Header";
import ExporttableChart from "../components/ExporttableChart";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
import Linechart from "../components/Linechart";

const DashboardPage = ({
  selectedUnit,
  setSelectedUnit,
  selectedYear,
  setSelectedYear,
  units,
  currentData,
  selectedMonth,
  setSelectedMonth,
  handleExportExcel,
  handleImportData,
  handleExportPDF,
}) => {
  return (
    <div className="space-y-6 pt-16">
      <Header
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        units={units.map((u) => u.name)}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        title="Admin Dashboard"
      />

      <div className="w-full flex flex-col gap-6">
        <ExporttableChart
          currentData={currentData}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          onExportExcel={handleExportExcel}
          onImportData={handleImportData}
          onExportPDF={handleExportPDF}
        >
          <div className="w-full flex flex-col lg:flex-row gap-6">
            <div className="flex-1 p-2 shadow rounded-lg bg-white">
              <Piechart
                data={currentData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
              />
            </div>

            <div className="flex-1 p-2 shadow rounded-lg bg-white">
              <Barchart data={currentData} selectedYear={selectedYear} />
            </div>
          </div>

          <div className="w-full mt-6">
            <div className="p-2 shadow rounded-lg bg-white">
              <Linechart data={currentData} />
            </div>
          </div>
        </ExporttableChart>
      </div>
    </div>
  );
};

export default DashboardPage;
