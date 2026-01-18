import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "../pages/Index";
import NotFound from "../pages/NotFound";
import Reminders from "../pages/Reminders";
import Login from "../pages/Login";
import Register from "../pages/Register";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { PublicRoute } from "./PublicRoutes";
import SetPassword from "@/pages/SetPassword";
import PrivacyPolicies from "@/pages/PrivacyPolicies";
import Home from "@/pages/Home";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoutes><Index /></ProtectedRoutes>} />
      <Route path="/reminders" element={<ProtectedRoutes><Reminders /></ProtectedRoutes>} />

      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/set-password" element={<SetPassword />} />

      {/* Company Register */}
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/privacy-policies" element={<PrivacyPolicies />} />
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
