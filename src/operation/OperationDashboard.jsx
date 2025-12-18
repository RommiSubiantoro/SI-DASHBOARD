import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";

// Component yang dipakai
import Sidebar from "./Sidebar";
import Navbar from "../components/navbar";
import JoEstimasi from "./JoEstimasi";
import JoRekapContainer from "./JoRekapContainer";
import JoVolume from "./JoVolume";

function OperationDashboard() {
  // 🟢 Load dari localStorage saat pertama kali
  const [activePage, setActivePage] = useState(() => {
    const savedPage = localStorage.getItem("activePage");
    return savedPage || "jo-estimasi";
  });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const auth = getAuth();

  // 🟢 Simpan ke localStorage setiap kali activePage berubah
  useEffect(() => {
    localStorage.setItem("activePage", activePage);
  }, [activePage]);

  // 🟢 Detect screen resize untuk responsivitas
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-close sidebar saat pindah ke mobile
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🟢 Prevent body scroll ketika sidebar mobile terbuka
  useEffect(() => {
    if (isSidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isSidebarOpen, isMobile]);

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
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop: Fixed, Mobile: Drawer */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-40 
          w-64 sm:w-72 md:w-64 lg:w-72
          h-full md:h-screen
          bg-red-500 
          transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          shadow-lg md:shadow-none
        `}
      >
        <Sidebar
          activePage={activePage}
          onChangePage={handlePageChange}
          onLogout={handleLogout}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </aside>

      {/* Backdrop Mobile - Hanya tampil di mobile ketika sidebar terbuka */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col w-full min-w-0">
        {/* Navbar - Sticky di semua viewport */}
        <header className="sticky top-0 z-20 bg-white shadow-sm">
          <Navbar
            onLogout={handleLogout}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isLoading={isLoading}
          />
        </header>

        {/* Content Area - Scrollable dengan padding responsif */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="
            container mx-auto
            px-3 py-4
            sm:px-4 sm:py-5
            md:px-6 md:py-6
            lg:px-8 lg:py-8
            max-w-full
          ">
            {/* Content Wrapper dengan max-width untuk layar besar */}
            <div className="max-w-7xl mx-auto w-full">
              {activePage === "jo-estimasi" && <JoEstimasi />}
              {activePage === "jo-rekap" && <JoRekapContainer data={[]} />}
              {activePage === "jo-volume" && <JoVolume />}
            </div>
          </div>
        </main>
      </div>

      {/* Loading Overlay - Responsive */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 sm:p-8 shadow-2xl max-w-sm w-full">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-4 border-red-500 border-t-transparent mx-auto"></div>
            <p className="text-center text-gray-700 mt-4 text-sm sm:text-base font-medium">
              Loading...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperationDashboard;