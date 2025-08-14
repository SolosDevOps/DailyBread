import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { useNavigate } from "react-router-dom";
import "../styles/NotificationBell.css";

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    markAsSeen,
    markAllAsSeen,
    fetchNotifications,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification: any) => {
    // Mark as seen
    if (!notification.seen) {
      await markAsSeen(notification.id);
    }

    // Navigate to relevant page
    if (notification.type === "follow") {
      navigate(`/profile/${notification.triggeredBy}`);
    } else if (notification.postId) {
      navigate(`/dashboard?postId=${notification.postId}`);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsSeen = async () => {
    await markAllAsSeen();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return "❤️";
      case "comment":
        return "💬";
      case "follow":
        return "👤";
      default:
        return "🔔";
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button className="notification-bell" onClick={handleBellClick}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={handleMarkAllAsSeen}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${
                    !notification.seen ? "unread" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-avatar">
                    {notification.triggerUser.profilePicture ? (
                      <img
                        src={notification.triggerUser.profilePicture}
                        alt={notification.triggerUser.username}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {notification.triggerUser.username
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="notification-content">
                    <div className="notification-message">
                      <span className="notification-icon">
                        {getNotificationIcon(notification.type)}
                      </span>
                      {notification.message}
                    </div>
                    <div className="notification-time">
                      {formatTimeAgo(notification.createdAt)}
                    </div>
                  </div>

                  {!notification.seen && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
