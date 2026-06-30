import React, { useEffect, useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import axios from 'axios';
  import toast from 'react-hot-toast';
  import { useAuth } from '../contexts/AuthContext';

  export default function Dashboard() {
    const { user, logout, getHeaders } = useAuth();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
      axios.get('/api/dashboard/status', { headers: getHeaders() })
        .then(r => setStatus(r.data))
        .catch(() => toast.error('Data load karne mein error'))
        .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => { logout(); navigate('/'); };

    if (loading) return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
      </div>
    );

    const isActive = status?.user?.active;
    const hasBotAccess = status?.hasBotAccess;

    return (
      <div className="min-h-screen bg-[#0a0f1e] font-body">
        <div className="fixed inset-0 opacity-10" style={{backgroundImage:'linear-gradient(rgba(34,211,238,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.05) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm font-bold">B</div>
            <span className="font-display font-semibold text-white">BugBotPro</span>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <button onClick={() => navigate('/admin')} className="text-neon-cyan text-sm hover:underline">Admin Panel</button>
            )}
            <span className="text-slate-400 text-sm">{user?.username}</span>
            <button onClick={handleLogout} className="text-slate-500 hover:text-neon-red text-sm transition-colors">Logout</button>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
          {/* Welcome */}
          <div className="mb-8 animate-fade-in">
            <h1 className="font-display text-2xl font-bold text-white">
              Salam, <span className="text-neon-cyan">{user?.username}</span>! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Tumhara BugBotPro Dashboard</p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="glass rounded-2xl p-5 animate-slide-up">
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">Account Status</div>
              <div className={`text-lg font-display font-bold ${isActive ? 'text-neon-green' : 'text-yellow-400'}`}>
                {isActive ? '✅ Active' : '⏳ Pending'}
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {isActive ? 'Admin ne approve kar diya' : 'Admin approval ka wait karo'}
              </div>
            </div>

            <div className="glass rounded-2xl p-5 animate-slide-up" style={{animationDelay:'0.05s'}}>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">Bot Access</div>
              <div className={`text-lg font-display font-bold ${hasBotAccess ? 'text-neon-green' : 'text-slate-500'}`}>
                {hasBotAccess ? '✅ Available' : '❌ No Access'}
              </div>
              <div className="text-slate-500 text-xs mt-1">
                {hasBotAccess ? 'Telegram bot use kar sakte ho' : 'Admin se access lo'}
              </div>
            </div>

            <div className="glass rounded-2xl p-5 animate-slide-up" style={{animationDelay:'0.1s'}}>
              <div className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-2">WhatsApp Numbers</div>
              <div className="text-lg font-display font-bold text-neon-cyan">
                {status?.totalPaired || 0} Paired
              </div>
              <div className="text-slate-500 text-xs mt-1">WhatsApp sessions active</div>
            </div>
          </div>

          {/* Role Badge */}
          <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" style={{animationDelay:'0.15s'}}>
            <h2 className="font-display font-semibold text-white mb-4">Account Info</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Email</div>
                <div className="text-sm text-slate-300 font-mono">{user?.email}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Role</div>
                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                  user?.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                  user?.role === 'reseller' ? 'bg-cyan-500/20 text-cyan-300' :
                  'bg-slate-500/20 text-slate-300'
                }`}>{user?.role?.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* How to use */}
          {!isActive && (
            <div className="glass rounded-2xl p-6 border border-yellow-400/10 animate-slide-up" style={{animationDelay:'0.2s'}}>
              <h3 className="font-display font-semibold text-yellow-400 mb-3">⏳ Account Pending</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Tumhara account admin approval ka wait kar raha hai. Admin se Telegram pe contact karo:
              </p>
              <a href="https://t.me/cybersecpro7" target="_blank" rel="noopener noreferrer"
                className="inline-flex mt-3 text-neon-cyan text-sm hover:underline">
                @cybersecpro7 pe message karo →
              </a>
            </div>
          )}

          {isActive && (
            <div className="glass rounded-2xl p-6 animate-slide-up" style={{animationDelay:'0.2s'}}>
              <h3 className="font-display font-semibold text-white mb-3">🚀 Kaise Use Karo</h3>
              <div className="space-y-3">
                {[
                  { step: '1', text: 'Telegram pe @YourBot dhundo aur /start karo' },
                  { step: '2', text: 'WhatsApp number enter karo pair code ke liye' },
                  { step: '3', text: 'Pair code WhatsApp pe enter karo — connect!' },
                  { step: '4', text: 'Ab sab commands use karo: crash, spam, ban aur zyada' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-neon-cyan/20 text-neon-cyan text-xs flex items-center justify-center flex-shrink-0 font-mono">{s.step}</div>
                    <div className="text-slate-300 text-sm">{s.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  