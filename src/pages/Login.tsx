import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setError("Fill all fields");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(emailOrUsername, password);
    } catch (e: any) {
      setError(e?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left Side - Form Section */}
        <div className="login-form-section">
          <div className="login-form-content">
            <h2 className="login-form-title">Sign in to Account</h2>

            <div className="login-social-buttons">
              <button className="login-social-btn">f</button>
              <button className="login-social-btn">G+</button>
              <button className="login-social-btn">in</button>
            </div>

            <p className="login-form-subtitle">or use your email account:</p>

            {error && <div className="login-error">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              <input
                type="text"
                placeholder="Email"
                className="login-input"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                autoComplete="username"
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="login-button"
              >
                {submitting ? "Signing in..." : "SIGN IN"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Welcome Section */}
        <div className="login-welcome">
          <div className="login-welcome-content">
            <h1 className="login-welcome-title">Hello, Friend!</h1>
            <p className="login-welcome-text">
              Enter your personal details and start journey with us
            </p>
            <Link to="/register" className="login-welcome-btn">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
