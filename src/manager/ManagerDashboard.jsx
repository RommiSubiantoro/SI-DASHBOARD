import React, { useState } from "react";
import UserDashboard from "../user/UserDashboard";
import { LogOut } from 'lucide-react';
import '../css/ManagerDash.css';

function ManagerDashboard() {
  const [activePage, setActivePage] = useState("dashboard");
  const [isLoading, setIsLoading] = useState(false);

  const handleSimpleLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  
  alert('Berhasil logout!');
  window.location.href= "/";
};

  return (
    <div className='Container'>
      {/* sidebar */}
      <div className='Sidebar'>
        <h2 className="text">Manager Panel</h2>
        <button
          className="home-unit"
          onClick={() => setActivePage("dashboard")}
        >
          Home
        </button>
        <button
          className="button-unit"
          onClick={() => setActivePage("unit")}
        >
          Show Unit Bisnis
        </button>

        <button
          className="Btn-manager"
          onClick={() => setActivePage("user")}
        >
          Manage User
        </button>
         <button
                  onClick={handleSimpleLogout}
                  disabled={isLoading}
                  className="button-logout"
                >
                  {isLoading ? (
                    <div className="loading-spinner"></div>
                  ) : (
                    <>
                      <LogOut size={20} />
                      Logout
                    </>
                  )}
                </button>
      </div>
      {/* Konten */}
      <div className="kontendash">
        {activePage === "dashboard" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <UserDashboard></UserDashboard>
          </div>
        )}

        {activePage === "unit" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Manage Unit Bisnis</h1>
          </div>
        )}

        {activePage === "user" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Akses User</h1>
          </div>
        )}

      </div>

    </div>


  )
}

export default ManagerDashboard