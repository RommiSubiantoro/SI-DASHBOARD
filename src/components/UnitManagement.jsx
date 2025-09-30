import React from "react";
import UnitTable from "./UnitTable";

const UnitManagement = ({
  units,
  users,
  loadingUnits,
  onAddUnit,
  onEditUnit,
  onDeleteUnit,
  onDeleteAllRecords,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Manajemen Unit</h2>
        <button
          onClick={onAddUnit}
          className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
        >
          + Tambah Unit
        </button>
      </div>

      {/* Tabel Unit */}
      <UnitTable
        units={units}
        users={users}
        loadingUnits={loadingUnits}
        onEdit={onEditUnit}
        onDelete={onDeleteUnit}
        onDeleteAllRecords={onDeleteAllRecords}
      />
    </div>
  );
};

export default UnitManagement;
