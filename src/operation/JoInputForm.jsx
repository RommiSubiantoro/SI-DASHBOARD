// import React, { useState } from 'react';
// import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
// import { db } from "../firebase";

// const JoInputForm = () => {
//   const [selectedUnit, setSelectedUnit] = useState('');
//   const [selectedYear, setSelectedYear] = useState('2025');
//   const [selectedMonth, setSelectedMonth] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('');
//   const [selectedItem, setSelectedItem] = useState('');
//   const [selectedUnit2, setSelectedUnit2] = useState('');
//   const [value, setValue] = useState('');
//   const [isSaving, setIsSaving] = useState(false);
//   const [message, setMessage] = useState('');

//   const unitBisnisList = [
//     'PT Makassar Jaya Samudera',
//     'PT Samudera Makassar Logistik',
//     'PT Samudera Agencies Indonesia',
//     'PT Masaji Kargosentra Tama',
//     'PT Kendari Jaya Samudera',
//     'PT Kendari Jaya Samudera',
//     'PT Samudera Perdana',
//     'PT Silkargo Indonesia'
//   ];

//   const years = ['2023', '2024', '2025', '2026', '2027'];
//   const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

//   const categories = {
//     'SteveDoring': {
//       'Break Bulk': ['Ton', 'Ft', 'Cbm'],
//       'Container 20Ft': ['Boxes'],
//       'Container 40Ft': ['Boxes'],
//       'Curah': ['KM', 'Ft', 'Cbm']
//     },
//     'Cargodoring': {
//       'Break Bulk': ['Ton', 'Ft', 'Cbm'],
//       'Container 20Ft': ['Boxes'],
//       'Container 40Ft': ['Boxes']
//     },
//     'Equipment Provider': {
//       'Break Bulk': ['Ton', 'Ft', 'Cbm'],
//       'Container 20Ft': ['Boxes'],
//       'Container 40Ft': ['Boxes']
//     },
//     'Warehousing': {
//       'Warehousing': ['Cbm']
//     },
//     'Tally': {
//       'Tally': ['']
//     },
//     'Erection On Base': {
//       'Erection On Base': ['']
//     },
//     'Container MDF/RPR': {
//       'Repair&Cleaning': ['Boxes'],
//       'Modifikasi Ctnr': ['Boxes']
//     },
//     'Stuffing / Stripping': {
//       'Stuffing / Stripping': ['']
//     },
//     'Other Service': {
//       'Project Logistic': [''],
//       'FCL Shipment': [''],
//       'LCL Shipment': ['Kg'],
//       'Management Fee': ['Doc'],
//       'Custom Clearance': ['BL/Doc'],
//       'Handling Supervisi': ['Project'],
//       'Forklit': ['unit'],
//       'Clearance/Ops Expenses & Agency Fee': ['Doc']
//     }
//   };

//   const categoryMapping = {
//     'SteveDoring': 'stevedoring',
//     'Cargodoring': 'cargodoring',
//     'Equipment Provider': 'equipmentProvider',
//     'Warehousing': 'warehousing',
//     'Tally': 'tally',
//     'Erection On Base': 'erection',
//     'Container MDF/RPR': 'containerMDF',
//     'Stuffing / Stripping': 'stuffing',
//     'Other Service': 'otherService'
//   };

//   const handleCategoryChange = (e) => {
//     setSelectedCategory(e.target.value);
//     setSelectedItem('');
//     setSelectedUnit2('');
//   };

//   const handleItemChange = (e) => {
//     setSelectedItem(e.target.value);
//     setSelectedUnit2('');
//   };

//   const getMonthIndex = (month) => {
//     return months.indexOf(month);
//   };

//   const saveToFirestore = async () => {
//     if (!selectedUnit || !selectedYear || !selectedMonth || !selectedCategory || !selectedItem || !value) {
//       setMessage('Mohon lengkapi semua field!');
//       setTimeout(() => setMessage(''), 3000);
//       return;
//     }

