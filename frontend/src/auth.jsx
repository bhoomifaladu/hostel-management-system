import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStore, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = () => { tokenStore.clear(); setUser(null); };

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) { setReady(true); return; }
    api.me().then(d => setUser(d.user)).catch(() => tokenStore.clear()).finally(() => setReady(true));
  }, []);

  async function login(email, password) {
    const d = await api.login(email, password);
    tokenStore.set(d.token);
    setUser(d.user);
  }

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}
