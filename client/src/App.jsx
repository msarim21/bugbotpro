import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
  import { AuthProvider, useAuth } from './contexts/AuthContext';
  import Landing from './pages/Landing';
  import Login from './pages/Login';
  import Signup from './pages/Signup';
  import Dashboard from './pages/Dashboard';
  import Admin from './pages/Admin';
  import Pairing from './pages/Pairing';
  import Tools from './pages/Tools';

  function PrivateRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-green-400 text-xl animate-pulse">Loading...</div></div>;
    return user ? children : <Navigate to="/login" replace />;
  }

  function AdminRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="text-green-400 text-xl animate-pulse">Loading...</div></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
    return children;
  }

  export default function App() {
    return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/pairing" element={<PrivateRoute><Pairing /></PrivateRoute>} />
            <Route path="/tools" element={<PrivateRoute><Tools /></PrivateRoute>} />
            <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    );
  }
  