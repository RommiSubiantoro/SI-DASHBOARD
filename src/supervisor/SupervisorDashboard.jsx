import React, { useState, useEffect } from "react";
import Select from "react-select";
import { CheckCircle, XCircle } from "lucide-react";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import { db } from "../firebase";

// Import komponen yang sudah dipecah
import Header from "../components/Header";
import StatsCards from "../components/StatsCards";
import Navbar from "../components/navbar";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
import ExporttableChart from "../components/ExporttableChart";
import Linechart from "../components/Linechart";

// Import custom hooks yang sudah diupdate dengan Firebase
import { useDataManagement } from "../hooks/useDataManagement";

function SupervisorDashboard() {
  const [activePage, setActivePage] = useState("");

  // State untuk unit bisnis
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);

  // State untuk users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // State untuk form modal
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [unitUploads, setUnitUploads] = useState({});
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: "" });
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    unitBisnis: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Dashboard states
  const [selectedUnit, setSelectedUnit] = useState("");

  // Tambahkan state untuk search di AdminDashboard
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");

  const getFilteredUsers = () => {
    return users.filter((user) => {
      const matchesSearch =
        searchTerm === "" ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email &&
          user.email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = roleFilter === "" || user.role === roleFilter;

      const matchesUnit =
        unitFilter === "" ||
        (Array.isArray(user.unitBisnis)
          ? user.unitBisnis.includes(unitFilter)
          : user.unitBisnis === unitFilter);

      return matchesSearch && matchesRole && matchesUnit;
    });
  };

  const filteredUsers = getFilteredUsers();

  // Fungsi untuk reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setUnitFilter("");
  };

  // Menggunakan Firebase-enabled custom hooks untuk dashboard data
  const {
    data,
    isLoading: dataLoading,
    calculateStats,
  } = useDataManagement({
    "Samudera Makassar Logistik": [],
    "Makassar Jaya Samudera": [],
    "Samudera Perdana": [],
    "Masaji Kargosentra Utama": [],
    "Kendari Jaya Samudera": [],
    "Silkargo Indonesia": [],
    "Samudera Agencies Indonesia": [],
    "Samudera Kendari Logistik": [],
  });

  // Dapatkan instance autentikasi
  const auth = getAuth();

  // Units mapping untuk dashboard
  const dashboardUnits = [
    "Samudera Makassar Logistik",
    "Makassar Jaya Samudera",
    "Samudera Perdana",
    "Masaji Kargosentra Utama",
    "Kendari Jaya Samudera",
    "Silkargo Indonesia",
    "Samudera Agencies Indonesia",
    "Samudera Kendari Logistik",
  ];

  // Data untuk dashboard
  const currentData = data[selectedUnit] || [];
  const stats = calculateStats(currentData);

  // Firebase functions untuk Units (existing code)
  const fetchUnits = async () => {
    try {
      setLoadingUnits(true);
      const unitsCollection = collection(db, "units");
      const unitsSnapshot = await getDocs(unitsCollection);
      const unitsList = unitsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (unitsList.length === 0) {
        const defaultUnits = [
          { name: "Samudera Makassar Logistik" },
          { name: "Makassar Jaya Samudera" },
          { name: "Kendari Jaya Samudera" },
          { name: "Samudera Kendari Logistik" },
          { name: "Samudera Agencies Indonesia" },
          { name: "Samudera Perdana" },
          { name: "Masaji Kargosentra Utama" },
          { name: "Silkargo Indonesia" },
        ];

        for (const unit of defaultUnits) {
          await addDoc(collection(db, "units"), {
            ...unit,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        await fetchUnits();
        return;
      }

      setUnits(unitsList);
    } catch (error) {
      console.error("Error fetching units:", error);
      alert("Error loading units from database");
    } finally {
      setLoadingUnits(false);
    }
  };

  useEffect(() => {
    const savedPage = localStorage.getItem("activePage");
    if (savedPage) {
      setActivePage(savedPage); // kalau ada, pakai halaman terakhir
    } else {
      setActivePage("dashboard"); // kalau belum pernah, default ke dashboard
    }
  }, []);

  // Simpan ke localStorage setiap kali ganti halaman
  const handlePageChange = (page) => {
    setActivePage(page);
    localStorage.setItem("activePage", page);
  };

  // Real-time listeners (existing code)
  useEffect(() => {
    const unsubscribeUnits = onSnapshot(
      collection(db, "units"),
      (snapshot) => {
        const unitsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUnits(unitsList);
        setLoadingUnits(false);
      },
      (error) => {
        console.error("Error listening to units:", error);
        setLoadingUnits(false);
      }
    );
    return () => unsubscribeUnits();
  }, []);

  useEffect(() => {
    const unsubscribeUsers = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const usersList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
        setLoadingUsers(false);
      },
      (error) => {
        console.error("Error listening to users:", error);
        setLoadingUsers(false);
      }
    );
    return () => unsubscribeUsers();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      alert("Berhasil logout!");
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Error during logout: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menghitung total stats dari semua unit
  const calculateAllUnitsStats = () => {
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalAct2025 = 0;
    let totalRecords = 0;
    let totalTargets = 0;

    Object.values(data).forEach((unitData) => {
      if (unitData && unitData.length > 0) {
        const unitStats = calculateStats(unitData);
        totalRevenue += unitStats.totalRevenue;
        totalExpenses += unitStats.totalExpenses;
        totalAct2025 += unitStats.totalAct2025;
        totalRecords += unitData.length;
        totalTargets += unitStats.avgTarget * unitData.length;
      }
    });

    return {
      totalRevenue,
      totalExpenses,
      totalAct2025,
      avgTarget: totalRecords > 0 ? totalTargets / totalRecords : 0,
    };
  };

  const allUnitsStats = calculateAllUnitsStats();

  // Unit management functions (existing code)

  const handleEditUnit = (unit) => {
    setEditingUnit(unit);
    setUnitForm({ name: unit.name });
    setShowUnitModal(true);
  };

  const handleSaveUnit = async () => {
    if (unitForm.name.trim() === "") {
      alert("Nama unit tidak boleh kosong!");
      return;
    }

    try {
      setIsLoading(true);

      if (editingUnit) {
        const unitRef = doc(db, "units", editingUnit.id);
        await updateDoc(unitRef, {
          name: unitForm.name,
          updatedAt: new Date(),
        });
        alert("Unit bisnis berhasil diupdate!");
      } else {
        await addDoc(collection(db, "units"), {
          name: unitForm.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        alert("Unit bisnis berhasil ditambahkan!");
      }
      setShowUnitModal(false);
      setUnitForm({ name: "" });
      setEditingUnit(null);
    } catch (error) {
      console.error("Error saving unit:", error);
      alert("Error saving unit to database");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUnit = async (unitToDelete) => {
    const usersUsingUnit = users.filter((user) =>
      Array.isArray(user.unitBisnis)
        ? user.unitBisnis.includes(unitToDelete.name)
        : user.unitBisnis === unitToDelete.name
    );

    if (usersUsingUnit.length > 0) {
      alert(
        `Tidak dapat menghapus unit "${unitToDelete.name}" karena masih ada ${usersUsingUnit.length} user yang menggunakannya.`
      );
      return;
    }

    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus unit "${unitToDelete.name}"?`
      )
    ) {
      try {
        setIsLoading(true);
        await deleteDoc(doc(db, "units", unitToDelete.id));
        alert("Unit bisnis berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting unit:", error);
        alert("Error deleting unit from database");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchUnitUploads = async () => {
    setLoadingUploads(true);
    try {
      // 1️⃣ Ambil daftar unit dari koleksi 'units' (karena ini pasti ada datanya)
      const unitsSnap = await getDocs(collection(db, "units"));
      const unitNames = unitsSnap.docs.map((doc) => doc.data().name);
      const counts = {};

      // 2️⃣ Cek tiap unit apakah punya records
      for (const unitName of unitNames) {
        const recordsRef = collection(db, "unitData", unitName, "records");
        const recordsSnap = await getDocs(recordsRef);
        counts[unitName] = recordsSnap.size;
      }
      setUnitUploads(counts);
    } catch (err) {
      console.error("❌ Error fetching uploads:", err);
    } finally {
      setLoadingUploads(false);
    }
  };

  useEffect(() => {
    fetchUnitUploads();
  }, [units]);

  // Tambahkan setelah handleDeleteUnit
  const handleDeleteAllRecords = async (unitName) => {
    if (!unitName) {
      alert("Unit bisnis tidak valid!");
      return;
    }

    if (
      !window.confirm(`Yakin ingin menghapus semua records di ${unitName}?`)
    ) {
      return;
    }

    try {
      setIsLoading(true);
      const recordsRef = collection(db, "unitData", unitName, "records");
      const snapshot = await getDocs(recordsRef);

      const deletePromises = snapshot.docs.map((record) =>
        deleteDoc(doc(db, "unitData", unitName, "records", record.id))
      );

      await Promise.all(deletePromises);
      console.log(`All records in "${unitName}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting records:", error);
      alert("❌ Gagal menghapus records: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email || "",
      password: "",
      role: user.role,
      unitBisnis: user.unitBisnis || [],
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (
      userForm.name.trim() === "" ||
      userForm.role.trim() === "" ||
      userForm.unitBisnis.length === 0 || // harus ada minimal 1 unit
      (!editingUser &&
        (userForm.email.trim() === "" || userForm.password.trim() === ""))
    ) {
      alert("Semua field harus diisi dan pilih minimal 1 unit bisnis!");
      return;
    }

    try {
      setIsLoading(true);

      if (editingUser) {
        const userRef = doc(db, "users", editingUser.id);
        const updateData = {
          name: userForm.name,
          role: userForm.role,
          unitBisnis: userForm.unitBisnis, // simpan array
          updatedAt: new Date(),
        };
        if (userForm.email.trim() !== "") {
          updateData.email = userForm.email;
        }

        await updateDoc(userRef, updateData);
        alert("User berhasil diupdate!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          userForm.email,
          userForm.password
        );
        const uid = userCredential.user.uid;

        await addDoc(collection(db, "users"), {
          uid,
          name: userForm.name,
          email: userForm.email,
          role: userForm.role,
          unitBisnis: userForm.unitBisnis, // simpan array
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        alert("User berhasil ditambahkan!");
      }

      setShowUserModal(false);
      setUserForm({
        name: "",
        email: "",
        password: "",
        role: "",
        unitBisnis: [],
      });
      setEditingUser(null);
    } catch (error) {
      console.error("Error saving user:", error);
      alert(`Error saving user: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      try {
        setIsLoading(true);
        await deleteDoc(doc(db, "users", id));
        alert("User berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user from database");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex  ">
        {/* Sidebar */}
        <div className="w-64 fixed bg-red-500 shadow-lg border-r border-gray-100 min-h-screen flex flex-col justify-between ">
          {/* Bagian atas */}
          <div className="p-6">
            <h2 className="text-2xl font-bold text-white mb-8 px-7">
              Supervisor Panel
            </h2>

            <nav className="space-y-2">
              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activePage === "dashboard"
                    ? "text-white bg-red-600 shadow-md"
                    : "text-white hover:bg-red-400"
                }`}
                onClick={() => handlePageChange("dashboard")}
              >
                📊 Dashboard
              </button>

              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activePage === "unit"
                    ? "text-white bg-red-600 shadow-md"
                    : "text-white hover:bg-red-400"
                }`}
                onClick={() => handlePageChange("unit")}
              >
                🏢 Manage Unit Bisnis
              </button>

              <button
                className={`w-full text-left px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  activePage === "user"
                    ? "text-white bg-red-600 shadow-md"
                    : "text-white hover:bg-red-400"
                }`}
                onClick={() => handlePageChange("user")}
              >
                👥 Manage User
              </button>
            </nav>
          </div>

          {/* Bagian bawah (footer sidebar) */}
          <div className="p-6 border-t border-red-400">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-lg font-medium text-sm text-white hover:bg-red-400 transition-all duration-200"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 ml-64 ">
          {/* Navbar */}
          <div className="fixed top-0 left-0 w-full z-50">
            <Navbar onLogout={handleLogout} />
          </div>

          {/* Dashboard Page */}
          {activePage === "dashboard" && (
            <div className="space-y-6 pt-16">
              {/* Header Component */}
              <Header
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                units={units.map((unit) => unit.name)}
                title="Manager Dashboard"
              />

              {/* Stats overview untuk semua unit */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Overview Semua Unit
                </h3>
                <StatsCards
                  totalRevenue={allUnitsStats.totalRevenue}
                  totalExpenses={allUnitsStats.totalExpenses}
                  totalAct2025={allUnitsStats.totalAct2025}
                  avgTarget={allUnitsStats.avgTarget}
                  labels={{
                    revenue: "Total Act 2024 (All Units)",
                    expenses: "Total Budget (All Units)",
                    act2025: "Total Act 2025 (All Units)",
                    avgTarget: "VAR YTD (All Units)",
                  }}
                />
              </div>

              {/* Stats cards untuk unit terpilih */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Detail Unit: {selectedUnit}
                </h3>
                <StatsCards
                  totalRevenue={stats.totalRevenue}
                  totalExpenses={stats.totalExpenses}
                  totalAct2025={stats.totalAct2025}
                  avgTarget={stats.avgTarget}
                  labels={{
                    revenue: `Act 2024 ${selectedUnit}`,
                    expenses: `Budget ${selectedUnit}`,
                    act2025: `Act 2025 ${selectedUnit}`,
                    avgTarget: `VAR YTD ${selectedUnit}`,
                  }}
                />
              </div>

              {/* Charts */}
              <div className="w-full flex flex-col gap-6">
                <ExporttableChart
                  currentData={currentData}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  selectedYear={selectedYear}
                  setSelectedYear={setSelectedYear}
                >
                  {/* Baris 1: Piechart & Barchart berdampingan */}
                  <div className="w-full flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 p-2 shadow rounded-lg bg-white">
                      <Piechart
                        data={currentData}
                        selectedMonth={selectedMonth}
                        setSelectedMonth={setSelectedMonth}
                        selectedYear={selectedYear}
                        setSelectedYear={setSelectedYear}
                      />
                    </div>

                    <div className="flex-1 p-2 shadow rounded-lg bg-white">
                      <Barchart
                        data={currentData}
                        selectedYear={selectedYear}
                      />
                    </div>
                  </div>

                  {/* Baris 2: Linechart di bawah */}
                  <div className="w-full mt-6">
                    <div className="p-2 shadow rounded-lg bg-white">
                      <Linechart data={currentData} />
                    </div>
                  </div>
                </ExporttableChart>
              </div>
            </div>
          )}

          {/* Unit Management Page */}
          {activePage === "unit" && (
            <div className="space-y-6 min-h-screen mt-12">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                  Manage Unit Bisnis
                </h1>
                {/* Loading State */}
                {loadingUnits ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-sm">Loading units...</p>
                  </div>
                ) : (
                  /* Table */
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            No
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            Nama Unit
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            Jumlah User
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            Data Unit
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
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
                              Belum ada unit bisnis. Tambahkan unit bisnis
                              pertama Anda!
                            </td>
                          </tr>
                        ) : (
                          units.map((unit, index) => {
                            const userCount = users.filter(
                              (user) =>
                                Array.isArray(user.unitBisnis) &&
                                user.unitBisnis.includes(unit.name)
                            ).length;
                            const hasUploads =
                              (unitUploads[unit.name] || 0) > 0;

                            return (
                              <tr key={unit.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-900">
                                  {index + 1}
                                </td>
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
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditUnit(unit)}
                                      className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded transition-colors disabled:opacity-50"
                                      disabled={isLoading}
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
          )}

          {/* User Management Page */}
          {activePage === "user" && (
            <div className="space-y-6 min-h-screen mt-12">
              {/* Search and Filter Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Cari berdasarkan nama atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <span className="absolute left-3 top-2.5 text-gray-400">
                        🔍
                      </span>
                    </div>

                    {/* Role Filter */}
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Semua Role</option>
                      <option value="User">User</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Manager">Manager</option>
                      <option value="Super Admin">Super Admin</option>
                    </select>

                    {/* Unit Filter */}
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

                    {/* Reset Button */}
                    <button
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium text-sm rounded-lg transition-colors disabled:opacity-50"
                      disabled={!searchTerm && !roleFilter && !unitFilter}
                    >
                      Reset Filter
                    </button>
                  </div>

                  {/* Search Results Info */}
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span className="text-gray-700 font-medium">
                      Menampilkan {filteredUsers.length} dari {users.length}{" "}
                      user
                    </span>

                    {/* Active Filters */}
                    {(searchTerm || roleFilter || unitFilter) && (
                      <div className="flex flex-wrap gap-2">
                        {searchTerm && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Pencarian: "{searchTerm}"
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
                            Role: {roleFilter}
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
                            Unit: {unitFilter}
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

              {/* Action Buttons */}

              {/* Warning Box */}
              {units.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <span className="text-lg">⚠️</span>
                    <strong>Peringatan:</strong> Anda perlu membuat unit bisnis
                    terlebih dahulu sebelum menambahkan user.
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loadingUsers ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-sm">Loading users...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            No
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            Nama
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            Unit Bisnis
                          </th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.length === 0 ? (
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
                          filteredUsers.map((user, index) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={
                                    searchTerm &&
                                    user.name
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase())
                                      ? "bg-yellow-200"
                                      : ""
                                  }
                                >
                                  {user.name}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                <span
                                  className={
                                    searchTerm &&
                                    user.email &&
                                    user.email
                                      .toLowerCase()
                                      .includes(searchTerm.toLowerCase())
                                      ? "bg-yellow-200"
                                      : ""
                                  }
                                >
                                  {user.email || "-"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    user.role === "Super Admin"
                                      ? "bg-red-100 text-red-800"
                                      : user.role === "Manager"
                                      ? "bg-purple-100 text-purple-800"
                                      : user.role === "Supervisor"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  } ${
                                    roleFilter === user.role
                                      ? "ring-2 ring-blue-300"
                                      : ""
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-700">
                                <span
                                  className={
                                    Array.isArray(user.unitBisnis)
                                      ? user.unitBisnis.includes(unitFilter)
                                        ? "bg-yellow-200"
                                        : ""
                                      : unitFilter === user.unitBisnis
                                      ? "bg-yellow-200"
                                      : ""
                                  }
                                >
                                  {Array.isArray(user.unitBisnis)
                                    ? user.unitBisnis.join(", ")
                                    : user.unitBisnis || "-"}
                                </span>
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
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingUnit ? "Edit Unit Bisnis" : "Tambah Unit Bisnis"}
              </h2>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Unit:
                </label>
                <input
                  type="text"
                  value={unitForm.name}
                  onChange={(e) =>
                    setUnitForm({ ...unitForm, name: e.target.value })
                  }
                  placeholder="Masukkan nama unit bisnis"
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSaveUnit}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : editingUnit ? "Update" : "Simpan"}
                </button>
                <button
                  onClick={() => setShowUnitModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {editingUser ? "Edit User" : "Tambah User"}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama:
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) =>
                      setUserForm({ ...userForm, name: e.target.value })
                    }
                    placeholder="Masukkan nama user"
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email:
                      </label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) =>
                          setUserForm({ ...userForm, email: e.target.value })
                        }
                        placeholder="Masukkan email"
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password:
                      </label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) =>
                          setUserForm({ ...userForm, password: e.target.value })
                        }
                        placeholder="Masukkan password"
                        disabled={isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role:
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm({ ...userForm, role: e.target.value })
                    }
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="">Pilih Role</option>
                    <option value="User">User</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Manager">Manager</option>
                    <option value="Super Admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Unit Bisnis:
                  </label>
                  <Select
                    isMulti
                    options={units.map((unit) => ({
                      value: unit.name,
                      label: unit.name,
                    }))}
                    value={userForm.unitBisnis.map((u) => ({
                      value: u,
                      label: u,
                    }))}
                    onChange={(selected) =>
                      setUserForm({
                        ...userForm,
                        unitBisnis: selected.map((s) => s.value),
                      })
                    }
                    isDisabled={isLoading}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveUser}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : editingUser ? "Update" : "Simpan"}
                </button>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SupervisorDashboard;
