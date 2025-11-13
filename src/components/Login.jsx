import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Logo from "../assets/logo-smdr.png";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("Silakan masukkan email terlebih dahulu");
      return;
    }

    setError("");
    setSuccessMessage("");
    setIsResetLoading(true);

    try {
      // Cek apakah email ada di Firestore
      const emailQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const emailSnapshot = await getDocs(emailQuery);

      if (emailSnapshot.empty) {
        setError("Email tidak terdaftar di sistem.");
        setIsResetLoading(false);
        return;
      }

      // Kirim email reset password via Firebase
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage(
        "Email reset kata sandi telah dikirim. Silakan periksa email Anda."
      );
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        setError("Format email tidak valid.");
      } else {
        setError(
          "Terjadi kesalahan saat mengirim email reset. Silakan coba lagi."
        );
      }
    } finally {
      setIsResetLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      // Login via Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const currentUser = userCredential.user;

      // Ambil role dari Firestore
      const emailQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const emailSnapshot = await getDocs(emailQuery);

      if (emailSnapshot.empty) {
        setError("Email tidak ditemukan di sistem. Silakan hubungi admin.");
        setIsLoading(false);
        return;
      }

      const userDoc = emailSnapshot.docs[0];
      const userData = userDoc.data();
      
      // 🔹 Tangani baik string maupun array
      let roleData = userData.role;

      let roles = [];
      if (Array.isArray(roleData)) {
        roles = roleData.map((r) => r.toLowerCase());
      } else if (typeof roleData === "string" && roleData.trim() !== "") {
        roles = [roleData.toLowerCase()];
      }

      // Simpan ke localStorage
      localStorage.setItem("userUid", userDoc.id);
      localStorage.setItem("userRoles", JSON.stringify(roles)); // simpan sebagai array
      localStorage.setItem("isAuthenticated", "true");

      // 🔹 Redirect berdasarkan prioritas role
      if (roles.includes("super admin")) {
        navigate("/admin");
      } else if (roles.includes("manager")) {
        navigate("/manager");
      } else if (roles.includes("supervisor")) {
        navigate("/supervisor");
      } else if (roles.includes("user")) {
        navigate("/user");
      } else if (roles.includes("operation")) {
        navigate("/operation");
      } else if (roles.includes("marketing")) {
        navigate("/marketing");
      } else {
        setError(`Role tidak dikenali: ${roles.join(", ")}`);
      }
    } catch (err) {
      console.error("Error saat login:", err);

      // 🔹 Tangani berbagai jenis error Firebase
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("Email atau password salah.");
      } else if (err.code === "auth/invalid-email") {
        setError("Format email tidak valid.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi nanti.");
      }

      // 🔹 Pesan error hilang otomatis setelah 5 detik
      setTimeout(() => setError(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-6xl bg-orange shadow-lg rounded-xl overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Form Section */}
        <div className="p-8 flex flex-col justify-center bg-red-500">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <img src={Logo} alt="Logo" className="w-16 h-16" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Selamat Datang</h1>
            <p className="text-gray-500">Silakan masuk ke akun Anda</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1 "
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white disabled:bg-gray-800"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white disabled:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  aria-label="Toggle password visibility"
                >
                  👁
                </button>
              </div>
              {error && (
                <div className="mt-3 p-2 text-sm text-red-600 bg-red-100 border border-red-200 rounded-md text-center transition-all duration-300">
                  {error}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && <div className="text-red-500 text-sm">{error}</div>}

            {/* Success Message */}
            {successMessage && (
              <div className="text-green-500 text-sm">{successMessage}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 bg-white text-black py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>

            {/* Reset Password */}
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={isResetLoading}
              className="w-full flex justify-center items-center gap-2 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-300"
            >
              {isResetLoading ? "Mengirim..." : "Lupa Password?"}
            </button>
          </form>
        </div>

        {/* Hero Section */}
        <div className="bg-blue-50 p-10 flex flex-col justify-center text-center">
          <div className="flex justify-center mb-6">
            <img src={Logo} alt="Logo" className="w-20 h-20" />
          </div>
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            SI-Dashboard
          </h2>
          <p className="text-gray-600 mb-8">
            Platform terpadu untuk mengelola operasional bisnis Anda dengan
            efisien dan modern
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white shadow p-4 rounded-lg">
              <p className="font-medium">📊 Dashboard Analytics</p>
            </div>
            <div className="bg-white shadow p-4 rounded-lg">
              <p className="font-medium">⏱ Real-time Monitoring</p>
            </div>
            <div className="bg-white shadow p-4 rounded-lg">
              <p className="font-medium">👥 Multi-role Access</p>
            </div>
            <div className="bg-white shadow p-4 rounded-lg">
              <p className="font-medium">🔒 Secure Authentication</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
