import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import NotificationBell from "./NotificationBell";
import "../styles/Navbar.css";

interface UserResult {
  id: number;
  username: string;
  bio?: string | null;
  profilePicture?: string | null;
  createdAt?: string;
}

const DEBOUNCE = 300;

const SearchDropdown: React.FC<{
  results: UserResult[];
  recentSearches: UserResult[];
  query: string;
  loading: boolean;
  error: string | null;
  open: boolean;
  onClose: () => void;
  onUserClick: (user: UserResult) => void;
}> = ({
  results,
  recentSearches,
  query,
  loading,
  error,
  open,
  onClose,
  onUserClick,
}) => {
  const navigate = useNavigate();

  const handleUserClick = (user: UserResult) => {
    onUserClick(user); // Save to recent searches
    onClose();
    navigate(`/profile/${user.id}`);
  };

  if (!open) return null;

  // Show recent searches when no query or results
  const showRecentSearches =
    !query.trim() &&
    !loading &&
    !error &&
    results.length === 0 &&
    recentSearches.length > 0;
  const displayResults = query.trim() ? results : [];

  return (
    <div className="navbar-search-dropdown">
      {loading && (
        <div className="navbar-search-item">
          <div className="navbar-search-loading">
            <svg
              className="navbar-search-spinner"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <span>Searching users...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="navbar-search-item">
          <div className="navbar-search-error">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {!loading &&
        !error &&
        displayResults.length === 0 &&
        !showRecentSearches && (
          <div className="navbar-search-item">
            <div className="navbar-search-empty">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
              </svg>
              <span>No users found</span>
            </div>
          </div>
        )}

      {showRecentSearches && (
        <>
          <div className="navbar-search-header">
            <span>Recent searches</span>
          </div>
          {recentSearches.map((user) => (
            <div
              key={`recent-${user.id}`}
              className="navbar-search-item navbar-search-item-clickable"
              onClick={() => handleUserClick(user)}
            >
              <div className="navbar-search-user-avatar">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.username}'s profile`}
                    className="navbar-search-avatar-img"
                  />
                ) : (
                  <div className="navbar-search-avatar-fallback">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="navbar-search-user-info">
                <div className="navbar-search-username">{user.username}</div>
                {user.bio && (
                  <div className="navbar-search-bio">
                    {user.bio.length > 50
                      ? `${user.bio.slice(0, 50)}...`
                      : user.bio}
                  </div>
                )}
              </div>
              <div className="navbar-search-recent-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
              </div>
            </div>
          ))}
        </>
      )}

      {displayResults.map((user) => (
        <div
          key={user.id}
          className="navbar-search-item navbar-search-item-clickable"
          onClick={() => handleUserClick(user)}
        >
          <div className="navbar-search-user-avatar">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={`${user.username}'s profile`}
                className="navbar-search-avatar-img"
              />
            ) : (
              <div className="navbar-search-avatar-fallback">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="navbar-search-user-info">
            <div className="navbar-search-username">{user.username}</div>
            {user.bio && (
              <div className="navbar-search-bio">
                {user.bio.length > 50
                  ? `${user.bio.slice(0, 50)}...`
                  : user.bio}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

interface NavbarProps {
  // No longer need sidebar props as we're using context
}

const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<UserResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    if (!user?.id) {
      setRecentSearches([]);
      return;
    }

    const userSpecificKey = `recentSearches_${user.id}`;
    const saved = localStorage.getItem(userSpecificKey);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
        setRecentSearches([]);
      }
    } else {
      setRecentSearches([]);
    }
  }, [user?.id]); // Re-run when user changes

  // Clean up old global recent searches data (migration)
  useEffect(() => {
    const oldGlobalKey = "recentSearches";
    if (localStorage.getItem(oldGlobalKey)) {
      localStorage.removeItem(oldGlobalKey);
      console.log("Cleaned up old global recent searches data for security");
    }
  }, []);

  // Clear recent searches when user logs out (when user becomes null)
  useEffect(() => {
    if (!user) {
      setRecentSearches([]);
    }
  }, [user]);

  // Handle user click - add to recent searches and navigate
  const handleUserClick = (searchUser: UserResult) => {
    if (!user?.id || !searchUser) return;

    // Add to recent searches (avoid duplicates) - user-specific
    setRecentSearches((prev) => {
      const filtered = prev.filter((u) => u.id !== searchUser.id);
      const updated = [searchUser, ...filtered].slice(0, 5); // Keep only 5 recent searches
      
      // Save to user-specific localStorage key
      const userSpecificKey = `recentSearches_${user.id}`;
      localStorage.setItem(userSpecificKey, JSON.stringify(updated));
      
      return updated;
    });

    // Clear search and close dropdown
    setQuery("");
    setOpen(false);

    // Navigate to user profile
    navigate(`/profile/${searchUser.id}`);
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      setError(null);

      try {
        const data = await api.get<UserResult[]>(`/search/users`, {
          query: { q: query },
          signal: ac.signal,
        });
        setResults(data);
        setOpen(true);
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError(e.message || "Search failed");
          setOpen(true);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE);

    return () => {
      window.clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      // Logout function handles the redirect to "/" via window.location.href
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback redirect if logout fails
      navigate("/", { replace: true });
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left controls */}
        <div className="navbar-left-group">
          {user && (
            <button
              type="button"
              className="navbar-avatar-btn"
              aria-label="Toggle sidebar"
              aria-pressed={!!sidebarCollapsed}
              onClick={toggleSidebar}
              title="Toggle menu"
            >
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.username}
                  className="navbar-avatar-img"
                />
              ) : (
                <span className="navbar-avatar-fallback">
                  {user.username?.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          )}
          <Link to="/dashboard" className="navbar-brand">
            Daily Bread
          </Link>
        </div>

        {/* Search - Always Centered */}
        <div className="navbar-search" ref={wrapperRef}>
          <div className="navbar-search-container">
            <svg
              className="navbar-search-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              placeholder="Search users..."
              className="navbar-search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
            />
          </div>
          <SearchDropdown
            results={results}
            recentSearches={recentSearches}
            query={query}
            loading={loading}
            error={error}
            open={open}
            onClose={() => setOpen(false)}
            onUserClick={handleUserClick}
          />
        </div>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          <Link to="/dashboard" className="navbar-link">
            Home
          </Link>
          <Link to={`/profile/${user?.id}`} className="navbar-link">
            Profile
          </Link>
          <button onClick={handleLogout} className="navbar-button">
            Sign Out
          </button>
        </div>

        {/* Mobile Menu Button - Right Side */}
        <div className="navbar-right-group">
          {user && <NotificationBell />}
          <button
            type="button"
            className="navbar-mobile-menu-btn"
            aria-label="Open navigation menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="navbar-mobile-overlay"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="navbar-mobile-menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="navbar-mobile-header">
              <div className="navbar-mobile-user">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className="navbar-mobile-avatar"
                  />
                ) : (
                  <div className="navbar-mobile-avatar-fallback">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="navbar-mobile-user-info">
                  <span className="navbar-mobile-username">
                    {user?.username}
                  </span>
                  <span className="navbar-mobile-user-label">
                    Daily Bread User
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="navbar-mobile-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="navbar-mobile-content">
              <nav className="navbar-mobile-nav">
                <Link
                  to="/dashboard"
                  className="navbar-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9,22 9,12 15,12 15,22"></polyline>
                  </svg>
                  <span>Home</span>
                </Link>

                <Link
                  to={`/profile/${user?.id}`}
                  className="navbar-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>Profile</span>
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="navbar-mobile-link navbar-mobile-logout"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16,17 21,12 16,7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Sign Out</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