//     setIsSaving(true);
//     try {
//       const docId = `${selectedUnit}_${selectedYear}_${selectedMonth}`;
//       const docRef = doc(db, 'jo_volume', docId);
//       const docSnap = await getDoc(docRef);

//       let currentData;
      
//       if (docSnap.exists()) {
//         currentData = docSnap.data().data;
//       } else {
//         // Initialize new data structure
//         currentData = {
//           stevedoring: [
//             { desc: 'Break Bulk', unit: 'Ton', values: Array(12).fill(''), total: '0' },
//             { desc: 'Break Bulk', unit: 'Ft', values: Array(12).fill(''), total: '0' },
//             { desc: 'Break Bulk', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
//             { desc: 'Container 20Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
//             { desc: 'Container 40Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
//             { desc: 'Curah', unit: 'KM', values: Array(12).fill(''), total: '0' },
//             { desc: 'Curah', unit: 'Ft', values: Array(12).fill(''), total: '0' },
//             { desc: 'Curah', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
//           ],
//           cargodoring: [
//             { desc: 'Break Bulk', unit: 'Ton', values: Array(12).fill(''), total: '0' },
//             { desc: 'Break Bulk', unit: 'Ft', values: Array(12).fill(''), total: '0' },
//             { desc: 'Break Bulk', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
//             { desc: 'Container 20Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
//             { desc: 'Container 40Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
//           ],
//           equipmentProvider: [
//             { desc: 'Break Bulk', unit: 'Ton', values: Array(12).fill(''), total: '0' },
//             { desc: 'Break Bulk', unit: 'Ft', values: Array(12).fill(''), total: '0' },
//             { desc: 'Break Bulk', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
//             { desc: 'Container 20Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
//             { desc: 'Container 40Ft', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
//           ],
//           warehousing: [
//             { desc: 'Warehousing', unit: 'Cbm', values: Array(12).fill(''), total: '0' },
//           ],
//           tally: [
//             { desc: 'Tally', unit: '', values: Array(12).fill(''), total: '0' },
//           ],
//           erection: [
//             { desc: 'Erection On Base', unit: '', values: Array(12).fill(''), total: '0' },
//           ],
//           containerMDF: [
//             { desc: 'Repair&Cleaning', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
//             { desc: 'Modifikasi Ctnr', unit: 'Boxes', values: Array(12).fill(''), total: '0' },
//           ],
//           stuffing: [
//             { desc: 'Stuffing / Stripping', unit: '', values: Array(12).fill(''), total: '0' },
//           ],
//           otherService: [
//             { desc: 'Project Logistic', unit: '', values: Array(12).fill(''), total: '0' },
//             { desc: 'FCL Shipment', unit: '', values: Array(12).fill(''), total: '0' },
//             { desc: 'LCL Shipment', unit: 'Kg', values: Array(12).fill(''), total: '0' },
//             { desc: 'Management Fee', unit: 'Doc', values: Array(12).fill(''), total: '0' },
//             { desc: 'Custom Clearance', unit: 'BL/Doc', values: Array(12).fill(''), total: '0' },
//             { desc: 'Handling Supervisi', unit: 'Project', values: Array(12).fill(''), total: '0' },
//             { desc: 'Forklit', unit: 'unit', values: Array(12).fill(''), total: '0' },
//             { desc: 'FCL Shipment', unit: 'Doc', values: Array(12).fill(''), total: '0' },
//             { desc: 'Clearance/Ops Expenses & Agency Fee', unit: 'Doc', values: Array(12).fill(''), total: '0' },
//           ]
//         };
//       }

//       // Update the specific cell
//       const categoryKey = categoryMapping[selectedCategory];
//       const monthIdx = getMonthIndex(selectedMonth);
//       const categoryData = currentData[categoryKey];
      
