import { useState, useEffect } from 'react';
  import { Link } from 'react-router-dom';
  import { useAuth } from '../contexts/AuthContext';
  import { api } from '../api';

  const TABS = [
    { id: 'users', label: '👥 Web Users' },
    { id: 'premium', label: '👑 Premium' },
    { id: 'resellers', label: '🏪 Resellers' },
    { id: 'sessions', label: '📱 WA Sessions' },
  ];

  export default function Admin() {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState('users');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');

    const [webUsers, setWebUsers] = useState([]);
    const [premiumList, setPremiumList] = useState([]);
    const [resellerList, setResellerList] = useState([]);
    const [sessions, setSessions] = useState([]);

    const [newPremium, setNewPremium] = useState('');
    const [newReseller, setNewReseller] = useState('');

    function notice(m, isErr=false) {
      if (isErr) { setErr(m); setMsg(''); } else { setMsg(m); setErr(''); }
      setTimeout(() => { setMsg(''); setErr(''); }, 3000);
    }

    async function load() {
      setLoading(true);
      try {
        if (tab === 'users') { const d = await api.webUsers(); setWebUsers(d.users || []); }
        if (tab === 'premium') { const d = await api.premiumList(); setPremiumList(d.users || []); }
        if (tab === 'resellers') { const d = await api.resellerList(); setResellerList(d.users || []); }
        if (tab === 'sessions') { const d = await api.waSessions(); setSessions(d.sessions || []); }
      } catch(e) { notice(e.message, true); }
      finally { setLoading(false); }
    }

    useEffect(() => { load(); }, [tab]);

    async function addPremium() {
      if (!newPremium.trim()) return;
      try { await api.addPremium(newPremium.trim()); setNewPremium(''); notice('✅ Premium add ho gaya!'); load(); }
      catch(e) { notice(e.message, true); }
    }
    async function removePremium(id) {
      if (!confirm('Remove karna?')) return;
      try { await api.removePremium(id); notice('✅ Removed'); load(); }
      catch(e) { notice(e.message, true); }
    }
    async function addReseller() {
      if (!newReseller.trim()) return;
      try { await api.addReseller(newReseller.trim()); setNewReseller(''); notice('✅ Reseller add ho gaya!'); load(); }
      catch(e) { notice(e.message, true); }
    }
    async function removeReseller(id) {
      if (!confirm('Remove karna?')) return;
      try { await api.removeReseller(id); notice('✅ Removed'); load(); }
      catch(e) { notice(e.message, true); }
    }
    async function killSession(userId) {
      if (!confirm('Session delete karna?')) return;
      try { await api.waKillSession(userId); notice('✅ Session killed'); load(); }
      catch(e) { notice(e.message, true); }
    }
    async function changeRole(id, role) {
      try { await api.changeRole(id, role); notice('✅ Role updated'); load(); }
      catch(e) { notice(e.message, true); }
    }
    async function deleteUser(id) {
      if (!confirm('User permanently delete karna?')) return;
      try { await api.deleteUser(id); notice('✅ User deleted'); load(); }
      catch(e) { notice(e.message, true); }
    }

    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        <nav className="border-b border-green-900 px-6 py-3 flex items-center justify-between sticky top-0 bg-black z-10">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold">⚡ BugBotPro</span>
            <span className="text-xs px-2 py-0.5 bg-purple-900 text-purple-300 rounded border border-purple-700">ADMIN</span>
            <Link to="/dashboard" className="text-green-700 hover:text-green-400 text-sm">Dashboard</Link>
            <Link to="/tools" className="text-green-700 hover:text-green-400 text-sm">Tools</Link>
            <Link to="/pairing" className="text-green-700 hover:text-green-400 text-sm">Pairing</Link>
          </div>
          <button onClick={logout} className="text-green-800 hover:text-green-500 text-sm">Logout</button>
        </nav>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-6 text-purple-400">⚙️ Admin Panel</h1>

          {/* Notifications */}
          {msg && <div className="mb-4 p-3 border border-green-700 bg-green-950/30 text-green-400 rounded text-sm">{msg}</div>}
          {err && <div className="mb-4 p-3 border border-red-700 bg-red-950/30 text-red-400 rounded text-sm">❌ {err}</div>}

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-green-950/20 p-1 rounded-xl border border-green-900 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-shrink-0 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                  tab === t.id ? 'bg-green-800 text-green-200' : 'text-green-700 hover:text-green-400'
                }`}>{t.label}</button>
            ))}
          </div>

          {loading && <div className="text-green-600 text-sm animate-pulse mb-4">Loading...</div>}

          {/* WEB USERS TAB */}
          {tab === 'users' && (
            <div className="space-y-2">
              <div className="text-green-600 text-xs mb-3">{webUsers.length} registered users</div>
              {webUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-3 border border-green-900 rounded-lg bg-green-950/10 gap-3">
                  <div className="flex-1 min-w-0">
                    <span className="text-green-300 font-bold text-sm">{u.username}</span>
                    <span className="text-green-700 text-xs ml-2">{u.email}</span>
                    {u.role === 'admin' && <span className="ml-2 text-xs px-1.5 py-0.5 bg-purple-900 text-purple-300 rounded">admin</span>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {u.role !== 'admin' ? (
                      <button onClick={() => changeRole(u.id, 'admin')} className="text-xs px-2 py-1 border border-purple-700 text-purple-400 rounded hover:bg-purple-950">Make Admin</button>
                    ) : (
                      u.id !== user?.id && <button onClick={() => changeRole(u.id, 'user')} className="text-xs px-2 py-1 border border-green-700 text-green-600 rounded hover:bg-green-950">Demote</button>
                    )}
                    {u.id !== user?.id && (
                      <button onClick={() => deleteUser(u.id)} className="text-xs px-2 py-1 border border-red-800 text-red-500 rounded hover:bg-red-950">Delete</button>
                    )}
                  </div>
                </div>
              ))}
              {webUsers.length === 0 && !loading && <div className="text-green-800 text-sm">Koi user nahi</div>}
            </div>
          )}

          {/* PREMIUM TAB */}
          {tab === 'premium' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={newPremium} onChange={e => setNewPremium(e.target.value)}
                  placeholder="User ID (Telegram or web)"
                  className="flex-1 bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-green-500 text-sm" />
                <button onClick={addPremium} className="px-4 py-2 bg-green-800 hover:bg-green-700 text-green-200 rounded text-sm font-bold">+ Add</button>
              </div>
              <div className="text-green-600 text-xs">{premiumList.length} premium users</div>
              {premiumList.map((id, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-green-900 rounded-lg bg-green-950/10">
                  <span className="text-green-300 text-sm font-mono">👑 {id}</span>
                  <button onClick={() => removePremium(id)} className="text-xs px-2 py-1 border border-red-800 text-red-500 rounded hover:bg-red-950">Remove</button>
                </div>
              ))}
              {premiumList.length === 0 && !loading && <div className="text-green-800 text-sm">Koi premium user nahi</div>}
            </div>
          )}

          {/* RESELLERS TAB */}
          {tab === 'resellers' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input value={newReseller} onChange={e => setNewReseller(e.target.value)}
                  placeholder="User ID"
                  className="flex-1 bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-green-500 text-sm" />
                <button onClick={addReseller} className="px-4 py-2 bg-green-800 hover:bg-green-700 text-green-200 rounded text-sm font-bold">+ Add</button>
              </div>
              <div className="text-green-600 text-xs">{resellerList.length} resellers</div>
              {resellerList.map((id, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-green-900 rounded-lg bg-green-950/10">
                  <span className="text-green-300 text-sm font-mono">🏪 {id}</span>
                  <button onClick={() => removeReseller(id)} className="text-xs px-2 py-1 border border-red-800 text-red-500 rounded hover:bg-red-950">Remove</button>
                </div>
              ))}
              {resellerList.length === 0 && !loading && <div className="text-green-800 text-sm">Koi reseller nahi</div>}
            </div>
          )}

          {/* WA SESSIONS TAB */}
          {tab === 'sessions' && (
            <div className="space-y-2">
              <div className="text-green-600 text-xs mb-3">{sessions.length} active sessions</div>
              {sessions.map(s => (
                <div key={s.userId} className="flex items-center justify-between p-3 border border-green-900 rounded-lg bg-green-950/10">
                  <div>
                    <span className="text-green-300 text-sm font-mono">👤 {s.userId}</span>
                    {s.phone && <span className="text-green-600 text-xs ml-2">📞 {s.phone}</span>}
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${s.connected ? 'bg-green-900 text-green-400' : 'bg-red-950 text-red-400'}`}>
                      {s.status}
                    </span>
                  </div>
                  <button onClick={() => killSession(s.userId)} className="text-xs px-2 py-1 border border-red-800 text-red-500 rounded hover:bg-red-950">Kill</button>
                </div>
              ))}
              {sessions.length === 0 && !loading && <div className="text-green-800 text-sm">Koi active session nahi</div>}
            </div>
          )}
        </div>
      </div>
    );
  }
  