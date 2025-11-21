// src/components/DashboardPage.jsx
import React from "react";
import Header from "../components/Header";
import ExporttableChart from "../components/ExporttableChart";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
import Linechart from "../components/Linechart";
import ControlButtons from "../components/ControlButtons";

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
  handleImportBudget,
  handleExportPDF,
}) => {
  return (
    <div className="space-y-6 pt-16 px-4 sm:px-6 lg:px-8">
      {/* === Header === */}
      <Header
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        units={units.map((u) => u.name)}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        title="Admin Dashboard"
      />

      {/* === Control Buttons === */}
      <ControlButtons
        onImportData={handleImportData}
        onImportBudget={handleImportBudget}
        onExportExcel={handleExportExcel}
        showImportButton
        showExportButtons
      />

      {/* === Charts === */}
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
          {/* Row of Pie + Bar Charts */}
          <div className="w-full flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0 p-4 shadow rounded-lg bg-white">
              <Piechart
                data={currentData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
              />
            </div>

            <div className="flex-1 min-w-0 p-4 shadow rounded-lg bg-white">
              <Barchart data={currentData} selectedYear={selectedYear} />
            </div>
          </div>

          {/* Line Chart Full Width */}
          <div className="w-full mt-6">
            <div className="p-4 shadow rounded-lg bg-white overflow-x-auto">
              <Linechart data={currentData} selectedYear={selectedYear} />
            </div>
          </div>
        </ExporttableChart>
      </div>
    </div>
  );
};

export default DashboardPage;
