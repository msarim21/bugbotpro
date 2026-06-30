import React, { useState } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';
  import toast from 'react-hot-toast';

  export default function Signup() {
    const [form, setForm] = useState({ username: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      try {
        const user = await signup(form.username, form.email, form.password);
        toast.success('Account ban gaya!');
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Signup failed.');
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
            <h1 className="font-display text-2xl font-bold text-white">Account Banao</h1>
            <p className="text-slate-400 text-sm mt-1">BugBotPro dashboard join karo</p>
          </div>

          <div className="glass rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label>Username</label>
                <input type="text" placeholder="cyberhacker" value={form.username}
                  onChange={e => setForm(p => ({...p, username: e.target.value}))} required />
              </div>
              <div>
                <label>Email</label>
                <input type="email" placeholder="apna@email.com" value={form.email}
                  onChange={e => setForm(p => ({...p, email: e.target.value}))} required />
              </div>
              <div>
                <label>Password</label>
                <input type="password" placeholder="Min 6 characters" value={form.password}
                  onChange={e => setForm(p => ({...p, password: e.target.value}))} required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 rounded-xl">
                {loading ? 'Creating...' : 'Account Banao'}
              </button>
            </form>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            Pehle se account hai?{' '}
            <Link to="/login" className="text-neon-cyan hover:underline">Login karo</Link>
          </p>
          <p className="text-center text-slate-600 text-xs mt-3">
            Note: Account admin se approve hone ke baad active hoga
          </p>
        </div>
      </div>
    );
  }
  