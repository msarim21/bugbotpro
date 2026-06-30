import React, { useEffect, useState } from 'react';
  import { useNavigate } from 'react-router-dom';
  import axios from 'axios';
  import toast from 'react-hot-toast';
  import { useAuth } from '../contexts/AuthContext';

  export default function Admin() {
    const { user, logout, getHeaders } = useAuth();
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const fetchData = async () => {
      try {
        const [usersRes, statsRes] = await Promise.all([
          axios.get('/api/admin/users', { headers: getHeaders() }),
          axios.get('/api/admin/stats', { headers: getHeaders() }),
        ]);
        setUsers(usersRes.data.users);
        setStats(statsRes.data);
      } catch { toast.error('Data load error'); }
      finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const action = async (id, endpoint, label) => {
      try {
        await axios.patch(`/api/admin/users/${id}/${endpoint}`, {}, { headers: getHeaders() });
        toast.success(label + ' done!');
        fetchData();
      } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    };

    const deleteUser = async (id) => {
      if (!window.confirm('Delete karna chahte ho?')) return;
      try {
        await axios.delete(`/api/admin/users/${id}`, { headers: getHeaders() });
        toast.success('User deleted');
        fetchData();
      } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    };

    const filtered = users.filter(u =>
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
      </div>
    );

    const roleBadge = (role) => {
      const map = { admin: 'bg-purple-500/20 text-purple-300', reseller: 'bg-cyan-500/20 text-cyan-300', user: 'bg-slate-500/20 text-slate-400' };
      return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[role] || map.user}`}>{role}</span>;
    };

    return (
      <div className="min-h-screen bg-[#0a0f1e] font-body">
        <div className="fixed inset-0 opacity-10" style={{backgroundImage:'linear-gradient(rgba(139,92,246,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.05) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-cyan-600 flex items-center justify-center text-sm font-bold">A</div>
            <span className="font-display font-semibold text-white">Admin Panel</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-slate-400 text-sm hover:text-white">Dashboard</button>
            <button onClick={() => { logout(); navigate('/'); }} className="text-slate-500 hover:text-neon-red text-sm">Logout</button>
          </div>
        </nav>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
          <h1 className="font-display text-2xl font-bold text-white mb-8">Admin Panel — BugBotPro</h1>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Total Users', value: stats.totalUsers, color: 'text-white' },
                { label: 'Active', value: stats.activeUsers, color: 'text-neon-green' },
                { label: 'Resellers', value: stats.resellers, color: 'text-neon-cyan' },
                { label: 'Banned', value: stats.bannedUsers, color: 'text-neon-red' },
              ].map((s, i) => (
                <div key={i} className="glass rounded-2xl p-5 animate-fade-in" style={{animationDelay: i*0.05+'s'}}>
                  <div className="text-xs text-slate-500 uppercase tracking-wider mb-2 font-mono">{s.label}</div>
                  <div className={`text-2xl font-display font-bold ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Free Mode Toggle Info */}
          {stats && (
            <div className={`glass rounded-xl p-4 mb-6 flex items-center gap-3 border ${stats.freeMode ? 'border-neon-green/20' : 'border-white/5'}`}>
              <div className={`w-2 h-2 rounded-full ${stats.freeMode ? 'bg-neon-green animate-pulse' : 'bg-slate-600'}`} />
              <span className="text-sm text-slate-400">
                Bot Free Mode: <span className={stats.freeMode ? 'text-neon-green font-semibold' : 'text-slate-500'}>
                  {stats.freeMode ? 'ON — Sab use kar sakte hain' : 'OFF — Sirf approved users'}
                </span>
              </span>
              <span className="text-xs text-slate-600 ml-auto">Telegram se /freeon /freeoff use karo</span>
            </div>
          )}

          {/* Users Table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between gap-4">
              <h2 className="font-display font-semibold text-white">All Users ({filtered.length})</h2>
              <input
                type="text" placeholder="Search users..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-48 text-sm py-2"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Username', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-mono text-slate-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors animate-fade-in" style={{animationDelay: i*0.03+'s'}}>
                      <td className="px-4 py-3 text-sm font-semibold text-white">{u.username}</td>
                      <td className="px-4 py-3 text-sm text-slate-400 font-mono">{u.email}</td>
                      <td className="px-4 py-3">{roleBadge(u.role)}</td>
                      <td className="px-4 py-3">
                        {u.banned ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-300">Banned</span>
                        ) : u.active ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-300">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-300">Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {u.id !== user?.id && (
                          <div className="flex flex-wrap gap-1">
                            {!u.active && !u.banned && (
                              <button onClick={() => action(u.id, 'activate', 'Activated')}
                                className="px-2 py-1 text-xs rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors">
                                Activate
                              </button>
                            )}
                            {u.active && (
                              <button onClick={() => action(u.id, 'deactivate', 'Deactivated')}
                                className="px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 transition-colors">
                                Deactivate
                              </button>
                            )}
                            {u.role !== 'reseller' && !u.banned && (
                              <button onClick={() => action(u.id, 'make-reseller', 'Reseller')}
                                className="px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors">
                                Reseller
                              </button>
                            )}
                            {u.role === 'reseller' && (
                              <button onClick={() => action(u.id, 'make-user', 'Downgraded')}
                                className="px-2 py-1 text-xs rounded bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 transition-colors">
                                User
                              </button>
                            )}
                            {!u.banned ? (
                              <button onClick={() => action(u.id, 'ban', 'Banned')}
                                className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
                                Ban
                              </button>
                            ) : (
                              <button onClick={() => action(u.id, 'unban', 'Unbanned')}
                                className="px-2 py-1 text-xs rounded bg-slate-500/20 text-slate-300 hover:bg-slate-500/30 transition-colors">
                                Unban
                              </button>
                            )}
                            <button onClick={() => deleteUser(u.id)}
                              className="px-2 py-1 text-xs rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors">
                              Del
                            </button>
                          </div>
                        )}
                        {u.id === user?.id && <span className="text-xs text-slate-600">You</span>}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-slate-600">Koi user nahi mila</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }
  