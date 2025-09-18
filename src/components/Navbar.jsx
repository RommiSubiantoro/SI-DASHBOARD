import React, { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { LogOut, User, ChevronDown } from 'lucide-react';
import '../css/Navbar.css';

const Navbar = ({ onLogout }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const auth = getAuth();
  const db = getFirestore();

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // ambil data role dari Firestore
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};

          const profile = {
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            photoURL: currentUser.photoURL,
            uid: currentUser.uid,
            role: userData.role || "", 
          };

          setUserProfile(profile);

          // Simpan role ke localStorage supaya bisa dicek di ProtectedRoute
          localStorage.setItem("userRole", profile.role);

        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
        localStorage.removeItem("userRole");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  // Close dropdown ketika klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (email, displayName) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return 'U';
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    if (onLogout) onLogout();
  };

  if (loading) {
    return <nav className="navbar"><div className="navbar-container"><h2>Loading...</h2></div></nav>;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <h2 className="logo-text">Samudera Indonesia</h2>
        </div>

        {/* User Profile */}
        {userProfile ? (
          <div className="navbar-user" ref={dropdownRef}>
            <div className="user-info" onClick={() => setShowDropdown(!showDropdown)}>
              <div className="user-details">
                <span className="user-name">{userProfile.displayName}</span>
                <span className="user-email">{userProfile.email}</span>
              </div>
              <div className="user-avatar">
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt="User Avatar" className="avatar-image" />
                ) : (
                  <div className="avatar-placeholder">{getInitials(userProfile.email, userProfile.displayName)}</div>
                )}
              </div>
              <ChevronDown className={`dropdown-icon ${showDropdown ? 'rotated' : ''}`} size={16} />
            </div>

            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-name">{userProfile.displayName}</div>
                  <div className="dropdown-email">{userProfile.email}</div>
                </div>
                <div className="dropdown-divider"></div>
                <div className="dropdown-items">
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={16} /><span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="navbar-auth">
            <span>Not logged in</span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
