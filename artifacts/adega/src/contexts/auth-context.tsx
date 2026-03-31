import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  active?: boolean;
};

type AuthState =
  | { status: "loading" }
  | { status: "setup_needed" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: AuthUser };

type AuthContextValue = {
  state: AuthState;
  user: AuthUser | null;
  isLoading: boolean;
  isSetupNeeded: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

async function checkSetup(): Promise<boolean> {
  try {
    const r = await fetch("/api/auth/setup");
    const data = await r.json();
    return !!data.needsSetup;
  } catch {
    return false;
  }
}

async function fetchMe(token: string): Promise<AuthUser | null> {
  try {
    const r = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  const initialize = useCallback(async () => {
    const needsSetup = await checkSetup();
    if (needsSetup) {
      setState({ status: "setup_needed" });
      return;
    }

    const token = localStorage.getItem("adega_token");
    if (!token) {
      setState({ status: "unauthenticated" });
      return;
    }

    const user = await fetchMe(token);
    if (user) {
      setState({ status: "authenticated", user });
    } else {
      localStorage.removeItem("adega_token");
      setState({ status: "unauthenticated" });
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback((token: string, user: AuthUser) => {
    localStorage.setItem("adega_token", token);
    setState({ status: "authenticated", user });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("adega_token");
    setState({ status: "unauthenticated" });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("adega_token");
    if (!token) return;
    const user = await fetchMe(token);
    if (user) {
      setState({ status: "authenticated", user });
    } else {
      localStorage.removeItem("adega_token");
      setState({ status: "unauthenticated" });
    }
  }, []);

  const user = state.status === "authenticated" ? state.user : null;

  const value: AuthContextValue = {
    state,
    user,
    isLoading: state.status === "loading",
    isSetupNeeded: state.status === "setup_needed",
    isAuthenticated: state.status === "authenticated",
    isAdmin: state.status === "authenticated" && state.user.role === "admin",
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
