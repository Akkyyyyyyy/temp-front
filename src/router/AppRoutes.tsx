import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Index from "../pages/Index";
import NotFound from "../pages/NotFound";
import Reminders from "../pages/Reminders";
import Login from "../pages/Login";
import Register from "../pages/Register";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { PublicRoute } from "./PublicRoutes";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Protected Routes */}
      <Route path="/" element={<ProtectedRoutes><Index /></ProtectedRoutes>} />
      <Route path="/reminders" element={<ProtectedRoutes><Reminders /></ProtectedRoutes>} />

      {/* Single Login Route with Tabs for Company/Member */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

      {/* Company Register */}
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
