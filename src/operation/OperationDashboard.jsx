import React, { useState } from "react";
import { getAuth, signOut } from "firebase/auth";

// Component yang dipakai
import Sidebar from "./Sidebar";
import Navbar from "../components/navbar";
import JoEstimasi from "./JoEstimasi";
import JoRekapContainer from "./JoRekapContainer";

function OperationDashboard() {
  const [activePage, setActivePage] = useState("jo-estimasi");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default false untuk mobile
  const [isLoading, setIsLoading] = useState(false);

  const auth = getAuth();

  // 🔴 Logout
  const handleLogout = async () => {
    try {
      setIsLoading(true);
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    } catch (e) {
      alert("Gagal logout: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle page change dan tutup sidebar di mobile
  const handlePageChange = (page) => {
    setActivePage(page);
    // Tutup sidebar otomatis di mobile setelah pilih menu
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar - Fixed */}
      <div
        className={`fixed inset-y-0 left-0 z-50 h-screen w-64 bg-red-500 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } md:relative md:translate-x-0`}
      >
        <Sidebar
          activePage={activePage}
          onChangePage={handlePageChange}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Backdrop Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {/* Navbar - Sticky */}
        <div className="sticky top-0 z-30 bg-white shadow">
          <Navbar
            onLogout={handleLogout}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isLoading={isLoading}
          />
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 md:p-8 min-h-full">
            {activePage === "jo-estimasi" && <JoEstimasi />}
            {activePage === "jo-rekap" && <JoRekapContainer data={[]} />}
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-center text-gray-600 mt-3 text-sm">
              Loading...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperationDashboard;