import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

const UnitManagement = ({
  units,
  users,
  unitUploads,
  loadingUnits,
  loadingUploads,
  setShowUnitModal,
  setEditingUnit,
  fetchUnitUploads,
  isLoading,
}) => {
  return (
    <div className="space-y-6 min-h-screen mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Manage Unit Bisnis
        </h1>

        {loadingUnits ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm">Loading units...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-500 border-b border-gray-200 ">
                <tr>
                  {["No", "Nama Unit", "Jumlah User", "Data Upload", "Aksi"].map(
                    (head) => (
                      <th
                        key={head}
                        className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider"
                      >
                        {head}
                      </th>
                    )
                  )}
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
                    const userCount = users.filter((u) =>
                      Array.isArray(u.unitBisnis)
                        ? u.unitBisnis.includes(unit.name)
                        : u.unitBisnis === unit.name
                    ).length;

                    const uploads2024 = unitUploads[unit.name]?.["2024"] || 0;
                    const uploads2025 = unitUploads[unit.name]?.["2025"] || 0;

                    return (
                      <tr key={unit.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-medium">{unit.name}</td>
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
                              {[2024, 2025].map((year) => (
                                <div
                                  key={year}
                                  className="flex items-center justify-between"
                                >
                                  <span className="text-gray-700 text-xs font-medium">
                                    {year}:
                                  </span>
                                  {unitUploads[unit.name]?.[year] > 0 ? (
                                    <CheckCircle className="text-green-500 w-5 h-5" />
                                  ) : (
                                    <XCircle className="text-red-500 w-5 h-5" />
                                  )}
                                  <button
                                    onClick={() =>
                                      fetchUnitUploads(unit.name, year)
                                    }
                                    className="px-2 py-1 text-[11px] font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 rounded transition-colors disabled:opacity-50"
                                    disabled={isLoading}
                                  >
                                    Refresh
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingUnit(unit);
                                setShowUnitModal(true);
                              }}
                              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded"
                            >
                              Edit
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
