// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Navbar from "../components/navbar";
import Header from "../components/Header";
import DashboardPage from "./DashboardPage";
import UnitManagement from "./UnitManagement";
import UserManagement from "./UserManagement";
import UnitModal from "./UnitModal";
import UserModal from "./UserModal";
import MasterCategory from "./MasterCategory";
import MasterCode from "./MasterCode";
import LibraryCode from "./LibraryCode";
import DashboardView from "../components/DashboardView";
import GAFSATK from "../components/GAFSATK";
import GAFSDaily from "../components/GAFSDaily";
import GAFSDriver from "../components/GAFSDriver";

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { db, firebaseConfig } from "../firebase";
import { initializeApp } from "firebase/app";
import { useDataManagement } from "../hooks/useDataManagement";

function AdminDashboard() {
  // General UI / loading state
  const [activePage, setActivePage] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);
  const [Loading, setLoading] = useState(false);

  // Units & uploads
  const [units, setUnits] = useState([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [unitUploads, setUnitUploads] = useState({});
  const [loadingUploads, setLoadingUploads] = useState(false);

  // Users
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Modals & forms
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitForm, setUnitForm] = useState({ name: "" });

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: [],
    unitBisnis: [],
  });

  // Dashboard states & stats
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("Jan");
  const [selectedYear, setSelectedYear] = useState("2025");
  const [currentData, setCurrentData] = useState([]);
  const [masterCode, setMasterCode] = useState([]);
  const [viewData, setViewData] = useState([]);

  //gafs
  const [currentUser, setCurrentUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  const {
    data,
    isLoading: dataLoading,
    exportToExcel,
    importFromExcelToFirebase,
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

  // User search & pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [unitFilter, setUnitFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Master Category & Code
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [codes, setCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  // Firebase Auth
  const auth = getAuth();

  // Firebase listeners

  // Units
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "units"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUnits(list);
        setLoadingUnits(false);
      },
      (err) => {
        console.error("listen units err:", err);
        setLoadingUnits(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Users
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(list);
        setLoadingUsers(false);
      },
      (err) => {
        console.error("listen users err:", err);
        setLoadingUsers(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = { uid: user.uid, ...userSnap.data() };
          console.log("🔥 CurrentUser dari Firestore:", data);
          setCurrentUser(data);
        } else {
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Master categories
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "masterCategory"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCategories(list);
        setLoadingCategories(false);
      },
      (err) => {
        console.error("listen masterCategory err:", err);
        setLoadingCategories(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Master codes
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "masterCode"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCodes(list);
        setLoadingCodes(false);
      },
      (err) => {
        console.error("listen masterCode err:", err);
        setLoadingCodes(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Unit uploads counts per year
  const fetchUnitUploads = async () => {
    setLoadingUploads(true);
    try {
      const unitsSnap = await getDocs(collection(db, "units"));
      const unitNames = unitsSnap.docs.map((d) => d.data().name);
      const counts = {};
      for (const unitName of unitNames) {
        let total2024 = 0;
        let total2025 = 0;
        try {
          const snap2024 = await getDocs(
            collection(db, `unitData/${unitName}/2024/data/items`)
          );
          total2024 = snap2024.size;
        } catch (err) {
          console.warn(`can't fetch ${unitName} 2024`, err);
        }
        try {
          const snap2025 = await getDocs(
            collection(db, `unitData/${unitName}/2025/data/items`)
          );
          total2025 = snap2025.size;
        } catch (err) {
          console.warn(`can't fetch ${unitName} 2025`, err);
        }
        counts[unitName] = { 2024: total2024, 2025: total2025 };
      }
      setUnitUploads(counts);
    } catch (err) {
      console.error("fetchUnitUploads err:", err);
    } finally {
      setLoadingUploads(false);
    }
  };

  useEffect(() => {
    fetchUnitUploads();
  }, [units]);

  // Realtime chart data for selectedUnit + selectedYear
  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;

    const colRef = collection(
      db,
      `unitData/${selectedUnit}/${selectedYear}/data/items`
    );

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());

      // 🔹 Hanya ambil Debit
      const debitData = rawData.filter((item) => item.type === "Debit");

      // 🔹 Kelompokkan berdasarkan account dan bulan
      const grouped = {};

      debitData.forEach((item) => {
        const key = `${item.accountCode}-${item.category}-${item.area}-${item.businessLine}`;
        if (!grouped[key]) {
          grouped[key] = {
            accountName: item.accountName,
            accountCode: item.accountCode,
            category: item.category,
            area: item.area,
            businessLine: item.businessLine,
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
        grouped[key][item.month] += item.docValue;
      });

      setCurrentData(Object.values(grouped)); // untuk DataTable
    });

    return () => unsubscribe();
  }, [selectedUnit, selectedYear]);
  useEffect(() => {
    if (!selectedUnit || !selectedYear) return;

    const colRef = collection(
      db,
      `unitData/${selectedUnit}/${selectedYear}/data/items`
    );

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());

      // 🔹 Hanya ambil Debit
      const debitData = rawData.filter((item) => item.type === "Debit");

      // 🔹 Kelompokkan berdasarkan account dan bulan
      const grouped = {};

      debitData.forEach((item) => {
        const key = `${item.accountCode}-${item.category}-${item.area}-${item.businessLine}`;
        if (!grouped[key]) {
          grouped[key] = {
            accountName: item.accountName,
            accountCode: item.accountCode,
            category: item.category,
            area: item.area,
            businessLine: item.businessLine,
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
        grouped[key][item.month] += item.docValue;
      });

      setCurrentData(Object.values(grouped)); // untuk DataTable
    });

    return () => unsubscribe();
  }, [selectedUnit, selectedYear]);

  // Realtime data untuk DashboardView (hanya baca, tidak berubah saat tahun diganti)
  useEffect(() => {
    if (!selectedUnit) return;

    // default ke tahun 2025 (atau bisa juga tahun terbaru yang tersedia)
    const colRef = collection(db, `unitData/${selectedUnit}/2025/data/items`);

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const rawData = snapshot.docs.map((doc) => doc.data());
      const debitData = rawData.filter((item) => item.type === "Debit");
      const grouped = {};

      debitData.forEach((item) => {
        const key = `${item.accountCode}-${item.category}-${item.area}-${item.businessLine}`;
        if (!grouped[key]) {
          grouped[key] = {
            accountName: item.accountName,
            accountCode: item.accountCode,
            category: item.category,
            area: item.area,
            businessLine: item.businessLine,
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
        grouped[key][item.month] += item.docValue;
      });

      setViewData(Object.values(grouped));
    });

    return () => unsubscribe();
  }, [selectedUnit]);

  // -------------------------
  // Auth / Navigation handlers
  // -------------------------
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      alert("Berhasil logout!");
      window.location.href = "/";
    } catch (err) {
      console.error("logout err:", err);
      alert("Error during logout: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("dashboard");
    if (saved) setActivePage(saved);
  }, []);

  const handlePageChange = (page) => {
    setActivePage(page);
    localStorage.setItem("dashboard", page);
  };

  // Unit handlers (CRUD)
  const handleAddUnit = () => {
    setEditingUnit(null);
    setUnitForm({ name: "" });
    setShowUnitModal(true);
  };

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
        const ref = doc(db, "units", editingUnit.id);
        await updateDoc(ref, { name: unitForm.name, updatedAt: new Date() });
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
    } catch (err) {
      console.error("handleSaveUnit err:", err);
      alert("Error saving unit: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUnit = async (unitToDelete) => {
    try {
      const usersUsing = users.filter((u) =>
        Array.isArray(u.unitBisnis)
          ? u.unitBisnis.includes(unitToDelete.name)
          : u.unitBisnis === unitToDelete.name
      );
      if (usersUsing.length > 0) {
        alert(
          `Tidak dapat menghapus unit "${unitToDelete.name}" karena masih ada ${usersUsing.length} user yang menggunakannya.`
        );
        return;
      }
      if (
        !window.confirm(
          `Apakah Anda yakin ingin menghapus unit "${unitToDelete.name}"?`
        )
      )
        return;
      setIsLoading(true);
      await deleteDoc(doc(db, "units", unitToDelete.id));
      alert("Unit berhasil dihapus");
    } catch (err) {
      console.error("handleDeleteUnit err:", err);
      alert("Error deleting unit: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllRecords = async (unitName, year) => {
    if (!unitName || !year) {
      alert("Unit atau tahun tidak valid");
      return;
    }

    if (!window.confirm(`⚠️ Yakin hapus semua data ${unitName} tahun ${year}?`))
      return;

    setIsLoading(true);
    try {
      const deleteAllDocs = async (path) => {
        const colRef = collection(db, path);
        const snap = await getDocs(colRef);

        if (snap.empty) return;

        console.log(`Menghapus ${snap.size} dokumen dari ${path}...`);

        // 🔥 langsung hapus semuanya sekaligus
        await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, path, d.id))));

        console.log(`✅ Selesai hapus ${snap.size} dokumen dari ${path}`);
      };

      await deleteAllDocs(`unitData/${unitName}/${year}/data/items`);
      await deleteAllDocs(`unitData/${unitName}/${year}/budget/items`);

      alert(`✅ Semua data ${unitName} tahun ${year} berhasil dihapus.`);
      fetchUnitUploads();
    } catch (err) {
      console.error("handleDeleteAllRecords err:", err);
      alert("Gagal menghapus records: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // User handlers (CRUD)
  const handleAddUser = () => {
    setEditingUser(null);
    setUserForm({
      name: "",
      email: "",
      password: "",
      role: [],
      unitBisnis: [],
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: Array.isArray(user.role) ? user.role : [user.role || ""],
      unitBisnis: user.unitBisnis || [],
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (
      userForm.name.trim() === "" ||
      userForm.role.length === 0 ||
      userForm.unitBisnis.length === 0 ||
      (!editingUser &&
        (userForm.email.trim() === "" || userForm.password.trim() === ""))
    ) {
      alert(
        "Semua field harus diisi dan pilih minimal 1 role dan unit bisnis!"
      );
      return;
    }

    try {
      setIsLoading(true);
      if (editingUser) {
        const ref = doc(db, "users", editingUser.id);
        await updateDoc(ref, {
          name: userForm.name,
          role: userForm.role, // array
          unitBisnis: userForm.unitBisnis,
          updatedAt: new Date(),
        });
        alert("User berhasil diupdate!");
      } else {
        const appSecondary = initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(appSecondary);
        const userCredential = await createUserWithEmailAndPassword(
          secondaryAuth,
          userForm.email,
          userForm.password
        );
        const uid = userCredential.user.uid;
        await addDoc(collection(db, "users"), {
          uid,
          name: userForm.name,
          email: userForm.email,
          role: userForm.role, // array
          unitBisnis: userForm.unitBisnis,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await secondaryAuth.signOut();
        alert("User baru berhasil ditambahkan");
      }
      setShowUserModal(false);
    } catch (err) {
      console.error("handleSaveUser err:", err);
      alert("Error: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus user ini?")) return;
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, "users", id));
      alert("User berhasil dihapus");
    } catch (err) {
      console.error("handleDeleteUser err:", err);
      alert("Error deleting user: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Export helpers (CSV / Excel / PDF stub)
  const handleExportUnits = () => {
    const csv =
      "data:text/csv;charset=utf-8," +
      "No,Nama Unit,Jumlah User\n" +
      units
        .map((unit, idx) => {
          const userCount = users.filter(
            (u) =>
              Array.isArray(u.unitBisnis) && u.unitBisnis.includes(unit.name)
          ).length;
          return `${idx + 1},"${unit.name}",${userCount}`;
        })
        .join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "unit_bisnis.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportUsers = () => {
    const csv =
      "data:text/csv;charset=utf-8," +
      "No,Nama,Email,Role,Unit Bisnis\n" +
      users
        .map(
          (u, idx) =>
            `${idx + 1},"${u.name}","${u.email || "-"}","${u.role}","${
              Array.isArray(u.unitBisnis)
                ? u.unitBisnis.join("; ")
                : u.unitBisnis || "-"
            }"`
        )
        .join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Dashboard export/import
  const handleExportExcel = () => {
    exportToExcel(selectedUnit, currentData);
  };

  const handleExportPDF = () => {
    alert("Export to PDF belum diimplementasikan");
  };

  const handleImportData = async (event) => {
    const file = event.target.files ? event.target.files[0] : event;
    if (!file) return;
    try {
      const message = await importFromExcelToFirebase(selectedUnit, file);
      alert("✅ " + message);
      if (event.target) event.target.value = "";
    } catch (err) {
      alert("❌ " + err);
    }
  };

  // Master Category CRUD
  const handleAddCategory = async ({ name }) => {
    if (!name || !name.trim())
      return alert("Nama kategori tidak boleh kosong.");
    // limit check: optional (front-end enforces too)
    if (categories.length >= 7) return alert("Maksimal 6 kategori.");
    try {
      setIsLoading(true);
      await addDoc(collection(db, "masterCategory"), {
        name: name.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("handleAddCategory err:", err);
      alert("Gagal menambahkan kategori: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async (category) => {
    if (!category.name || !category.name.trim())
      return alert("Nama kategori tidak boleh kosong.");
    try {
      setIsLoading(true);
      await updateDoc(doc(db, "masterCategory", category.id), {
        name: category.name.trim(),
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("handleEditCategory err:", err);
      alert("Gagal update kategori: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    try {
      // find codes that reference this category as primary or in description
      const qPrimary = query(
        collection(db, "masterCode"),
        where("category", "==", category.name)
      );
      const snapPrimary = await getDocs(qPrimary);

      const qDesc = query(
        collection(db, "masterCode"),
        where("description", "array-contains", category.name)
      );
      const snapDesc = await getDocs(qDesc);

      if (!snapPrimary.empty || !snapDesc.empty) {
        if (
          !window.confirm(
            "Kategori ini digunakan di beberapa code. Hapus akan menghapus referensi. Lanjutkan?"
          )
        )
          return;
        // clear primary category for those docs
        const updatePromises = [];
        snapPrimary.docs.forEach((d) =>
          updatePromises.push(
            updateDoc(doc(db, "masterCode", d.id), { category: "" })
          )
        );
        snapDesc.docs.forEach((d) => {
          const desc = d.data().description || [];
          const newDesc = desc.filter((x) => x !== category.name);
          updatePromises.push(
            updateDoc(doc(db, "masterCode", d.id), { description: newDesc })
          );
        });
        await Promise.all(updatePromises);
      }

      await deleteDoc(doc(db, "masterCategory", category.id));
      alert("Kategori berhasil dihapus");
    } catch (err) {
      console.error("handleDeleteCategory err:", err);
      alert("Gagal hapus kategori: " + err.message);
    }
  };

  // Tambah data Master Code
  const handleAddCode = async ({
    code,
    accountName,
    category,
    description = "",
  }) => {
    if (!code || !code.trim()) return alert("Kode tidak boleh kosong");
    if (!accountName || !accountName.trim())
      return alert("Account Name tidak boleh kosong");
    if (!category || !category.trim()) return alert("Pilih kategori utama");

    try {
      setIsLoading(true);
      await addDoc(collection(db, "masterCode"), {
        code: code.trim(),
        accountName: accountName.trim(), // ✅ tambahkan field baru
        category: category.trim(),
        description: description.trim(), // ✅ sekarang berupa string, bukan array
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("handleAddCode err:", err);
      alert("Gagal menambahkan code: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Edit data Master Code
  const handleEditCode = async (codeObj) => {
    if (!codeObj.code || !codeObj.code.trim())
      return alert("Kode tidak boleh kosong");
    if (!codeObj.accountName || !codeObj.accountName.trim())
      return alert("Account Name tidak boleh kosong");
    if (!codeObj.category || !codeObj.category.trim())
      return alert("Pilih kategori utama");

    try {
      setIsLoading(true);
      await updateDoc(doc(db, "masterCode", codeObj.id), {
        code: codeObj.code.trim(),
        accountName: codeObj.accountName.trim(), // ✅ simpan juga saat update
        category: codeObj.category.trim(),
        description:
          typeof codeObj.description === "string"
            ? codeObj.description.trim()
            : Array.isArray(codeObj.description)
            ? codeObj.description.join(", ")
            : "",
        updatedAt: new Date(),
      });
    } catch (err) {
      console.error("handleEditCode err:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Hapus data Master Code (sudah benar)
  const handleDeleteCode = async (codeObj) => {
    if (!window.confirm(`Hapus code "${codeObj.code}"?`)) return;
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, "masterCode", codeObj.id));
    } catch (err) {
      console.error("handleDeleteCode err:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // User filters & pagination helpers
  const getFilteredUsers = () => {
    return users.filter((user) => {
      // 🔍 Filter pencarian nama/email
      const matchesSearch =
        !searchTerm ||
        (user.name &&
          user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.email &&
          user.email.toLowerCase().includes(searchTerm.toLowerCase()));

      // 🧩 Pastikan roles jadi array string aman
      const userRoles = Array.isArray(user.role)
        ? user.role.map((r) => (typeof r === "string" ? r.toLowerCase() : ""))
        : typeof user.role === "string"
        ? [user.role.toLowerCase()]
        : [];

      // 🧠 Perbaikan utama: cek jika roleFilter ada di salah satu roles[]
      const matchesRole =
        !roleFilter ||
        userRoles.some((r) =>
          r.trim().includes(roleFilter.toLowerCase().trim())
        );

      // 🏢 Filter unit bisnis
      const matchesUnit =
        !unitFilter ||
        (Array.isArray(user.unitBisnis)
          ? user.unitBisnis.includes(unitFilter)
          : user.unitBisnis === unitFilter);

      return matchesSearch && matchesRole && matchesUnit;
    });
  };

  const filteredUsers = getFilteredUsers();
  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / usersPerPage)
  );
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const paginatedUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("");
    setUnitFilter("");
  };

  const savedRoles = JSON.parse(localStorage.getItem("userRoles") || "[]");
  // 🟢 Ambil data semua tahun (tanpa perlu pilih di header)
  useEffect(() => {
    const fetchAllBudgets = async () => {
      if (!selectedUnit || masterCode.length === 0) return;

      try {
        const years = ["2024", "2025"]; // 🔸 kamu bisa tambah tahun lain di sini kalau perlu
        const monthsUpper = [
          "JAN",
          "FEB",
          "MAR",
          "APR",
          "MAY",
          "JUN",
          "JUL",
          "AUG",
          "SEP",
          "OCT",
          "NOV",
          "DEC",
        ];
        const validCodes = new Set(
          masterCode.map((m) => String(m.code).toLowerCase().trim())
        );

        let allBudgets = {};

        for (const year of years) {
          const colRef = collection(
            db,
            `unitData/${selectedUnit}/${year}/budget/items`
          );
          const snap = await getDocs(colRef);

          let data = snap.docs.map((doc) => doc.data());
          data = data.filter((item) => {
            const rowCode = String(
              item.accountCode || item["ACCOUNT CODE"] || ""
            )
              .toLowerCase()
              .trim();
            return validCodes.has(rowCode);
          });

          const grouped = {};
          data.forEach((item) => {
            const code = String(
              item.accountCode || item["ACCOUNT CODE"] || ""
            ).trim();
            if (!grouped[code])
              grouped[code] = { accountCode: code, totalBudget: 0 };
            const total = monthsUpper.reduce(
              (sum, m) => sum + (Number(item[m]) || 0),
              0
            );
            grouped[code].totalBudget += total;
          });

          allBudgets[year] = Object.values(grouped);
        }

        setBudgetData(allBudgets);
      } catch (error) {
        console.error("❌ Gagal ambil data semua tahun:", error);
      }
    };

    fetchAllBudgets();
  }, [selectedUnit, masterCode]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar
          activePage={activePage}
          onChangePage={handlePageChange}
          onLogout={handleLogout}
          userRoles={currentUser?.role || savedRoles}
        />

        <div className="flex-1 p-6 ml-64">
          <div className="fixed top-0 left-0 w-full z-50">
            <Navbar onLogout={handleLogout} />
          </div>

          {/* Dashboard */}
          {activePage === "dashboard" && (
            <>
              <DashboardPage
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                units={units}
                currentData={currentData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                handleExportExcel={handleExportExcel}
                handleImportData={(e) => handleImportData(e)}
                handleExportPDF={handleExportPDF}
              />
            </>
          )}

          {activePage === "dashboardView" && (
            <div style={{ marginTop: "70px" }}>
              {" "}
              {/* atur sesuai tinggi Navbar */}
              <Header
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                units={units.map((u) => u.name)}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                title="View Table"
              />
              <DashboardView
                selectedUnit={selectedUnit}
                setSelectedUnit={setSelectedUnit}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                units={units}
                currentData={currentData}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                handleExportExcel={handleExportExcel}
                handleImportData={(e) => handleImportData(e)}
                handleExportPDF={handleExportPDF}
              />
            </div>
          )}

          {/* Unit management */}
          {activePage === "unit" && (
            <UnitManagement
              units={units}
              users={users}
              loadingUnits={loadingUnits}
              loadingUploads={loadingUploads}
              unitUploads={unitUploads}
              handleAddUnit={handleAddUnit}
              handleEditUnit={handleEditUnit}
              handleDeleteUnit={handleDeleteUnit}
              handleDeleteAllRecords={handleDeleteAllRecords}
              handleExportUnits={handleExportUnits}
              isLoading={isLoading}
            />
          )}

          {/* User management */}
          {activePage === "user" && (
            <UserManagement
              users={users}
              loadingUsers={loadingUsers}
              units={units}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              unitFilter={unitFilter}
              setUnitFilter={setUnitFilter}
              handleResetFilters={handleResetFilters}
              paginatedUsers={paginatedUsers}
              currentPage={currentPage}
              usersPerPage={usersPerPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
              handleAddUser={handleAddUser}
              handleEditUser={handleEditUser}
              handleDeleteUser={handleDeleteUser}
              handleExportUsers={handleExportUsers}
              isLoading={isLoading}
            />
          )}

          {/* Master Category */}
          {activePage === "masterCategory" && (
            <MasterCategory
              categories={categories}
              codes={codes} // ⬅️ penting untuk relasi ke MasterCode
              loading={loadingCategories || loadingCodes}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {/* Master Code */}
          {activePage === "masterCode" && (
            <MasterCode
              codes={codes}
              categories={categories}
              loading={loadingCodes}
              onAddCode={handleAddCode}
              onEditCode={handleEditCode}
              onDeleteCode={handleDeleteCode}
            />
          )}

          {/* Library Code */}
          {activePage === "libraryCode" && (
            <LibraryCode
              codes={codes}
              categories={categories}
              loading={loadingCodes}
              onAddCode={handleAddCode}
              onEditCode={handleEditCode}
              onDeleteCode={handleDeleteCode}
            />
          )}

          {/* === GA/FS SECTION === */}
          {activePage === "gafs_daily" && (
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Daily OB/CS Report</h2>
              <p>Data laporan harian OB/CS ditampilkan di sini...</p>
              {<GAFSDaily />}
            </div>
          )}

          {activePage === "gafs_driver" && (
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">Driver Report</h2>
              <p>Data laporan driver ditampilkan di sini...</p>
              {<GAFSDriver />}
            </div>
          )}

          {activePage === "gafs_atk" && (
            <div className="bg-white rounded-lg p-6 shadow">
              <h2 className="text-lg font-semibold mb-4">ATK / RTG Report</h2>
              <p>Data laporan ATK/RTG ditampilkan di sini...</p>
              {<GAFSATK />}
            </div>
          )}
        </div>
      </div>

      {/* Modals for Unit & User */}
      <UnitModal
        show={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSave={handleSaveUnit}
        form={unitForm}
        setForm={setUnitForm}
        loading={isLoading}
        editing={editingUnit}
      />

      <UserModal
        show={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSave={handleSaveUser}
        form={userForm}
        setForm={setUserForm}
        loading={isLoading}
        editing={editingUser}
        units={units}
      />
    </div>
  );
}

export default AdminDashboard;
