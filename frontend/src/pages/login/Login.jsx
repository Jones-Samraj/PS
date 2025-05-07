import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "./firebase";
import "./Login.css";
import ps from "../../assets/ps.png";
import testportal from "../../assets/testportal.png";
import google from "../../assets/google.png";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPortal, setSelectedPortal] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/login", {
        email,
        password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("role", response.data.role);
      localStorage.setItem("id", response.data.id);

      if (selectedPortal === "testportal") {
        navigate("/testportal");
      } else if (response.data.role === "admin") {
        navigate("/adminnavbar", { state: { loginSuccess: true } });
      } else {
        navigate("/studentnavbar", { state: { loginSuccess: true } });
      }
    } catch (error) {
      alert(error.response?.data?.message || "Login failed");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Email is missing from Firebase login response");
      }

      const response = await axios.post("http://localhost:5000/oauth", {
        email: user.email,
      });

      localStorage.setItem("googleEmail", user.email);
      localStorage.setItem("googleName", user.displayName);
      localStorage.setItem("role", response.data.role || "student");
      localStorage.setItem("id", response.data.id || "");
      localStorage.setItem("token", "firebase_token");

      console.log("Login success:", response.data);

      setTimeout(() => {
        if (selectedPortal === "testportal") {
          navigate("/testportal");
        } else if (response.data.role === "admin") {
          navigate("/adminnavbar", { state: { loginSuccess: true } });
        } else {
          navigate("/studentnavbar", { state: { loginSuccess: true } });
        }
      }, 100);
    } catch (error) {
      console.error("❌ Error during Firebase login:", error.message);
      alert("Login failed: " + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="login-container">
      <div className="header">
        <div
          className={`ps ${selectedPortal === "ps" ? "active" : ""}`}
          onClick={() => setSelectedPortal("ps")}
        >
          <img src={ps} alt="PS" /> PS
        </div>
        <div
          className={`testportal ${selectedPortal === "testportal" ? "active" : ""}`}
          onClick={() => setSelectedPortal("testportal")}
        >
          <img src={testportal} alt="Test Portal" /> Test Portal
        </div>
      </div>

      <div className="login-box">
        <div className="input-group">
          <div className="card-top">
            <h2 className="welcome-login">Hi, Welcome Back!</h2>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="input-group">
            <label style={{ marginTop: -15 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button className="login-button" onClick={handleLogin}>
            Login
          </button>
        </div>

        <div style={{ marginBottom: -10 }}>
          <div className="divider">— OR —</div>

          <button className="login-button google" onClick={handleGoogleLogin}>
            <img
              src={google}
              alt="Google-signin"
              style={{ width: 15, height: 15 }}
            />
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
