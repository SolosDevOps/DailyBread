import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Register.css";

const Register: React.FC = () => {
  const { user, register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !email || !password) {
      setError("Fill all fields");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(username, email, password);
    } catch (e: any) {
      setError(e?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="register-container">
      <div className="register-card">
        {/* Left Side - Welcome Section */}
        <div className="register-welcome">
          <div className="register-welcome-content">
            <h1 className="register-welcome-title">Welcome Back!</h1>
            <p className="register-welcome-text">
              To keep connected with us please login with your personal info
            </p>
            <Link to="/login" className="register-welcome-btn">
              Sign In
            </Link>
          </div>
        </div>

        {/* Right Side - Form Section */}
        <div className="register-form-section">
          <div className="register-form-content">
            <h2 className="register-form-title">Create Account</h2>

            <div className="register-social-buttons">
              <button className="register-social-btn">f</button>
              <button className="register-social-btn">G+</button>
              <button className="register-social-btn">in</button>
            </div>

            <p className="register-form-subtitle">
              or use your email for registration:
            </p>

            {error && <div className="register-error">{error}</div>}

            <form onSubmit={handleSubmit} className="register-form">
              <input
                type="text"
                placeholder="Name"
                className="register-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />

              <input
                type="email"
                placeholder="Email"
                className="register-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="register-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />

              <button
                type="submit"
                disabled={submitting}
                className="register-button"
              >
                {submitting ? "Creating..." : "SIGN UP"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
