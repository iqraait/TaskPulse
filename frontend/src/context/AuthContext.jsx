import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user_info");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Fetch current user from /api/users/me/ if token exists
  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get("users/me/");
          setUser(res.data);
          localStorage.setItem("user_info", JSON.stringify(res.data));
        } catch (err) {
          console.error("Auth check error:", err);
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post("login/", { username, password });
    const { access, user: userData } = res.data;

    localStorage.setItem("token", access);
    setToken(access);

    if (userData) {
      setUser(userData);
      localStorage.setItem("user_info", JSON.stringify(userData));
      return userData;
    } else {
      const meRes = await api.get("users/me/", {
        headers: { Authorization: `Bearer ${access}` }
      });
      setUser(meRes.data);
      localStorage.setItem("user_info", JSON.stringify(meRes.data));
      return meRes.data;
    }
  };

  const demoLogin = async (roleType) => {
    let credentials = { username: "superadmin", password: "superadmin123" };
    if (roleType === "it_admin" || roleType === "admin") {
      credentials = { username: "it_admin", password: "adminpassword" };
    } else if (roleType === "hr_admin") {
      credentials = { username: "hr_admin", password: "adminpassword" };
    } else if (roleType === "staff1" || roleType === "staff") {
      credentials = { username: "staff1", password: "staffpassword" };
    } else if (roleType === "staff2") {
      credentials = { username: "staff2", password: "staffpassword" };
    }
    return await login(credentials.username, credentials.password);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_info");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, demoLogin, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
