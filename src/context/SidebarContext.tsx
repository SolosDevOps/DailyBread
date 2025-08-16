import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface SidebarContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });
  
  const [activeSection, setActiveSection] = useState(() => {
    // Load active section from localStorage, fallback to "feed"
    return localStorage.getItem('active-section') || "feed";
  });
  
  const location = useLocation();

  // Auto-detect active section based on current route
  useEffect(() => {
    const path = location.pathname;

    if (path === "/dashboard") {
      // For dashboard, don't override if we have a saved section
      const savedSection = localStorage.getItem('active-section');
      if (!savedSection) {
        setActiveSection("feed");
      }
    } else if (path.startsWith("/profile")) {
      setActiveSection("profile");
    } else if (path.includes("/community")) {
      setActiveSection("community");
    } else if (path.includes("/prayer")) {
      setActiveSection("prayer");
    } else if (path.includes("/study") || path.includes("/bible")) {
      setActiveSection("study");
    } else if (path.includes("/events")) {
      setActiveSection("events");
    }
  }, [location.pathname]);

  // Persist sidebar collapsed state
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Persist active section
  useEffect(() => {
    localStorage.setItem('active-section', activeSection);
  }, [activeSection]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <SidebarContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        activeSection,
        setActiveSection,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};
