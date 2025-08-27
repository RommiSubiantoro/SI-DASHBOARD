import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import loginImage from "../assets/truck.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import "../css/login.css"


const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // redirect ke dashboard kalau berhasil
      navigate("/admin");
    } catch (err) {
      setError("Login gagal: " + err.message);
    }
  };

  return (
    <div className="container-login">
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
          />

          {/* Input Password dengan ikon mata */}
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              style={{ width: "100%", paddingRight: "40px" }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
              }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Error message */}
          {error && <p style={{ color: "red" }}>{error}</p>}

          <button type="submit">Submit</button>
        </form>
      </div>

      <div className="logo-login">
        <img src={loginImage} alt="Login Logo" />
      </div>
    </div>
  );
};

export default Login;
