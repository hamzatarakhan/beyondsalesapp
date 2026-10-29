import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextValue {
  isLoggedIn: boolean;
  /** True from the moment login() is called until the post-login loader finishes playing. */
  loginTransition: boolean;
  login: () => void;
  finishLoginTransition: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "app-auth";

function getInitialLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(getInitialLoggedIn);
  const [loginTransition, setLoginTransition] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isLoggedIn));
  }, [isLoggedIn]);

  // Flips isLoggedIn immediately so the Home route mounts. The splash plays only when the app
  // opens, so login no longer raises loginTransition (the App-level overlay stays wired to it,
  // in case a post-login loader is wanted again: call setLoginTransition(true) here).
  const login = () => {
    setIsLoggedIn(true);
  };
  const finishLoginTransition = () => setLoginTransition(false);
  const logout = () => setIsLoggedIn(false);

  return (
    <AuthContext.Provider value={{ isLoggedIn, loginTransition, login, finishLoginTransition, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
