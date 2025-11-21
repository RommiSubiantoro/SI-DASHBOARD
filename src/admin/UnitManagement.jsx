// src/components/UnitManagement.jsx
import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

const UnitManagement = ({
  units,
  users,
  loadingUnits,
  loadingUploads,
  unitUploads,
  handleAddUnit,
  handleEditUnit,
  handleDeleteUnit,
  handleDeleteAllRecords,
  handleExportUnits,
  isLoading,
}) => {
  return (
    <div className="space-y-6 min-h-screen mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Manage Unit Bisnis
        </h1>

        <div className="flex flex-wrap gap-3 mb-6">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
            onClick={handleAddUnit}
            disabled={isLoading}
          >
            ➕ Tambah Unit
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
            onClick={handleExportUnits}
            disabled={units.length === 0}
          >
            📤 Ekspor Unit
          </button>
        </div>

        {loadingUnits ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm">Loading units...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-red-500 text-white border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                    Nama Unit
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                    Jumlah User
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                    Data Upload
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {units.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Belum ada unit bisnis. Tambahkan unit bisnis pertama Anda!
                    </td>
                  </tr>
                ) : (
                  units.map((unit, index) => {
                    const userCount = users.filter(
                      (user) =>
                        Array.isArray(user.unitBisnis) &&
                        user.unitBisnis.includes(unit.name)
                    ).length;

                    const uploads2024 = unitUploads[unit.name]?.["2024"] || 0;
                    const uploads2025 = unitUploads[unit.name]?.["2025"] || 0;

                    return (
                      <tr key={unit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">
                          {unit.name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              userCount > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {userCount} user
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {loadingUploads ? (
                            <span className="text-gray-400 italic text-sm">
                              Loading...
                            </span>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {["2024", "2025"].map((year) => {
                                const uploads =
                                  unitUploads[unit.name]?.[year] || 0;
                                return (
                                  <div
                                    key={year}
                                    className="flex flex-col sm:flex-row sm:items-center sm:gap-2 justify-between"
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-gray-700 text-xs font-medium">
                                        {year}:
                                      </span>
                                      {uploads > 0 ? (
                                        <CheckCircle className="text-green-500 w-5 h-5" />
                                      ) : (
                                        <XCircle className="text-red-500 w-5 h-5" />
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleDeleteAllRecords(unit.name, year)
                                      }
                                      className="px-2 py-1 text-[11px] font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded transition-colors disabled:opacity-50 mt-1 sm:mt-0"
                                      disabled={isLoading || uploads === 0}
                                    >
                                      Hapus {year}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleEditUnit(unit)}
                              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors w-full sm:w-auto"
                              disabled={isLoading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUnit(unit)}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors w-full sm:w-auto"
                              disabled={isLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnitManagement;
