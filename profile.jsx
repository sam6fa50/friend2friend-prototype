// ── Profile / Bio editor ───────────────────────────────────────────────────
const { useState: useStateP } = React;

function ProfileScreen({ profile, setProfile, onOpenInterests, onPreview, blocked }) {
  const INK = window.F2F_INK, GREEN = window.F2F_GREEN;
  const [saved, setSaved] = useStateP(false);
  const bio = profile.bio;
  const overLimit = bio.length > 255;
  const flagged = window.F2F_BANNED.find(w => bio.toLowerCase().includes(w));
  const canSave = !overLimit && !flagged;

  const set = (k, v) => { setProfile(p => ({ ...p, [k]: v })); setSaved(false); };
  const equippedBadges = window.F2F_BADGES.filter(b => profile.equipped?.includes(b.id));

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: window.F2F_BG }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: window.F2F_BOT_SAFE + 150 }}>
        {/* header */}
        <div style={{ padding: window.F2F_TOP_SAFE + 'px 20px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <window.Avatar initials={profile.initials} size={58} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: INK, letterSpacing: -0.4 }}>Hi, {profile.firstName}!</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#71717a', fontSize: 13 }}>
                <window.Icon name="pin" size={13} stroke="#71717a" /> {profile.region}
              </div>
            </div>
            <window.Icon name="edit" size={22} stroke="#71717a" />
          </div>
        </div>

        <div style={{ padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* BIO */}
          <Section label="Bio">
            <textarea value={bio} onChange={e => set('bio', e.target.value)} rows={4}
              style={{ width: '100%', boxSizing: 'border-box', border: '1px solid ' + (flagged ? '#fca5a5' : '#e4e4e7'),
              borderRadius: 14, padding: '12px 14px', fontSize: 14.5, lineHeight: 1.5, resize: 'none',
              outline: 'none', fontFamily: 'inherit', background: '#fff', color: INK }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
              {flagged
                ? <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 12.5, fontWeight: 600 }}>
                    <window.Icon name="info" size={15} stroke="#dc2626" /> Inappropriate content detected</span>
                : <span style={{ fontSize: 12, color: '#a1a1aa' }}>Keep it catchy — others see this first</span>}
              <span style={{ fontSize: 12, fontWeight: 600, color: overLimit ? '#dc2626' : '#a1a1aa' }}>{bio.length}/255</span>
            </div>
          </Section>

          {/* SOCIAL */}
          <Section label="Social media">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {['instagram', 'twitter', 'tiktok', 'discord'].map(k => (
                <div key={k} onClick={() => set('socials', { ...profile.socials, [k]: !profile.socials[k] })} style={{ cursor: 'pointer' }}>
                  <window.SocialIcon kind={k} on={profile.socials[k]} />
                </div>
              ))}
              <div style={{ width: 46, height: 46, borderRadius: 12, border: '1.5px dashed #cbd5d8',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <window.Icon name="plus" size={22} stroke="#a1a1aa" />
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: '#a1a1aa', marginTop: 8 }}>Tap to connect · highlighted accounts are visible on your profile</div>
          </Section>

          {/* INTERESTS */}
          <Section label="Interests" right={<span style={{ fontSize: 12.5, color: '#a1a1aa' }}>{profile.interests.length}/20</span>}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {profile.interests.map(i => (
                <window.Pill key={i} on onRemove={() => set('interests', profile.interests.filter(x => x !== i))}>{i}</window.Pill>
              ))}
              <div onClick={onOpenInterests} style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 999, border: '1px dashed #cbd5d8', background: '#fff',
                fontSize: 13.5, fontWeight: 600, color: '#52525b', cursor: 'pointer' }}>
                <window.Icon name="plus" size={15} stroke="#52525b" /> See more
              </div>
            </div>
          </Section>

          {/* LOCATION */}
          <Section label="Location" right={
            <div onClick={() => set('shareLocation', !profile.shareLocation)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <span style={{ fontSize: 12.5, color: '#71717a', fontWeight: 600 }}>Share</span>
              <window.Toggle on={profile.shareLocation} />
            </div>}>
            <window.MapPlaceholder height={120} label={profile.region} radius={profile.shareLocation} />
          </Section>

          {/* RADIUS */}
          <Section label="Visibility radius"
            right={<span style={{ fontSize: 14, fontWeight: 700, color: INK }}>{profile.radius} mi</span>}>
            <RangeSlider value={profile.radius} min={5} max={150} onChange={v => set('radius', v)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#a1a1aa', marginTop: 2 }}>
              <span>5 mi</span><span>150 mi</span>
            </div>
          </Section>

          {/* BADGES */}
          <Section label="Badges" right={<span style={{ fontSize: 12.5, color: '#a1a1aa' }}>{equippedBadges.length}/5 equipped</span>}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {window.F2F_BADGES.map(b => {
                const equipped = profile.equipped?.includes(b.id);
                return (
                  <div key={b.id} onClick={() => {
                    if (!b.earned) return;
                    setProfile(p => {
                      const has = p.equipped.includes(b.id);
                      if (has) return { ...p, equipped: p.equipped.filter(x => x !== b.id) };
                      if (p.equipped.length >= 5) return p;
                      return { ...p, equipped: [...p.equipped, b.id] };
                    });
                  }} style={{
                    border: '1px solid ' + (equipped ? INK : '#ececef'), borderRadius: 14, padding: '12px 8px',
                    textAlign: 'center', background: equipped ? INK : '#fff', cursor: b.earned ? 'pointer' : 'default',
                    opacity: b.earned ? 1 : 0.5, position: 'relative',
                  }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', margin: '0 auto 6px',
                      background: equipped ? 'rgba(255,255,255,0.15)' : (b.earned ? '#f0f4f0' : '#f4f4f5'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <window.Icon name={b.earned ? b.glyph : 'lock'} size={20}
                        stroke={equipped ? '#fff' : (b.earned ? GREEN : '#a1a1aa')} />
                    </div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: equipped ? '#fff' : INK }}>{b.name}</div>
                    <div style={{ fontSize: 9.5, color: equipped ? 'rgba(255,255,255,0.6)' : '#a1a1aa', marginTop: 1, lineHeight: 1.2 }}>{b.sub}</div>
                  </div>
                );
              })}
            </div>
          </Section>

          {/* LEADERBOARD RANKING */}
          <Section label="Leaderboard ranking">
            <div style={{ background: '#fff', border: '1px solid #ececef', borderRadius: 14, overflow: 'hidden' }}>
              {[['National', '6,738 / 7,656,767'], ['California', '1,670 / 106,706'], ['Within radius', '67 / 9,677']].map(([k, v], i) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px',
                  borderBottom: i < 2 ? '1px solid #f4f4f5' : 'none', fontSize: 14 }}>
                  <span style={{ color: '#52525b' }}>{k}</span>
                  <span style={{ fontWeight: 700, color: INK }}>{v}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* sticky save bar */}
      <div style={{ position: 'absolute', bottom: window.F2F_BOT_SAFE + 62, left: 0, right: 0,
        padding: '12px 20px', background: 'linear-gradient(to top,#f4f4f5 70%,rgba(244,244,245,0))',
        display: 'flex', gap: 10 }}>
        <button onClick={() => onPreview(profile)} style={{ flex: 1, padding: '14px', borderRadius: 14,
          border: '1px solid #d4d4d8', background: '#fff', fontWeight: 700, fontSize: 14.5, color: INK, cursor: 'pointer' }}>
          Preview
        </button>
        <button onClick={() => canSave && setSaved(true)} disabled={!canSave} style={{ flex: 1, padding: '14px',
          borderRadius: 14, border: 'none', background: canSave ? INK : '#d4d4d8', color: '#fff',
          fontWeight: 700, fontSize: 14.5, cursor: canSave ? 'pointer' : 'not-allowed',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          {saved && <window.Icon name="check" size={18} stroke="#fff" />}
          {saved ? 'Saved' : 'Save profile'}
        </button>
      </div>
    </div>
  );
}

function Section({ label, right, children }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.3 }}>{label}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

function RangeSlider({ value, min, max, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  const GREEN = window.F2F_GREEN, INK = window.F2F_INK;
  return (
    <div style={{ padding: '6px 0' }}>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)}
        style={{ width: '100%', accentColor: INK, height: 6 }} />
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