//       // Find the row to update
//       let rowIdx = -1;
//       if (selectedUnit2) {
//         rowIdx = categoryData.findIndex(row => row.desc === selectedItem && row.unit === selectedUnit2);
//       } else {
//         rowIdx = categoryData.findIndex(row => row.desc === selectedItem);
//       }

//       if (rowIdx !== -1) {
//         categoryData[rowIdx].values[monthIdx] = value;
        
//         // Calculate total
//         const sum = categoryData[rowIdx].values.reduce((acc, val) => {
//           const num = parseFloat(val) || 0;
//           return acc + num;
//         }, 0);
//         categoryData[rowIdx].total = sum > 0 ? sum.toFixed(2) : '0';
//       }

//       // Save to Firestore
//       await setDoc(docRef, {
//         unitBisnis: selectedUnit,
//         year: selectedYear,
//         month: selectedMonth,
//         data: currentData,
//         lastUpdated: new Date().toISOString()
//       });

//       setMessage('Data berhasil disimpan!');
//       setValue('');
//       setTimeout(() => setMessage(''), 3000);
//     } catch (error) {
//       setMessage('Error: ' + error.message);
//       console.error(error);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <div className="container">
//       <style>{`
//         .container {
//           max-width: 800px;
//           margin: 20px auto;
//           padding: 20px;
//           background: white;
//           border-radius: 8px;
//           box-shadow: 0 2px 10px rgba(0,0,0,0.1);
//           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//         }

//         .header {
//           text-align: center;
//           margin-bottom: 30px;
//           padding-bottom: 15px;
//           border-bottom: 3px solid #4472C4;
//         }

//         .header h1 {
//           color: #2c3e50;
//           font-size: 24px;
//           margin: 0 0 5px 0;
//         }

//         .header p {
//           color: #7f8c8d;
//           font-size: 14px;
//           margin: 0;
//         }

//         .form-group {
//           margin-bottom: 20px;
//         }

//         .form-group label {
//           display: block;
//           margin-bottom: 8px;
//           font-weight: 600;
//           color: #34495e;
//           font-size: 14px;
//         }

//         .form-group label span {
//           color: #e74c3c;
//         }

//         .form-group select,
//         .form-group input {
//           width: 100%;
//           padding: 10px 12px;
//           border: 2px solid #ddd;
//           border-radius: 6px;
//           font-size: 14px;
//           transition: border-color 0.3s;
//         }

//         .form-group select:focus,
//         .form-group input:focus {
//           outline: none;
//           border-color: #4472C4;
//         }

//         .form-row {
//           display: grid;
//           grid-template-columns: 1fr 1fr;
//           gap: 15px;
//         }

//         .btn-submit {
//           width: 100%;
//           padding: 12px;
//           background: #4472C4;
//           color: white;
//           border: none;
//           border-radius: 6px;
//           font-size: 16px;
//           font-weight: 600;
//           cursor: pointer;
//           transition: background 0.3s;
//           margin-top: 10px;
//         }

//         .btn-submit:hover {
//           background: #2E5BA8;
//         }

//         .btn-submit:disabled {
//           background: #95a5a6;
//           cursor: not-allowed;
//         }

//         .message {
//           padding: 12px;
//           margin-bottom: 20px;
//           border-radius: 6px;
//           font-size: 14px;
//           text-align: center;
//           animation: slideDown 0.3s ease;
//         }

//         .message.success {
//           background: #d4edda;
//           color: #155724;
//           border: 1px solid #c3e6cb;
//         }

//         .message.error {
//           background: #f8d7da;
//           color: #721c24;
//           border: 1px solid #f5c6cb;
//         }

//         @keyframes slideDown {
//           from {
//             opacity: 0;
//             transform: translateY(-10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         .info-box {
//           background: #e3f2fd;
//           padding: 15px;
//           border-radius: 6px;
//           border-left: 4px solid #2196F3;
//           margin-bottom: 20px;
//         }

//         .info-box p {
//           margin: 0;
//           color: #1565C0;
//           font-size: 13px;
//           line-height: 1.5;
//         }

