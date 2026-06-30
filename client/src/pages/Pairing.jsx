import { useState, useEffect, useRef } from 'react';
  import { useNavigate, Link } from 'react-router-dom';
  import { api } from '../api';
  import QRCode from 'qrcode';

  export default function Pairing() {
    const [mode, setMode] = useState(null); // 'qr' | 'pair'
    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState('disconnected'); // disconnected|qr|connecting|open
    const [pairCode, setPairCode] = useState(null);
    const [qrUrl, setQrUrl] = useState(null);
    const [connectedPhone, setConnectedPhone] = useState(null);
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const pollRef = useRef(null);
    const nav = useNavigate();

    // Check current status on mount
    useEffect(() => {
      api.waStatus().then(d => {
        setStatus(d.status || 'disconnected');
        if (d.phone) setConnectedPhone(d.phone);
        if (d.qr) renderQR(d.qr);
        if (d.pairCode) setPairCode(d.pairCode);
      }).catch(() => {});
    }, []);

    async function renderQR(raw) {
      try { setQrUrl(await QRCode.toDataURL(raw, { width: 280, margin: 2, color: { dark: '#00ff41', light: '#000' } })); }
      catch(_) {}
    }

    function startPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const d = await api.waPoll();
          setStatus(d.status || 'disconnected');
          if (d.phone) setConnectedPhone(d.phone);
          if (d.qr) renderQR(d.qr);
          if (d.pairCode) setPairCode(d.pairCode);
          if (d.connected) {
            clearInterval(pollRef.current);
            setMsg('✅ WhatsApp Connected!');
            setMode(null);
          }
        } catch(_) {}
      }, 2000);
    }

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    async function connectQR() {
      setLoading(true); setMsg(''); setQrUrl(null); setMode('qr');
      try {
        const d = await api.waConnectQR();
        if (d.qr) renderQR(d.qr);
        setStatus(d.status);
        startPolling();
      } catch(e) { setMsg('❌ ' + e.message); } finally { setLoading(false); }
    }

    async function connectPair() {
      if (!phone.trim()) return setMsg('❌ Phone number daalo (e.g. 923001234567)');
      setLoading(true); setMsg(''); setPairCode(null); setMode('pair');
      try {
        const d = await api.waConnectPair(phone.trim());
        if (d.pairCode) setPairCode(d.pairCode);
        if (d.qr) renderQR(d.qr);
        setStatus(d.status);
        startPolling();
      } catch(e) { setMsg('❌ ' + e.message); } finally { setLoading(false); }
    }

    async function disconnect() {
      if (!confirm('Session delete kar dein?')) return;
      setLoading(true);
      try {
        await api.waDisconnect();
        setStatus('disconnected'); setConnectedPhone(null); setQrUrl(null); setPairCode(null); setMode(null);
        if (pollRef.current) clearInterval(pollRef.current);
        setMsg('✅ Disconnect ho gaya');
      } catch(e) { setMsg('❌ ' + e.message); } finally { setLoading(false); }
    }

    return (
      <div className="min-h-screen bg-black text-green-400 font-mono">
        {/* Nav */}
        <nav className="border-b border-green-900 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-green-400">⚡ BugBotPro</span>
            <span className="text-green-700">/ WhatsApp Pairing</span>
          </div>
          <div className="flex gap-4">
            <Link to="/dashboard" className="text-green-600 hover:text-green-400 text-sm">Dashboard</Link>
            <Link to="/tools" className="text-green-600 hover:text-green-400 text-sm">Tools</Link>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold mb-2 text-green-400">📱 WhatsApp Connect</h1>
          <p className="text-green-700 mb-8 text-sm">Apna WhatsApp number website se pair karo — Telegram ki zaroorat nahi</p>

          {/* Connected status */}
          {status === 'open' && connectedPhone && (
            <div className="mb-6 p-4 border border-green-500 rounded-lg bg-green-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-green-400 font-bold text-lg">✅ Connected</div>
                  <div className="text-green-300 text-sm mt-1">📞 {connectedPhone}</div>
                </div>
                <button onClick={disconnect} disabled={loading} className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-300 rounded text-sm border border-red-700">
                  {loading ? '...' : 'Disconnect'}
                </button>
              </div>
            </div>
          )}

          {/* Disconnected — show options */}
          {status !== 'open' && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              <button onClick={connectQR} disabled={loading}
                className="p-6 border border-green-800 hover:border-green-500 rounded-xl bg-green-950/20 hover:bg-green-950/40 transition-all text-left">
                <div className="text-3xl mb-3">📷</div>
                <div className="font-bold text-green-300">QR Code Scan</div>
                <div className="text-green-700 text-xs mt-1">WhatsApp pe scan karo</div>
              </button>
              <button onClick={() => setMode('pairInput')} disabled={loading}
                className="p-6 border border-green-800 hover:border-green-500 rounded-xl bg-green-950/20 hover:bg-green-950/40 transition-all text-left">
                <div className="text-3xl mb-3">🔢</div>
                <div className="font-bold text-green-300">Pair Code</div>
                <div className="text-green-700 text-xs mt-1">Phone number se 8-digit code</div>
              </button>
            </div>
          )}

          {/* Pair code input */}
          {mode === 'pairInput' && status !== 'open' && (
            <div className="mb-6 p-5 border border-green-800 rounded-xl bg-green-950/20">
              <div className="text-green-400 font-bold mb-3">📞 Phone Number (with country code)</div>
              <div className="flex gap-3">
                <input value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="923001234567"
                  className="flex-1 bg-black border border-green-700 rounded px-3 py-2 text-green-300 focus:outline-none focus:border-green-400 text-sm" />
                <button onClick={connectPair} disabled={loading}
                  className="px-5 py-2 bg-green-800 hover:bg-green-700 text-green-200 rounded font-bold text-sm">
                  {loading ? '...' : 'Get Code'}
                </button>
              </div>
            </div>
          )}

          {/* QR Code display */}
          {mode === 'qr' && qrUrl && (
            <div className="mb-6 flex flex-col items-center p-6 border border-green-800 rounded-xl bg-black">
              <div className="text-green-400 font-bold mb-4">📷 WhatsApp pe scan karo</div>
              <img src={qrUrl} alt="QR Code" className="rounded-lg" style={{width:280,height:280}} />
              <div className="text-green-700 text-xs mt-4">WhatsApp → Linked Devices → Link a Device → Scan</div>
            </div>
          )}

          {/* Pair code display */}
          {pairCode && status !== 'open' && (
            <div className="mb-6 p-6 border border-yellow-700 rounded-xl bg-yellow-950/20 text-center">
              <div className="text-yellow-400 font-bold mb-3">🔐 Pair Code — WhatsApp pe enter karo</div>
              <div className="text-4xl font-bold tracking-widest text-yellow-300 bg-black rounded-lg py-4 px-6 border border-yellow-800">
                {pairCode}
              </div>
              <div className="text-yellow-700 text-xs mt-3">WhatsApp → Settings → Linked Devices → Link a Device → Enter Phone Number</div>
            </div>
          )}

          {/* Connecting spinner */}
          {(status === 'connecting' || (loading && mode)) && !qrUrl && !pairCode && (
            <div className="mb-6 flex items-center justify-center gap-3 text-green-500 py-8">
              <div className="animate-spin w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
              <span>Connecting...</span>
            </div>
          )}

          {/* Message */}
          {msg && <div className={`mb-4 px-4 py-3 rounded text-sm border ${msg.startsWith('✅') ? 'border-green-700 bg-green-950/30 text-green-400' : 'border-red-700 bg-red-950/30 text-red-400'}`}>{msg}</div>}

          {/* Action buttons when connected */}
          {status === 'open' && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link to="/tools" className="p-4 border border-green-800 hover:border-green-500 rounded-xl bg-green-950/20 text-center text-green-300 hover:text-green-200 transition-all">
                ⚔️ Tools kholo
              </Link>
              <Link to="/dashboard" className="p-4 border border-green-800 hover:border-green-500 rounded-xl bg-green-950/20 text-center text-green-300 hover:text-green-200 transition-all">
                📊 Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
  