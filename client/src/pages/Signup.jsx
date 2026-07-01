import React, { useState } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';
  import toast from 'react-hot-toast';

  export default function Signup() {
    const { signup } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
      e.preventDefault();
      setLoading(true);
      try {
        await signup(form.username, form.email, form.password);
        toast.success('Account ban gaya!');
        nav('/dashboard');
      } catch (err) {
        toast.error(err.message || 'Signup failed');
      } finally {
        setLoading(false);
      }
    }

    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4">
        <div className="glass rounded-2xl p-8 w-full max-w-md">
          <h1 className="font-display text-2xl font-bold text-white mb-6 text-center">⚡ Signup</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label>Username</label>
              <input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="yourname" />
            </div>
            <div>
              <label>Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="you@email.com" />
            </div>
            <div>
              <label>Password</label>
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="••••••" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl">
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-slate-400 text-sm mt-4">
            Pehle se account hai? <Link to="/login" className="text-cyan-400 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    );
  }
  