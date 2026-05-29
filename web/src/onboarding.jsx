// ── Onboarding / first launch ──────────────────────────────────────────────
import { useState } from 'react'
import { Icon, Pill, MapPlaceholder, F2F_INK, F2F_GREEN, F2F_TOP_SAFE, F2F_BOT_SAFE } from './ui.jsx'
import { F2F_POPULAR } from './data.js'

export function Onboarding({ onDone, profile, setProfile }) {
  const [step, setStep] = useState(0);
  const INK = F2F_INK, GREEN = F2F_GREEN;
  const total = 3;

  const next = () => step < total - 1 ? setStep(step + 1) : onDone();

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ height: F2F_TOP_SAFE }} />
      {/* progress */}
      <div style={{ display: 'flex', gap: 6, padding: '0 24px 8px' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999, background: i <= step ? INK : '#e4e4e7', transition: 'background .3s' }} />
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {step === 0 && (
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: 84, height: 84, borderRadius: 24, background: INK, margin: '0 auto 22px',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="zot" size={44} stroke="#fff" sw={2.4} />
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: INK, margin: '0 0 10px', letterSpacing: -0.6 }}>Friend2Friend</h1>
            <p style={{ fontSize: 15.5, color: '#52525b', lineHeight: 1.55, margin: 0 }}>
              Meet people nearby who love what you love. Match on shared interests, chat, and climb the leaderboard together.
            </p>
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[['heart', 'Swipe to connect', 'Discover people who share your hobbies'],
                ['pin', 'Stay close', 'Set a radius so matches are always nearby'],
                ['shield', 'You\'re in control', 'Block and hide anyone, anytime']].map(([ic, t, s]) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f0f4f0', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={ic} size={22} stroke={GREEN} />
                  </div>
                  <div><div style={{ fontWeight: 700, fontSize: 14.5, color: INK }}>{t}</div>
                    <div style={{ fontSize: 12.5, color: '#71717a' }}>{s}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 25, fontWeight: 800, color: INK, margin: '6px 0 6px', letterSpacing: -0.4 }}>What are you into?</h2>
            <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 18px' }}>Pick a few interests — you can always change these later. We'll match you with people who share them.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {F2F_POPULAR.map(i => {
                const on = profile.interests.includes(i);
                return <Pill key={i} on={on} onClick={() => setProfile(p => ({ ...p,
                  interests: on ? p.interests.filter(x => x !== i) : [...p.interests, i] }))}>{i}</Pill>;
              })}
            </div>
            <div style={{ marginTop: 16, fontSize: 13, color: '#a1a1aa' }}>{profile.interests.length} selected</div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: 25, fontWeight: 800, color: INK, margin: '6px 0 6px', letterSpacing: -0.4 }}>How far should we look?</h2>
            <p style={{ fontSize: 14, color: '#71717a', margin: '0 0 18px' }}>Only people within your radius — who also include you in theirs — will appear.</p>
            <MapPlaceholder height={170} label={profile.region} radius />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '22px 0 4px' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#52525b' }}>Visibility radius</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: INK }}>{profile.radius} mi</span>
            </div>
            <input type="range" min={5} max={150} value={profile.radius}
              onChange={e => setProfile(p => ({ ...p, radius: +e.target.value }))}
              style={{ width: '100%', accentColor: INK, height: 6 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a1a1aa' }}><span>5 mi</span><span>150 mi</span></div>
          </div>
        )}
      </div>

      <div style={{ padding: `12px 24px ${F2F_BOT_SAFE + 8}px` }}>
        <button onClick={next} disabled={step === 1 && profile.interests.length === 0} style={{
          width: '100%', padding: '15px', borderRadius: 16, border: 'none',
          background: (step === 1 && profile.interests.length === 0) ? '#d4d4d8' : INK,
          color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
          {step === 0 ? 'Get started' : step === total - 1 ? 'Start exploring' : 'Continue'}
        </button>
        {step === 0 && <div style={{ textAlign: 'center', fontSize: 11.5, color: '#a1a1aa', marginTop: 12 }}>
          By continuing you agree to share your interests and approximate location.</div>}
      </div>
    </div>
  );
}
