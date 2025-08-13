import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/Profile/ProfilePage";
import "./styles/App.css";
import { ToastProvider } from "./context/ToastContext";
import { FeedProvider } from "./context/FeedContext";

const Home: React.FC = () => (
  <div className="auth-container">
    <div className="auth-card">
      <div className="auth-header">
        <h1 className="auth-title font-serif">Daily Bread</h1>
        <p className="auth-subtitle">
          A Christian community for sharing life's daily bread.
        </p>
      </div>

      <div className="flex space-x-4">
        <a href="/login" className="btn flex-1">
          Sign In
        </a>
        <a href="/register" className="btn btn-secondary flex-1">
          Sign Up
        </a>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SidebarProvider>
        <ToastProvider>
          <FeedProvider>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile/:id" element={<ProfilePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </FeedProvider>
        </ToastProvider>
      </SidebarProvider>
    </AuthProvider>
  );
};

export default App;
