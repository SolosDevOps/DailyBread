import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, baseURL } from "../lib/api";

// ---- Types ----
export interface AuthUser {
  id: number;
  username: string;
  email?: string;
  bio?: string | null;
  profilePicture?: string | null;
  createdAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  login: (emailOrUsername: string, password: string) => Promise<void>; // backend expects username; we accept email/username
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper to safely extract error message
function extractError(e: unknown): string {
  if (e && typeof e === "object" && "message" in e)
    return (e as any).message || "Error";
  return "Error";
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`${baseURL.replace(/\/$/, "")}/auth/me`, {
        credentials: "include",
      });
      if (res.ok) {
        const me: AuthUser = await res.json();
        setUser(me);
      } else if (res.status === 401) {
        setUser(null);
      } else {
        // Other errors: capture message but avoid throwing to keep console clean
        try {
          const data = await res.json();
          setError((data && (data.error || data.message)) || "Request failed");
        } catch {
          setError(res.statusText || "Request failed");
        }
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // initial load
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (emailOrUsername: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        // Backend login currently expects a 'username'. We map provided value directly.
        const u = await api.post<AuthUser>("/auth/login", {
          username: emailOrUsername,
          password,
        });
        setUser(u);
      } catch (e) {
        setError(extractError(e));
        setUser(null);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const u = await api.post<AuthUser>("/auth/register", {
          username,
          email,
          password,
        });
        setUser(u); // Optional: auto-login on register (since cookie may not be set). Adjust if backend sets cookie only on login.
      } catch (e) {
        setError(extractError(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/auth/logout");
      setUser(null);
    } catch (e) {
      setError(extractError(e));
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
