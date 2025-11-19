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

const isValidString = (s) => typeof s === "string" && s.trim() !== "";

const UserDashboard = () => {
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [assignedUnits, setAssignedUnits] = useState([]);
  const [currentData, setCurrentData] = useState([]);
  const [viewData, setViewData] = useState([]);
  const [units, setUnits] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [masterCode, setMasterCode] = useState([]);
  const [budgetData, setBudgetData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeMenu, setActiveMenu] = useState("dashboard");

  const listenersRef = useRef({
    userListener: null,
    unitsListener: null,
    dataListener: null,
  });

  const isMountedRef = useRef(true);

  const { exportToExcel, importFromExcelToFirebase, importBudgetFromExcel } =
    useDataManagement({});

  // ============================
  // AUTH LISTENER
  // ============================
  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (listenersRef.current.userListener) {
        listenersRef.current.userListener();
        listenersRef.current.userListener = null;
      }

      if (!user) {
        setAssignedUnits([]);
        return;
      }

      try {
        const q = query(collection(db, "users"), where("uid", "==", user.uid));
        const unsub = onSnapshot(q, (snapshot) => {
          if (!isMountedRef.current) return;

          if (snapshot.empty) {
            setAssignedUnits([]);
            return;
          }

          const userData = snapshot.docs[0].data() || {};
          const unitsFromUser = Array.isArray(userData.unitBisnis)
            ? userData.unitBisnis
            : [];

          setAssignedUnits(unitsFromUser);

          setSelectedUnit((prev) => {
            if (!isValidString(prev) && unitsFromUser.length > 0) {
              return unitsFromUser[0];
            }
            if (isValidString(prev) && unitsFromUser.includes(prev)) return prev;
            return unitsFromUser.length > 0 ? unitsFromUser[0] : prev;
          });
        });

        listenersRef.current.userListener = unsub;
      } catch (error) {
        console.error("User listener error:", error);
      }
    });

    return () => {
      isMountedRef.current = false;
      if (listenersRef.current.userListener)
        listenersRef.current.userListener();
      unsubscribeAuth();
    };
  }, []);

  // ============================
  // LISTENER UNTUK UNIT
  // ============================
  useEffect(() => {
    const colRef = collection(db, "units");

    const unsub = onSnapshot(colRef, (snapshot) => {
      if (!isMountedRef.current) return;
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUnits(list);
    });

    listenersRef.current.unitsListener = unsub;

    return () => {
      if (listenersRef.current.unitsListener) {
        listenersRef.current.unitsListener();
        listenersRef.current.unitsListener = null;
      }
    };
  }, []);

  // ============================
  // FETCH MASTER CODE
  // ============================
  useEffect(() => {
    let cancelled = false;

    const fetchMaster = async () => {
      try {
        const snap = await getDocs(collection(db, "masterCode"));
        if (cancelled) return;

        const data = snap.docs.map((doc) => doc.data() || {});
        const normalized = data
          .filter((d) => d && (d.code || d.code === 0))
          .map((d) => ({ ...d, code: String(d.code).trim() }));

        if (isMountedRef.current) setMasterCode(normalized);
      } catch (error) {
        console.error("Error masterCode:", error);
      }
    };

    fetchMaster();
    return () => {
      cancelled = true;
    };
  }, []);

  // ============================
  // REALTIME DATA LISTENER (FINAL)
  // ============================
  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;

    const colRef = collection(
      db,
      `unitData/${selectedUnit}/${selectedYear}/data/items`
    );

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      let rawData = snapshot.docs.map((doc) => doc.data() || {});

      // Filter by masterCode
      if (masterCode.length > 0) {
        const validCodes = new Set(
          masterCode.map((m) => String(m.code).toLowerCase().trim())
        );

        rawData = rawData.filter((item) =>
          validCodes.has(String(item.accountCode || "").toLowerCase().trim())
        );
      }

      const grouped = {};

      rawData.forEach((item) => {
        // use grouping WITHOUT forcing sign changes — take docValue as-is
        const key = `${item.accountCode || ""}-${item.category || ""}-${item.area || ""}-${item.businessLine || ""}-${item.type || ""}`;

        if (!grouped[key]) {
          grouped[key] = {
            accountName: item.accountName || "",
            accountCode: item.accountCode || "",
            category: item.category || "",
            area: item.area || "",
            businessLine: item.businessLine || "",
            type: item.type || "",
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
        const signedValue = parseFloat(item.docValue) || 0; // take value as-is from Excel

        // ensure month key exists (safety)
        if (grouped[key].hasOwnProperty(month)) {
          grouped[key][month] += signedValue;
        } else {
          // if month invalid, ignore or you may log
          // console.warn('Unknown month:', month, item);
        }
      });

      const finalData = Object.values(grouped);

      setCurrentData(finalData);
      setViewData(finalData);
    });

    listenersRef.current.dataListener = unsubscribe;

    return () => {
      if (listenersRef.current.dataListener) {
        listenersRef.current.dataListener();
        listenersRef.current.dataListener = null;
      }
    };
  }, [selectedUnit, selectedYear, masterCode]);

  // ============================
  // BUDGET DATA
  // ============================
  useEffect(() => {
    let cancelled = false;

    const fetchBudget = async () => {
      if (!selectedUnit || !selectedYear) return;
      if (!masterCode.length) return;

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
        console.error("Gagal ambil data budget:", error);
      }
    };

    fetchBudget();

    return () => {
      cancelled = true;
    };
  }, [selectedUnit, selectedYear, masterCode]);

  // ============================
  // HANDLERS
  // ============================
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
