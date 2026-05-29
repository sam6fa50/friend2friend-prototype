// ── Discover — Tinder-style swipe ──────────────────────────────────────────
import { useState, useRef } from 'react'
import { ScreenHeader, Icon, Avatar, Pill, F2F_INK, F2F_GREEN, F2F_BG, F2F_BOT_SAFE } from './ui.jsx'
import { F2F_DISCOVER } from './data.js'

export function DiscoverScreen({ onMatch, onOpenProfile }) {
  const deck = F2F_DISCOVER;
  const [idx, setIdx] = useState(0);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState(null); // {dir}
  const start = useRef(null);

  const current = deck[idx];

  function commit(dir) {
    setLeaving(dir);
    setDrag({ x: 0, y: 0, active: false });
    const liked = dir === 'right';
    if (liked && current) onMatch(current);
    setTimeout(() => {
      setIdx(i => i + 1);
      setLeaving(null);
    }, 280);
  }

  function onDown(e) {
    if (leaving) return;
    start.current = { x: e.clientX, y: e.clientY };
    setDrag(d => ({ ...d, active: true }));
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onMove(e) {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  }
  function onUp() {
    if (!start.current) return;
    const { x } = drag;
    start.current = null;
    if (x > 95) commit('right');
    else if (x < -95) commit('left');
    else setDrag({ x: 0, y: 0, active: false });
  }

  const INK = F2F_INK, GREEN = F2F_GREEN;
  const rot = drag.x / 18;
  const likeOp = Math.max(0, Math.min(1, drag.x / 90));
  const nopeOp = Math.max(0, Math.min(1, -drag.x / 90));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: F2F_BG }}>
      <ScreenHeader title="Discover" />

      {/* card area */}
      <div style={{ flex: 1, position: 'relative', margin: '6px 18px 0' }}>
        {!current && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 30 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e7eae7',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Icon name="compass" size={30} stroke="#71717a" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: INK }}>You're all caught up</div>
            <p style={{ fontSize: 13.5, color: '#71717a', maxWidth: 220, lineHeight: 1.5 }}>
              Widen your visibility radius or add interests to discover more people nearby.
            </p>
            <button onClick={() => setIdx(0)} style={btnGhost}>Start over</button>
          </div>
        )}

        {/* next card peeking */}
        {deck[idx + 1] && (
          <DiscoverCard data={deck[idx + 1]} style={{ transform: 'scale(0.95) translateY(10px)', opacity: 0.6 }} />
        )}

        {/* top card */}
        {current && (
          <DiscoverCard
            data={current}
            onTapInfo={() => onOpenProfile(current)}
            top
            style={{
              transform: leaving
                ? `translateX(${leaving === 'right' ? 600 : -600}px) rotate(${leaving === 'right' ? 22 : -22}deg)`
                : `translate(${drag.x}px, ${drag.y * 0.4}px) rotate(${rot}deg)`,
              transition: drag.active ? 'none' : 'transform .28s cubic-bezier(.2,.7,.3,1)',
              cursor: drag.active ? 'grabbing' : 'grab',
            }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            likeOp={likeOp} nopeOp={nopeOp}
          />
        )}
      </div>

      {/* actions */}
      {current && (
        <div style={{ paddingBottom: F2F_BOT_SAFE + 78, paddingTop: 14, display: 'flex',
          flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 34, alignItems: 'center' }}>
            <button onClick={() => commit('left')} style={{ ...roundBtn, border: '1.5px solid #d4d4d8', background: '#fff' }}>
              <Icon name="x" size={28} stroke="#52525b" sw={2.6} />
            </button>
            <button onClick={() => commit('right')} style={{ ...roundBtn, width: 72, height: 72, background: INK }}>
              <Icon name="heart" size={32} fill="#fff" stroke="#fff" />
            </button>
          </div>
          <div style={{ fontSize: 12.5, color: '#a1a1aa', fontWeight: 500 }}>{idx + 1} of {deck.length}</div>
        </div>
      )}
    </div>
  );
}

function DiscoverCard({ data, style, top, onTapInfo, likeOp = 0, nopeOp = 0, ...handlers }) {
  const INK = F2F_INK, GREEN = F2F_GREEN;
  return (
    <div {...handlers} style={{
      position: 'absolute', inset: 0, borderRadius: 26, background: '#fff',
      boxShadow: '0 18px 50px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.05)',
      border: '1px solid #ececef', overflow: 'hidden', touchAction: 'none',
      display: 'flex', flexDirection: 'column', ...style,
    }}>
      {/* LIKE / NOPE stamps */}
      {top && (
        <>
          <Stamp text="CONNECT" color={GREEN} op={likeOp} left />
          <Stamp text="PASS" color="#71717a" op={nopeOp} />
        </>
      )}
      <div style={{ padding: '22px 22px 0', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Avatar initials={data.initials} size={70} />
          <div style={{ background: GREEN, color: '#fff', fontWeight: 700, fontSize: 13,
            padding: '6px 12px', borderRadius: 999 }}>{data.match}% Match</div>
        </div>
        <h2 style={{ margin: '18px 0 4px', fontSize: 23, fontWeight: 700, color: INK }}>{data.name}, {data.age}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#71717a', fontSize: 14 }}>
          <Icon name="pin" size={15} stroke="#71717a" /> {data.distance}
        </div>
        <p style={{ margin: '14px 0 0', fontSize: 14.5, lineHeight: 1.55, color: '#3f3f46' }}>{data.bio}</p>
        <div style={{ marginTop: 18, fontSize: 13, fontWeight: 600, color: '#71717a' }}>Interests</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
          {data.interests.map(i => <Pill key={i} small on={data.shared?.includes(i)}>{i}</Pill>)}
        </div>
      </div>
      <div style={{ borderTop: '1px solid #f0f0f2', margin: '14px 0 0', padding: '12px 22px',
        display: 'flex', alignItems: 'center', gap: 8, color: '#71717a', cursor: 'pointer' }}
        onClick={(e) => { e.stopPropagation(); onTapInfo?.(); }}>
        <Icon name="info" size={17} stroke="#a1a1aa" />
        <span style={{ fontSize: 12.5 }}>Tap for full profile · you share <b style={{ color: INK }}>{data.shared?.length}</b> interest{data.shared?.length === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
}

function Stamp({ text, color, op, left }) {
  return (
    <div style={{
      position: 'absolute', top: 30, [left ? 'left' : 'right']: 22, zIndex: 5,
      transform: `rotate(${left ? -16 : 16}deg)`, opacity: op,
      border: `3px solid ${color}`, color, borderRadius: 10,
      padding: '4px 12px', fontWeight: 800, fontSize: 22, letterSpacing: 1,
      pointerEvents: 'none',
    }}>{text}</div>
  );
}

const roundBtn = { width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer', boxShadow: '0 6px 18px rgba(0,0,0,0.12)', border: 'none' };
const btnGhost = { marginTop: 16, padding: '10px 20px', borderRadius: 999, border: '1px solid #d4d4d8',
  background: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', color: '#0a0a0a' };
