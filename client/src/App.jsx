import React from 'react';
  import { Routes, Route, Navigate } from 'react-router-dom';
  import { Toaster } from 'react-hot-toast';
  import { AuthProvider, useAuth } from './contexts/AuthContext';
  import Landing from './pages/Landing';
  import Login from './pages/Login';
  import Signup from './pages/Signup';
  import Dashboard from './pages/Dashboard';
  import Admin from './pages/Admin';

  const Protected = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
  };

  const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
    return children;
  };

  const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
  };

  const Loader = () => (
    <div className="fixed inset-0 flex items-center justify-center bg-[#0a0f1e]">
      <div className="w-10 h-10 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
    </div>
  );

  function AppRoutes() {
    return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  export default function App() {
    return (
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a2035', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)' }
        }} />
      </AuthProvider>
    );
  }
  