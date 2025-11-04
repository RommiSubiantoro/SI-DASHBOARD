import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

const UnitManagement = ({
  units,
  users,
  loadingUnits,
  setShowUnitModal,
}) => {
  const [loadingUploads, setLoadingUploads] = React.useState(false);
  const [unitUploads, setUnitUploads] = React.useState({});

  React.useEffect(() => {
    const fetchUnitUploads = async () => {
      setLoadingUploads(true);
      try {
        const counts = {};
        for (const unit of units) {
          counts[unit.name] = 0; // dummy placeholder
        }
        setUnitUploads(counts);
      } finally {
        setLoadingUploads(false);
      }
    };
    fetchUnitUploads();
  }, [units]);

  return (
    <div className="space-y-6 min-h-screen mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Manage Unit Bisnis
          </h1>
          <button
            onClick={() => setShowUnitModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            + Tambah Unit
          </button>
        </div>

        {loadingUnits ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm">Loading units...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-red-500 border-b border-gray-200">
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
                    Data Unit
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {units.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      Belum ada unit bisnis. Tambahkan unit bisnis pertama Anda!
                    </td>
                  </tr>
                ) : (
                  units.map((unit, index) => {
                    const userCount = users.filter(
                      (u) =>
                        Array.isArray(u.unitBisnis) &&
                        u.unitBisnis.includes(unit.name)
                    ).length;
                    const hasUploads = (unitUploads[unit.name] || 0) > 0;
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
                        <td className="p-2 text-center">
                          {loadingUploads ? (
                            <span className="text-gray-400 italic text-sm">
                              Loading...
                            </span>
                          ) : hasUploads ? (
                            <CheckCircle className="text-green-500 inline-block w-5 h-5" />
                          ) : (
                            <XCircle className="text-red-500 inline-block w-5 h-5" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setShowUnitModal(true)}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded"
                          >
                            Edit
                          </button>
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
