import { useState, useEffect } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import * as XLSX from "xlsx";

// 🔹 Custom Hook untuk Manajemen Data dari Excel
export const useDataManagement = (initialData = {}) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // 1️⃣ REALTIME LISTENER
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

  // 2️⃣ IMPORT DARI EXCEL (otomatis ubah header lama → baru)
  const importFromExcelToFirebase = async (
    selectedUnit,
    file,
    selectedYear
  ) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

          for (const row of data) {
            if (row["Dr/Cr"] !== "Debit") continue;

            const jsDate = new Date((row["Doc Date"] - 25569) * 86400 * 1000);
            const month = jsDate.toLocaleString("en-US", { month: "short" });
            const cleanValue = parseFloat(row["Doc Value"]) || 0;

            try {
              await addDoc(
                collection(
                  db,
                  "unitData",
                  selectedUnit,
                  selectedYear,
                  "data",
                  "items"
                ),
                {
                  accountName: row["Line Desc."] || "-",
                  accountCode: row["Account Code"] || "-",
                  category: row["El4 short name"] || "-",
                  area: row["Location"] || "-",
                  businessLine: row["Business Line"] || ["Alocation"] || [""],
                  month,
                  docValue: cleanValue,
                  type: row["Dr/Cr"],
                }
              );
            } catch (err) {
              console.warn("Lewati data duplikat:", err.message);
            }
          }

          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  // 🔹 IMPORT SEMUA DATA BUDGET DARI EXCEL KE FIRESTORE
  const importBudgetFromExcel = async (selectedUnit, file, selectedYear) => {
    if (!file) throw new Error("Tidak ada file yang dipilih.");
    if (!selectedUnit || !selectedYear)
      throw new Error("Unit dan Tahun harus dipilih.");

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const workbook = XLSX.read(e.target.result, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

          // Simpan semua isi baris ke Firestore tanpa ubah nama header
          for (const row of rows) {
            await addDoc(
              collection(
                db,
                "unitData",
                selectedUnit,
                selectedYear,
                "budget",
                "items"
              ),
              {
                ...row, // simpan semua kolom sesuai header Excel
                createdAt: new Date(),
              }
            );
          }

          resolve(true);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (err) => reject(err);
      reader.readAsBinaryString(file);
    });
  };

  // 3️⃣ EXPORT KE EXCEL (dengan header baru)
  const exportToExcel = (selectedUnit, unitData) => {
    const ws = XLSX.utils.json_to_sheet(unitData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, selectedUnit);
    XLSX.writeFile(wb, `${selectedUnit}_data.xlsx`);
  };

  // 4️⃣ RESET DATA TAHUN
  const resetYearData = async (selectedUnit, selectedYear) => {
    try {
      setIsLoading(true);
      const dataRef = collection(
        db,
        `unitData/${selectedUnit}/${selectedYear}/data/items`
      );
      const snapshot = await getDocs(dataRef);

      if (snapshot.empty) {
        return { success: false, message: "⚠️ Tidak ada data untuk dihapus!" };
      }

      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

      return {
        success: true,
        message: `✅ Semua data tahun ${selectedYear} telah dihapus!`,
      };
    } catch (error) {
      console.error("Error resetting data:", error);
      return {
        success: false,
        message: "❌ Gagal reset data: " + error.message,
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 5️⃣ DATA PIE CHART (berdasarkan Category dan Bulan)
  const getPieChartData = (unitData, selectedMonth) => {
    if (!unitData) return [];
    return unitData.map((row) => ({
      name: row.category,
      value: selectedMonth && row.bulan === selectedMonth ? row.homeValue : 0,
    }));
  };

  // 6️⃣ UPDATE & HAPUS DATA SATUAN
  const updateDataInFirebase = async (
    selectedUnit,
    selectedYear,
    recordId,
    updateData
  ) => {
    try {
      setIsLoading(true);
      await updateDoc(
        doc(
          db,
          `unitData/${selectedUnit}/${selectedYear}/data/items`,
          recordId
        ),
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

  const deleteDataFromFirebase = async (
    selectedUnit,
    selectedYear,
    recordId
  ) => {
    try {
      setIsLoading(true);
      await deleteDoc(
        doc(db, `unitData/${selectedUnit}/${selectedYear}/data/items`, recordId)
      );
      return { success: true, message: "🗑️ Data berhasil dihapus!" };
    } catch (error) {
      console.error("Error deleting data:", error);
      return { success: false, message: "❌ Gagal hapus: " + error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGroupedData = async (selectedUnit, selectedYear) => {
    const colRef = collection(
      db,
      `unitData/${selectedUnit}/${selectedYear}/data/items`
    );
    const snapshot = await getDocs(colRef);

    const rawData = snapshot.docs.map((doc) => doc.data());

    // 🔹 Siapkan struktur data per account code
    const grouped = {};
    rawData.forEach((row) => {
      const {
        lineDesc,
        accountCode,
        ei4ShortName,
        location,
        businessLine,
        month,
        amount,
      } = row;

      if (!grouped[accountCode]) {
        grouped[accountCode] = {
          category: ei4ShortName || "-",
          accountCode: accountCode || "-",
          area: location || "-",
          busLine: businessLine || "-",
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

      if (month) {
        const monthKey = month.slice(0, 3); // misal "January" → "Jan"
        if (grouped[accountCode][monthKey] !== undefined) {
          grouped[accountCode][monthKey] += Number(amount) || 0;
        }
      }
    });

    return Object.values(grouped);
  };

  return {
    data,
    isLoading,
    importFromExcelToFirebase,
    importBudgetFromExcel,
    exportToExcel,
    updateDataInFirebase,
    deleteDataFromFirebase,
    getPieChartData,
    resetYearData,
    fetchGroupedData,
  };
};