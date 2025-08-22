import React, { useState } from "react";
import loginImage from "../assets/truck.png"; 

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  return (
      <div className="container">
        <div className="auth">
          <form>
             <h1 className="login">Login</h1>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button type="submit">Submit</button>
          </form>
        </div>
        
        <div className="logo-login">
          {

          }
          <img src={loginImage} />
        </div>
      </div>
  );
};

export default Login;
