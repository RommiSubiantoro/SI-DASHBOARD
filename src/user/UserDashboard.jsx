import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Download, Upload, Plus, FileText, BarChart3, Target, TrendingUp } from 'lucide-react';
import * as XLSX from 'xlsx';
import "../css/UserDashboard.css"


const UserDashboard = () => {
  const [selectedUnit, setSelectedUnit] = useState('Unit A');
  const [showAddModal, setShowAddModal] = useState(false);
  const [data, setData] = useState({
    'Unit A': [
      { month: 'Jan', revenue: 45000, expenses: 32000, profit: 13000, target: 50000 },
      { month: 'Feb', revenue: 52000, expenses: 35000, profit: 17000, target: 50000 },
      { month: 'Mar', revenue: 48000, expenses: 33000, profit: 15000, target: 50000 },
      { month: 'Apr', revenue: 61000, expenses: 40000, profit: 21000, target: 60000 },
      { month: 'May', revenue: 55000, expenses: 38000, profit: 17000, target: 60000 },
      { month: 'Jun', revenue: 67000, expenses: 42000, profit: 25000, target: 60000 },
    ],
    'Unit B': [
      { month: 'Jan', revenue: 38000, expenses: 28000, profit: 10000, target: 45000 },
      { month: 'Feb', revenue: 43000, expenses: 30000, profit: 13000, target: 45000 },
      { month: 'Mar', revenue: 41000, expenses: 29000, profit: 12000, target: 45000 },
      { month: 'Apr', revenue: 52000, expenses: 35000, profit: 17000, target: 55000 },
      { month: 'May', revenue: 48000, expenses: 33000, profit: 15000, target: 55000 },
      { month: 'Jun', revenue: 58000, expenses: 38000, profit: 20000, target: 55000 },
    ],
    'Unit C': [
      { month: 'Jan', revenue: 32000, expenses: 25000, profit: 7000, target: 35000 },
      { month: 'Feb', revenue: 36000, expenses: 27000, profit: 9000, target: 35000 },
      { month: 'Mar', revenue: 34000, expenses: 26000, profit: 8000, target: 35000 },
      { month: 'Apr', revenue: 42000, expenses: 30000, profit: 12000, target: 40000 },
      { month: 'May', revenue: 39000, expenses: 28000, profit: 11000, target: 40000 },
      { month: 'Jun', revenue: 47000, expenses: 32000, profit: 15000, target: 40000 },
    ],
  });

  const [newRecord, setNewRecord] = useState({
    month: '',
    revenue: '',
    expenses: '',
    target: ''
  });

  const units = ['Unit A', 'Unit B', 'Unit C'];
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

 
  const currentData = data[selectedUnit] || [];
  const totalRevenue = currentData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = currentData.reduce((sum, item) => sum + item.expenses, 0);
  const totalProfit = currentData.reduce((sum, item) => sum + item.profit, 0);
  const avgTarget = currentData.reduce((sum, item) => sum + item.target, 0) / currentData.length;

 
  const pieData = [
    { name: 'Revenue', value: totalRevenue, color: '#4facfe' },
    { name: 'Expenses', value: totalExpenses, color: '#ff6b6b' },
    { name: 'Profit', value: totalProfit, color: '#43e97b' },
  ];

  const handleAddData = () => {
    if (newRecord.month && newRecord.revenue && newRecord.expenses && newRecord.target) {
      const revenue = parseInt(newRecord.revenue);
      const expenses = parseInt(newRecord.expenses);
      const target = parseInt(newRecord.target);
      const profit = revenue - expenses;

      const updatedData = {
        ...data,
        [selectedUnit]: [
          ...data[selectedUnit],
          {
            month: newRecord.month,
            revenue,
            expenses,
            profit,
            target
          }
        ]
      };
      
      setData(updatedData);
      setNewRecord({ month: '', revenue: '', expenses: '', target: '' });
      setShowAddModal(false);
      
      
      console.log('Data saved to Firebase:', updatedData);
    }
  };

  const handleExportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(currentData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedUnit);
    XLSX.writeFile(wb, `${selectedUnit}_data.xlsx`);
  };

  const handleExportPDF = () => {
    
    alert(`Exporting ${selectedUnit} data to PDF...`);
  };

  const handleImportData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const importedData = XLSX.utils.sheet_to_json(sheet);
          
          const processedData = importedData.map(row => ({
            month: row.month || row.Month || '',
            revenue: parseInt(row.revenue || row.Revenue || 0),
            expenses: parseInt(row.expenses || row.Expenses || 0),
            profit: parseInt(row.profit || row.Profit || (row.revenue || row.Revenue || 0) - (row.expenses || row.Expenses || 0)),
            target: parseInt(row.target || row.Target || 0)
          }));

          setData({
            ...data,
            [selectedUnit]: processedData
          });
          
          alert('Data berhasil diimport!');
        } catch (error) {
          alert('Error importing file: ' + error.message);
        };



      };
      reader.readAsBinaryString(file);
    }
  };

  return (
    <div className="Container-usr">
      <div className="body">
        {/* Header */}
        <div className="header">
          <h1 className="title-header">
            Selamat Datang Didashboard
          </h1>
          
          {/* Unit Selector */}
          <div className="unit selector">
            {units.map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnit(unit)}
                className={`button-selector ${
                  selectedUnit === unit
                    ? 'select-unit1'
                    : 'select-unit2'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="control">
          <div className="control-1">
            <button
              onClick={() => setShowAddModal(true)}
              className="button-control"
            >
              <Plus size={20} />
              Add Data
            </button>
            
            <label className="label-control">
              <Upload size={20} />
              Import Excel
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
            
            <button
              onClick={handleExportExcel}
              className="button-excel"
            >
              <Download size={20} />
              Export Excel
            </button>
            
            <button
              onClick={handleExportPDF}
              className="button-pdf"
            >
              <FileText size={20} />
              Export PDF
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="revenue-stats">
            <div className="body-text">
              <div>
                <p className="textstats-1">Total Revenue</p>
                <p className="textstats-2">Rp {totalRevenue.toLocaleString()}</p>
              </div>
              <TrendingUp size={32} className="barchart-revenue" />
            </div>
          </div>
          
          <div className="stats-cards-2">
            <div className="body-text-expenses">
              <div>
                <p className="text-expenses1">Total Expenses</p>
                <p className="text-expenses2">Rp {totalExpenses.toLocaleString()}</p>
              </div>
              <BarChart3 size={32} className="bart-chart-expenses" />
            </div>
          </div>
          
          <div className="stats-card-profit">
            <div className="stats-card-3">
              <div>
                <p className="text-profit-1">Total Profit</p>
                <p className="text-profit-2">Rp {totalProfit.toLocaleString()}</p>
              </div>
              <Target size={32} className="bar-chart-profit" />
            </div>
          </div>
          
          <div className="stats-card-avg">
            <div className="stats-card-4">
              <div>
                <p className="text-avg-1">Avg Target</p>
                <p className="text-avg-2">Rp {Math.round(avgTarget).toLocaleString()}</p>
              </div>
              <TrendingUp size={32} className="bar-chart-avg" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="body-charts">
          {/* Line Chart */}
          <div className="line-chart">
            <h3 className="judul-line-chart">Revenue vs Target Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#4facfe" strokeWidth={3} />
                <Line type="monotone" dataKey="target" stroke="#ff6b6b" strokeWidth={3} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="body-barchart">
            <h3 className="text-revenuevsepenses">Revenue vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={currentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#4facfe" />
                <Bar dataKey="expenses" fill="#ff6b6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart and Data Table */}
        <div className="body-piechat&table">
          {/* Pie Chart */}
          <div className="body-piechart">
            <h3 className="judul-piechart">Financial Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Data Table */}
          <div className="body-datatable">
            <h3 className="text-datatable">Data Table - {selectedUnit}</h3>
            <div className="body-table">
              <table className="table-datatable">
                <thead>
                  <tr className="listmonth-datatable">
                    <th className="datatable-1">Month</th>
                    <th className="datatable-2">Revenue</th>
                    <th className="datatable-3">Expenses</th>
                    <th className="datatable-4">Profit</th>
                    <th className="datatable-5">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.map((row, index) => (
                    <tr key={index} className="table-data">
                      <td className="table-1">{row.month}</td>
                      <td className="table-2">Rp {row.revenue.toLocaleString()}</td>
                      <td className="table-3">Rp {row.expenses.toLocaleString()}</td>
                      <td className="table-4">Rp {row.profit.toLocaleString()}</td>
                      <td className="table-5">Rp {row.target.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add Data Modal */}
        {showAddModal && (
          <div className="container-addmodal">
            <div className="body-addmodal">
              <h3 className="judul-addmodal">Add New Data</h3>
              <div className="input-addmodal">
                <input
                  type="text"
                  placeholder="Month"
                  value={newRecord.month}
                  onChange={(e) => setNewRecord({...newRecord, month: e.target.value})}
                  className="input-modal1"
                />
                <input
                  type="number"
                  placeholder="Revenue"
                  value={newRecord.revenue}
                  onChange={(e) => setNewRecord({...newRecord, revenue: e.target.value})}
                  className="input-modal1"
                />
                <input
                  type="number"
                  placeholder="Expenses"
                  value={newRecord.expenses}
                  onChange={(e) => setNewRecord({...newRecord, expenses: e.target.value})}
                  className="input-modal1"
                />
                <input
                  type="number"
                  placeholder="Target"
                  value={newRecord.target}
                  onChange={(e) => setNewRecord({...newRecord, target: e.target.value})}
                  className="input-modal1"
                />
              </div>
              <div className="body-button-addmodal">
                <button
                  onClick={handleAddData}
                  className="button-addmodal1"
                >
                  Add Data
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="button-addmodal1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
