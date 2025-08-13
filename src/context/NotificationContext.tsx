import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

interface Notification {
  id: number;
  userId: number;
  triggeredBy: number;
  type: "like" | "comment" | "follow";
  message: string;
  postId?: number;
  seen: boolean;
  seenAt?: string;
  createdAt: string;
  triggerUser: {
    id: number;
    username: string;
    profilePicture?: string;
  };
  post?: {
    id: number;
    title: string;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsSeen: (notificationId: number) => Promise<void>;
  markAllAsSeen: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL =
    (import.meta as any).env?.VITE_API_URL || "http://localhost:4001/api";

  const fetchNotifications = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/notifications`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const markAsSeen = async (notificationId: number) => {
    try {
      const response = await fetch(
        `${API_URL}/notifications/${notificationId}/seen`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  seen: true,
                  seenAt: new Date().toISOString(),
                }
              : notification
          )
        );
        await refreshUnreadCount();
      }
    } catch (error) {
      console.error("Failed to mark notification as seen:", error);
    }
  };

  const markAllAsSeen = async () => {
    try {
      const response = await fetch(`${API_URL}/notifications/mark-all-seen`, {
        method: "PATCH",
        credentials: "include",
      });

      if (response.ok) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            seen: true,
            seenAt: new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all notifications as seen:", error);
    }
  };

  // Fetch notifications and unread count when user changes
  useEffect(() => {
    if (user) {
      fetchNotifications();
      refreshUnreadCount();

      // Refresh unread count every 30 seconds
      const interval = setInterval(refreshUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        fetchNotifications,
        markAsSeen,
        markAllAsSeen,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
