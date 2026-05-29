// ── Leaderboard ────────────────────────────────────────────────────────────
import { useState } from 'react'
import { ScreenHeader, Icon, Avatar, F2F_INK, F2F_GREEN, F2F_BG, F2F_BOT_SAFE } from './ui.jsx'

export function LeaderboardScreen({ profile, board = [], blocked }) {
  const me = profile, INK = F2F_INK, GREEN = F2F_GREEN;
  const [scope, setScope] = useState('Nearby');
  const [hidden, setHidden] = useState([]); // blocked names the user chose to hide
  const myRank = board.findIndex(p => p.id === profile.id) + 1; // 0 = not on board

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: F2F_BG }}>
      <ScreenHeader title="Leaderboard"
        right={<button style={infoBtn}><Icon name="info" size={20} stroke="#71717a" /></button>} />

      {/* scope segmented */}
      <div style={{ display: 'flex', gap: 4, margin: '4px 18px 10px', background: '#e9e9ec', borderRadius: 11, padding: 3 }}>
        {['Nearby', 'California', 'National'].map(s => (
          <button key={s} onClick={() => setScope(s)} style={{
            flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, color: scope === s ? INK : '#71717a',
            background: scope === s ? '#fff' : 'transparent',
            boxShadow: scope === s ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>{s}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: `0 18px ${F2F_BOT_SAFE + 70}px` }}>
        {/* personal card */}
        <div style={{ background: INK, color: '#fff', borderRadius: 22, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', color: INK,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 19 }}>{me.initials}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, opacity: 0.65 }}>Your rank {scope === 'Nearby' ? 'nearby' : 'in ' + scope}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 30, fontWeight: 800 }}>{myRank ? '#' + myRank : '—'}</span>
                <span style={{ fontSize: 13, color: GREEN, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Icon name="arrowUp" size={14} stroke={GREEN} /> +120 this week
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Stat label="Points" value={(me.stats?.points || 0).toLocaleString()} />
            <Stat label="Connections" value={me.stats?.connections || 0} />
            <Stat label="Top interest" value={me.interests?.[0] || '—'} />
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase',
          letterSpacing: 0.4, margin: '4px 4px 10px' }}>Top members {scope === 'Nearby' ? 'in your area' : ''}</div>

        {board.map(p => {
          const isBlocked = blocked.includes(p.name);
          const isHidden = hidden.includes(p.name);
          if (isHidden) return null;
          return (
            <div key={p.rank} onClick={() => isBlocked && setHidden(h => [...h, p.name])} style={{
              display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 16,
              padding: '12px 14px', marginBottom: 8, border: '1px solid #ececef',
              opacity: isBlocked ? 0.45 : 1, cursor: isBlocked ? 'pointer' : 'default',
            }}>
              <RankBadge rank={p.rank} />
              <div style={{ position: 'relative' }}>
                <Avatar initials={p.initials} size={44} dim={isBlocked} />
                {!p.active && !isBlocked && (
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%',
                    background: '#a1a1aa', border: '2px solid #fff' }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: INK }}>{isBlocked ? 'Blocked user' : p.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  {!isBlocked && <>
                    {p.distance && <>
                      <Icon name="pin" size={11} stroke="#a1a1aa" />
                      <span style={{ fontSize: 11.5, color: '#a1a1aa' }}>{p.distance}</span>
                    </>}
                    <span style={{ fontSize: 10.5, fontWeight: 600, background: INK, color: '#fff', padding: '2px 8px', borderRadius: 999 }}>{p.interest}</span>
                  </>}
                  {isBlocked && <span style={{ fontSize: 11.5, color: '#a1a1aa' }}>Tap to hide</span>}
                </div>
              </div>
              {!isBlocked && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: INK }}>{p.points.toLocaleString()}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', fontSize: 11, color: '#a1a1aa' }}>
                    <Icon name="user" size={11} stroke="#a1a1aa" /> {p.connections}
                    <TrendArrow t={p.trend} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 13, padding: '10px 12px' }}>
      <div style={{ fontSize: 16.5, fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 1 }}>{label}</div>
    </div>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <Medal bg="#f5c542" icon="crown" iconColor="#7a5b00" />;
  if (rank === 2) return <Medal bg="#cfd4da" icon="medal" iconColor="#5b6470" />;
  if (rank === 3) return <Medal bg="#e0a06a" icon="medal" iconColor="#7a4a1f" />;
  return <div style={{ width: 30, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#a1a1aa' }}>{rank}</div>;
}
function Medal({ bg, icon, iconColor }) {
  return (
    <div style={{ width: 30, height: 30, borderRadius: '50%', background: bg, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name={icon} size={17} fill={iconColor} stroke={iconColor} sw={1.4} />
    </div>
  );
}
function TrendArrow({ t }) {
  const GREEN = F2F_GREEN;
  if (t === 'up') return <Icon name="arrowUp" size={13} stroke={GREEN} />;
  if (t === 'down') return <Icon name="arrowDown" size={13} stroke="#ef4444" />;
  return <Icon name="minus" size={13} stroke="#a1a1aa" />;
}

const infoBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginBottom: 4 };
