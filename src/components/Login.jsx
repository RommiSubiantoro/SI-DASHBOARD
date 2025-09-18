import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
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
      <div className="auth">
        <form onSubmit={handleLogin}>
          <h1 className="login">Login</h1>

          {/* Input Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />

          {/* Input Password */}
          <div style={{ position: "relative", width: "100%", top: "10px" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)} // perbaikan disini
              required
              disabled={isLoading}
            />
            <span
              onClick={togglePasswordVisibility}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: "black",
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <p style={{ color: "white", marginTop: "10px", marginBottom: "10px" }}>
              {error}
            </p>
          )}

          {/* Success Message */}
          {successMessage && (
            <p style={{ color: "lightgreen", marginTop: "10px", marginBottom: "10px" }}>
              {successMessage}
            </p>
          )}

          {/* Submit Button */}
          <button className="submit-login"
          type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Submit"}
          </button>

          {/* Reset Password Button */}
          <button className="lupa-pass"
            type="button"
            onClick={handleResetPassword}
            disabled={isResetLoading}
            style={{ marginTop: "10px", }}
          >
            {isResetLoading ? "Mengirim..." : "Lupa Password?"}
          </button>
        </form>
      </div>
      <div className="logo-login"></div>
    </div>
  );
};

export default Login;
