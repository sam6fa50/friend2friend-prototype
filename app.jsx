// ── Friend2Friend — app shell, state, routing ──────────────────────────────
const { useState: useStateA, useEffect: useEffectA } = React;

function App() {
  const [onboarded, setOnboarded] = useStateA(() => localStorage.getItem('f2f_onboarded') === '1');
  const [tab, setTab] = useStateA('discover');
  const [profile, setProfile] = useStateA(() => ({
    ...window.F2F_ME,
    equipped: ['pioneer', 'connector', 'streak'],
  }));
  const [conversations, setConversations] = useStateA(window.F2F_CONVERSATIONS);
  const [invites, setInvites] = useStateA(window.F2F_INVITES);
  const [openChatId, setOpenChatId] = useStateA(null);
  const [blocked, setBlocked] = useStateA([]);

  // modals
  const [interestSheet, setInterestSheet] = useStateA(false);
  const [blockTarget, setBlockTarget] = useStateA(null);
  const [detailUser, setDetailUser] = useStateA(null);
  const [previewProfile, setPreviewProfile] = useStateA(null);
  const [toast, setToast] = useStateA(null);

  const INK = window.F2F_INK, GREEN = window.F2F_GREEN;

  useEffectA(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function finishOnboarding() {
    localStorage.setItem('f2f_onboarded', '1');
    setOnboarded(true);
  }

  function matchWith(user) {
    setToast({ accent: true, text: `It's a match with ${user.name.split(' ')[0]}! Say hi 👋` });
    const id = 'c-' + user.id;
    setConversations(prev => prev.some(c => c.id === id) ? prev : [{
      id, name: user.name, initials: user.initials, distance: user.distance,
      shared: user.shared || user.interests.slice(0, 2), unread: 0, time: 'now',
      messages: [{ from: 'them', text: `Hey! We matched on ${(user.shared || user.interests)[0]} 🎉`, time: 'now' }],
    }, ...prev]);
  }

  function messageFromDetail(user) {
    matchWith(user);
    setDetailUser(null);
    setTab('messages');
    setOpenChatId('c-' + user.id);
  }

  function confirmBlock(target, scopes) {
    setBlocked(prev => prev.includes(target.name) ? prev : [...prev, target.name]);
    setConversations(prev => prev.filter(c => c.name !== target.name));
    setBlockTarget(null);
    setDetailUser(null);
    if (openChatId && conversations.find(c => c.id === openChatId)?.name === target.name) setOpenChatId(null);
    setToast({ text: `${target.name.split(' ')[0]} has been blocked` });
  }

  function toggleInterest(name, add) {
    setProfile(p => ({ ...p, interests: add ? [...new Set([...p.interests, name])] : p.interests.filter(x => x !== name) }));
  }

  return (
    <IOSDevice>
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {!onboarded ? (
          <Onboarding onDone={finishOnboarding} profile={profile} setProfile={setProfile} />
        ) : (
          <>
            {toast && <window.Toast accent={toast.accent}>
              {toast.accent && <window.Icon name="heart" size={18} fill="#fff" stroke="#fff" />} {toast.text}
            </window.Toast>}

            <div style={{ position: 'absolute', inset: 0 }}>
              {tab === 'discover' && <window.DiscoverScreen onMatch={matchWith} onOpenProfile={setDetailUser} />}
              {tab === 'messages' && <window.MessagesScreen
                conversations={conversations} setConversations={setConversations}
                invites={invites} setInvites={setInvites}
                openChatId={openChatId} setOpenChatId={setOpenChatId}
                onBlock={setBlockTarget} />}
              {tab === 'leaderboard' && <window.LeaderboardScreen blocked={blocked} />}
              {tab === 'profile' && <window.ProfileScreen profile={profile} setProfile={setProfile}
                onOpenInterests={() => setInterestSheet(true)} onPreview={setPreviewProfile} blocked={blocked} />}
            </div>

            {/* hide bottom nav while inside a chat */}
            {!(tab === 'messages' && openChatId) && <window.BottomNav tab={tab} onTab={(t) => { setTab(t); setOpenChatId(null); }} />}

            {/* sheets */}
            {interestSheet && <window.InterestSearchSheet selected={profile.interests}
              onToggle={toggleInterest} onClose={() => setInterestSheet(false)} />}
            {blockTarget && <window.BlockSheet target={blockTarget} onConfirm={confirmBlock} onClose={() => setBlockTarget(null)} />}
            {detailUser && <window.ProfileDetailSheet user={detailUser} onClose={() => setDetailUser(null)}
              onBlock={setBlockTarget} onMessage={messageFromDetail} />}
            {previewProfile && <PreviewSheet profile={previewProfile} onClose={() => setPreviewProfile(null)} />}
          </>
        )}
      </div>
    </IOSDevice>
  );
}

// read-only "as others see it" preview
function PreviewSheet({ profile, onClose }) {
  const INK = window.F2F_INK, GREEN = window.F2F_GREEN;
  const equipped = window.F2F_BADGES.filter(b => profile.equipped?.includes(b.id));
  return (
    <window.Sheet onClose={onClose} tall title="Preview · as others see you">
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <window.Avatar initials={profile.initials} size={64} />
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: INK }}>{profile.name}, {profile.age}</div>
            {profile.shareLocation && <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#71717a', fontSize: 13.5 }}>
              <window.Icon name="pin" size={14} stroke="#71717a" /> {profile.region}</div>}
          </div>
        </div>
        {equipped.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {equipped.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0f4f0',
                padding: '5px 11px', borderRadius: 999 }}>
                <window.Icon name={b.glyph} size={14} stroke={GREEN} />
                <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{b.name}</span>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: '#3f3f46', marginTop: 16 }}>{profile.bio}</p>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 8 }}>Interests</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
          {profile.interests.map(i => <window.Pill key={i} on>{i}</window.Pill>)}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {Object.entries(profile.socials).filter(([, v]) => v).map(([k]) => <window.SocialIcon key={k} kind={k} on />)}
        </div>
      </div>
    </window.Sheet>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
