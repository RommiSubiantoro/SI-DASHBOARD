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

// Custom hook untuk manajemen data dengan Firebase real-time sync
export const useDataManagement = (initialData = {}) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Real-time listener untuk semua unit data
  useEffect(() => {
    const unsubscribers = [];

    Object.keys(initialData).forEach((unitKey) => {
      const unsubscribe = onSnapshot(
        collection(db, `unitData/${unitKey}/records`),
        (snapshot) => {
          const unitData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setData((prevData) => ({
            ...prevData,
            [unitKey]: unitData,
          }));
        },
        (error) => {
          console.error(`Error listening to ${unitKey} data:`, error);
        }
      );

      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [initialData]); // ✅ jalankan ulang jika initialData berubah

  const sumMonths = (row) => {
    return (
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
      (row.Dec || 0)
    );
  };

  // Fungsi untuk menghitung statistik
  const calculateStats = (unitData) => {
    if (!unitData || unitData.length === 0) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        totalProfit: 0,
        totalAct2025: 0,
        avgTarget: 0,
      };
    }

    const totalRevenue = unitData.reduce(
      (sum, item) => sum + (item.revenue || 0),
      0
    );
    const totalExpenses = unitData.reduce(
      (sum, item) => sum + (item.expenses || 0),
      0
    );
    const totalProfit = unitData.reduce(
      (sum, item) => sum + (item.profit || 0),
      0
    );
    const totalAct2025 = unitData.reduce((sum, row) => sum + sumMonths(row), 0);
    const avgTarget =
      unitData.length > 0
        ? unitData.reduce((sum, item) => sum + (item.target || 0), 0) /
          unitData.length
        : 0;

    return {
      totalRevenue,
      totalExpenses,
      totalProfit,
      totalAct2025,
      avgTarget,
    };
  };

  // Fungsi untuk menambah data ke Firebase
  const addDataToFirebase = async (selectedUnit, newRecord) => {
    if (
      newRecord.month &&
      newRecord.revenue &&
      newRecord.expenses &&
      newRecord.target
    ) {
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
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Generate unique ID atau gunakan timestamp
        const recordId = `record_${Date.now()}`;

        await setDoc(
          doc(db, `unitData/${selectedUnit}/records`, recordId),
          recordData
        );

        return { success: true, message: "Data berhasil ditambahkan!" };
      } catch (error) {
        console.error("Error adding data to Firebase:", error);
        return {
          success: false,
          message: "Error menambahkan data: " + error.message,
        };
      } finally {
        setIsLoading(false);
      }
    }
    return { success: false, message: "Semua field harus diisi!" };
  };

  // Fungsi untuk export Excel
  const exportToExcel = (selectedUnit, unitData) => {
    const ws = XLSX.utils.json_to_sheet(unitData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedUnit);
    XLSX.writeFile(wb, `${selectedUnit}_data.xlsx`);
  };

  // Fungsi untuk import Excel dan save ke Firebase
  const importFromExcelToFirebase = async (selectedUnit, file) => {
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

          // Clear existing data first
          const existingDocs = await getDocs(
            collection(db, `unitData/${selectedUnit}/records`)
          );
          const deletePromises = existingDocs.docs.map((doc) =>
            deleteDoc(doc.ref)
          );
          await Promise.all(deletePromises);

          // Add new data
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
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const recordId = `import_${Date.now()}_${index}`;
            return setDoc(
              doc(db, `unitData/${selectedUnit}/records`, recordId),
              recordData
            );
          });

          await Promise.all(addPromises);
          resolve("Data berhasil diimport dan disinkronkan!");
        } catch (error) {
          reject("Error importing file: " + error.message);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  // Fungsi untuk mendapatkan pie chart data
  const getPieChartData = (unitData, selectedMonth) => {
    if (!unitData) return [];
    return unitData.map((row) => ({
      name: row.category,
      value: row[selectedMonth] || 0,
    }));
  };

  // Fungsi untuk update data di Firebase
  const updateDataInFirebase = async (selectedUnit, recordId, updateData) => {
    try {
      setIsLoading(true);
      await updateDoc(doc(db, `unitData/${selectedUnit}/records`, recordId), {
        ...updateData,
        updatedAt: new Date(),
      });
      return { success: true, message: "Data berhasil diupdate!" };
    } catch (error) {
      console.error("Error updating data:", error);
      return {
        success: false,
        message: "Error mengupdate data: " + error.message,
      };
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk delete data dari Firebase
  const deleteDataFromFirebase = async (selectedUnit, recordId) => {
    try {
      setIsLoading(true);
      await deleteDoc(doc(db, `unitData/${selectedUnit}/records`, recordId));
      return { success: true, message: "Data berhasil dihapus!" };
    } catch (error) {
      console.error("Error deleting data:", error);
      return {
        success: false,
        message: "Error menghapus data: " + error.message,
      };
    } finally {
      setIsLoading(false);
    }
  };

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
  };
};

// Custom hook untuk form management
export const useFormManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    month: "",
    revenue: "",
    expenses: "",
    target: "",
  });

  const resetForm = () => {
    setNewRecord({
      month: "",
      revenue: "",
      expenses: "",
      target: "",
    });
  };

  const updateField = (field, value) => {
    setNewRecord((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return {
    showAddModal,
    setShowAddModal,
    newRecord,
    setNewRecord,
    resetForm,
    updateField,
  };
};
