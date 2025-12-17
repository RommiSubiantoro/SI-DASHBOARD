import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from "../firebase";

const JoVolume = () => {
  const [selectedUnit, setSelectedUnit] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);

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

  const years = ['2024', '2025', '2026', '2027'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const [data, setData] = useState({
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

  // Load data dari Firestore
  const loadData = async () => {
    if (!selectedUnit || !selectedYear) return;

    try {
      const docId = `${selectedUnit}_${selectedYear}`;
      const docRef = doc(db, 'jo_volume', docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const loadedData = docSnap.data().data;
        console.log('Data loaded from Firestore:', loadedData);
        setData(loadedData);
        setMessage('✓ Data berhasil dimuat');
        setTimeout(() => setMessage(''), 3000);
      } else {
        console.log('No data found for:', docId);
        setMessage('⚠ Tidak ada data, silakan mulai input');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('✗ Error memuat data: ' + error.message);
      console.error('Error loading data:', error);
    }
  };

  // Auto-save data ke Firestore dengan debounce
  const autoSaveData = async (newData) => {
    if (!selectedUnit || !selectedYear) return;

    // Clear previous timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Set new timer untuk auto-save setelah 2 detik tidak ada perubahan
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const docId = `${selectedUnit}_${selectedYear}`;
        await setDoc(doc(db, 'jo_volume', docId), {
          unitBisnis: selectedUnit,
          year: selectedYear,
          data: newData,
          lastUpdated: new Date().toISOString()
        });
        
        setMessage('✓ Data tersimpan otomatis');
        setTimeout(() => setMessage(''), 2000);
      } catch (error) {
        setMessage('✗ Error menyimpan: ' + error.message);
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    setAutoSaveTimer(timer);
  };

  // Hitung total untuk setiap baris
  const calculateTotal = (values) => {
    const sum = values.reduce((acc, val) => {
      const num = parseFloat(val) || 0;
      return acc + num;
    }, 0);
    return sum > 0 ? sum.toFixed(2) : '0';
  };

  // Update nilai cell
  const updateCell = (category, rowIdx, monthIdx, value) => {
    const newData = { ...data };
    newData[category][rowIdx].values[monthIdx] = value;
    newData[category][rowIdx].total = calculateTotal(newData[category][rowIdx].values);
    setData(newData);
    
    // Auto-save setelah perubahan
    autoSaveData(newData);
  };

  useEffect(() => {
    loadData();
    // Cleanup timer saat component unmount
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [selectedUnit, selectedYear]);

  const renderRows = (rows, category) => {
    const isDisabled = !selectedUnit || !selectedYear;
    
    return rows.map((row, idx) => (
      <tr key={idx}>
        <td className="desc-cell">{row.desc}</td>
        <td className="unit-cell">{row.unit}</td>
        {row.values.map((val, i) => (
          <td key={i} className="data-cell">
            <input
              type="text"
              value={val}
              onChange={(e) => updateCell(category, idx, i, e.target.value)}
              className="cell-input"
              disabled={isDisabled}
              placeholder={isDisabled ? '' : '0'}
            />
          </td>
        ))}
        <td className="total-cell">{row.total}</td>
      </tr>
    ));
  };

  return (
    <div className="wrapper">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .wrapper {
          width: 100%;
          overflow-x: auto;
          background: #f0f0f0;
          padding: 10px;
          font-family: 'Calibri', Arial, sans-serif;
        }

        .controls {
          background: white;
          padding: 15px;
          margin-bottom: 10px;
          border-radius: 5px;
          display: flex;
          gap: 15px;
          align-items: center;
          flex-wrap: wrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .control-group label {
          font-size: 12px;
          font-weight: bold;
          color: #333;
        }

        .control-group select {
          padding: 8px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          min-width: 200px;
        }

        .message {
          padding: 10px 15px;
          margin-left: auto;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .message::before {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          font-size: 10px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        th {
          background: #4472C4;
          color: white;
          font-weight: bold;
          padding: 6px 4px;
          border: 1px solid #2E5BA8;
          text-align: center;
          font-size: 10px;
          white-space: nowrap;
        }

        .header-main {
          background: #2E4E7E;
        }

        .category-header {
          background: #A5A5A5;
          color: white;
          font-weight: bold;
          text-align: left;
          padding: 6px 8px;
          border: 1px solid #888;
          font-size: 11px;
        }

        .subcategory-header {
          background: #D0D0D0;
          color: #000;
          font-weight: bold;
          text-align: left;
          padding: 6px 8px;
          border: 1px solid #999;
          font-size: 10px;
        }

        td {
          border: 1px solid #D0D0D0;
          padding: 0;
          text-align: center;
          font-size: 10px;
        }

        .desc-cell {
          text-align: left;
          padding-left: 20px;
          background: white;
          min-width: 150px;
          font-size: 10px;
          padding: 3px 5px;
        }

        .unit-cell {
          background: white;
          text-align: center;
          min-width: 50px;
          font-size: 10px;
          padding: 3px 5px;
        }

        .data-cell {
          text-align: right;
          min-width: 60px;
          background: white;
          font-size: 10px;
          padding: 0;
        }

        .cell-input {
          width: 100%;
          border: none;
          padding: 3px 8px 3px 4px;
          text-align: right;
          font-size: 10px;
          font-family: 'Calibri', Arial, sans-serif;
          background: transparent;
          transition: all 0.2s;
        }

        .cell-input:focus {
          outline: 2px solid #4472C4;
          background: #FFF9E6;
        }

        .cell-input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .cell-input:hover:not(:disabled) {
          background: #FFFEF0;
        }

        .total-cell {
          background: #E7E6E6;
          font-weight: bold;
          text-align: right;
          padding-right: 8px;
          min-width: 70px;
          font-size: 10px;
          padding: 3px 8px 3px 5px;
        }

        tr:hover td.desc-cell,
        tr:hover td.unit-cell,
        tr:hover td.total-cell {
          background-color: #F8F8F8;
        }

        .info-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 12px 20px;
          border-radius: 8px;
          margin-bottom: 15px;
          text-align: center;
          font-size: 13px;
          font-weight: 500;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="info-banner">
        💡 Langsung ketik di tabel untuk mengisi data - Auto-save setiap 2 detik
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Unit Bisnis:</label>
          <select 
            value={selectedUnit} 
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <option value="">Pilih Unit Bisnis</option>
            {unitBisnisList.map((unit, idx) => (
              <option key={idx} value={unit}>{unit}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>Tahun:</label>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            {years.map((year, idx) => (
              <option key={idx} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {message && (
          <div className="message" style={{
            color: message.includes('✓') ? '#155724' : message.includes('⚠') ? '#856404' : '#721c24',
            background: message.includes('✓') ? '#d4edda' : message.includes('⚠') ? '#fff3cd' : '#f8d7da',
            border: `1px solid ${message.includes('✓') ? '#c3e6cb' : message.includes('⚠') ? '#ffeaa7' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}
      </div>
      
      <table>
        <thead>
          <tr>
            <th className="header-main" rowSpan="2">Description<br/>Activity</th>
            <th className="header-main" rowSpan="2">Satuan</th>
            {months.map((month, idx) => (
              <th key={idx} className="header-main">{month}</th>
            ))}
            <th className="header-main" rowSpan="2">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="15" className="category-header">SteveDoring</td>
          </tr>
          {renderRows(data.stevedoring, 'stevedoring')}
          
          <tr>
            <td colSpan="15" className="category-header">Cargodoring</td>
          </tr>
          {renderRows(data.cargodoring, 'cargodoring')}
          
          <tr>
            <td colSpan="15" className="category-header">Equipment Provider</td>
          </tr>
          <tr>
            <td colSpan="15" className="subcategory-header">Receving & Delivery</td>
          </tr>
          {renderRows(data.equipmentProvider, 'equipmentProvider')}
          
          <tr>
            <td colSpan="15" className="category-header">Warehousing</td>
          </tr>
          {renderRows(data.warehousing, 'warehousing')}
          
          <tr>
            <td colSpan="15" className="category-header">Tally</td>
          </tr>
          {renderRows(data.tally, 'tally')}
          
          <tr>
            <td colSpan="15" className="category-header">Erection On Base</td>
          </tr>
          {renderRows(data.erection, 'erection')}
          
          <tr>
            <td colSpan="15" className="category-header">Container MDF/RPR</td>
          </tr>
          {renderRows(data.containerMDF, 'containerMDF')}
          
          <tr>
            <td colSpan="15" className="category-header">Stuffing / Stripping</td>
          </tr>
          {renderRows(data.stuffing, 'stuffing')}
          
          <tr>
            <td colSpan="15" className="category-header">Other Service</td>
          </tr>
          {renderRows(data.otherService, 'otherService')}
        </tbody>
      </table>
    </div>
  );
};

export default JoVolume;