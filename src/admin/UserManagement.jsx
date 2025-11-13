// src/components/UserManagement.jsx
import React from "react";

const UserManagement = ({
  users,
  loadingUsers,
  units,
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  unitFilter,
  setUnitFilter,
  handleResetFilters,
  paginatedUsers,
  currentPage,
  usersPerPage,
  totalPages,
  setCurrentPage,
  handleAddUser,
  handleEditUser,
  handleDeleteUser,
  handleExportUsers,
  isLoading,
}) => {
  return (
    <div className="space-y-6 min-h-screen mt-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Semua Role</option>
              <option value="GA/FS">GA/FS</option>
              <option value="Marketing">Marketing</option>
              <option value="Operation">Operation</option>
              <option value="User">User</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Manager">Manager</option>
              <option value="Super Admin">Super Admin</option>
            </select>

            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Semua Unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.name}>
                  {unit.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
              disabled={!searchTerm && !roleFilter && !unitFilter}
            >
              Reset Filter
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="text-gray-700 font-medium">
              Menampilkan {paginatedUsers.length} dari {users.length} user
            </span>
            {(searchTerm || roleFilter || unitFilter) && (
              <div className="flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    Pencarian: "{searchTerm}"{" "}
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                {roleFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Role: {roleFilter}{" "}
                    <button
                      onClick={() => setRoleFilter("")}
                      className="text-green-600 hover:text-green-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
                {unitFilter && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                    Unit: {unitFilter}{" "}
                    <button
                      onClick={() => setUnitFilter("")}
                      className="text-purple-600 hover:text-purple-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
          disabled={isLoading || units.length === 0}
        >
          ➕ Tambah User
        </button>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50"
          onClick={handleExportUsers}
          disabled={users.length === 0}
        >
          📊 Ekspor Data
        </button>
      </div>

      {units.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <span className="text-lg">⚠️</span>
            <strong>Peringatan:</strong> Anda perlu membuat unit bisnis terlebih
            dahulu sebelum menambahkan user.
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loadingUsers ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                      No
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                      Unit Bisnis
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-white text-xs uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        {users.length === 0
                          ? "Belum ada user. Tambahkan user pertama Anda!"
                          : "Tidak ada user yang sesuai dengan pencarian."}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, idx) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">
                          {(currentPage - 1) * usersPerPage + idx + 1}
                        </td>
                        <td className="px-4 py-3">{user.name}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {user.email || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(user.roles)
                              ? user.roles
                              : [user.role || "-"]
                            ).map((r, i) => {
                              const color =
                                r === "Super Admin"
                                  ? "bg-red-600 text-white"
                                  : r === "Manager"
                                  ? "bg-purple-600 text-white"
                                  : r === "Supervisor"
                                  ? "bg-blue-600 text-white"
                                  : r === "GA/FS"
                                  ? "bg-orange-500 text-white"
                                  : r === "Operation"
                                  ? "bg-green-600 text-white"
                                  : r === "User"
                                  ? "bg-yellow-600 text-white"
                                   : r === "Marketing"
                                  ? "bg-purple-600 text-white"
                                  : "bg-gray-400 text-white";

                              return (
                                <span
                                  key={i}
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}
                                >
                                  {r}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-gray-700">
                          {Array.isArray(user.unitBisnis)
                            ? user.unitBisnis.join(", ")
                            : user.unitBisnis || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors disabled:opacity-50"
                              disabled={isLoading}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
                              disabled={isLoading}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                &lt; Prev
              </button>
              <span className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50"
              >
                Next &gt;
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
