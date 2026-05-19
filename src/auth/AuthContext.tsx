import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../types";
import { fetchMe, logoutApi, refreshAccessToken } from "../api/client";

interface AuthState {
  user: User | null;
  token: string | null;
  ready: boolean;
  isNew: boolean;
  loginWithToken: (accessToken: string, refreshToken: string, user: User, isNew?: boolean) => void;
  logout: () => void;
  refreshUser: () => void;
  clearIsNew: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  ready: false,
  isNew: false,
  loginWithToken: () => {},
  logout: () => {},
  refreshUser: () => {},
  clearIsNew: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const savedAccess = sessionStorage.getItem("natiq_token");
    const savedRefresh = sessionStorage.getItem("natiq_refresh");

    const tryRefresh = async () => {
      if (!savedRefresh) { setReady(true); return; }
      try {
        const data = await refreshAccessToken(savedRefresh);
        sessionStorage.setItem("natiq_token", data.access_token);
        sessionStorage.setItem("natiq_refresh", data.refresh_token);
        setToken(data.access_token);
        setUser(data.user);
      } catch {
        sessionStorage.removeItem("natiq_token");
        sessionStorage.removeItem("natiq_refresh");
      } finally {
        setReady(true);
      }
    };

    if (savedAccess && !isTokenExpired(savedAccess)) {
      setToken(savedAccess);
      fetchMe(savedAccess)
        .then((u) => { setUser(u); setReady(true); })
        .catch(() => tryRefresh());
    } else if (savedRefresh) {
      tryRefresh();
    } else {
      setReady(true);
    }
  }, []);

  const loginWithToken = (accessToken: string, refreshToken: string, u: User, newUser = false) => {
    sessionStorage.setItem("natiq_token", accessToken);
    sessionStorage.setItem("natiq_refresh", refreshToken);
    setToken(accessToken);
    setUser(u);
    setIsNew(newUser);
  };

  const logout = async () => {
    if (token) {
      try { await logoutApi(token); } catch { /* ignore — blacklist best-effort */ }
    }
    sessionStorage.removeItem("natiq_token");
    sessionStorage.removeItem("natiq_refresh");
    setToken(null);
    setUser(null);
    setIsNew(false);
  };

  const refreshUser = () => {
    if (!token) return;
    fetchMe(token).then(setUser).catch(() => {});
  };

  const clearIsNew = () => setIsNew(false);

  return (
    <AuthContext.Provider value={{ user, token, ready, isNew, loginWithToken, logout, refreshUser, clearIsNew }}>
      {children}
    </AuthContext.Provider>
  );
}
