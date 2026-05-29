// ── Bottom sheets: interest search, blocking, profile detail ───────────────
import { useState } from 'react'
import { Icon, Pill, Avatar, MapPlaceholder, F2F_INK, F2F_GREEN, F2F_BG, F2F_BOT_SAFE } from './ui.jsx'
import { F2F_POPULAR, F2F_NICHE, F2F_BLOCK_SCOPES } from './data.js'

export function Sheet({ children, onClose, title, tall }) {
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 80,
      background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end',
      animation: 'f2fFade .2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', background: '#fff', borderRadius: '24px 24px 0 0',
        maxHeight: tall ? '88%' : '72%', display: 'flex', flexDirection: 'column',
        paddingBottom: F2F_BOT_SAFE, animation: 'f2fSheet .3s cubic-bezier(.2,.8,.3,1)' }}>
        <div style={{ width: 38, height: 5, borderRadius: 999, background: '#d4d4d8', margin: '10px auto 4px' }} />
        {title && <div style={{ padding: '6px 20px 10px', fontSize: 18, fontWeight: 700, color: F2F_INK,
          borderBottom: '1px solid #f0f0f2' }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// ── Interest search ("See More") ────────────────────────────────────────────
export function InterestSearchSheet({ selected, onToggle, onClose }) {
  const [q, setQ] = useState('');
  const [custom, setCustom] = useState('');
  const INK = F2F_INK, GREEN = F2F_GREEN;
  const pool = [...F2F_POPULAR, ...F2F_NICHE].filter((v, i, a) => a.indexOf(v) === i);
  const norm = q.trim().toLowerCase();
  const results = pool.filter(i => i.toLowerCase().includes(norm));
  const exactExists = pool.some(i => i.toLowerCase() === norm);

  function addCustom(name) {
    const n = name.trim();
    if (!n) return;
    const existing = pool.find(i => i.toLowerCase() === n.toLowerCase());
    onToggle(existing || n, true);
    setCustom(''); setQ('');
  }

  return (
    <Sheet onClose={onClose} title="Find an interest" tall>
      <div style={{ padding: '12px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: F2F_BG,
          borderRadius: 12, padding: '10px 14px' }}>
          <Icon name="search" size={18} stroke="#a1a1aa" />
          <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search interests, hobbies…"
            style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontSize: 15 }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 8px' }}>
        {/* create new */}
        {norm && !exactExists && (
          <div onClick={() => addCustom(q)} style={{ display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 4px', cursor: 'pointer', borderBottom: '1px solid #f4f4f5' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: GREEN, display: 'flex',
              alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={20} stroke="#fff" />
            </div>
            <div><div style={{ fontWeight: 600, fontSize: 14.5, color: INK }}>Create "{q.trim()}"</div>
              <div style={{ fontSize: 12, color: '#a1a1aa' }}>Add a custom interest</div></div>
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 12 }}>
          {results.map(i => (
            <Pill key={i} on={selected.includes(i)} onClick={() => onToggle(i, !selected.includes(i))}>{i}</Pill>
          ))}
        </div>
        {results.length === 0 && !norm && <div style={{ color: '#a1a1aa', fontSize: 13, padding: 12 }}>Start typing to search.</div>}
      </div>
      {/* custom add bar */}
      <div style={{ borderTop: '1px solid #f0f0f2', padding: '12px 20px', display: 'flex', gap: 8 }}>
        <input value={custom} onChange={e => setCustom(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addCustom(custom); }}
          placeholder="Add your own…" style={{ flex: 1, border: '1px solid #e4e4e7', borderRadius: 10,
          padding: '10px 14px', fontSize: 14.5, outline: 'none' }} />
        <button onClick={() => addCustom(custom)} style={{ width: 44, borderRadius: 10, border: 'none',
          background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="plus" size={20} stroke="#fff" />
        </button>
      </div>
    </Sheet>
  );
}

// ── Block scope sheet ───────────────────────────────────────────────────────
export function BlockSheet({ target, onConfirm, onClose }) {
  const [scopes, setScopes] = useState({ profile: true, geo: true, messages: true, leaderboard: false });
  const INK = F2F_INK;
  const toggle = id => setScopes(s => ({ ...s, [id]: !s[id] }));
  return (
    <Sheet onClose={onClose}>
      <div style={{ padding: '4px 22px 0', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fee2e2', margin: '4px auto 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="shield" size={26} stroke="#dc2626" />
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, color: INK }}>Block {target.name}?</div>
        <p style={{ fontSize: 13.5, color: '#71717a', lineHeight: 1.5, margin: '6px 0 4px' }}>
          Choose what {target.name.split(' ')[0]} can no longer see or do. They won't be notified.
        </p>
      </div>
      <div style={{ padding: '10px 18px' }}>
        {F2F_BLOCK_SCOPES.map(s => (
          <div key={s.id} onClick={() => toggle(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 6px', cursor: 'pointer', borderBottom: '1px solid #f4f4f5' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14.5, color: INK }}>{s.label}</div>
              <div style={{ fontSize: 12, color: '#a1a1aa' }}>{s.sub}</div>
            </div>
            <Toggle on={scopes[s.id]} />
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 18px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={() => onConfirm(target, scopes)} style={{ padding: '14px', borderRadius: 14, border: 'none',
          background: '#dc2626', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Confirm block</button>
        <button onClick={onClose} style={{ padding: '12px', borderRadius: 14, border: 'none', background: 'transparent',
          color: '#71717a', fontWeight: 600, fontSize: 14.5, cursor: 'pointer' }}>Cancel</button>
      </div>
    </Sheet>
  );
}

// ── Profile detail (viewing another user from Discover) ─────────────────────
export function ProfileDetailSheet({ user, onClose, onBlock, onMessage }) {
  const INK = F2F_INK, GREEN = F2F_GREEN;
  return (
    <Sheet onClose={onClose} tall>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar initials={user.initials} size={64} />
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: INK }}>{user.name}, {user.age}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#71717a', fontSize: 13.5 }}>
              <Icon name="pin" size={14} stroke="#71717a" /> {user.distance}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', background: GREEN, color: '#fff', fontWeight: 700, fontSize: 12.5,
            padding: '5px 11px', borderRadius: 999 }}>{user.match}%</div>
        </div>
        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: '#3f3f46', marginTop: 16 }}>{user.bio}</p>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 8 }}>Interests</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
          {user.interests.map(i => <Pill key={i} on={user.shared?.includes(i)}>{i}</Pill>)}
        </div>
        <MapPlaceholder height={120} label={user.distance + ' · approx.'} />
      </div>
      <div style={{ borderTop: '1px solid #f0f0f2', padding: '12px 18px 0', display: 'flex', gap: 10 }}>
        <button onClick={() => onBlock({ name: user.name, initials: user.initials })} style={{ width: 52, borderRadius: 14,
          border: '1px solid #e4e4e7', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon name="shield" size={20} stroke="#71717a" />
        </button>
        <button onClick={() => onMessage(user)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none',
          background: INK, color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon name="chat" size={18} stroke="#fff" /> Message
        </button>
      </div>
    </Sheet>
  );
}

export function Toggle({ on }) {
  return (
    <div style={{ width: 46, height: 28, borderRadius: 999, background: on ? F2F_GREEN : '#d4d4d8',
      position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 22, height: 22, borderRadius: '50%',
        background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}
