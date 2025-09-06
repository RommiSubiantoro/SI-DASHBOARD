import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase"; // Pastikan db diimpor dari file firebase.js
import { collection, query, where, getDocs } from "firebase/firestore"; // Impor fungsi Firestore yang diperlukan
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/login.css";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // State untuk menunjukkan proses login

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Lakukan otentikasi dengan email dan sandi
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      
      // 2. Dapatkan data pengguna dari Firestore berdasarkan UID
      const usersCollectionRef = collection(db, "users");
      const q = query(usersCollectionRef, where("email", "==", user.email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Jika tidak ada dokumen yang cocok, berarti data pengguna di Firestore tidak ada
        // (opsional) Anda bisa menambahkan logika logout di sini
        setError("Login gagal: Data pengguna tidak ditemukan.");
        await auth.signOut(); // Pastikan untuk logout dari Firebase Auth jika data tidak ditemukan
        setIsLoading(false);
        return;
      }

      // 3. Dapatkan data role dari dokumen Firestore pertama yang cocok
      const userData = querySnapshot.docs[0].data();
      const userRole = userData.role;

      // 4. Arahkan pengguna berdasarkan rolenya
      if (userRole === "Super Admin") {
        navigate("/admin");
      } else if (userRole === "User") {
        navigate("/user");
      } else if (userRole === "Manager"){
        navigate("manager");
      } else if (userRole === "Supervisor")  {
        navigate("/supervisor");
      } else ("tidak ada data yang sesuai, silahkan hubungi admin")
      
    } catch (err) {
      // Tangani kesalahan otentikasi dari Firebase
      let errorMessage = "Login gagal: username atau sandi salah.";
      console.error(err.code);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        errorMessage = "Email atau sandi salah.";
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-cover">
      <div className="auth">
        <form onSubmit={handleSubmit}>
          <h1 className="login">Login</h1>

          {/* Input Email */}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            disabled={isLoading}
          />

          {/* Input Password dengan ikon mata */}
          <div style={{ position: "relative", width: "100%", top: "10px" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              disabled={isLoading}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "black" }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Error message */}
          {error && <p style={{ color: "white", marginTop: "10px", marginBottom: "10px" }}>{error}</p>}

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Submit"}
          </button>
        </form>
      </div>

      <div className="logo-login"></div>
    </div>
  );
};

export default Login;