import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Download, FileText, Table2, Calendar } from "lucide-react";

function JoVolume() {
  const currentYear = new Date().getFullYear().toString();
  
  const [selectedUnit, setSelectedUnit] = useState('PT Makassar Jaya Samudera');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [joEstimasiData, setJoEstimasiData] = useState([]);
  const [calculationMode, setCalculationMode] = useState('auto');
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(0); // 0-11
  
  const unitBisnisList = [
    'PT Makassar Jaya Samudera',
    'PT Samudera Makassar Logistik',
    'PT Samudera Agencies Indonesia',
    'PT Masaji Kargosentra Tama',
    'PT Kendari Jaya Samudera',
    'PT Samudera Kendari Logistik',
    'PT Silkargo Indonesia',
    'PT Samudera Perdana',
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const [volumeData, setVolumeData] = useState({
    stevedoring: [
      { desc: 'Break Bulk', unit: 'Ton', values: Array(12).fill(''), total: '0' },
      { desc: 'Break Bulk', unit: 'Ft', values: Array(12).fill(''), total: '0' },
      { desc: 'Break Bulk', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
      { desc: 'Container 20Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
      { desc: 'Container 40Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
      { desc: 'Curah', unit: 'KM', values: Array(12).fill(''), total: '0' },
      { desc: 'Curah', unit: 'Ft', values: Array(12).fill(''), total: '0' },
      { desc: 'Curah', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
    ],
    cargodoring: [
      { desc: 'Break Bulk', unit: 'Ton', values: Array(12).fill(''), total: '0' },
      { desc: 'Break Bulk', unit: 'Ft', values: Array(12).fill(''), total: '0' },
      { desc: 'Break Bulk', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
      { desc: 'Container 20Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
      { desc: 'Container 40Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
    ],
    equipmentProvider: [
      { desc: 'Break Bulk', unit: 'Ton', values: Array(12).fill(''), total: '0' },
      { desc: 'Break Bulk', unit: 'Ft', values: Array(12).fill(''), total: '0' },
      { desc: 'Break Bulk', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
      { desc: 'Container 20Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
      { desc: 'Container 40Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
    ],
    warehousing: [
      { desc: 'Warehousing', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
    ],
    tally: [
      { desc: 'Tally', unit: '', values: Array(12).fill(''), total: '0' },
    ],
    erection: [
      { desc: 'Erection On Base', unit: '', values: Array(12).fill(''), total: '0' },
    ],
    containerMDF: [
      { desc: 'Repair&Cleaning', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
      { desc: 'Modifikasi Ctnr', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
    ],
    stuffing: [
      { desc: 'Stuffing / Stripping', unit: '', values: Array(12).fill(''), total: '0' },
    ],
    otherService: [
      { desc: 'Project Logistic', unit: '', values: Array(12).fill(''), total: '0' },
      { desc: 'FCL Shipment', unit: '', values: Array(12).fill(''), total: '0' },
      { desc: 'LCL Shipment', unit: 'Kg', values: Array(12).fill(''), total: '0' },
      { desc: 'Management Fee', unit: 'Doc', values: Array(12).fill(''), total: '0' },
      { desc: 'Custom Clearance', unit: 'BL/Doc', values: Array(12).fill(''), total: '0' },
      { desc: 'Handling Supervisi', unit: 'Project', values: Array(12).fill(''), total: '0' },
      { desc: 'Forklit', unit: 'unit', values: Array(12).fill(''), total: '0' },
      { desc: 'FCL Shipment', unit: 'Doc', values: Array(12).fill(''), total: '0' },
      { desc: 'Clearance/Ops Expenses & Agency Fee', unit: 'Doc', values: Array(12).fill(''), total: '0' },
    ]
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "joOperasional_estimasi"),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setJoEstimasiData(data);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (calculationMode === 'auto') {
      calculateVolumeFromEstimasi();
    } else {
      loadManualVolumeData();
    }
  }, [selectedUnit, selectedYear, joEstimasiData, calculationMode]);

  const calculateVolumeFromEstimasi = () => {
    setLoading(true);
    
    const categoryMapping = {
      "SteveDoring": "stevedoring",
      "Cargodoring": "cargodoring",
      "Equipment Provider": "equipmentProvider",
      "Warehousing": "warehousing",
      "Tally": "tally",
      "Erection On Base": "erection",
      "Container MDF/RPR": "containerMDF",
      "Stuffing / Stripping": "stuffing",
      "Other Service": "otherService",
    };

    const rowMapping = {
      stevedoring: {
        "Break Bulk-Ton": 0, "Break Bulk-Ft": 1, "Break Bulk-Cbm": 2,
        "Container 20Ft-Boxes": 3, "Container 40Ft-Boxes": 4,
        "Curah-KM": 5, "Curah-Ft": 6, "Curah-Cbm": 7,
      },
      cargodoring: {
        "Break Bulk-Ton": 0, "Break Bulk-Ft": 1, "Break Bulk-Cbm": 2,
        "Container 20Ft-Boxes": 3, "Container 40Ft-Boxes": 4,
      },
      equipmentProvider: {
        "Break Bulk-Ton": 0, "Break Bulk-Ft": 1, "Break Bulk-Cbm": 2,
        "Container 20Ft-Boxes": 3, "Container 40Ft-Boxes": 4,
      },
      warehousing: { "Warehousing-Cbm": 0 },
      tally: { "Tally-": 0 },
      erection: { "Erection On Base-": 0 },
      containerMDF: { "Repair & Cleaning-Boxes": 0, "Modifikasi Ctnr-Boxes": 1 },
      stuffing: { "Stuffing / Stripping-": 0 },
      otherService: {
        "Project Logistic-": 0, "FCL Shipment-": 1, "LCL Shipment-Kg": 2,
        "Management Fee-Doc": 3, "Custom Clearance-BL/Doc": 4,
        "Handling Supervisi-Project": 5, "Forklit-unit": 6,
        "FCL Shipment-Doc": 7, "Clearance/Ops Expenses & Agency Fee-Doc": 8,
      },
    };

    const newVolumeData = {
      stevedoring: [
        { desc: 'Break Bulk', unit: 'Ton', values: Array(12).fill(0), total: '0' },
        { desc: 'Break Bulk', unit: 'Ft', values: Array(12).fill(0), total: '0' },
        { desc: 'Break Bulk', unit: 'Cbm', values: Array(12).fill(0), total: '0' },
        { desc: 'Container 20Ft', unit: 'Boxes', values: Array(12).fill(0), total: '0' },
        { desc: 'Container 40Ft', unit: 'Boxes', values: Array(12).fill(0), total: '0' },
        { desc: 'Curah', unit: 'KM', values: Array(12).fill(0), total: '0' },
        { desc: 'Curah', unit: 'Ft', values: Array(12).fill(0), total: '0' },
        { desc: 'Curah', unit: 'Cbm', values: Array(12).fill(0), total: '0' },
      ],
      cargodoring: [
        { desc: 'Break Bulk', unit: 'Ton', values: Array(12).fill(0), total: '0' },
        { desc: 'Break Bulk', unit: 'Ft', values: Array(12).fill(0), total: '0' },
        { desc: 'Break Bulk', unit: 'Cbm', values: Array(12).fill(0), total: '0' },
        { desc: 'Container 20Ft', unit: 'Boxes', values: Array(12).fill(0), total: '0' },
        { desc: 'Container 40Ft', unit: 'Boxes', values: Array(12).fill(0), total: '0' },
      ],
      equipmentProvider: [
        { desc: 'Break Bulk', unit: 'Ton', values: Array(12).fill(0), total: '0' },
        { desc: 'Break Bulk', unit: 'Ft', values: Array(12).fill(0), total: '0' },
        { desc: 'Break Bulk', unit: 'Cbm', values: Array(12).fill(0), total: '0' },
        { desc: 'Container 20Ft', unit: 'Boxes', values: Array(12).fill(0), total: '0' },
        { desc: 'Container 40Ft', unit: 'Boxes', values: Array(12).fill(0), total: '0' },
      ],
      warehousing: [{ desc: 'Warehousing', unit: 'Cbm', values: Array(12).fill(0), total: '0' }],
      tally: [{ desc: 'Tally', unit: '', values: Array(12).fill(0), total: '0' }],
      erection: [{ desc: 'Erection On Base', unit: '', values: Array(12).fill(0), total: '0' }],
      containerMDF: [
        { desc: 'Repair&Cleaning', unit: 'Boxes', values: Array(12).fill(0), total: '0' },
        { desc: 'Modifikasi Ctnr', unit: 'Boxes', values: Array(12).fill(0), total: '0' },
      ],
      stuffing: [{ desc: 'Stuffing / Stripping', unit: '', values: Array(12).fill(0), total: '0' }],
      otherService: [
        { desc: 'Project Logistic', unit: '', values: Array(12).fill(0), total: '0' },
        { desc: 'FCL Shipment', unit: '', values: Array(12).fill(0), total: '0' },
        { desc: 'LCL Shipment', unit: 'Kg', values: Array(12).fill(0), total: '0' },
        { desc: 'Management Fee', unit: 'Doc', values: Array(12).fill(0), total: '0' },
        { desc: 'Custom Clearance', unit: 'BL/Doc', values: Array(12).fill(0), total: '0' },
        { desc: 'Handling Supervisi', unit: 'Project', values: Array(12).fill(0), total: '0' },
        { desc: 'Forklit', unit: 'unit', values: Array(12).fill(0), total: '0' },
        { desc: 'FCL Shipment', unit: 'Doc', values: Array(12).fill(0), total: '0' },
        { desc: 'Clearance/Ops Expenses & Agency Fee', unit: 'Doc', values: Array(12).fill(0), total: '0' },
      ]
    };

    const filteredData = joEstimasiData.filter(doc => {
      const unitBisnis = doc.header?.unitBisnis;
      const tglMulai = doc.header?.tglMulai;
      if (!unitBisnis || !tglMulai) return false;
      const parts = tglMulai.split('-');
      let docYear = '';
      if (parts.length >= 3) {
        const yearShort = parts[2];
        docYear = yearShort.length === 2 ? '20' + yearShort : yearShort;
      }
      return unitBisnis === selectedUnit && docYear === selectedYear;
    });

    filteredData.forEach(doc => {
      const serviceItems = doc.header?.serviceItems || [];
      const tglMulai = doc.header?.tglMulai;
      if (!tglMulai) return;
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const parts = tglMulai.split('-');
      let monthIndex = -1;
      if (parts.length >= 2) {
        monthIndex = monthNames.indexOf(parts[1]);
      }
      if (monthIndex === -1) return;
      
      serviceItems.forEach(item => {
        const category = categoryMapping[item.kategori];
        if (!category) return;
        const key = `${item.detail}-${item.satuan}`;
        const rowIndex = rowMapping[category]?.[key];
        if (rowIndex !== undefined && newVolumeData[category][rowIndex]) {
          const value = parseFloat(item.jumlah.replace(/,/g, '.')) || 0;
          newVolumeData[category][rowIndex].values[monthIndex] += value;
        }
      });
    });

    Object.keys(newVolumeData).forEach(category => {
      newVolumeData[category].forEach(row => {
        const total = row.values.reduce((sum, val) => sum + val, 0);
        row.total = total > 0 ? total.toFixed(2) : '0';
        row.values = row.values.map(v => v > 0 ? v.toFixed(2) : '');
      });
    });

    setVolumeData(newVolumeData);
    setLoading(false);
  };

  const loadManualVolumeData = async () => {
    setLoading(true);
    try {
      const docId = `${selectedUnit}_${selectedYear}`;
      const docRef = doc(db, 'jo_volume', docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setVolumeData(docSnap.data().data);
      } else {
        calculateVolumeFromEstimasi();
      }
    } catch (error) {
      console.error("Error loading volume data:", error);
    }
    setLoading(false);
  };

  const updateValue = (category, rowIndex, monthIndex, value) => {
    setVolumeData(prev => {
      const newData = { ...prev };
      newData[category][rowIndex].values[monthIndex] = value;
      const total = newData[category][rowIndex].values.reduce((sum, val) => {
        return sum + (parseFloat(val) || 0);
      }, 0);
      newData[category][rowIndex].total = total > 0 ? total.toFixed(2) : '0';
      return newData;
    });
  };

  const saveData = async () => {
    try {
      const docId = `${selectedUnit}_${selectedYear}`;
      const docRef = doc(db, 'jo_volume', docId);
      await setDoc(docRef, {
        unitBisnis: selectedUnit,
        year: selectedYear,
        data: volumeData,
        mode: calculationMode,
        lastUpdated: new Date().toISOString()
      });
      alert('✅ Data berhasil disimpan!');
    } catch (error) {
      console.error("Error saving data:", error);
      alert('❌ Gagal menyimpan data: ' + error.message);
    }
  };

  const exportToExcel = () => {
    let csvContent = `JO VOLUME TRACKER\n`;
    csvContent += `Unit Bisnis: ${selectedUnit}\n`;
    csvContent += `Tahun: ${selectedYear}\n`;
    csvContent += `Tanggal Export: ${new Date().toLocaleString('id-ID')}\n\n`;

    const categories = [
      { key: 'stevedoring', title: 'STEVEDORING' },
      { key: 'cargodoring', title: 'CARGODORING' },
      { key: 'equipmentProvider', title: 'EQUIPMENT PROVIDER' },
      { key: 'warehousing', title: 'WAREHOUSING' },
      { key: 'tally', title: 'TALLY' },
      { key: 'erection', title: 'ERECTION ON BASE' },
      { key: 'containerMDF', title: 'CONTAINER MDF/RPR' },
      { key: 'stuffing', title: 'STUFFING / STRIPPING' },
      { key: 'otherService', title: 'OTHER SERVICE' }
    ];

    categories.forEach(cat => {
      csvContent += `\n${cat.title}\n`;
      csvContent += `Description,Unit,${months.join(',')},Total\n`;
      
      volumeData[cat.key].forEach(row => {
        const values = row.values.map(v => v || '0').join(',');
        csvContent += `"${row.desc}","${row.unit}",${values},${row.total}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `JO_Volume_${selectedUnit.replace(/\s+/g, '_')}_${selectedYear}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>JO Volume Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e40af; }
          .info { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .category-title { background-color: #e5e7eb; font-weight: bold; padding: 10px; margin-top: 20px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>📊 JO VOLUME TRACKER</h1>
        <div class="info">
          <p><strong>Unit Bisnis:</strong> ${selectedUnit}</p>
          <p><strong>Tahun:</strong> ${selectedYear}</p>
          <p><strong>Tanggal Export:</strong> ${new Date().toLocaleString('id-ID')}</p>
        </div>
    `;

    const categories = [
      { key: 'stevedoring', title: '⚓ STEVEDORING' },
      { key: 'cargodoring', title: '📦 CARGODORING' },
      { key: 'equipmentProvider', title: '🚛 EQUIPMENT PROVIDER' },
      { key: 'warehousing', title: '🏭 WAREHOUSING' },
      { key: 'tally', title: '📋 TALLY' },
      { key: 'erection', title: '🏗️ ERECTION ON BASE' },
      { key: 'containerMDF', title: '🔧 CONTAINER MDF/RPR' },
      { key: 'stuffing', title: '📦 STUFFING / STRIPPING' },
      { key: 'otherService', title: '🔹 OTHER SERVICE' }
    ];

    categories.forEach(cat => {
      htmlContent += `
        <div class="category-title">${cat.title}</div>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Unit</th>
              ${months.map(m => `<th>${m}</th>`).join('')}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      volumeData[cat.key].forEach(row => {
        htmlContent += `
          <tr>
            <td>${row.desc}</td>
            <td>${row.unit}</td>
            ${row.values.map(v => `<td>${v || '0'}</td>`).join('')}
            <td><strong>${row.total}</strong></td>
          </tr>
        `;
      });

      htmlContent += `</tbody></table>`;
    });

    htmlContent += `
        <button class="no-print" onclick="window.print()" style="padding: 10px 20px; background: #1e40af; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 20px;">Print / Save as PDF</button>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const renderTable = (category, title, bgColor) => {
    const data = volumeData[category];
    const isMonthlyView = viewMode === 'monthly';
    
    return (
      <div className="mb-6">
        <h3 className={`${bgColor} font-bold text-sm p-2 mb-2 rounded`}>{title}</h3>
        <div className="overflow-x-auto border border-gray-400">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-400 p-2 text-left">Description</th>
                <th className="border border-gray-400 p-2 text-center">Unit</th>
                {isMonthlyView ? (
                  <th className="border border-gray-400 p-2 text-center min-w-[100px]">
                    {months[selectedMonth]}
                  </th>
                ) : (
                  months.map((month, idx) => (
                    <th key={idx} className="border border-gray-400 p-2 text-center min-w-[70px]">
                      {month}
                    </th>
                  ))
                )}
                <th className="border border-gray-400 p-2 text-center bg-yellow-100">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50">
                  <td className="border border-gray-400 p-2">{row.desc}</td>
                  <td className="border border-gray-400 p-2 text-center font-semibold">
                    {row.unit}
                  </td>
                  {isMonthlyView ? (
                    <td className="border border-gray-400 p-1">
                      <input
                        type="text"
                        value={row.values[selectedMonth]}
                        onChange={(e) => updateValue(category, rowIdx, selectedMonth, e.target.value)}
                        disabled={calculationMode === 'auto'}
                        className={`w-full text-center border-0 outline-none p-1 ${
                          calculationMode === 'auto' ? 'bg-gray-100 cursor-not-allowed' : 'bg-transparent'
                        }`}
                        placeholder="0"
                      />
                    </td>
                  ) : (
                    row.values.map((value, monthIdx) => (
                      <td key={monthIdx} className="border border-gray-400 p-1">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateValue(category, rowIdx, monthIdx, e.target.value)}
                          disabled={calculationMode === 'auto'}
                          className={`w-full text-center border-0 outline-none p-1 ${
                            calculationMode === 'auto' ? 'bg-gray-100 cursor-not-allowed' : 'bg-transparent'
                          }`}
                          placeholder="0"
                        />
                      </td>
                    ))
                  )}
                  <td className="border border-gray-400 p-2 text-center font-bold bg-yellow-50">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white min-h-screen">
      <div className="mb-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-lg">
        <h1 className="text-2xl font-bold">📊 JO VOLUME TRACKER</h1>
        <p className="text-sm mt-1 opacity-90">Tracking volume operasional berdasarkan data JO Estimasi</p>
      </div>

      <div className="mb-6 bg-gray-50 border border-gray-300 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Unit Bisnis</label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full border border-gray-400 rounded p-2 text-sm"
            >
              {unitBisnisList.map((unit, idx) => (
                <option key={idx} value={unit}>{unit}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2">Tahun</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full border border-gray-400 rounded p-2 text-sm"
            >
              <option value="2023">2023</option>
              <option value="2024">2024</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Tampilan</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="w-full border border-gray-400 rounded p-2 text-sm"
            >
              <option value="all">📅 Semua Bulan</option>
              <option value="monthly">📆 Per Bulan</option>
            </select>
          </div>

          {viewMode === 'monthly' && (
            <div>
              <label className="block text-sm font-semibold mb-2">Pilih Bulan</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full border border-gray-400 rounded p-2 text-sm"
              >
                {months.map((month, idx) => (
                  <option key={idx} value={idx}>{month}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveData}
            className="px-4 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition flex items-center gap-2"
          >
            💾 Simpan
          </button>
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Table2 size={16} /> Export Excel (CSV)
          </button>
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-red-600 text-white rounded font-semibold hover:bg-red-700 transition flex items-center gap-2"
          >
            <FileText size={16} /> Export PDF
          </button>
        </div>
      </div>

      {renderTable('stevedoring', '⚓ STEVEDORING', 'bg-blue-200')}
      {renderTable('cargodoring', '📦 CARGODORING', 'bg-green-200')}
      {renderTable('equipmentProvider', '🚛 EQUIPMENT PROVIDER', 'bg-purple-200')}
      {renderTable('warehousing', '🏭 WAREHOUSING', 'bg-orange-200')}
      {renderTable('tally', '📋 TALLY', 'bg-pink-200')}
      {renderTable('erection', '🏗️ ERECTION ON BASE', 'bg-indigo-200')}
      {renderTable('containerMDF', '🔧 CONTAINER MDF/RPR', 'bg-yellow-200')}
      {renderTable('stuffing', '📦 STUFFING / STRIPPING', 'bg-red-200')}
      {renderTable('otherService', '🔹 OTHER SERVICE', 'bg-teal-200')}

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={saveData}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition shadow-lg"
        >
          💾 Simpan Semua Data
        </button>
      </div>
    </div>
  );
}

export default JoVolume;