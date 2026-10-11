import { createContext, useContext, useState, useEffect, useCallback } from "react";
import API from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
    setAuthError("");
  }, []);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await API.get("/auth/me");
          setUser(res.data.user);
        } catch (error) {
          console.error("Token verification failed:", error);
          logout();
        }
      }
      setLoading(false);
    }
    loadUser();
  }, [token, logout]);

  const login = async (email, password) => {
    try {
      setAuthError("");
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed. Please check your credentials.";
      setAuthError(msg);
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setAuthError("");
      const res = await API.post("/auth/register", userData);
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please try again.";
      setAuthError(msg);
      throw err;
    }
  };

  const clearAuthError = () => setAuthError("");

  const isAdmin = user?.role === "admin";
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isAuthenticated,
        authError,
        clearAuthError,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

