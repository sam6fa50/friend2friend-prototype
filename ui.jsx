// ── Friend2Friend shared UI ───────────────────────────────────────────────
const { useState, useRef, useEffect } = React;

const GREEN = '#22c55e';
const INK = '#0a0a0a';
const PAPER = '#ffffff';
const BG = '#f4f4f5';

// safe-area paddings for the iOS bezel
const TOP_SAFE = 60;   // clears status bar + dynamic island
const BOT_SAFE = 30;   // clears home indicator

// ── Icons (lucide-style, stroke) ──────────────────────────────────────────
function Icon({ name, size = 24, stroke = 'currentColor', fill = 'none', sw = 2, style }) {
  const p = { fill, stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5" {...p}/><path d="M5 9.5V21h14V9.5" {...p}/></>,
    chat: <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.9 9.9 0 0 1-4.2-.9L3 21l1.4-4.2A8.4 8.4 0 1 1 21 11.5Z" {...p}/>,
    trophy: <><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" {...p}/><path d="M7 5H4v1a3 3 0 0 0 3 3M17 5h3v1a3 3 0 0 1-3 3" {...p}/><path d="M12 13v4M9 21h6M10 17h4l.5 4h-5l.5-4Z" {...p}/></>,
    user: <><circle cx="12" cy="8" r="4" {...p}/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" {...p}/></>,
    pin: <><path d="M12 21s7-5.3 7-11a7 7 0 0 0-14 0c0 5.7 7 11 7 11Z" {...p}/><circle cx="12" cy="10" r="2.5" {...p}/></>,
    heart: <path d="M12 20.5 4.5 13a4.6 4.6 0 0 1 6.5-6.5l1 .9 1-.9A4.6 4.6 0 0 1 19.5 13L12 20.5Z" {...p}/>,
    x: <path d="M6 6l12 12M18 6 6 18" {...p}/>,
    search: <><circle cx="11" cy="11" r="7" {...p}/><path d="m20 20-3.5-3.5" {...p}/></>,
    plus: <path d="M12 5v14M5 12h14" {...p}/>,
    chevL: <path d="M15 5l-7 7 7 7" {...p}/>,
    chevR: <path d="M9 5l7 7-7 7" {...p}/>,
    send: <path d="M4 12 20 4l-5 16-3.5-6.5L4 12Z" {...p}/>,
    crown: <path d="M3 7l4 4 5-7 5 7 4-4-2 12H5L3 7Z" {...p}/>,
    medal: <><circle cx="12" cy="14" r="6" {...p}/><path d="M9 3h6l-1.5 5h-3L9 3Z" {...p}/></>,
    edit: <><path d="M4 20h4L19 9l-4-4L4 16v4Z" {...p}/><path d="M14 6l4 4" {...p}/></>,
    shield: <><path d="M12 3 5 6v6c0 4.4 3 7.5 7 9 4-1.5 7-4.6 7-9V6l-7-3Z" {...p}/></>,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6" {...p}/>,
    arrowDown: <path d="M12 5v14M6 13l6 6 6-6" {...p}/>,
    minus: <path d="M5 12h14" {...p}/>,
    info: <><circle cx="12" cy="12" r="9" {...p}/><path d="M12 11v5M12 8h.01" {...p}/></>,
    settings: <><circle cx="12" cy="12" r="3" {...p}/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3 14a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 7a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.6 2 2 0 1 1 14 3.6a1.6 1.6 0 0 0 2.7-1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.6 1.6 0 0 0 21 10a2 2 0 1 1 0 4Z" {...p}/></>,
    flag: <><path d="M5 21V4M5 4h11l-2 4 2 4H5" {...p}/></>,
    link: <><path d="M9 15l6-6M10 7l1-1a4 4 0 0 1 6 6l-1 1M14 17l-1 1a4 4 0 0 1-6-6l1-1" {...p}/></>,
    compass: <><circle cx="12" cy="12" r="9" {...p}/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" {...p}/></>,
    flame: <path d="M12 3c1 3-2 4-2 7a2 2 0 0 0 4 0c2 2 3 3.5 3 6a5 5 0 0 1-10 0c0-4 4-6 5-13Z" {...p}/>,
    mountain: <path d="m3 20 6-12 4 7 2-3 6 8H3Z" {...p}/>,
    check: <path d="M5 12l5 5 9-11" {...p}/>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" {...p}/><path d="M8 11V8a4 4 0 0 1 8 0v3" {...p}/></>,
    sliders: <><path d="M4 7h10M18 7h2M4 12h2M10 12h10M4 17h6M14 17h6" {...p}/><circle cx="16" cy="7" r="2" {...p}/><circle cx="8" cy="12" r="2" {...p}/><circle cx="12" cy="17" r="2" {...p}/></>,
    zot: <path d="M5 5h11l-9 14h10" {...p}/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={style}>{paths[name]}</svg>;
}

// ── Avatar (charcoal disc w/ initials) ─────────────────────────────────────
function Avatar({ initials, size = 56, dim = false }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: dim ? '#d4d4d8' : INK, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.34, letterSpacing: 0.5,
    }}>{initials}</div>
  );
}

