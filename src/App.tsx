import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import { NotificationProvider } from "./context/NotificationContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/Profile/ProfilePage";
import "./styles/App.css";
import { ToastProvider } from "./context/ToastContext";
import { FeedProvider } from "./context/FeedContext";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
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
                  <Route path="/" element={<Landing />} />
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
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
