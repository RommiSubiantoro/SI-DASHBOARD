import { useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import * as XLSX from "xlsx";

// 🔹 Custom hook untuk manajemen data (realtime & sinkron)
export const useDataManagement = (initialData = {}) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // =====================================================
  // 1️⃣ REALTIME LISTENER BERDASARKAN UNIT & TAHUN
  // =====================================================
  useEffect(() => {
    if (!initialData || Object.keys(initialData).length === 0) return;

    const unsubscribers = [];

    Object.keys(initialData).forEach((unitKey) => {
      const yearKeys = Object.keys(initialData[unitKey] || {});

      yearKeys.forEach((year) => {
        const unsubscribe = onSnapshot(
          collection(db, `unitData/${unitKey}/${year}/data/items`),
          (snapshot) => {
            const yearData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            setData((prev) => ({
              ...prev,
              [unitKey]: {
                ...(prev[unitKey] || {}),
                [year]: yearData,
              },
            }));
          },
          (error) => {
            console.error(`Error listening ${unitKey}/${year}:`, error);
          }
        );

        unsubscribers.push(unsubscribe);
      });
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [JSON.stringify(Object.keys(initialData))]);

  // =====================================================
  // 2️⃣ HELPER - HITUNG TOTAL BULAN
  // =====================================================
  const sumMonths = (row) =>
    (row.Jan || 0) +
    (row.Feb || 0) +
    (row.Mar || 0) +
    (row.Apr || 0) +
    (row.May || 0) +
    (row.Jun || 0) +
    (row.Jul || 0) +
    (row.Aug || 0) +
    (row.Sep || 0) +
    (row.Oct || 0) +
    (row.Nov || 0) +
    (row.Dec || 0);

  // =====================================================
  // 3️⃣ HITUNG STATISTIK
  // =====================================================
  const calculateStats = (unitData) => {
    if (!unitData || unitData.length === 0)
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalAct2025: 0,
        avgTarget: 0,
      };

    const totalRevenue = unitData.reduce(
      (sum, item) => sum + (item.revenue || 0),
      0
    );
    const totalExpenses = unitData.reduce(
      (sum, item) => sum + (item.expenses || 0),
      0
    );
    const totalProfit = totalRevenue - totalExpenses;
    const totalAct2025 = unitData.reduce((sum, row) => sum + sumMonths(row), 0);
    const avgTarget =
      unitData.length > 0
        ? unitData.reduce((sum, item) => sum + (item.target || 0), 0) /
          unitData.length
        : 0;

    return { totalRevenue, totalExpenses, totalProfit, totalAct2025, avgTarget };
  };

  // =====================================================
  // 4️⃣ TAMBAH DATA MANUAL
  // =====================================================
  const addDataToFirebase = async (selectedUnit, newRecord, selectedYear) => {
    if (
      !newRecord.month ||
      !newRecord.revenue ||
      !newRecord.expenses ||
      !newRecord.target
    ) {
      return { success: false, message: "Semua field harus diisi!" };
    }

    try {
      setIsLoading(true);
      const revenue = parseInt(newRecord.revenue);
      const expenses = parseInt(newRecord.expenses);
      const target = parseInt(newRecord.target);
      const profit = revenue - expenses;

      const recordData = {
        month: newRecord.month,
        revenue,
        expenses,
        profit,
        target,
        tahun: selectedYear || new Date().getFullYear().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const recordId = `record_${Date.now()}`;
      await setDoc(
        doc(db, `unitData/${selectedUnit}/${selectedYear}/data/items`, recordId),
        recordData
      );

      return { success: true, message: "✅ Data berhasil ditambahkan!" };
    } catch (error) {
      console.error("Error adding data:", error);
      return { success: false, message: "❌ Gagal: " + error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // 5️⃣ IMPORT DARI EXCEL
  // =====================================================
  const importFromExcelToFirebase = async (selectedUnit, file, selectedYear) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          setIsLoading(true);

          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[1] || workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          const headers = sheetData[0];
          const rows = sheetData.slice(1);

          const monthIndexes = {
            Jan: headers.indexOf("JAN"),
            Feb: headers.indexOf("FEB"),
            Mar: headers.indexOf("MAR"),
            Apr: headers.indexOf("APR"),
            May: headers.indexOf("MAY"),
            Jun: headers.indexOf("JUN"),
            Jul: headers.indexOf("JUL"),
            Aug: headers.indexOf("AUG"),
            Sep: headers.indexOf("SEP"),
            Oct: headers.indexOf("OCT"),
            Nov: headers.indexOf("NOV"),
            Dec: headers.indexOf("DEC"),
          };

          // 🔹 Hapus data lama
          const existingDocs = await getDocs(
            collection(db, `unitData/${selectedUnit}/${selectedYear}/data/items`)
          );
          await Promise.all(existingDocs.docs.map((doc) => deleteDoc(doc.ref)));

          // 🔹 Tambahkan data baru
          const addPromises = rows.map(async (row, index) => {
            const recordData = {
              category: row[headers.indexOf("CATEGORY")] || "",
              accountCode: row[headers.indexOf("ACCOUNT CODE")] || "",
              area: row[headers.indexOf("AREA")] || "",
              busLine: row[headers.indexOf("BUS LINE")] || "",
              Jan: row[monthIndexes.Jan] || 0,
              Feb: row[monthIndexes.Feb] || 0,
              Mar: row[monthIndexes.Mar] || 0,
              Apr: row[monthIndexes.Apr] || 0,
              May: row[monthIndexes.May] || 0,
              Jun: row[monthIndexes.Jun] || 0,
              Jul: row[monthIndexes.Jul] || 0,
              Aug: row[monthIndexes.Aug] || 0,
              Sep: row[monthIndexes.Sep] || 0,
              Oct: row[monthIndexes.Oct] || 0,
              Nov: row[monthIndexes.Nov] || 0,
              Dec: row[monthIndexes.Dec] || 0,
              tahun: selectedYear,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const recordId = `import_${Date.now()}_${index}`;
            return setDoc(
              doc(db, `unitData/${selectedUnit}/${selectedYear}/data/items`, recordId),
              recordData
            );
          });

          await Promise.all(addPromises);
          resolve("✅ Data berhasil diimport & disinkronkan!");
        } catch (error) {
          reject("❌ Error importing file: " + error.message);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  // =====================================================
  // 6️⃣ EXPORT KE EXCEL
  // =====================================================
  const exportToExcel = (selectedUnit, unitData) => {
    const ws = XLSX.utils.json_to_sheet(unitData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedUnit);
    XLSX.writeFile(wb, `${selectedUnit}_data.xlsx`);
  };

  // =====================================================
  // 7️⃣ UPDATE DATA
  // =====================================================
  const updateDataInFirebase = async (selectedUnit, selectedYear, recordId, updateData) => {
    try {
      setIsLoading(true);
      await updateDoc(
        doc(db, `unitData/${selectedUnit}/${selectedYear}/data/items`, recordId),
        { ...updateData, updatedAt: new Date() }
      );
      return { success: true, message: "✅ Data berhasil diupdate!" };
    } catch (error) {
      console.error("Error updating data:", error);
      return { success: false, message: "❌ Gagal update: " + error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // 8️⃣ HAPUS DATA SATUAN
  // =====================================================
  const deleteDataFromFirebase = async (selectedUnit, selectedYear, recordId) => {
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, `unitData/${selectedUnit}/${selectedYear}/data/items`, recordId));
      return { success: true, message: "🗑️ Data berhasil dihapus!" };
    } catch (error) {
      console.error("Error deleting data:", error);
      return { success: false, message: "❌ Gagal hapus: " + error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // 9️⃣ HAPUS SEMUA DATA DALAM TAHUN (RESET)
  // =====================================================
  const resetYearData = async (selectedUnit, selectedYear) => {
    try {
      setIsLoading(true);
      const dataRef = collection(db, `unitData/${selectedUnit}/${selectedYear}/data/items`);
      const snapshot = await getDocs(dataRef);

      if (snapshot.empty) {
        return { success: false, message: "⚠️ Tidak ada data untuk dihapus!" };
      }

      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

      return { success: true, message: `✅ Semua data tahun ${selectedYear} telah dihapus!` };
    } catch (error) {
      console.error("Error resetting data:", error);
      return { success: false, message: "❌ Gagal reset data: " + error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // 🔟 PIE CHART DATA
  // =====================================================
  const getPieChartData = (unitData, selectedMonth) => {
    if (!unitData) return [];
    return unitData.map((row) => ({
      name: row.category,
      value: row[selectedMonth] || 0,
    }));
  };

  // =====================================================
  // RETURN SEMUA FUNGSI
  // =====================================================
  return {
    data,
    isLoading,
    calculateStats,
    addDataToFirebase,
    exportToExcel,
    importFromExcelToFirebase,
    updateDataInFirebase,
    deleteDataFromFirebase,
    getPieChartData,
    sumMonths,
    resetYearData, // 🔥 Tambahan baru
  };
};

// =====================================================
// HOOK UNTUK FORM TAMBAH DATA
// =====================================================
export const useFormManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    month: "",
    revenue: "",
    expenses: "",
    target: "",
  });

  const resetForm = () =>
    setNewRecord({
      month: "",
      revenue: "",
      expenses: "",
      target: "",
    });

  const updateField = (field, value) =>
    setNewRecord((prev) => ({ ...prev, [field]: value }));

  return {
    showAddModal,
    setShowAddModal,
    newRecord,
    setNewRecord,
    resetForm,
    updateField,
  };
};
