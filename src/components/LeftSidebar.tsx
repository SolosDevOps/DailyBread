import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/LeftSidebar.css";

interface QuickStat {
  label: string;
  value: number;
  icon: string;
}

interface DailyVerse {
  text: string;
  reference: string;
}

interface Suggestion {
  id: number;
  username: string;
  mutual?: number;
}

interface LeftSidebarProps {
  collapsed?: boolean;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ collapsed = false }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<QuickStat[]>([]);
  const [dailyVerse] = useState<DailyVerse>({
    text: "For I know the plans I have for you, declares the Lord, plans to prosper you and not to harm you, to give you hope and a future.",
    reference: "Jeremiah 29:11",
  });
  const [loading, setLoading] = useState(true);
  const [sectionCollapsed, setSectionCollapsed] = useState<{
    [k: string]: boolean;
  }>({
    stats: false,
    actions: false,
    verse: false,
    events: true,
    prayer: true,
    suggestions: false,
  });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  useEffect(() => {
    fetchDashboardStats();
    // mock suggestions
    setSuggestions([
      { id: 101, username: "grace_note", mutual: 2 },
      { id: 102, username: "faithwalker" },
      { id: 103, username: "lightbearer", mutual: 1 },
    ]);
  }, []);

  // If user is not loaded yet, return null to prevent rendering
  if (!user) {
    return null;
  }

  const fetchDashboardStats = async () => {
    if (!user) return;
    try {
      const res = await fetch(
        `${
          (import.meta as any).env?.VITE_API_URL || "http://localhost:4001/api"
        }/users/${user.id}/stats`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load stats");
      const data: {
        posts: number;
        friends: number;
        prayers: number;
        blessings: number;
      } = await res.json();
      setStats([
        { label: "My Posts", value: data.posts, icon: "📝" },
        { label: "Friends", value: data.friends, icon: "👥" },
        { label: "Prayers", value: data.prayers, icon: "🙏" },
        { label: "Blessings", value: data.blessings, icon: "✨" },
      ]);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats([
        { label: "My Posts", value: 0, icon: "📝" },
        { label: "Friends", value: 0, icon: "👥" },
        { label: "Prayers", value: 0, icon: "🙏" },
        { label: "Blessings", value: 0, icon: "✨" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Post", icon: "�", action: "post" },
    { label: "Prayer", icon: "🙏", action: "prayer" },
    { label: "Testimony", icon: "✨", action: "testimony" },
    { label: "Study", icon: "�", action: "study" },
  ];

  const upcomingEvents = [
    { title: "Sunday Service", time: "10:00 AM", date: "Tomorrow" },
    { title: "Bible Study", time: "7:00 PM", date: "Wednesday" },
  ];

  const toggle = (key: string) =>
    setSectionCollapsed((c) => ({ ...c, [key]: !c[key] }));

  const copyVerse = async () => {
    try {
      await navigator.clipboard.writeText(
        `"${dailyVerse.text}" — ${dailyVerse.reference}`
      );
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      /* no-op */
    }
  };

  const minimalStatInline = (
    <div className="ls-inline-stats">
      {stats.slice(0, 3).map((s) => (
        <div key={s.label} className="ls-inline-stat">
          <span className="ls-inline-stat-value">{s.value}</span>
          <span className="ls-inline-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <aside
      className={`left-sidebar minimal ${collapsed ? "is-collapsed" : ""}`}
    >
      {/* Header / User */}
      <div className="ls-user-card">
        <div className="ls-user-row">
          <div className="ls-avatar" aria-label="User avatar">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.username}
                className="ls-avatar-img"
              />
            ) : (
              <span className="ls-avatar-fallback">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="ls-user-meta">
            <div className="ls-username">{user?.username}</div>
            <div className="ls-subtle">Welcome back</div>
          </div>
          <Link
            to={`/profile/${user?.id}`}
            className="ls-profile-link"
            aria-label="View profile"
          >
            ↗
          </Link>
        </div>
        {!loading && stats.length > 0 && minimalStatInline}
      </div>

      {/* Quick Create */}
      <div className="ls-block">
        <div className="ls-block-head">
          <h4>Quick Create</h4>
        </div>
        <div className="ls-actions-inline">
          {quickActions.map((a) => (
            <button
              key={a.action}
              className="ls-action-chip"
              onClick={() => console.log("Action:", a.action)}
            >
              <span className="ls-action-icon" aria-hidden>
                {a.icon}
              </span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats (collapsible full) */}
      <div className="ls-block">
        <div className="ls-block-head">
          <h4>My Journey</h4>
          <button
            className="ls-toggle"
            onClick={() => toggle("stats")}
            aria-label="Toggle stats"
          >
            {sectionCollapsed.stats ? "+" : "−"}
          </button>
        </div>
        {!sectionCollapsed.stats && (
          <div className="ls-grid-2">
            {loading && <div className="ls-text-light">Loading…</div>}
            {!loading &&
              stats.map((s) => (
                <div key={s.label} className="ls-stat-card">
                  <div className="ls-stat-icon" aria-hidden>
                    {s.icon}
                  </div>
                  <div className="ls-stat-main">
                    <div className="ls-stat-value">{s.value}</div>
                    <div className="ls-stat-label">{s.label}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Daily Verse (always visible, minimal) */}
      <div className="ls-block verse">
        <div className="ls-block-head">
          <h4>Daily Verse</h4>
          <div className="ls-verse-actions">
            <button
              className="ls-icon-btn"
              onClick={copyVerse}
              aria-label="Copy verse"
            >
              {copyState === "copied" ? "✓" : "⧉"}
            </button>
          </div>
        </div>
        <blockquote className="ls-verse" aria-label="Daily verse">
          <p className="ls-verse-text">{dailyVerse.text}</p>
          <cite className="ls-verse-ref">{dailyVerse.reference}</cite>
        </blockquote>
      </div>

      {/* Suggestions */}
      <div className="ls-block">
        <div className="ls-block-head">
          <h4>Suggestions</h4>
          <button
            className="ls-toggle"
            onClick={() => toggle("suggestions")}
            aria-label="Toggle suggestions"
          >
            {sectionCollapsed.suggestions ? "+" : "−"}
          </button>
        </div>
        {!sectionCollapsed.suggestions && (
          <ul className="ls-suggestions" aria-label="User suggestions">
            {suggestions.map((s) => (
              <li key={s.id} className="ls-suggestion-item">
                <span className="ls-suggestion-avatar">
                  {s.username.charAt(0).toUpperCase()}
                </span>
                <div className="ls-suggestion-meta">
                  <Link to={`/profile/${s.id}`}>{s.username}</Link>
                  {s.mutual && (
                    <span className="ls-mutual">{s.mutual} mutual</span>
                  )}
                </div>
                <button className="ls-follow-btn">Follow</button>
              </li>
            ))}
            {!suggestions.length && (
              <li className="ls-text-light">No suggestions</li>
            )}
          </ul>
        )}
      </div>

      {/* Events */}
      <div className="ls-block">
        <div className="ls-block-head">
          <h4>Events</h4>
          <button
            className="ls-toggle"
            onClick={() => toggle("events")}
            aria-label="Toggle events"
          >
            {sectionCollapsed.events ? "+" : "−"}
          </button>
        </div>
        {!sectionCollapsed.events && (
          <div className="ls-events">
            {upcomingEvents.map((e) => (
              <div key={e.title} className="ls-event">
                <div className="ls-event-main">
                  <div className="ls-event-title">{e.title}</div>
                  <div className="ls-event-detail">
                    {e.time} • {e.date}
                  </div>
                </div>
              </div>
            ))}
            {!upcomingEvents.length && (
              <div className="ls-text-light">No events</div>
            )}
          </div>
        )}
      </div>

      {/* Prayer Corner */}
      <div className="ls-block">
        <div className="ls-block-head">
          <h4>Prayer</h4>
          <button
            className="ls-toggle"
            onClick={() => toggle("prayer")}
            aria-label="Toggle prayer section"
          >
            {sectionCollapsed.prayer ? "+" : "−"}
          </button>
        </div>
        {!sectionCollapsed.prayer && (
          <div className="ls-prayer">
            <p className="ls-prayer-text">
              Be joyful in hope, patient in affliction, faithful in prayer.
            </p>
            <p className="ls-prayer-ref">Romans 12:12</p>
            <button className="ls-primary-btn">Submit Prayer</button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;
