import React from 'react';
  import { Link } from 'react-router-dom';

  const features = [
    { icon: '🔐', title: 'Multi-User Pairing', desc: 'Har user apna WhatsApp number pair kar sakta hai pair code se' },
    { icon: '👑', title: 'Premium System', desc: 'Owner resellers manage kar sakta hai, premium users control mein' },
    { icon: '⚡', title: 'Bug Commands', desc: 'Crash, spam, ban — powerful WhatsApp attack tools' },
    { icon: '🔄', title: 'Auto Session Restore', desc: 'Bot restart hone pe WhatsApp sessions automatically reconnect' },
    { icon: '📊', title: 'Web Dashboard', desc: 'Web panel se users manage karo, access do ya hato' },
    { icon: '🛡️', title: 'Access Control', desc: 'Free mode, paid mode, reseller system — sab control mein' },
  ];

  export default function Landing() {
    return (
      <div className="min-h-screen bg-[#0a0f1e] font-body">
        {/* Grid bg */}
        <div className="fixed inset-0 opacity-20" style={{backgroundImage:'linear-gradient(rgba(34,211,238,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,0.05) 1px,transparent 1px)',backgroundSize:'40px 40px'}} />

        {/* Navbar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-sm font-bold">B</div>
            <span className="font-display font-bold text-white">BugBotPro</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">Login</Link>
            <Link to="/signup" className="btn-primary text-sm px-4 py-2 rounded-lg">Get Started</Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 pt-24 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neon-cyan/20 bg-neon-cyan/5 text-neon-cyan text-xs font-mono mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
            Telegram + WhatsApp Bot Platform
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            BugBot<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Pro</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-xl mb-10 leading-relaxed">
            Telegram bot se WhatsApp sessions manage karo. Multi-user pairing, premium system, bug tools aur web dashboard — sab ek jagah.
          </p>

          <div className="flex gap-4 flex-wrap justify-center">
            <Link to="/signup" className="btn-primary px-8 py-3 rounded-xl text-base font-semibold">
              Dashboard Join Karo
            </Link>
            <a href="https://t.me/cybersecpro7" target="_blank" rel="noopener noreferrer"
              className="px-8 py-3 rounded-xl text-base font-semibold border border-white/10 text-slate-300 hover:border-neon-cyan/40 hover:text-white transition-all">
              Telegram Channel →
            </a>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
          <h2 className="text-center font-display text-2xl font-bold text-white mb-12">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:border-neon-cyan/20 transition-all animate-fade-in" style={{animationDelay: i*0.05+'s'}}>
                <div className="text-2xl mb-3">{f.icon}</div>
                <h3 className="font-display font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Heroku Deploy */}
        <div className="relative z-10 flex flex-col items-center py-16 px-6">
          <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
            <h3 className="font-display font-bold text-white text-xl mb-3">Heroku Pe Deploy Karo</h3>
            <p className="text-slate-400 text-sm mb-6">One-click Heroku deploy — web panel + bot dono saath chalein</p>
            <a href="https://heroku.com/deploy?template=https://github.com/msarim21/bugbotpro"
              target="_blank" rel="noopener noreferrer">
              <img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy to Heroku" className="mx-auto" />
            </a>
          </div>
        </div>

        <footer className="relative z-10 text-center py-8 text-slate-600 text-sm border-t border-white/5">
          BugBotPro © 2025 — Telegram + WhatsApp Bot
        </footer>
      </div>
    );
  }
  