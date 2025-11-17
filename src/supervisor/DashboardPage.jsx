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
    <div className="space-y-6 pt-16">
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
          <div className="w-full flex flex-col lg:flex-row gap-6">
            <div className="flex-1 p-2 shadow rounded-lg bg-white">
              <Piechart
                data={currentData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
              />
            </div>
            <div className="flex-1 p-2 shadow rounded-lg bg-white">
              <Barchart data={currentData} selectedYear={selectedYear} />
            </div>
          </div>

          <div className="w-full mt-6">
            <div className="p-2 shadow rounded-lg bg-white">
              <Linechart data={currentData} selectedYear={selectedYear} />
            </div>
          </div>
        </ExporttableChart>
      </div>
    </div>
  );
};

export default DashboardPage;
