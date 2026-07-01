'use strict';
  import React, { createContext, useContext, useState, useEffect } from 'react';

  const AuthContext = createContext(null);
  const API = '/api';

  function getToken() { return localStorage.getItem('bbp_token'); }

  async function apiReq(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API + path, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`);
    return data;
  }

  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const token = getToken();
      if (!token) { setLoading(false); return; }
      apiReq('GET', '/auth/me')
        .then(d => setUser(d.user))
        .catch(() => localStorage.removeItem('bbp_token'))
        .finally(() => setLoading(false));
    }, []);

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
  