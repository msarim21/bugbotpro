import { useState, useEffect } from 'react';
  import { Link, useNavigate } from 'react-router-dom';
  import { api } from '../api';
  import { useAuth } from '../contexts/AuthContext';

  const TABS = [
    { id: 'ban', label: '🔥 Ban', icon: '🔥' },
    { id: 'bug', label: '💥 Bug', icon: '💥' },
    { id: 'spam', label: '📨 Spam', icon: '📨' },
    { id: 'send', label: '✉️ Send', icon: '✉️' },
  ];

  export default function Tools() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    const [tab, setTab] = useState('ban');
    const [waStatus, setWaStatus] = useState({ connected: false, phone: null });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [err, setErr] = useState('');

    // Ban state
    const [banPhone, setBanPhone] = useState('');
    // Bug state
    const [bugPhone, setBugPhone] = useState('');
    const [bugType, setBugType] = useState('crash');
    const [bugCount, setBugCount] = useState(10);
    // Spam state
    const [spamPhone, setSpamPhone] = useState('');
    const [spamMsg, setSpamMsg] = useState('');
    const [spamCount, setSpamCount] = useState(10);
    // Send state
    const [sendPhone, setSendPhone] = useState('');
    const [sendMsg, setSendMsg] = useState('');

    useEffect(() => {
      api.waStatus().then(d => setWaStatus(d)).catch(() => {});
      const t = setInterval(() => api.waStatus().then(d => setWaStatus(d)).catch(() => {}), 5000);
      return () => clearInterval(t);
    }, []);

    async function run(fn) {
      setLoading(true); setResult(null); setErr('');
      try {
        const d = await fn();
        setResult(d);
      } catch(e) { setErr(e.message); }
      finally { setLoading(false); }
    }

    const StatusBadge = () => (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
        waStatus.connected ? 'border-green-600 bg-green-950/40 text-green-400' : 'border-red-700 bg-red-950/30 text-red-400'
      }`}>
        <div className={`w-2 h-2 rounded-full ${waStatus.connected ? 'bg-green-400 animate-pulse' : 'bg-red-500'}`}></div>
        {waStatus.connected ? `WA: ${waStatus.phone || 'Connected'}` : 'WA: Not Connected'}
      </div>
    );

    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        {/* Nav */}
        <nav className="border-b border-green-900 px-6 py-3 flex items-center justify-between sticky top-0 bg-black z-10">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold">⚡ BugBotPro</span>
            <Link to="/dashboard" className="text-green-700 hover:text-green-400 text-sm">Dashboard</Link>
            <Link to="/pairing" className="text-green-700 hover:text-green-400 text-sm">Pairing</Link>
            {user?.role === 'admin' && <Link to="/admin" className="text-green-700 hover:text-green-400 text-sm">Admin</Link>}
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge />
            <button onClick={logout} className="text-green-800 hover:text-green-500 text-sm">Logout</button>
          </div>
        </nav>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* WA not connected warning */}
          {!waStatus.connected && (
            <div className="mb-6 p-4 border border-yellow-700 rounded-xl bg-yellow-950/20 flex items-center justify-between">
              <div>
                <div className="text-yellow-400 font-bold">⚠️ WhatsApp Connected Nahi</div>
                <div className="text-yellow-700 text-sm mt-1">Tools use karne ke liye pehle WA connect karo</div>
              </div>
              <Link to="/pairing" className="px-4 py-2 bg-yellow-900 hover:bg-yellow-800 text-yellow-300 rounded text-sm border border-yellow-700 font-bold">
                Connect →
              </Link>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-green-950/20 p-1 rounded-xl border border-green-900">
            {TABS.map(t => (
              <button key={t.id} onClick={() => { setTab(t.id); setResult(null); setErr(''); }}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-bold transition-all ${
                  tab === t.id ? 'bg-green-800 text-green-200' : 'text-green-700 hover:text-green-400'
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* BAN TAB */}
          {tab === 'ban' && (
            <div className="space-y-4">
              <div className="p-5 border border-red-900 rounded-xl bg-red-950/10">
                <div className="text-red-400 font-bold text-lg mb-1">🔥 Multi-Vector Ban</div>
                <div className="text-red-700 text-xs mb-4">WA block + crash messages — target permanently ban hoga</div>
                <div className="mb-3">
                  <label className="text-green-600 text-xs mb-1 block">Target Phone (with country code)</label>
                  <input value={banPhone} onChange={e => setBanPhone(e.target.value)}
                    placeholder="923001234567"
                    className="w-full bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-red-500 text-sm" />
                </div>
                <button onClick={() => run(() => api.waBan(banPhone))} disabled={loading || !waStatus.connected}
                  className="w-full py-3 bg-red-900 hover:bg-red-800 disabled:opacity-40 text-red-200 rounded-lg font-bold border border-red-700 transition-all">
                  {loading ? '⚙️ Attacking...' : '🔥 BAN KARO'}
                </button>
              </div>
            </div>
          )}

          {/* BUG TAB */}
          {tab === 'bug' && (
            <div className="space-y-4">
              <div className="p-5 border border-orange-900 rounded-xl bg-orange-950/10">
                <div className="text-orange-400 font-bold text-lg mb-1">💥 Bug / Crash Sender</div>
                <div className="text-orange-700 text-xs mb-4">Target ke WhatsApp ko crash/freeze karo</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-green-600 text-xs mb-1 block">Target Phone</label>
                    <input value={bugPhone} onChange={e => setBugPhone(e.target.value)}
                      placeholder="923001234567"
                      className="w-full bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-orange-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-green-600 text-xs mb-1 block">Count (max 50)</label>
                    <input type="number" value={bugCount} onChange={e => setBugCount(e.target.value)} min={1} max={50}
                      className="w-full bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-orange-500 text-sm" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-green-600 text-xs mb-2 block">Bug Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{v:'basic',l:'Basic Crash'},{v:'crash',l:'Heavy Crash'},{v:'freeze',l:'Freeze'},{v:'heavy',l:'Ultra Heavy'}].map(({v,l}) => (
                      <button key={v} onClick={() => setBugType(v)}
                        className={`py-2 px-3 rounded text-xs font-bold border transition-all ${
                          bugType === v ? 'border-orange-500 bg-orange-900/40 text-orange-300' : 'border-green-900 text-green-700 hover:border-green-600'
                        }`}>{l}</button>
                    ))}
                  </div>
                </div>
                <button onClick={() => run(() => api.waBug(bugPhone, bugType, bugCount))} disabled={loading || !waStatus.connected}
                  className="w-full py-3 bg-orange-900 hover:bg-orange-800 disabled:opacity-40 text-orange-200 rounded-lg font-bold border border-orange-700 transition-all">
                  {loading ? '⚙️ Sending...' : '💥 BUG BHEJO'}
                </button>
              </div>
            </div>
          )}

          {/* SPAM TAB */}
          {tab === 'spam' && (
            <div className="space-y-4">
              <div className="p-5 border border-purple-900 rounded-xl bg-purple-950/10">
                <div className="text-purple-400 font-bold text-lg mb-1">📨 Spam Sender</div>
                <div className="text-purple-700 text-xs mb-4">Target ko same message baar baar bhejo (max 100)</div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-green-600 text-xs mb-1 block">Target Phone</label>
                    <input value={spamPhone} onChange={e => setSpamPhone(e.target.value)}
                      placeholder="923001234567"
                      className="w-full bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-purple-500 text-sm" />
                  </div>
                  <div>
                    <label className="text-green-600 text-xs mb-1 block">Count (max 100)</label>
                    <input type="number" value={spamCount} onChange={e => setSpamCount(e.target.value)} min={1} max={100}
                      className="w-full bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-purple-500 text-sm" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-green-600 text-xs mb-1 block">Message</label>
                  <textarea value={spamMsg} onChange={e => setSpamMsg(e.target.value)}
                    rows={3} placeholder="Jo message spam karna hai..."
                    className="w-full bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-purple-500 text-sm resize-none" />
                </div>
                <button onClick={() => run(() => api.waSpam(spamPhone, spamMsg, spamCount))} disabled={loading || !waStatus.connected}
                  className="w-full py-3 bg-purple-900 hover:bg-purple-800 disabled:opacity-40 text-purple-200 rounded-lg font-bold border border-purple-700 transition-all">
                  {loading ? '⚙️ Spamming...' : '📨 SPAM KARO'}
                </button>
              </div>
            </div>
          )}

          {/* SEND TAB */}
          {tab === 'send' && (
            <div className="space-y-4">
              <div className="p-5 border border-blue-900 rounded-xl bg-blue-950/10">
                <div className="text-blue-400 font-bold text-lg mb-1">✉️ Single Message</div>
                <div className="text-blue-700 text-xs mb-4">Kisi bhi number pe ek message bhejo</div>
                <div className="mb-3">
                  <label className="text-green-600 text-xs mb-1 block">Target Phone (with country code)</label>
                  <input value={sendPhone} onChange={e => setSendPhone(e.target.value)}
                    placeholder="923001234567"
                    className="w-full bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-blue-500 text-sm" />
                </div>
                <div className="mb-3">
                  <label className="text-green-600 text-xs mb-1 block">Message</label>
                  <textarea value={sendMsg} onChange={e => setSendMsg(e.target.value)}
                    rows={4} placeholder="Message likhein..."
                    className="w-full bg-black border border-green-800 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-blue-500 text-sm resize-none" />
                </div>
                <button onClick={() => run(() => api.waSend(sendPhone, sendMsg))} disabled={loading || !waStatus.connected}
                  className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-blue-200 rounded-lg font-bold border border-blue-700 transition-all">
                  {loading ? '⚙️ Sending...' : '✉️ BHEJO'}
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {err && (
            <div className="mt-4 p-4 border border-red-700 bg-red-950/20 rounded-xl text-red-400 text-sm">
              ❌ {err}
            </div>
          )}
          {result && (
            <div className="mt-4 p-4 border border-green-700 bg-green-950/20 rounded-xl text-sm">
              <div className="text-green-400 font-bold mb-2">✅ Result</div>
              {result.sent !== undefined && (
                <div className="text-green-300">📤 Sent: <span className="text-green-200 font-bold">{result.sent}</span> | ❌ Failed: {result.failed}</div>
              )}
              {result.results && (
                <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                  {result.results.map((r, i) => (
                    <div key={i} className={`text-xs flex gap-2 ${r.success ? 'text-green-400' : 'text-red-400'}`}>
                      <span>{r.success ? '✅' : '❌'}</span><span>{r.method}</span>
                      {r.error && <span className="text-red-600">({r.error})</span>}
                    </div>
                  ))}
                </div>
              )}
              {result.message && <div className="text-green-300">{result.message}</div>}
            </div>
          )}
        </div>
      </div>
    );
  }
  