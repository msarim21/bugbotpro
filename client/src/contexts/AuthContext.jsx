import React, { createContext, useContext, useState, useEffect } from 'react';
  import axios from 'axios';

  const AuthContext = createContext(null);

  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const getToken = () => localStorage.getItem('bbp_token');
    const getHeaders = () => ({ Authorization: `Bearer ${getToken()}` });

    useEffect(() => {
      const token = getToken();
      if (!token) { setLoading(false); return; }
      axios.get('/api/auth/me', { headers: getHeaders() })
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('bbp_token'))
        .finally(() => setLoading(false));
    }, []);

    const login = async (email, password) => {
      const { data } = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('bbp_token', data.token);
      setUser(data.user);
      return data.user;
    };

    const signup = async (username, email, password) => {
      const { data } = await axios.post('/api/auth/signup', { username, email, password });
      localStorage.setItem('bbp_token', data.token);
      setUser(data.user);
      return data.user;
    };

    const logout = () => {
      localStorage.removeItem('bbp_token');
      setUser(null);
    };

    return (
      <AuthContext.Provider value={{ user, loading, login, signup, logout, getHeaders }}>
        {children}
      </AuthContext.Provider>
    );
  }

  export const useAuth = () => useContext(AuthContext);
  