// ── Interest pill ──────────────────────────────────────────────────────────
function Pill({ children, on = true, onRemove, onClick, small = false }) {
  return (
    <div onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: small ? '5px 11px' : '7px 13px', borderRadius: 999,
      background: on ? INK : '#fff', color: on ? '#fff' : INK,
      border: on ? '1px solid ' + INK : '1px solid #d4d4d8',
      fontSize: small ? 12.5 : 13.5, fontWeight: 500, cursor: onClick ? 'pointer' : 'default',
      whiteSpace: 'nowrap', userSelect: 'none',
    }}>
      {children}
      {onRemove && (
        <span onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ display: 'inline-flex', marginRight: -3, opacity: 0.7 }}>
          <Icon name="x" size={14} sw={2.4} />
        </span>
      )}
    </div>
  );
}

// ── Map placeholder (styled, no real tiles) ────────────────────────────────
function MapPlaceholder({ height = 130, label = 'Irvine, CA', radius = false }) {
  return (
    <div style={{
      height, borderRadius: 16, overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(135deg,#eef1ee 0%,#e7ebe7 100%)',
      border: '1px solid #e4e4e7',
    }}>
      {/* faux roads */}
      <svg width="100%" height="100%" viewBox="0 0 300 140" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
        <rect width="300" height="140" fill="#eaf0ea"/>
        <path d="M-10 40 Q120 20 320 70" stroke="#fff" strokeWidth="7" fill="none"/>
        <path d="M-10 110 Q150 90 320 120" stroke="#fff" strokeWidth="5" fill="none"/>
        <path d="M60 -10 Q90 80 50 160" stroke="#fff" strokeWidth="6" fill="none"/>
        <path d="M210 -10 Q190 70 240 160" stroke="#fff" strokeWidth="5" fill="none"/>
        <rect x="95" y="55" width="48" height="34" rx="3" fill="#dde6dd"/>
        <rect x="165" y="78" width="40" height="30" rx="3" fill="#dde6dd"/>
        <rect x="30" y="80" width="34" height="26" rx="3" fill="#dde6dd"/>
      </svg>
      {radius && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: height * 0.92, height: height * 0.92, borderRadius: '50%',
          background: 'rgba(34,197,94,0.14)', border: '1.5px solid ' + GREEN,
        }} />
      )}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-100%)',
        color: INK,
      }}>
        <Icon name="pin" size={26} fill={INK} stroke="#fff" sw={1.5} />
      </div>
      <div style={{
        position: 'absolute', bottom: 8, left: 10, fontSize: 11, fontWeight: 600,
        color: '#52525b', background: 'rgba(255,255,255,0.8)', padding: '2px 7px', borderRadius: 6,
      }}>{label}</div>
    </div>
  );
}

