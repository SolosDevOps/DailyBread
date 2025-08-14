import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import "../styles/LeftSidebar.css";

interface DailyVerse {
  text: string;
  reference: string;
}

// Public-domain (KJV) daily verses rotation
const DAILY_VERSES: DailyVerse[] = [
  {
    text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
    reference: "Jeremiah 29:11 (KJV)",
  },
  {
    text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.",
    reference: "Proverbs 3:5-6 (KJV)",
  },
  {
    text: "The LORD is my shepherd; I shall not want.",
    reference: "Psalm 23:1 (KJV)",
  },
  {
    text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.",
    reference: "Isaiah 41:10 (KJV)",
  },
  {
    text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
    reference: "John 3:16 (KJV)",
  },
  {
    text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
    reference: "Romans 8:28 (KJV)",
  },
  {
    text: "Come unto me, all ye that labour and are heavy laden, and I will give you rest.",
    reference: "Matthew 11:28 (KJV)",
  },
  {
    text: "God is our refuge and strength, a very present help in trouble.",
    reference: "Psalm 46:1 (KJV)",
  },
  {
    text: "This is the day which the LORD hath made; we will rejoice and be glad in it.",
    reference: "Psalm 118:24 (KJV)",
  },
  {
    text: "For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.",
    reference: "2 Timothy 1:7 (KJV)",
  },
  {
    text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",
    reference: "Joshua 1:9 (KJV)",
  },
  {
    text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?",
    reference: "Psalm 27:1 (KJV)",
  },
  {
    text: "Casting all your care upon him; for he careth for you.",
    reference: "1 Peter 5:7 (KJV)",
  },
  {
    text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart.",
    reference: "Psalm 37:4 (KJV)",
  },
  {
    text: "It is of the LORD'S mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
    reference: "Lamentations 3:22-23 (KJV)",
  },
  {
    text: "Thy word is a lamp unto my feet, and a light unto my path.",
    reference: "Psalm 119:105 (KJV)",
  },
  {
    text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
    reference: "James 1:5 (KJV)",
  },
  {
    text: "But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith, meekness, temperance.",
    reference: "Galatians 5:22-23 (KJV)",
  },
  {
    text: "Now faith is the substance of things hoped for, the evidence of things not seen.",
    reference: "Hebrews 11:1 (KJV)",
  },
  {
    text: "O taste and see that the LORD is good: blessed is the man that trusteth in him.",
    reference: "Psalm 34:8 (KJV)",
  },
];

interface LeftSidebarProps {
  collapsed?: boolean;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ collapsed = false }) => {
  const { user } = useAuth();
  const { activeSection, setActiveSection } = useSidebar();
  // Deterministic daily index; rotates verse each calendar day
  const MS_PER_DAY = 86_400_000;
  const dayIndex = Math.floor(Date.now() / MS_PER_DAY);
  const dailyVerse = useMemo<DailyVerse>(
    () => DAILY_VERSES[dayIndex % DAILY_VERSES.length],
    [dayIndex]
  );
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const navigationItems = [
    {
      id: "feed",
      label: "Feed",
      icon: "🏠",
      isActive: activeSection === "feed",
    },
    {
      id: "profile",
      label: "Profile",
      icon: "👤",
      href: `/profile/${user?.id}`,
      isActive: activeSection === "profile",
    },
    {
      id: "community",
      label: "Community",
      icon: "👥",
      href: "/community",
      isActive: activeSection === "community",
    },
    {
      id: "prayer",
      label: "Prayer Requests",
      icon: "🙏",
      href: "/prayers",
      isActive: activeSection === "prayer",
    },
    {
      id: "study",
      label: "Bible Study",
      icon: "📖",
      isActive: activeSection === "study",
    },
    {
      id: "events",
      label: "Events",
      icon: "📅",
      href: "/events",
      isActive: activeSection === "events",
    },
  ];

  // Stats section removed per request; no data fetching needed

  if (!user) return null;

  const copyVerse = async () => {
    try {
      await navigator.clipboard.writeText(
        `"${dailyVerse.text}" — ${dailyVerse.reference}`
      );
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      /* noop */
    }
  };

  return (
    <aside className={`elegant-sidebar ${collapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar-profile">
        <div className="profile-avatar">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture ?? undefined}
              alt={user?.username ?? "Profile"}
              className="avatar-img"
            />
          ) : (
            <div className="avatar-placeholder">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h3 className="profile-name">{user?.username || "User"}</h3>
          <p className="profile-status">Active now</p>
        </div>
      </div>

      {/* Stats section removed */}

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h4 className="nav-title">Menu</h4>
          <ul className="nav-list">
            {navigationItems.map((item) => (
              <li key={item.id} className="nav-item">
                {item.href ? (
                  <Link
                    to={item.href}
                    className={`nav-link ${item.isActive ? "active" : ""}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                ) : (
                  <button
                    className={`nav-link nav-button ${
                      item.isActive ? "active" : ""
                    }`}
                    onClick={() => setActiveSection(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-verse">
        <div className="verse-header">
          <h4 className="verse-title">Daily Verse</h4>
          <button
            className="verse-copy-btn"
            onClick={copyVerse}
            title="Copy verse"
          >
            {copyState === "copied" ? "✓" : "📋"}
          </button>
        </div>
        <blockquote className="verse-content">
          <p className="verse-text">{dailyVerse.text}</p>
          <cite className="verse-reference">{dailyVerse.reference}</cite>
        </blockquote>
      </div>
    </aside>
  );
};

export default LeftSidebar;
