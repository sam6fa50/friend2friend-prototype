// ── Messages — DM list, chat view, invites ─────────────────────────────────
const { useState: useStateM, useRef: useRefM, useEffect: useEffectM } = React;

function MessagesScreen({ conversations, setConversations, invites, setInvites, openChatId, setOpenChatId, onBlock }) {
  const [seg, setSeg] = useStateM('chats');
  const INK = window.F2F_INK, GREEN = window.F2F_GREEN;

  const open = conversations.find(c => c.id === openChatId);
  if (open) {
    return <ChatView convo={open} conversations={conversations} setConversations={setConversations}
      onBack={() => setOpenChatId(null)} onBlock={onBlock} />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: window.F2F_BG }}>
      <window.ScreenHeader title="Messages" />
      {/* segmented control */}
      <div style={{ display: 'flex', gap: 4, margin: '4px 18px 8px', background: '#e9e9ec',
        borderRadius: 11, padding: 3 }}>
        {[['chats', 'Chats'], ['invites', `Invites${invites.length ? ' · ' + invites.length : ''}`]].map(([id, label]) => (
          <button key={id} onClick={() => setSeg(id)} style={{
            flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 13.5, fontWeight: 600, color: seg === id ? INK : '#71717a',
            background: seg === id ? '#fff' : 'transparent',
            boxShadow: seg === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: window.F2F_BOT_SAFE + 70 }}>
        {seg === 'chats' && conversations.map(c => (
          <div key={c.id} onClick={() => setOpenChatId(c.id)} style={rowStyle}>
            <window.Avatar initials={c.initials} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, fontSize: 15.5, color: INK }}>{c.name}</span>
                <span style={{ fontSize: 12, color: c.unread ? GREEN : '#a1a1aa', fontWeight: c.unread ? 700 : 400 }}>{c.time}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '3px 0 5px' }}>
                <window.Icon name="pin" size={12} stroke="#a1a1aa" />
                <span style={{ fontSize: 11.5, color: '#a1a1aa' }}>{c.distance}</span>
                {c.shared.slice(0, 2).map(s => (
                  <span key={s} style={{ fontSize: 10.5, fontWeight: 600, background: INK, color: '#fff',
                    padding: '2px 8px', borderRadius: 999 }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, color: c.unread ? INK : '#71717a', fontWeight: c.unread ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.messages[c.messages.length - 1].text}
                </span>
                {c.unread > 0 && (
                  <span style={{ flexShrink: 0, minWidth: 20, height: 20, borderRadius: 999, background: GREEN,
                    color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: '0 6px' }}>{c.unread}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {seg === 'invites' && (
          invites.length === 0 ? (
            <EmptyNote icon="chat" title="No pending invites" sub="When someone nearby wants to chat, their request shows up here." />
          ) : invites.map(iv => (
            <div key={iv.id} style={{ ...rowStyle, alignItems: 'flex-start', cursor: 'default' }}>
              <window.Avatar initials={iv.initials} size={52} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15.5, color: INK }}>{iv.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '3px 0' }}>
                  <window.Icon name="pin" size={12} stroke="#a1a1aa" />
                  <span style={{ fontSize: 11.5, color: '#a1a1aa' }}>{iv.distance}</span>
                  {iv.shared.map(s => (
                    <span key={s} style={{ fontSize: 10.5, fontWeight: 600, background: INK, color: '#fff',
                      padding: '2px 8px', borderRadius: 999 }}>{s}</span>
                  ))}
                </div>
                <div style={{ fontSize: 13, color: '#71717a', marginBottom: 9 }}>{iv.note}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => {
                    setInvites(p => p.filter(x => x.id !== iv.id));
                    setConversations(p => [{ id: 'c-' + iv.id, name: iv.name, initials: iv.initials,
                      distance: iv.distance, shared: iv.shared, unread: 0, time: 'now',
                      messages: [{ from: 'them', text: 'Hey! Thanks for accepting 🙌', time: 'now' }] }, ...p]);
                  }} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: INK,
                    color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>Accept</button>
                  <button onClick={() => setInvites(p => p.filter(x => x.id !== iv.id))}
                    style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid #d4d4d8',
                    background: '#fff', color: '#52525b', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>Decline</button>
                </div>
              </div>
            </div>
          ))
        )}

        {seg === 'chats' && conversations.length === 0 && (
          <EmptyNote icon="chat" title="No conversations yet" sub="Connect with someone in Discover to start chatting." />
        )}
      </div>
    </div>
  );
}

function ChatView({ convo, conversations, setConversations, onBack, onBlock }) {
  const [text, setText] = useStateM('');
  const [menu, setMenu] = useStateM(false);
  const scroller = useRefM(null);
  const INK = window.F2F_INK, GREEN = window.F2F_GREEN;

  useEffectM(() => {
    // mark read
    setConversations(p => p.map(c => c.id === convo.id ? { ...c, unread: 0 } : c));
  }, [convo.id]);
  useEffectM(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; });

  function send() {
    const t = text.trim();
    if (!t) return;
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    setConversations(p => p.map(c => c.id === convo.id
      ? { ...c, time: 'now', messages: [...c.messages, { from: 'me', text: t, time: now }] } : c));
    setText('');
    // canned reply
    setTimeout(() => {
      setConversations(p => p.map(c => c.id === convo.id
        ? { ...c, messages: [...c.messages, { from: 'them', text: pickReply(t), time: now }] } : c));
    }, 1100);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: window.F2F_BG }}>
      {/* chat header */}
      <div style={{ paddingTop: window.F2F_TOP_SAFE - 14, paddingBottom: 12, background: '#fff',
        borderBottom: '1px solid #ececef', display: 'flex', alignItems: 'center', gap: 10, padding: `${window.F2F_TOP_SAFE - 14}px 14px 12px`, position: 'relative' }}>
        <button onClick={onBack} style={iconBtn}><window.Icon name="chevL" size={26} stroke={INK} /></button>
        <window.Avatar initials={convo.initials} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: INK }}>{convo.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#a1a1aa' }}>
            <window.Icon name="pin" size={11} stroke="#a1a1aa" /> {convo.distance} · shares {convo.shared.join(', ')}
          </div>
        </div>
        <button onClick={() => setMenu(m => !m)} style={iconBtn}>
          <svg width="22" height="6" viewBox="0 0 22 6"><circle cx="3" cy="3" r="2.5" fill="#71717a"/><circle cx="11" cy="3" r="2.5" fill="#71717a"/><circle cx="19" cy="3" r="2.5" fill="#71717a"/></svg>
        </button>
        {menu && (
          <div style={{ position: 'absolute', top: window.F2F_TOP_SAFE + 30, right: 14, zIndex: 30,
            background: '#fff', borderRadius: 14, boxShadow: '0 12px 34px rgba(0,0,0,0.18)', overflow: 'hidden',
            border: '1px solid #ececef', minWidth: 180 }}>
            <MenuItem label="View profile" icon="user" onClick={() => setMenu(false)} />
            <MenuItem label="Block user" icon="shield" danger onClick={() => { setMenu(false); onBlock({ name: convo.name, initials: convo.initials }); }} />
          </div>
        )}
      </div>

      {/* messages */}
      <div ref={scroller} style={{ flex: 1, overflowY: 'auto', padding: '16px 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 8 }}>
        {convo.messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === 'me' ? 'flex-end' : 'flex-start', maxWidth: '76%' }}>
            <div style={{
              padding: '10px 14px', borderRadius: 20, fontSize: 14.5, lineHeight: 1.4,
              background: m.from === 'me' ? INK : '#fff', color: m.from === 'me' ? '#fff' : INK,
              borderBottomRightRadius: m.from === 'me' ? 6 : 20,
              borderBottomLeftRadius: m.from === 'me' ? 20 : 6,
              border: m.from === 'me' ? 'none' : '1px solid #ececef',
            }}>{m.text}</div>
            <div style={{ fontSize: 10.5, color: '#b4b4bb', margin: '3px 6px 0',
              textAlign: m.from === 'me' ? 'right' : 'left' }}>{m.time}</div>
          </div>
        ))}
      </div>

      {/* input */}
      <div style={{ padding: `8px 12px ${window.F2F_BOT_SAFE}px`, background: '#fff', borderTop: '1px solid #ececef',
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="Message…" style={{ flex: 1, border: '1px solid #e4e4e7', borderRadius: 999,
          padding: '11px 16px', fontSize: 14.5, outline: 'none', background: window.F2F_BG }} />
        <button onClick={send} disabled={!text.trim()} style={{
          width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: text.trim() ? INK : '#d4d4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <window.Icon name="send" size={20} fill="#fff" stroke="#fff" sw={1.5} />
        </button>
      </div>
    </div>
  );
}

function MenuItem({ label, icon, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
      fontWeight: 500, color: danger ? '#dc2626' : window.F2F_INK, borderBottom: '1px solid #f4f4f5' }}>
      <window.Icon name={icon} size={18} stroke={danger ? '#dc2626' : '#71717a'} /> {label}
    </button>
  );
}

function EmptyNote({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 40px', color: '#71717a' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e7eae7', margin: '0 auto 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <window.Icon name={icon} size={26} stroke="#a1a1aa" />
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: window.F2F_INK }}>{title}</div>
      <p style={{ fontSize: 13.5, lineHeight: 1.5, maxWidth: 230, margin: '6px auto 0' }}>{sub}</p>
    </div>
  );
}

function pickReply(t) {
  const r = ['Sounds good! 😄', "Let's do it.", 'Haha for sure', 'Nice, what time works?', 'Down! Where should we meet?'];
  return r[Math.floor(Math.random() * r.length)];
}

const rowStyle = { display: 'flex', gap: 12, padding: '12px 18px', cursor: 'pointer',
  borderBottom: '1px solid #ececef', alignItems: 'center', background: 'transparent' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' };

window.MessagesScreen = MessagesScreen;
