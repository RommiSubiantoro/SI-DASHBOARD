import React, { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { LogOut, ChevronDown, Menu } from "lucide-react";
import Logo from "../assets/logo-smdr.png";

const Navbar = ({ onLogout, onToggleSidebar }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const roleFromStorage = localStorage.getItem("userRole") || "";
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.exists() ? userDocSnap.data() : {};

          const resolvedRole =
            userData.role && String(userData.role).trim() !== ""
              ? String(userData.role).trim()
              : roleFromStorage;

          const profile = {
            email: currentUser.email,
            displayName:
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "User",
            photoURL: currentUser.photoURL,
            uid: currentUser.uid,
            role: resolvedRole || "",
          };

          setUserProfile(profile);
          localStorage.setItem("userUid", profile.uid);
          if (profile.role.trim() !== "") {
            localStorage.setItem("userRole", profile.role.toLowerCase());
          }
          localStorage.setItem("isAuthenticated", "true");
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      } else {
        setUserProfile(null);
        localStorage.clear();
      }
    });
    return () => unsubscribe();
  }, [auth, db]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (email, displayName) => {
    if (displayName)
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    if (onLogout) onLogout();
  };

  return (
    <nav className="bg-black shadow-md sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 md:px-8">
        {/* Left: Logo + menu button */}
        <div className="flex items-center space-x-3">
          {/* Tombol toggle sidebar (mobile only) */}
          <button
            className="md:hidden text-white p-2 rounded-md hover:bg-gray-800 transition-colors"
            onClick={onToggleSidebar}
          >
            {/* Hamburger icon */}
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo */}
          <img
            src={Logo}
            alt="Samudera Indonesia Logo"
            className="h-10 w-auto object-contain"
          />
          <h2 className="text-lg md:text-xl font-bold text-white">
            Samudera Indonesia
          </h2>
        </div>

        {/* Right: User info */}
        {userProfile ? (
          <div className="relative" ref={dropdownRef}>
            <button
              className="flex items-center p-2 rounded-lg hover:bg-gray-800 transition-colors"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {/* User Info (hidden on very small screens) */}
              <div className="hidden sm:flex flex-col text-left mr-3">
                <span className="text-sm font-medium text-white truncate">
                  {userProfile.displayName}
                </span>
                <span className="text-xs text-gray-400 truncate">
                  {userProfile.email}
                </span>
              </div>

              {/* Avatar */}
              {userProfile.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-800">
                    {getInitials(userProfile.email, userProfile.displayName)}
                  </span>
                </div>
              )}

              {/* Chevron */}
              <ChevronDown
                className={`ml-1 text-white transition-transform duration-200 ${
                  showDropdown ? "rotate-180" : ""
                }`}
                size={16}
              />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 animate-fade-in">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="font-medium text-gray-900 truncate">
                    {userProfile.displayName}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {userProfile.email}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-300 text-sm">Not logged in</div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