//         .form-section {
//           background: #f8f9fa;
//           padding: 20px;
//           border-radius: 6px;
//           margin-bottom: 20px;
//         }

//         .form-section-title {
//           font-size: 16px;
//           font-weight: 600;
//           color: #2c3e50;
//           margin-bottom: 15px;
//           padding-bottom: 10px;
//           border-bottom: 2px solid #ddd;
//         }
//       `}</style>

//       <div className="header">
//         <h1>📊 Form Input JO Volume</h1>
//         <p>Input data akan otomatis tersimpan ke JoVolume</p>
//       </div>

//       {message && (
//         <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
//           {message}
//         </div>
//       )}

//       <div className="info-box">
//         <p>
//           💡 <strong>Petunjuk:</strong> Pilih unit bisnis, tahun, bulan, kategori, item, dan masukkan nilai. 
//           Data akan otomatis masuk ke tabel JoVolume pada bulan yang dipilih.
//         </p>
//       </div>

//       <div className="form-section">
//         <div className="form-section-title">Informasi Dasar</div>
        
//         <div className="form-row">
//           <div className="form-group">
//             <label>Unit Bisnis <span>*</span></label>
//             <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
//               <option value="">Pilih Unit Bisnis</option>
//               {unitBisnisList.map((unit, idx) => (
//                 <option key={idx} value={unit}>{unit}</option>
//               ))}
//             </select>
//           </div>

//           <div className="form-group">
//             <label>Tahun <span>*</span></label>
//             <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
//               {years.map((year, idx) => (
//                 <option key={idx} value={year}>{year}</option>
//               ))}
//             </select>
//           </div>
//         </div>

//         <div className="form-group">
//           <label>Bulan <span>*</span></label>
//           <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
//             <option value="">Pilih Bulan</option>
//             {months.map((month, idx) => (
//               <option key={idx} value={month}>{month}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       <div className="form-section">
//         <div className="form-section-title">Detail Data</div>
        
//         <div className="form-group">
//           <label>Kategori <span>*</span></label>
//           <select value={selectedCategory} onChange={handleCategoryChange}>
//             <option value="">Pilih Kategori</option>
//             {Object.keys(categories).map((cat, idx) => (
//               <option key={idx} value={cat}>{cat}</option>
//             ))}
//           </select>
//         </div>

//         {selectedCategory && (
//           <div className="form-group">
//             <label>Item <span>*</span></label>
//             <select value={selectedItem} onChange={handleItemChange}>
//               <option value="">Pilih Item</option>
//               {Object.keys(categories[selectedCategory]).map((item, idx) => (
//                 <option key={idx} value={item}>{item}</option>
//               ))}
//             </select>
//           </div>
//         )}

//         {selectedItem && categories[selectedCategory][selectedItem].length > 0 && 
//          categories[selectedCategory][selectedItem][0] !== '' && (
//           <div className="form-group">
//             <label>Satuan <span>*</span></label>
//             <select value={selectedUnit2} onChange={(e) => setSelectedUnit2(e.target.value)}>
//               <option value="">Pilih Satuan</option>
//               {categories[selectedCategory][selectedItem].map((unit, idx) => (
//                 <option key={idx} value={unit}>{unit}</option>
//               ))}
//             </select>
//           </div>
//         )}

//         <div className="form-group">
//           <label>Nilai <span>*</span></label>
//           <input
//             type="number"
//             step="0.01"
//             value={value}
//             onChange={(e) => setValue(e.target.value)}
//             placeholder="Masukkan nilai"
//           />
//         </div>
//       </div>

//       <button 
//         className="btn-submit" 
//         onClick={saveToFirestore}
//         disabled={isSaving || !selectedUnit || !selectedYear || !selectedMonth || !selectedCategory || !selectedItem || !value}
//       >
//         {isSaving ? '💾 Menyimpan...' : '✅ Simpan Data'}
//       </button>
//     </div>
//   );
// };

// export default JoInputForm;