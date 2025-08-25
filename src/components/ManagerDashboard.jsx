import React, { useState } from "react";
import '../css/ManagerDash.css';

function ManagerDashboard() {
    const [activePage, setActivePage] = useState("dashboard");

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
          Manage Unit Bisnis
        </button>
        
        <button
          className="Btn-manager"
          onClick={() => setActivePage("user")}
        >
          Manage User
        </button>
    </div>
        {/* Konten */}
      <div className="kontendash">
        {activePage === "dashboard" && (
          <div>
            <h1 className="title">Dashboard</h1>
            <p>Selamat datang di dashboard admin </p>
          </div>
        )}

        {activePage === "unit" && (
          <div>
             <h1 className="title">Manage Unit Bisnis</h1>
          </div>
        )}

        {activePage === "user" && (
          <div>
             <h1 className="title">Akses User</h1>
          </div>
        )}
        
      </div>
      
   </div>
   
        
  )
}

export default ManagerDashboard