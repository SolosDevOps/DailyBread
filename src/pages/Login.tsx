import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import "../styles/Login.css";

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<{
    google: boolean;
    facebook: boolean;
  } | null>(null);

  // Remember Me functionality
  const REMEMBER_ME_KEY = "dailybread_remember_me";
  const REMEMBER_ME_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  const saveCredentials = (email: string, password: string) => {
    const credentials = {
      email,
      password,
      timestamp: Date.now(),
      expiresAt: Date.now() + REMEMBER_ME_EXPIRY,
    };
    localStorage.setItem(REMEMBER_ME_KEY, JSON.stringify(credentials));
  };

  const loadSavedCredentials = () => {
    const saved = localStorage.getItem(REMEMBER_ME_KEY);
    if (!saved) return null;

    try {
      const credentials = JSON.parse(saved);

      // Check if credentials have expired
      if (Date.now() > credentials.expiresAt) {
        localStorage.removeItem(REMEMBER_ME_KEY);
        return null;
      }

      return credentials;
    } catch {
      localStorage.removeItem(REMEMBER_ME_KEY);
      return null;
    }
  };

  const clearSavedCredentials = () => {
    localStorage.removeItem(REMEMBER_ME_KEY);
  };

  // Utility function to check for expired credentials globally
  const checkAndCleanExpiredCredentials = () => {
    const saved = localStorage.getItem(REMEMBER_ME_KEY);
    if (!saved) return;

    try {
      const credentials = JSON.parse(saved);
      if (Date.now() > credentials.expiresAt) {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    } catch {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }
  };

  useEffect(() => {
    let aborted = false;
    api
      .get<{ google: boolean; facebook: boolean }>("/auth/oauth/providers")
      .then((res) => {
        if (!aborted) setProviders(res);
      })
      .catch(() => {
        if (!aborted) setProviders({ google: false, facebook: false });
      });
    return () => {
      aborted = true;
    };
  }, []);

  // Load saved credentials on component mount
  useEffect(() => {
    // First clean any expired credentials
    checkAndCleanExpiredCredentials();

    // Then load valid credentials
    const saved = loadSavedCredentials();
    if (saved) {
      setEmailOrUsername(saved.email);
      setPassword(saved.password);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      switch (err) {
        case "google_disabled":
          setError("Google sign-in is not configured on the server.");
          break;
        case "facebook_disabled":
          setError("Facebook sign-in is not configured on the server.");
          break;
        case "google_failed":
          setError("Google sign-in failed. Please try again.");
          break;
        case "facebook_failed":
          setError("Facebook sign-in failed. Please try again.");
          break;
        default:
          setError("Social sign-in error. Please try again.");
      }
      // Clean the query string
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

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

      // Save or clear credentials based on remember me checkbox
      if (rememberMe) {
        saveCredentials(emailOrUsername, password);
      } else {
        clearSavedCredentials();
      }
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
              <button
                type="button"
                className="login-social-btn"
                disabled={providers ? !providers.facebook : true}
                onClick={() => {
                  if (!providers?.facebook) {
                    setError("Facebook sign-in is not available.");
                    return;
                  }
                  const url =
                    (import.meta as any).env?.VITE_API_URL ||
                    "http://localhost:4001/api";
                  window.location.href = `${url}/auth/oauth/facebook`;
                }}
                title="Continue with Facebook"
                aria-label="Continue with Facebook"
              >
                f
              </button>
              <button
                type="button"
                className="login-social-btn"
                disabled={providers ? !providers.google : true}
                onClick={() => {
                  if (!providers?.google) {
                    setError("Google sign-in is not available.");
                    return;
                  }
                  const url =
                    (import.meta as any).env?.VITE_API_URL ||
                    "http://localhost:4001/api";
                  window.location.href = `${url}/auth/oauth/google`;
                }}
                title="Continue with Google"
                aria-label="Continue with Google"
              >
                G+
              </button>
              <button className="login-social-btn" disabled title="Coming soon">
                in
              </button>
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
                onChange={(e) => {
                  setPassword(e.target.value);
                  // If user manually clears password, uncheck remember me for security
                  if (e.target.value === "" && rememberMe) {
                    setRememberMe(false);
                    clearSavedCredentials();
                  }
                }}
                autoComplete="current-password"
                required
              />

              <div className="remember-me-container">
                <label className="remember-me-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="remember-me-checkbox"
                  />
                  <span className="remember-me-text">
                    Remember me for 30 days
                  </span>
                </label>
                <Link to="/forgot-password" className="forgot-password-link">
                  Forgot Password?
                </Link>
              </div>

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
