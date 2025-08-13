import React, { createContext, useContext, useState } from "react";

interface FeedContextType {
  refreshKey: number;
  refreshFeed: () => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshFeed = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <FeedContext.Provider value={{ refreshKey, refreshFeed }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error("useFeed must be used within a FeedProvider");
  }
  return context;
};