// ── Social icon chips (colored brand glyphs) ───────────────────────────────
function SocialIcon({ kind, on }) {
  const wraps = {
    instagram: 'linear-gradient(45deg,#feda75,#d62976,#962fbf)',
    twitter: '#000', tiktok: '#000', discord: '#5865F2',
  };
  const glyph = {
    instagram: <><rect x="5" y="5" width="14" height="14" rx="4.5" fill="none" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="3.4" fill="none" stroke="#fff" strokeWidth="2"/><circle cx="16.4" cy="7.6" r="1.1" fill="#fff"/></>,
    twitter: <path d="M4 4h3.6l4 5.6L16.5 4H20l-6 7.2L20.5 20h-3.6l-4.4-6L7 20H4l6.4-7.6L4 4Z" fill="#fff"/>,
    tiktok: <path d="M14 4c.4 2.3 1.8 3.7 4 4v2.6c-1.4 0-2.8-.4-4-1.2v4.9a4.9 4.9 0 1 1-4.9-4.9c.3 0 .6 0 .9.1V12a2.4 2.4 0 1 0 1.7 2.3V4H14Z" fill="#fff"/>,
    discord: <path d="M8.5 8.5C10 7.8 14 7.8 15.5 8.5M7 16c1.5 1 8.5 1 10 0M8.2 7.5 7.4 6c-2 .6-3.4 2-3.4 2C2.8 10.5 2.6 13.4 3 16c1.4 1.4 3.4 1.6 3.4 1.6l.7-1.2M15.8 7.5l.8-1.5c2 .6 3.4 2 3.4 2 1.2 2.5 1.4 5.4 1 8-1.4 1.4-3.4 1.6-3.4 1.6l-.7-1.2" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"/>,
  };
  return (
    <div style={{
      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
      background: on ? wraps[kind] : '#f4f4f5',
      border: on ? 'none' : '1px solid #e4e4e7',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: on ? 1 : 0.55,
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" style={{ filter: on ? 'none' : 'grayscale(1)' }}>
        {on ? glyph[kind] : React.cloneElement(glyph[kind], {})}
      </svg>
    </div>
  );
}

// ── Bottom tab bar ─────────────────────────────────────────────────────────
function BottomNav({ tab, onTab }) {
  const tabs = [
    { id: 'discover', icon: 'home' },
    { id: 'messages', icon: 'chat' },
    { id: 'leaderboard', icon: 'trophy' },
    { id: 'profile', icon: 'user' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      paddingBottom: BOT_SAFE, paddingTop: 10,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)', borderTop: '1px solid #ececef',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          background: 'none', border: 'none', padding: '4px 16px', cursor: 'pointer',
          color: tab === t.id ? INK : '#b4b4bb', display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <Icon name={t.icon} size={26} sw={tab === t.id ? 2.3 : 2} fill={tab === t.id && t.id === 'discover' ? INK : 'none'} />
        </button>
      ))}
    </div>
  );
}

// ── Screen header (large title) ────────────────────────────────────────────
function ScreenHeader({ title, right, sub }) {
  return (
    <div style={{ padding: TOP_SAFE + 'px 20px 8px', background: BG }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: -0.5, color: INK }}>{title}</h1>
        {right}
      </div>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 14, color: '#71717a' }}>{sub}</p>}
    </div>
  );
}

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ children, accent }) {
  return (
    <div style={{
      position: 'absolute', top: TOP_SAFE + 6, left: 20, right: 20, zIndex: 90,
      background: accent ? GREEN : INK, color: '#fff', borderRadius: 14,
      padding: '13px 16px', fontSize: 14, fontWeight: 600,
      boxShadow: '0 10px 30px rgba(0,0,0,0.22)',
      display: 'flex', alignItems: 'center', gap: 10,
      animation: 'f2fToast .3s ease',
    }}>{children}</div>
  );
}

Object.assign(window, {
  Icon, Avatar, Pill, MapPlaceholder, SocialIcon, BottomNav, ScreenHeader, Toast,
  F2F_GREEN: GREEN, F2F_INK: INK, F2F_BG: BG, F2F_TOP_SAFE: TOP_SAFE, F2F_BOT_SAFE: BOT_SAFE,
});
