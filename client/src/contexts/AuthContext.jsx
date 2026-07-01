import React, { createContext, useContext, useState, useEffect } from 'react';

  const AuthContext = createContext(null);

  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const getToken = () => localStorage.getItem('bbp_token');

    useEffect(() => {
      const token = getToken();
      if (!token) { setLoading(false); return; }
      fetch('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => setUser(d.user))
        .catch(() => localStorage.removeItem('bbp_token'))
        .finally(() => setLoading(false));
    }, []);

    const apiReq = async (method, path, body) => {
      const opts = { method, headers: { 'Content-Type': 'application/json' } };
      const t = getToken();
      if (t) opts.headers.Authorization = 'Bearer ' + t;
      if (body) opts.body = JSON.stringify(body);
      const r = await fetch('/api' + path, opts);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || d.message || 'HTTP ' + r.status);
      return d;
    };

    const login = async (email, password) => {
      const data = await apiReq('POST', '/auth/login', { email, password });
      localStorage.setItem('bbp_token', data.token);
      setUser(data.user);
      return data.user;
    };

    const signup = async (username, email, password) => {
      const data = await apiReq('POST', '/auth/signup', { username, email, password });
      localStorage.setItem('bbp_token', data.token);
      setUser(data.user);
      return data.user;
    };

    const logout = () => {
      localStorage.removeItem('bbp_token');
      setUser(null);
    };

    return (
      <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export const useAuth = () => useContext(AuthContext);
  