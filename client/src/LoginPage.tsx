import { useState } from 'react';
import { ArrowRight, Compass, Leaf, LogIn, Sprout } from 'lucide-react';
import './login.css';

export default function LoginPage() {
  const [message, setMessage] = useState('');

  return <div className="app-shell login-shell">
    <a className="skip-link" href="#login-main">本文へ移動</a>
    <header className="site-header">
      <div className="header-inner">
        <div className="brand" aria-label="AtRogaining"><Compass size={31} strokeWidth={1.5}/><span>AtRogaining<span className="brand-sub">ROGAINING FIELD NOTES</span></span></div>
        <div className="event-name"><span className="live-dot"/> YOYOGI ROGAINING <span className="edition">2026 / AUTUMN</span></div>
        <span className="demo-tag">DEMO</span>
      </div>
    </header>

    <main id="login-main" className="login-main">
      <section className="login-intro" aria-labelledby="login-welcome">
        <span className="eyebrow">YOUR NEXT DISCOVERY</span>
        <h1 id="login-welcome">いつもの街に、<br/>新しい発見を。</h1>
        <p>歩いて、見つけて、仲間とつながる。<br/>今日の寄り道を、特別な思い出に。</p>
        <div className="login-field-art" aria-hidden="true">
          <svg viewBox="0 0 480 190" fill="none"><circle cx="365" cy="44" r="24" fill="#e9dfc5"/><path d="M0 120Q85 60 170 115T350 100T480 110V190H0Z" fill="#d2d9bf"/><path d="M0 160Q130 90 240 145T480 140V190H0Z" fill="#b7c5a3"/><path d="M120 190Q155 155 226 152T300 106" stroke="#eee6d0" strokeWidth="18"/><path d="M370 150V70" stroke="#71825f" strokeWidth="5"/><path d="M370 32L338 112H402Z" fill="#81946a"/><path d="M412 162V112" stroke="#71825f" strokeWidth="4"/><path d="M412 77L387 139H437Z" fill="#93a27b"/><path d="M275 108V58" stroke="#71825f" strokeWidth="3"/><path d="M276 58L304 66L276 78Z" fill="#ac7855"/></svg>
          <span>YOYOGI FIELD / TOKYO</span>
        </div>
        <div className="login-field-note"><Leaf size={16}/><span>歩いた分だけ、街が好きになる。</span></div>
      </section>

      <section className="login-panel" aria-labelledby="login-title">
        <span className="eyebrow">01 / SIGN IN</span>
        <div className="login-emblem" aria-hidden="true"><Sprout size={36} strokeWidth={1.3}/></div>
        <h2 id="login-title">ログイン</h2>
        <p className="login-description">あなたのアカウントで、<br/>今日の冒険をはじめましょう。</p>
        <button type="button" className="button primary login-button" aria-describedby="login-help" onClick={() => setMessage('ログイン機能は準備中です。')}><LogIn size={19}/><span>AT Protocolでログイン</span><ArrowRight size={18}/></button>
        <p id="login-help" className="login-help">AT Protocolのアカウントを使用します。</p>
        <p className="login-message" role="status">{message || '\u00a0'}</p>
        <div className="login-panel-footer"><Compass size={15}/><span>一歩先に、まだ知らない景色。</span></div>
      </section>
    </main>

    <footer className="site-footer"><span><Compass size={17}/> AtRogaining <small>歩いた分だけ、街が好きになる。</small></span><span>YOYOGI, TOKYO <span className="footer-dot">·</span> デモ大会</span></footer>
  </div>;
}
