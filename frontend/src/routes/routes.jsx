import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Login from "../pages/login/Login";
import StudentNavbar from "../components/navbar/Studentnavbar";
import Adminnavbar from "../components/navbar/Adminnavbar";
import ProtectedRoute from "./ProtectedRoute";
import Testportal from "../pages/testportal/Testportal";

const AppRoutes = () => {
  const [role, setRole] = useState(localStorage.getItem("role") || null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get("http://localhost:5000/user-role", {
          headers: { Authorization: token },
        });

        setRole(response.data.role);
        localStorage.setItem("role", response.data.role);
      } catch (error) {
        console.error("Error fetching role:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("role");
      }
    };

    fetchUserRole();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/studentnavbar"
          element={
            <ProtectedRoute
              element={<StudentNavbar />}
              allowedRoles={["student"]}
            />
          }
        />
        <Route
          path="/testportal"
          element={
            <ProtectedRoute
              element={<Testportal />}
              allowedRoles={["student"]}
            />
          }
        />
        <Route
          path="/adminnavbar"
          element={
            <ProtectedRoute
              element={<Adminnavbar />}
              allowedRoles={["admin"]}
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to={role === "admin" ? "/adminnavbar" : "/studentnavbar"}
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
