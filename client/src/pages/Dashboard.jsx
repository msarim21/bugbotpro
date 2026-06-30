import { useState, useEffect } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';
  import { api } from '../api';

  export default function Dashboard() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    const [waStatus, setWaStatus] = useState({ connected: false, phone: null, status: 'disconnected' });
    const [stats, setStats] = useState({ premiumCount: 0, resellerCount: 0, webUserCount: 0 });

    useEffect(() => {
      api.waStatus().then(d => setWaStatus(d)).catch(() => {});
      api.stats().then(d => setStats(d.stats || {})).catch(() => {});
      const t = setInterval(() => {
        api.waStatus().then(d => setWaStatus(d)).catch(() => {});
      }, 5000);
      return () => clearInterval(t);
    }, []);

    const cards = [
      { icon: '📱', title: 'WhatsApp Pairing', desc: 'QR ya pair code se connect karo', link: '/pairing', color: 'green' },
      { icon: '⚔️', title: 'Attack Tools', desc: 'Ban, Bug, Spam sender', link: '/tools', color: 'red' },
      ...(user?.role === 'admin' ? [{ icon: '⚙️', title: 'Admin Panel', desc: 'Users, access, sessions manage karo', link: '/admin', color: 'purple' }] : []),
    ];

    const colorMap = {
      green: 'border-green-800 hover:border-green-500 hover:bg-green-950/30',
      red: 'border-red-900 hover:border-red-600 hover:bg-red-950/20',
      purple: 'border-purple-900 hover:border-purple-600 hover:bg-purple-950/20',
    };

    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        {/* Nav */}
        <nav className="border-b border-green-900 px-6 py-3 flex items-center justify-between">
          <span className="text-xl font-bold text-green-400">⚡ BugBotPro</span>
          <div className="flex items-center gap-4">
            <span className="text-green-700 text-sm">{user?.username || user?.email}</span>
            {user?.role === 'admin' && <span className="text-xs px-2 py-0.5 bg-purple-900 text-purple-300 rounded border border-purple-700">ADMIN</span>}
            <button onClick={logout} className="text-green-800 hover:text-green-500 text-sm">Logout</button>
          </div>
        </nav>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-green-400">👋 Welcome, {user?.username || 'User'}!</h1>
            <p className="text-green-700 text-sm mt-1">BugBotPro Web Dashboard — Telegram se azaad</p>
          </div>

          {/* WA Status Bar */}
          <div className={`mb-8 p-4 rounded-xl border flex items-center justify-between ${
            waStatus.connected ? 'border-green-700 bg-green-950/20' : 'border-yellow-800 bg-yellow-950/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${waStatus.connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-500'}`}></div>
              <div>
                <div className={`font-bold text-sm ${waStatus.connected ? 'text-green-400' : 'text-yellow-400'}`}>
                  WhatsApp {waStatus.connected ? 'Connected ✅' : 'Not Connected ⚠️'}
                </div>
                {waStatus.phone && <div className="text-green-600 text-xs">📞 {waStatus.phone}</div>}
                {!waStatus.connected && <div className="text-yellow-700 text-xs">Tools use karne ke liye connect karo</div>}
              </div>
            </div>
            <Link to="/pairing"
              className={`px-4 py-2 rounded text-sm font-bold border transition-all ${
                waStatus.connected
                  ? 'border-green-700 bg-green-950 text-green-400 hover:bg-green-900'
                  : 'border-yellow-700 bg-yellow-950 text-yellow-400 hover:bg-yellow-900'
              }`}>
              {waStatus.connected ? 'Manage' : 'Connect →'}
            </Link>
          </div>

          {/* Stats (admin only) */}
          {user?.role === 'admin' && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Premium Users', val: stats.premiumCount, icon: '👑' },
                { label: 'Resellers', val: stats.resellerCount, icon: '🏪' },
                { label: 'Web Users', val: stats.webUserCount, icon: '👥' },
              ].map(s => (
                <div key={s.label} className="p-4 border border-green-900 rounded-xl bg-green-950/10 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-bold text-green-300">{s.val}</div>
                  <div className="text-green-700 text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Main Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.map(c => (
              <Link key={c.link} to={c.link}
                className={`p-6 border rounded-xl transition-all ${colorMap[c.color]}`}>
                <div className="text-4xl mb-3">{c.icon}</div>
                <div className="font-bold text-green-300 text-lg">{c.title}</div>
                <div className="text-green-700 text-sm mt-1">{c.desc}</div>
              </Link>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-8 p-5 border border-green-900 rounded-xl bg-green-950/10">
            <div className="text-green-600 text-xs font-bold mb-3 uppercase tracking-wider">Quick Actions</div>
            <div className="flex flex-wrap gap-3">
              <Link to="/pairing" className="px-4 py-2 bg-green-900/40 hover:bg-green-900/70 border border-green-800 text-green-300 rounded text-sm transition-all">
                📱 WA Connect
              </Link>
              <Link to="/tools?tab=ban" className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-400 rounded text-sm transition-all">
                🔥 Ban Tool
              </Link>
              <Link to="/tools?tab=bug" className="px-4 py-2 bg-orange-900/30 hover:bg-orange-900/50 border border-orange-800 text-orange-400 rounded text-sm transition-all">
                💥 Bug Tool
              </Link>
              <Link to="/tools?tab=spam" className="px-4 py-2 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-800 text-purple-400 rounded text-sm transition-all">
                📨 Spam
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  