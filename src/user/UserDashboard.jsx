// src/pages/UserDashboard.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
} from "firebase/firestore";
import * as XLSX from "xlsx";

// Import komponen
import Header from "../components/Header";
import ControlButtons from "../components/ControlButtons";
import DataTable from "../components/DataTable";
import Piechart from "../components/Piechart";
import Barchart from "../components/Barchart";
import Linechart from "../components/Linechart";
import Navbar from "../components/navbar";
import DashboardView from "../components/DashboardView";

// Custom hook
import { useDataManagement } from "../hooks/useDataManagement";

/**
 * Helper: cek apakah string valid (bukan null/undefined/empty/whitespace)
 */
const isValidString = (s) => typeof s === "string" && s.trim() !== "";

const UserDashboard = () => {
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [masterCode, setMasterCode] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [budgetFile, setBudgetFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  // refs to keep track of active unsubscribes and mounted state
  const listenersRef = useRef({
    userListener: null,
    unitsListener: null,
    dataListener: null,
  });
  const isMountedRef = useRef(true);

  // Custom hook import/export
  const { exportToExcel, importFromExcelToFirebase, importBudgetFromExcel } =
    useDataManagement({});

  // --- AUTH: ambil assignedUnits dari dokumen users ---
  useEffect(() => {
    isMountedRef.current = true;

    // subscribe auth state one time
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // clear previous user listener if any
      if (listenersRef.current.userListener) {
        listenersRef.current.userListener();
        listenersRef.current.userListener = null;
      }

      if (!user) {
        setAssignedUnits([]);
        // don't force redirect here - keep UI simple
        return;
      }

      try {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const unsub = onSnapshot(
          q,
          (snapshot) => {
            if (!isMountedRef.current) return;
            if (snapshot.empty) {
              setAssignedUnits([]);
              return;
            }
            const doc = snapshot.docs[0];
            const userData = doc.data() || {};
            const unitsFromUser = Array.isArray(userData.unitBisnis)
              ? userData.unitBisnis
              : [];

            setAssignedUnits(unitsFromUser);

            // set selectedUnit only if not set or invalid
            setSelectedUnit((prev) => {
              if (!isValidString(prev) && unitsFromUser.length > 0) {
                return unitsFromUser[0];
              }
              // If prev is valid and exists in assigned list, keep it.
              if (isValidString(prev) && unitsFromUser.includes(prev))
                return prev;
              // Otherwise fallback to first if available
              return unitsFromUser.length > 0 ? unitsFromUser[0] : prev;
            });
          },
          (error) => {
            console.error("❌ users onSnapshot error:", error);
          }
        );

        listenersRef.current.userListener = unsub;
      } catch (error) {
        console.error("❌ Error setting user listener:", error);
      }
    });

    listenersRef.current.unitsListener = null; // will be set in next effect

    return () => {
      isMountedRef.current = false;
      if (listenersRef.current.userListener)
        listenersRef.current.userListener();
      unsubscribeAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  // --- Ambil daftar semua unit (static list) ---
  useEffect(() => {
    const colRef = collection(db, "units");
    const unsub = onSnapshot(
      colRef,
      (snapshot) => {
        if (!isMountedRef.current) return;
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUnits(list);
      },
      (error) => {
        console.error("❌ units onSnapshot error:", error);
      }
    );
    listenersRef.current.unitsListener = unsub;
    return () => {
      if (listenersRef.current.unitsListener) {
        listenersRef.current.unitsListener();
        listenersRef.current.unitsListener = null;
      }
    };
  }, []);

  // --- Ambil masterCode (cached fetch sekali, safe) ---
  useEffect(() => {
    let cancelled = false;
    const fetchMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        if (cancelled) return;
        const data = snap.docs.map((doc) => doc.data() || {});
        // normalisasi: pastikan code ada dan string
        const normalized = data
          .filter((d) => d && (d.code || d.code === 0))
          .map((d) => ({ ...d, code: String(d.code).trim() }));
        if (isMountedRef.current) setMasterCode(normalized);
      } catch (error) {
        console.error("❌ Gagal ambil masterCode di UserDashboard:", error);
      }
    };
    fetchMaster();
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Realtime listener untuk data (protected by strict validation) ---
  const setupDataListener = useCallback(() => {
    if (listenersRef.current.dataListener) {
      listenersRef.current.dataListener();
      listenersRef.current.dataListener = null;
    }

    if (!isValidString(selectedUnit)) return;
    if (!isValidString(selectedYear)) return;
    if (!Array.isArray(masterCode) || masterCode.length === 0) return;

    if (selectedUnit.includes("/") || selectedYear.includes("/")) {
      console.error("❌ Invalid characters in selectedUnit/selectedYear");
      return;
    }

    try {
      const colRef = collection(
        db,
        `unitData/${selectedUnit}/${selectedYear}/data/items`
      );

      const unsub = onSnapshot(
        colRef,
        (snapshot) => {
          if (!isMountedRef.current) return;
          const rawData = snapshot.docs.map((doc) => doc.data() || {});

          // Ambil data Debit & Credit
          let filteredData = rawData.filter(
            (item) => item.type === "Debit" || item.type === "Credit"
          );

          // Filter berdasarkan masterCode
          const validCodes = new Set(
            masterCode.map((m) => String(m.code).toLowerCase().trim())
          );

          filteredData = filteredData.filter((item) => {
            const code = String(item.accountCode || "")
              .toLowerCase()
              .trim();
            return validCodes.has(code);
          });

          // Grouping
          const grouped = {};
          filteredData.forEach((item) => {
            const key = `${item.accountCode || ""}-${item.category || ""}-${
              item.area || ""
            }-${item.businessLine || ""}`.trim();
            if (!grouped[key]) {
              grouped[key] = {
                accountName: item.accountName || "",
                accountCode: item.accountCode || "",
                category: item.category || "",
                area: item.area || "",
                businessLine: item.businessLine || "",
                Jan: 0,
                Feb: 0,
                Mar: 0,
                Apr: 0,
                May: 0,
                Jun: 0,
                Jul: 0,
                Aug: 0,
                Sep: 0,
                Oct: 0,
                Nov: 0,
                Dec: 0,
              };
            }

            const month = String(item.month || "").trim();
            if (grouped[key].hasOwnProperty(month)) {
              // Jika Debit dan Credit sama-sama ditambahkan, gunakan ini:
              const value = Number(item.docValue) || 0;

              grouped[key][month] += value;
            }
          });

          setCurrentData(Object.values(grouped));
        },
        (error) => {
          console.error("❌ data onSnapshot error:", error);
        }
      );

      listenersRef.current.dataListener = unsub;
    } catch (error) {
      console.error("❌ Exception creating data listener:", error);
    }
  }, [selectedUnit, selectedYear, masterCode]);

  // call setupDataListener when deps change
  useEffect(() => {
    setupDataListener();
    // cleanup on unmount handled inside setupDataListener via listenersRef
    return () => {
      // leave cleanup to setupDataListener next invocation or unmount
    };
  }, [setupDataListener]);

  // --- Fetch budget data (one-time per selectedUnit/selectedYear when masterCode ready) ---
  useEffect(() => {
    let cancelled = false;
    const fetchBudget = async () => {
      if (!isValidString(selectedUnit) || !isValidString(selectedYear)) return;
      if (!Array.isArray(masterCode) || masterCode.length === 0) return;
      try {
        const colRef = collection(
          db,
          `unitData/${selectedUnit}/${selectedYear}/budget/items`
        );
        const snap = await getDocs(colRef);
        if (cancelled || !isMountedRef.current) return;

        let data = snap.docs.map((doc) => doc.data() || {});

        const validCodes = new Set(
          masterCode.map((m) => String(m.code).toLowerCase().trim())
        );

        const getCode = (item) =>
          String(
            item.accountCode ||
              item.AccountCode ||
              item["ACCOUNT CODE"] ||
              item.account_code ||
              item.Code ||
              ""
          )
            .toLowerCase()
            .trim();

        const calcTotal = (item) => {
          let total = 0;
          for (const key in item) {
            const low = key.toLowerCase();
            if (
              low.includes("jan") ||
              low.includes("feb") ||
              low.includes("mar") ||
              low.includes("apr") ||
              low.includes("may") ||
              low.includes("jun") ||
              low.includes("jul") ||
              low.includes("aug") ||
              low.includes("sep") ||
              low.includes("oct") ||
              low.includes("nov") ||
              low.includes("dec")
            ) {
              total += Number(item[key]) || 0;
            }
          }
          return total;
        };

        data = data.filter((item) => validCodes.has(getCode(item)));

        const final = data.map((item) => ({
          accountCode: getCode(item),
          totalBudget: calcTotal(item),
        }));

        setBudgetData(final);
      } catch (error) {
        console.error("❌ Gagal ambil data budget:", error);
      }
    };

    fetchBudget();

    return () => {
      cancelled = true;
    };
  }, [selectedUnit, selectedYear, masterCode]);

  // ====== HANDLERS ======
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

  const columns = [
    { Header: "Account Name", accessor: "accountName" },
    { Header: "Account Code", accessor: "accountCode" },
    { Header: "Category", accessor: "category" },
    { Header: "Area", accessor: "area" },
    { Header: "Business Line", accessor: "businessLine" },
    { Header: "Jan", accessor: "Jan" },
    { Header: "Feb", accessor: "Feb" },
    { Header: "Mar", accessor: "Mar" },
    { Header: "Apr", accessor: "Apr" },
    { Header: "May", accessor: "May" },
    { Header: "Jun", accessor: "Jun" },
    { Header: "Jul", accessor: "Jul" },
    { Header: "Aug", accessor: "Aug" },
    { Header: "Sep", accessor: "Sep" },
    { Header: "Oct", accessor: "Oct" },
    { Header: "Nov", accessor: "Nov" },
    { Header: "Dec", accessor: "Dec" },
  ];

  const handleExportExcel = () => {
    if (!isValidString(selectedUnit) || !isValidString(selectedYear)) {
      alert("⚠️ Pilih Unit Bisnis dan Tahun terlebih dahulu sebelum export!");
      return;
    }
    exportToExcel(selectedUnit, currentData);
  };

  const handleImportData = async (event) => {
    const file = event.target.files[0];
    if (!isValidString(selectedUnit) || !isValidString(selectedYear)) {
      alert("⚠️ Pilih Unit Bisnis dan Tahun terlebih dahulu sebelum import!");
      return;
    }
    if (file) {
      try {
        setIsLoading(true);
        await importFromExcelToFirebase(selectedUnit, file, selectedYear);
        console.log("🔥 Import selesai, data Firestore akan update otomatis");
        alert("✅ Data berhasil diimport dan chart diperbarui!");
        event.target.value = "";
      } catch (error) {
        console.error("Import failed:", error);
        alert("❌ Gagal import data: " + error.message);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleImportBudget = async (event) => {
    const file = event.target.files[0];
    if (!file) return alert("⚠️ Harap pilih file Excel Budget!");
    if (!file.name.endsWith(".xlsx"))
      return alert("❌ Harap upload file .xlsx yang valid!");

    if (!isValidString(selectedUnit) || !isValidString(selectedYear))
      return alert("⚠️ Pilih Unit & Tahun dulu!");

    try {
      const reader = new FileReader();

      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);

        if (data.length < 50) {
          alert("❌ File Excel corrupt atau tidak valid ZIP!");
          return;
        }

        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
          cellNF: false,
          cellFormula: false,
          cellText: false,
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);

        const colRef = collection(
          db,
          `unitData/${selectedUnit}/${selectedYear}/budget/items`
        );

        for (const row of rows) {
          await addDoc(colRef, row);
        }

        alert("✅ Semua data budget berhasil di-upload!");
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("❌ Gagal upload budget:", error);
      alert("❌ Error: " + error.message);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("dashboard");
    if (saved) setActiveMenu(saved);
  }, []);

  const handlePageChange = (page) => {
    setActiveMenu(page);
    localStorage.setItem("dashboard", page);
  };

  // Cleanup on unmount: unsubscribe any leftover listeners
  useEffect(() => {
    return () => {
      if (listenersRef.current.userListener)
        listenersRef.current.userListener();
      if (listenersRef.current.unitsListener)
        listenersRef.current.unitsListener();
      if (listenersRef.current.dataListener)
        listenersRef.current.dataListener();
    };
  }, []);

  // ====== RENDER ======
  return (
    <div className="grid grid-cols-[16rem_1fr] min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="h-screen bg-red-500 border-r shadow-lg flex flex-col">
        <div className="p-4">
          <h2 className="text-2xl font-bold text-white mb-3 px-12 pt-3">
            User Panel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => handlePageChange("dashboard")}
            className={`w-full text-left px-4 py-2 rounded-lg text-white font-medium text-sm transition-all ${
              activeMenu === "dashboard" ? "bg-red-600" : "hover:bg-red-600"
            }`}
          >
            📊 Dashboard
          </button>

          <button
            onClick={() => handlePageChange("viewTable")}
            className={`w-full text-left px-4 py-2 rounded-lg text-white font-medium text-sm transition-all ${
              activeMenu === "viewTable" ? "bg-red-600" : "hover:bg-red-600"
            }`}
          >
            📑 View Table
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col h-screen overflow-auto">
        <header className="fixed top-0 left-0 w-full z-50">
          <Navbar onLogout={handleLogout} />
        </header>

        <main className="flex-1 p-6 space-y-6 pt-20">
          <Header
            selectedUnit={selectedUnit}
            setSelectedUnit={(u) => {
              // safe setter: only accept valid strings
              if (!isValidString(u)) return;
              setSelectedUnit(u);
            }}
            units={assignedUnits}
            title={activeMenu === "dashboard" ? "User Dashboard" : "View Table"}
            selectedYear={selectedYear}
            setSelectedYear={(y) => {
              if (!isValidString(y)) return;
              setSelectedYear(y);
            }}
          />

          <ControlButtons
            onImportData={handleImportData}
            onImportBudget={handleImportBudget}
            onExportExcel={handleExportExcel}
            showImportButton
            showExportButtons
          />

          {activeMenu === "dashboard" && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Piechart
                  data={currentData}
                  masterCodeData={masterCode}
                  selectedMonth={selectedMonth}
                  setSelectedMonth={setSelectedMonth}
                  selectedYear={selectedYear}
                />
                <Barchart data={currentData} selectedYear={selectedYear} />
              </div>

              <div className="p-2 shadow rounded-lg bg-white">
                <Linechart data={currentData} selectedYear={selectedYear} />
              </div>
            </>
          )}

          {activeMenu === "viewTable" && (
            <>
              <DashboardView
                currentData={currentData}
                masterCodeData={masterCode}
                budgetData={budgetData}
                selectedYear={selectedYear}
                selectedUnit={selectedUnit}
              />

              <div className="bg-white p-6 rounded-xl shadow">
                <DataTable
                  data={currentData}
                  columns={columns}
                  title={`Data ${selectedUnit} - ${selectedYear}`}
                  showFilters
                  showPagination
                  rowsPerPage={25}
                />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
