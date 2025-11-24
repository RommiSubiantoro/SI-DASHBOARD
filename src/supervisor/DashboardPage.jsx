import React, { useState } from "react";
import Header from "../components/Header";
import ExporttableChart from "../components/ExporttableChart";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
import Linechart from "../components/Linechart";

const DashboardPage = ({
  selectedUnit,
  setSelectedUnit,
  units,
  selectedYear,
  setSelectedYear,
  currentData,
}) => {
  const [selectedMonth, setSelectedMonth] = useState("Jan");

  return (
    <div className="space-y-6 pt-10">
      <Header
        selectedUnit={selectedUnit}
        setSelectedUnit={setSelectedUnit}
        units={units.map((unit) => unit.name)}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        title="Management Report"
      />

      <div className="w-full flex flex-col gap-6">
        <ExporttableChart
          currentData={currentData}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        >
          {/* Row Chart: Pie + Bar */}
          <div className="w-full flex flex-col lg:flex-row gap-6">
            <div className="flex-1 p-2 shadow rounded-lg bg-white min-h-[300px]">
              <Piechart
                data={currentData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            </div>
            <div className="flex-1 p-2 shadow rounded-lg bg-white min-h-[300px]">
              <Barchart data={currentData} selectedYear={selectedYear} />
            </div>
          </div>

          {/* Line Chart Full Width */}
          <div className="w-full mt-6">
            <div className="p-2 shadow rounded-lg bg-white min-h-[300px]">
              <Linechart data={currentData} selectedYear={selectedYear} />
            </div>
          </div>
        </ExporttableChart>
      </div>
    </div>
  );
};

export default DashboardPage;
