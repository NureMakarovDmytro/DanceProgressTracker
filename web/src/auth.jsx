import { createContext, useContext, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

// Зберігає поточного користувача (роль) у пам'яті + localStorage.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  });

  async function login(username, password) {
    const u = await api.login(username, password);
    setUser(u);
    localStorage.setItem('user', JSON.stringify(u));
    return u;
  }

  function logout() {
    api.logout();
    localStorage.removeItem('user');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
