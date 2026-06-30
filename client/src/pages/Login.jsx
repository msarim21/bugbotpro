import React, { useState } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';
  import toast from 'react-hot-toast';

  export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const user = await login(form.email, form.password);
        toast.success('Login successful!');
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Login failed.');
      } finally { setLoading(false); }
    };

    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
        <div className="fixed inset-0 opacity-20" style={{backgroundImage:'linear-gradient(rgba(34,211,238,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.05) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />
        <div className="relative z-10 w-full max-w-sm animate-fade-in">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center font-bold text-lg">B</div>
            </Link>
            <h1 className="font-display text-2xl font-bold text-white">Wapas aa gaye!</h1>
            <p className="text-slate-400 text-sm mt-1">Dashboard mein login karo</p>
          </div>

          <div className="glass rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label>Email</label>
                <input type="email" placeholder="apna@email.com" value={form.email}
                  onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
              </div>
              <div>
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={form.password}
                  onChange={e => setForm(p => ({...p, password: e.target.value}))} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl">
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Account nahi hai?{' '}
            <Link to="/signup" className="text-neon-cyan hover:underline">Signup karo</Link>
          </p>
        </div>
      </div>
    );
  }
  