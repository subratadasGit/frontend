import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedToken = localStorage.getItem("token");
    return !!storedToken;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [name, setName] = useState(() => localStorage.getItem("name"));
  // Tokens issued before roles existed have no role, which resolves to "user" —
  // the CMS fails closed until the next sign-in.
  const [role, setRole] = useState(() => localStorage.getItem("role") || "user");

  const login = (token, name = "John", role = "user") => {
    localStorage.setItem("token", token);
    localStorage.setItem("name", name);
    localStorage.setItem("role", role);
    setToken(token);
    setIsAuthenticated(true);
    setName(name);
    setRole(role);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    setToken(null);
    setIsAuthenticated(false);
    setName(null);
    setRole("user");
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        name,
        role,
        isAdmin: role === "admin",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}