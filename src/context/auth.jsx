import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const storedToken = localStorage.getItem("token");
    return !!storedToken;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [name, setName] = useState(() => localStorage.getItem("name"));

  const login = (token, name = "John") => {
    localStorage.setItem("token", token);
    localStorage.setItem("name", name);
    setToken(token);
    setIsAuthenticated(true);
    setName(name);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    setToken(null);
    setIsAuthenticated(false);
    setName(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        name,
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