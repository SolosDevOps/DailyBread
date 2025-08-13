import React from "react";
import { Link } from "react-router-dom";
import "../styles/Landing.css";

const Landing: React.FC = () => {
  return (
    <div className="landing-container">
      {/* Navigation Header */}
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="nav-logo">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              className="logo-icon"
            >
              <defs>
                <linearGradient
                  id="breadGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" style={{ stopColor: "#D4A574" }} />
                  <stop offset="50%" style={{ stopColor: "#C8956A" }} />
                  <stop offset="100%" style={{ stopColor: "#B8845A" }} />
                </linearGradient>
                <linearGradient
                  id="crustGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" style={{ stopColor: "#A67C52" }} />
                  <stop offset="100%" style={{ stopColor: "#8B6A42" }} />
                </linearGradient>
              </defs>
              <ellipse
                cx="16"
                cy="20"
                rx="13"
                ry="8"
                fill="url(#crustGradient)"
              />
              <ellipse
                cx="16"
                cy="18"
                rx="11"
                ry="6"
                fill="url(#breadGradient)"
              />
              <path
                d="M8 16 Q16 14 24 16"
                stroke="#A67C52"
                strokeWidth="0.5"
                fill="none"
                opacity="0.6"
              />
              <path
                d="M10 18 Q16 16.5 22 18"
                stroke="#A67C52"
                strokeWidth="0.5"
                fill="none"
                opacity="0.4"
              />
              <circle cx="12" cy="17" r="0.5" fill="#A67C52" opacity="0.3" />
              <circle cx="20" cy="18" r="0.5" fill="#A67C52" opacity="0.3" />
              <circle cx="16" cy="19" r="0.5" fill="#A67C52" opacity="0.2" />
            </svg>
            <span className="logo-text">Daily Bread</span>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="nav-link">
              Sign In
            </Link>
            <Link to="/register" className="nav-btn">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Share Life's
              <span className="hero-highlight"> Daily Bread</span>
            </h1>
            <p className="hero-description">
              Connect with your Christian community. Share meaningful moments,
              inspire others with your journey, and find encouragement in daily
              fellowship.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="hero-btn primary">
                Join Our Community
              </Link>
              <Link to="/login" className="hero-btn secondary">
                Sign In
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <div className="card-header">
                <div className="avatar"></div>
                <div className="user-info">
                  <div className="username">Henry Cavel</div>
                  <div className="timestamp">2 hours ago</div>
                </div>
              </div>
              <div className="card-content">
                <p>
                  "Give us this day our daily bread" - Today I'm grateful for
                  unexpected kindness from a stranger at the coffee shop. Small
                  moments, big blessings! 🙏
                </p>
              </div>
              <div className="card-actions">
                <div className="action-btn">❤️ 12</div>
                <div className="action-btn">💬 5</div>
                <div className="action-btn">🔄 Share</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-content">
          <h2 className="features-title">Built for Christian Community</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Connect & Follow</h3>
              <p>
                Build meaningful relationships with fellow believers and stay
                connected through life's journey.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Share & Encourage</h3>
              <p>
                Post updates, share prayers, and encourage others with
                thoughtful comments and reactions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🙏</div>
              <h3>Faith-Centered</h3>
              <p>
                A safe space designed specifically for Christian fellowship and
                spiritual growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to join our community?</h2>
          <p className="cta-description">
            Start sharing your journey and connecting with believers today.
          </p>
          <Link to="/register" className="cta-btn">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <svg
              width="24"
              height="24"
              viewBox="0 0 32 32"
              className="footer-logo-icon"
            >
              <ellipse cx="16" cy="20" rx="13" ry="8" fill="#A67C52" />
              <ellipse cx="16" cy="18" rx="11" ry="6" fill="#D4A574" />
            </svg>
            <span>Daily Bread</span>
          </div>
          <p className="footer-text">
            Building Christian community, one post at a time.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
