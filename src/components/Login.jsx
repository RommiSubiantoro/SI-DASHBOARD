import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Logo from "../assets/logo-smdr.png"
import { useNavigate } from "react-router-dom";
// Import CSS file baru
import "../css/login.css";

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
      const emailQuery = query(collection(db, "users"), where("email", "==", email));
      const emailSnapshot = await getDocs(emailQuery);

      if (emailSnapshot.empty) {
        setError("Email tidak terdaftar di sistem.");
        setIsResetLoading(false);
        return;
      }

      // Kirim email reset password via Firebase
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage("Email reset kata sandi telah dikirim. Silakan periksa email Anda.");
    } catch (err) {
      if (err.code === "auth/invalid-email") {
        setError("Format email tidak valid.");
      } else {
        setError("Terjadi kesalahan saat mengirim email reset. Silakan coba lagi.");
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
      await signInWithEmailAndPassword(auth, email, password);

      // Ambil role dari Firestore
      const emailQuery = query(collection(db, "users"), where("email", "==", email));
      const emailSnapshot = await getDocs(emailQuery);

      if (emailSnapshot.empty) {
        setError("Email tidak ditemukan di sistem. Silakan hubungi admin.");
        setIsLoading(false);
        return;
      }

      const userDoc = emailSnapshot.docs[0];
      const userData = userDoc.data();
      const role = (userData.role || "").trim().toLowerCase();

      // Simpan data ke localStorage
      localStorage.setItem("userUid", userDoc.id);
      localStorage.setItem("userRole", role);

      // Redirect sesuai role
      if (role === 'super admin') {
        navigate("/admin");
      } else if (role === 'manager') {
        navigate("/manager");
      } else if (role === 'supervisor') {
        navigate("/supervisor");
      } else if (role === 'user') {
        navigate("/user");
      } else {
        setError("Role tidak dikenali. Hubungi Super Admin.");
      }
    } catch (err) {
      if (err.code === "auth/invalid-credential") {
        setError("Email atau password salah.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-cover">
      <div className="login-container">
        {/* Form Section */}
        <div className="auth">
          <div className="auth-header">
            <div className="auth-logo"></div>
            <h1 className="login">Selamat Datang</h1>
            <p className="auth-subtitle">Silakan masuk ke akun Anda</p>
          </div>

          <form onSubmit={handleLogin}>
            {/* Email Input */}
            <div className="input-group">
              <label htmlFor="email" className="input-label">Email</label>
              <div className="input-wrapper">
                <div className="input-icon"></div>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Masukkan email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label htmlFor="password" className="input-label">Password</label>
              <div className="input-wrapper">
                <div className="input-icon password-icon"></div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Masukkan password Anda"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={`password-toggle ${showPassword ? 'hidden' : ''}`}
                  onClick={togglePasswordVisibility}
                  aria-label="Toggle password visibility"
                ></button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="message error">
                {error}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="message success">
                {successMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              className="btn btn-primary"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Memproses...</span>
                </>
              ) : (
                "Masuk"
              )}
            </button>

            {/* Reset Password Button */}
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleResetPassword}
              disabled={isResetLoading}
            >
              {isResetLoading ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>Mengirim...</span>
                </>
              ) : (
                "Lupa Password?"
              )}
            </button>
          </form>
        </div>

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-logo"><div className="hero-logo">
              <img src={Logo} alt="Logo" className="w-20 h-20" />
            </div></div>
            <h2 className="hero-title">Sistem Manajemen</h2>
            <p className="hero-description">
              Platform terpadu untuk mengelola operasional bisnis Anda dengan efisien dan modern
            </p>

            {/* Features Grid */}
            <div className="hero-features">
              <div className="hero-feature">
                <div className="hero-feature-icon"></div>
                <p className="hero-feature-text">Dashboard Analytics</p>
              </div>
              <div className="hero-feature">
                <div className="hero-feature-icon"></div>
                <p className="hero-feature-text">Real-time Monitoring</p>
              </div>
              <div className="hero-feature">
                <div className="hero-feature-icon"></div>
                <p className="hero-feature-text">Multi-role Access</p>
              </div>
              <div className="hero-feature">
                <div className="hero-feature-icon"></div>
                <p className="hero-feature-text">Secure Authentication</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;