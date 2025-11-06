import React, { useState, useEffect } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

// Komponen umum
import Navbar from "../components/navbar";
import Header from "../components/Header";
import DataTable from "../components/DataTable";

const GAFSDashboard = () => {
  const [activeMenu, setActiveMenu] = useState("daily");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState("");
  const [dataOB, setDataOB] = useState([]);
  const [dataDriver, setDataDriver] = useState([]);
  const [dataATK, setDataATK] = useState([]);

  // === AMBIL DATA USER LOGIN ===
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserName(user.email);
      }
    });
    return () => unsub();
  }, []);

  // === AMBIL DATA DARI FIRESTORE (Contoh) ===
  useEffect(() => {
    // Kamu bisa ubah collection-nya nanti sesuai struktur Firestore kamu
    const unsubOB = onSnapshot(collection(db, "daily_obcs"), (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDataOB(list);
    });

    const unsubDriver = onSnapshot(collection(db, "driver_report"), (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDataDriver(list);
    });

    const unsubATK = onSnapshot(collection(db, "atk_rtg_report"), (snap) => {
      const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setDataATK(list);
    });

    return () => {
      unsubOB();
      unsubDriver();
      unsubATK();
    };
  }, []);

  // === LOGOUT ===
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      alert("Berhasil logout!");
      window.location.href = "/";
    } catch (error) {
      alert("Error logout: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // === KOLOM UNTUK DATATABLE ===
  const columnsOB = [
    { Header: "Nama OB/CS", accessor: "nama" },
    { Header: "Tanggal", accessor: "tanggal" },
    { Header: "Shift", accessor: "shift" },
    { Header: "Area", accessor: "area" },
    { Header: "Keterangan", accessor: "keterangan" },
  ];

  const columnsDriver = [
    { Header: "Nama Driver", accessor: "nama" },
    { Header: "Tanggal", accessor: "tanggal" },
    { Header: "Tujuan", accessor: "tujuan" },
    { Header: "Kendaraan", accessor: "kendaraan" },
    { Header: "Keterangan", accessor: "keterangan" },
  ];

  const columnsATK = [
    { Header: "Tanggal", accessor: "tanggal" },
    { Header: "Nama Barang", accessor: "barang" },
    { Header: "Jumlah", accessor: "jumlah" },
    { Header: "Unit", accessor: "unit" },
    { Header: "Keterangan", accessor: "keterangan" },
  ];

  return (
    <div className="grid grid-cols-[16rem_1fr] min-h-screen bg-gray-100">
      {/* === SIDEBAR === */}
      <aside className="h-screen bg-red-500 border-r shadow-lg flex flex-col">
        <div className="p-4">
          <h2 className="text-2xl font-bold text-white mb-3 px-8 pt-3">
            GA / FS Panel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveMenu("daily")}
            className={`w-full text-left px-4 py-2 rounded-lg text-white font-medium text-sm transition-all ${
              activeMenu === "daily" ? "bg-red-600" : "hover:bg-yellow-100"
            }`}
          >
            🧹 Daily OB/CS
          </button>
          <button
            onClick={() => setActiveMenu("driver")}
            className={`w-full text-left px-4 py-2 rounded-lg text-white font-medium text-sm transition-all ${
              activeMenu === "driver" ? "bg-red-600" : "hover:bg-yellow-2100"
            }`}
          >
            🚗 Driver Report
          </button>
          <button
            onClick={() => setActiveMenu("atk")}
            className={`w-full text-left px-4 py-2 rounded-lg text-white font-medium text-sm transition-all ${
              activeMenu === "atk" ? "bg-red-600" : "hover:bg-yellow-100"
            }`}
          >
            📦 ATK / RTG Report
          </button>
        </nav>
      </aside>

      {/* === MAIN CONTENT === */}
      <div className="flex flex-col h-screen overflow-auto">
        <header className="fixed top-0 left-0 w-full z-50">
          <Navbar onLogout={handleLogout} />
        </header>

        <main className="flex-1 p-6 pt-20 space-y-6">
          <Header
            selectedUnit={selectedUnit}
            setSelectedUnit={setSelectedUnit}
            units={assignedUnits}
            title={
              activeMenu === "dashboard" ? "GA/FS DASHBOARD" : "View Table"
            }
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
          />

          {/* === DAILY OB/CS === */}
          {activeMenu === "daily" && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Daily OB/CS Report</h3>
              <DataTable
                data={dataOB}
                columns={columnsOB}
                title="Data Daily OB/CS"
                showPagination
                rowsPerPage={20}
              />
            </div>
          )}

          {/* === DRIVER REPORT === */}
          {activeMenu === "driver" && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">Driver Report</h3>
              <DataTable
                data={dataDriver}
                columns={columnsDriver}
                title="Data Driver"
                showPagination
                rowsPerPage={20}
              />
            </div>
          )}

          {/* === ATK/RTG REPORT === */}
          {activeMenu === "atk" && (
            <div className="bg-white p-6 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-4">ATK / RTG Report</h3>
              <DataTable
                data={dataATK}
                columns={columnsATK}
                title="Data ATK / RTG"
                showPagination
                rowsPerPage={20}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GAFSDashboard;
