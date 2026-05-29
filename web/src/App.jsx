// ── Friend2Friend — app shell, state, routing ──────────────────────────────
import { useState, useEffect } from 'react'
import { IOSDevice } from './ios.jsx'
import { Onboarding } from './onboarding.jsx'
import { DiscoverScreen } from './discover.jsx'
import { MessagesScreen } from './messages.jsx'
import { LeaderboardScreen } from './leaderboard.jsx'
import { ProfileScreen } from './profile.jsx'
import { Toast, Icon, BottomNav, Avatar, SocialIcon, Pill, F2F_INK, F2F_GREEN } from './ui.jsx'
import { InterestSearchSheet, BlockSheet, ProfileDetailSheet, Sheet } from './sheets.jsx'
import { F2F_CONVERSATIONS, F2F_INVITES, F2F_BADGES } from './data.js'
import { supabase } from './supabaseClient.js'
import { AuthScreen } from './auth.jsx'
import { fetchProfile, saveProfile, fetchInterestsCatalog } from './db.js'

function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem('f2f_onboarded') === '1');
  const [tab, setTab] = useState('discover');
  const [profile, setProfile] = useState(null);          // loaded from Supabase after auth
  const [conversations, setConversations] = useState(F2F_CONVERSATIONS);
  const [invites, setInvites] = useState(F2F_INVITES);
  const [openChatId, setOpenChatId] = useState(null);
  const [blocked, setBlocked] = useState([]);

  // modals
  const [interestSheet, setInterestSheet] = useState(false);
  const [blockTarget, setBlockTarget] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [toast, setToast] = useState(null);

  // auth session
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // interest catalog (from DB; null until loaded)
  const [catalog, setCatalog] = useState(null);

  // load the profile + interest catalog from Supabase whenever the user changes
  useEffect(() => {
    let cancelled = false;
    if (!session?.user) { setProfile(null); setCatalog(null); return; }
    fetchProfile(session.user)
      .then(p => { if (!cancelled) setProfile(p); })
      .catch(err => { console.error('Failed to load profile', err); if (!cancelled) setToast({ text: 'Could not load your profile.' }); });
    fetchInterestsCatalog()
      .then(c => { if (!cancelled) setCatalog(c); })
      .catch(err => console.error('Failed to load interest catalog', err));
    return () => { cancelled = true; };
  }, [session]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  async function finishOnboarding() {
    try { if (profile) await saveProfile(profile); }
    catch (err) { console.error('Failed to save onboarding profile', err); }
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
        {!authReady ? null : !session ? (
          <AuthScreen />
        ) : !profile ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff', color: '#71717a', fontSize: 14 }}>Loading…</div>
        ) : !onboarded ? (
          <Onboarding onDone={finishOnboarding} profile={profile} setProfile={setProfile} />
        ) : (
          <>
            {toast && <Toast accent={toast.accent}>
              {toast.accent && <Icon name="heart" size={18} fill="#fff" stroke="#fff" />} {toast.text}
            </Toast>}

            <div style={{ position: 'absolute', inset: 0 }}>
              {tab === 'discover' && <DiscoverScreen onMatch={matchWith} onOpenProfile={setDetailUser} />}
              {tab === 'messages' && <MessagesScreen
                conversations={conversations} setConversations={setConversations}
                invites={invites} setInvites={setInvites}
                openChatId={openChatId} setOpenChatId={setOpenChatId}
                onBlock={setBlockTarget} />}
              {tab === 'leaderboard' && <LeaderboardScreen blocked={blocked} />}
              {tab === 'profile' && <ProfileScreen profile={profile} setProfile={setProfile}
                onOpenInterests={() => setInterestSheet(true)} onPreview={setPreviewProfile} blocked={blocked}
                onSave={() => saveProfile(profile)} onSignOut={() => supabase.auth.signOut()} />}
            </div>

            {/* hide bottom nav while inside a chat */}
            {!(tab === 'messages' && openChatId) && <BottomNav tab={tab} onTab={(t) => { setTab(t); setOpenChatId(null); }} />}

            {/* sheets */}
            {interestSheet && <InterestSearchSheet selected={profile.interests} catalog={catalog}
              onToggle={toggleInterest} onClose={() => setInterestSheet(false)} />}
            {blockTarget && <BlockSheet target={blockTarget} onConfirm={confirmBlock} onClose={() => setBlockTarget(null)} />}
            {detailUser && <ProfileDetailSheet user={detailUser} onClose={() => setDetailUser(null)}
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
  const INK = F2F_INK, GREEN = F2F_GREEN;
  const equipped = F2F_BADGES.filter(b => profile.equipped?.includes(b.id));
  return (
    <Sheet onClose={onClose} tall title="Preview · as others see you">
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 22px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar initials={profile.initials} size={64} />
          <div>
            <div style={{ fontSize: 21, fontWeight: 700, color: INK }}>{profile.name}, {profile.age}</div>
            {profile.shareLocation && <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#71717a', fontSize: 13.5 }}>
              <Icon name="pin" size={14} stroke="#71717a" /> {profile.region}</div>}
          </div>
        </div>
        {equipped.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {equipped.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0f4f0',
                padding: '5px 11px', borderRadius: 999 }}>
                <Icon name={b.glyph} size={14} stroke={GREEN} />
                <span style={{ fontSize: 12, fontWeight: 600, color: INK }}>{b.name}</span>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 14.5, lineHeight: 1.55, color: '#3f3f46', marginTop: 16 }}>{profile.bio}</p>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 8 }}>Interests</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
          {profile.interests.map(i => <Pill key={i} on>{i}</Pill>)}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {Object.entries(profile.socials).filter(([, v]) => v).map(([k]) => <SocialIcon key={k} kind={k} on />)}
        </div>
      </div>
    </Sheet>
  );
}

export default App
