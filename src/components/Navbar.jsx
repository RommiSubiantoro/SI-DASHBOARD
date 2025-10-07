import React, { useState, useEffect, useRef } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { LogOut, ChevronDown } from "lucide-react";
import Logo from "../assets/logo-smdr.png";

const Navbar = ({ onLogout }) => {
  const [userProfile, setUserProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const auth = getAuth();
  const db = getFirestore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        try {
          // ambil role yang mungkin sudah ada di localStorage (fallback)
          const roleFromStorage = (
            localStorage.getItem("userRole") || ""
          ).trim();

          // ambil dokumen user dari Firestore (pastikan doc id = auth.uid)
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.exists() ? userDocSnap.data() : {};

          // pilih role: prefer Firestore jika ada, kalau tidak gunakan yang di localStorage
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
            role: resolvedRole || "", // bisa kosong kalau memang tidak ada sama sekali
          };

          setUserProfile(profile);

          // simpan ke localStorage — hanya kalau ada role non-empty
          localStorage.setItem("userUid", profile.uid);
          if (profile.role && profile.role.trim() !== "") {
            // simpan lowercase agar konsisten saat dicek ProtectedRoute
            localStorage.setItem("userRole", profile.role.trim().toLowerCase());
          }
          localStorage.setItem("isAuthenticated", "true");
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // jangan menimpa localStorage kalau error saat fetch
        }
      } else {
        // user logout / tidak ada
        setUserProfile(null);
        localStorage.removeItem("userRole");
        localStorage.removeItem("userUid");
        localStorage.removeItem("isAuthenticated");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db]);

  // close dropdown when click outside
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
    if (displayName) {
      return displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    localStorage.removeItem("userRole");
    localStorage.removeItem("userUid");
    localStorage.removeItem("isAuthenticated");
    if (onLogout) onLogout();
  };

  return (
    <nav className="bg-black shadow-md ml-64">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <img
              src={Logo}
              alt="Samudera Indonesia Logo"
              className="h-10 w-auto object-contain"
            />
            <h2 className="text-xl font-bold text-white">Samudera Indonesia</h2>
          </div>

          {userProfile ? (
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="flex flex-col mr-3 min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {userProfile.displayName}
                  </span>
                  <span className="text-xs text-gray-300 truncate">
                    {userProfile.email}
                  </span>
                </div>
                <div className="flex-shrink-0">
                  {userProfile.photoURL ? (
                    <img
                      src={userProfile.photoURL}
                      alt="User  Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700">
                        {getInitials(
                          userProfile.email,
                          userProfile.displayName
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <ChevronDown
                  className={`ml-1 transition-transform duration-200 ${
                    showDropdown ? "rotate-180" : ""
                  }`}
                  size={16}
                />
              </div>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="font-medium text-gray-900 truncate">
                      {userProfile.displayName}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {userProfile.email}
                    </div>
                  </div>
                  <div className="border-t border-gray-200">
                    <button
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className="mr-3" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">Not logged in</div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
