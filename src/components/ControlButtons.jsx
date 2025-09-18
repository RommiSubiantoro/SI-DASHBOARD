import React from 'react';
import { Download, Upload, Plus, FileText } from 'lucide-react';

const ControlButtons = ({ 
  onAddData, 
  onImportData, 
  onExportExcel, 
  onExportPDF,
  showAddButton = true,
  showImportButton = true,
  showExportButtons = true 
}) => {
  return (
    <div className="control">
      <div className="control-1">
        {showAddButton && (
          <button onClick={onAddData} className="button-control">
            <Plus size={20} /> Add Data
          </button>
        )}
        
        {showImportButton && (
          <label className="label-control">
            <Upload size={20} /> Import Excel
            <input 
              type="file" 
              accept=".xlsx,.xls" 
              onChange={onImportData} 
              className="hidden" 
            />
          </label>
        )}
        
        {showExportButtons && (
          <>
            <button onClick={onExportExcel} className="button-excel">
              <Download size={20} /> Export Excel
            </button>
            <button onClick={onExportPDF} className="button-pdf">
              <FileText size={20} /> Export PDF
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ControlButtons;