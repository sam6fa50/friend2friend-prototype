// ── Messages — DM list, chat view, invites (Supabase-backed) ───────────────
import { useState, useRef, useEffect } from 'react'
import { ScreenHeader, Icon, Avatar, F2F_INK, F2F_GREEN, F2F_BG, F2F_TOP_SAFE, F2F_BOT_SAFE } from './ui.jsx'

export function MessagesScreen({ conversations, invites, openChatId, setOpenChatId, onBlock, onSend, onAcceptInvite, onDeclineInvite, onRefresh }) {
  const [seg, setSeg] = useState('chats');
  const INK = F2F_INK, GREEN = F2F_GREEN;

  const open = conversations.find(c => c.id === openChatId);
  if (open) {
    return <ChatView convo={open} onBack={() => setOpenChatId(null)} onBlock={onBlock}
      onSend={onSend} onRefresh={onRefresh} />;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: F2F_BG }}>
      <ScreenHeader title="Messages" />
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

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: F2F_BOT_SAFE + 70 }}>
        {seg === 'chats' && conversations.map(c => (
          <div key={c.id} onClick={() => setOpenChatId(c.id)} style={rowStyle}>
            <Avatar initials={c.initials} size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 600, fontSize: 15.5, color: INK }}>{c.name}</span>
                <span style={{ fontSize: 12, color: c.unread ? GREEN : '#a1a1aa', fontWeight: c.unread ? 700 : 400 }}>{c.time}</span>
              </div>
              {c.shared?.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '3px 0 5px' }}>
                  {c.shared.slice(0, 2).map(s => (
                    <span key={s} style={{ fontSize: 10.5, fontWeight: 600, background: INK, color: '#fff',
                      padding: '2px 8px', borderRadius: 999 }}>{s}</span>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 13.5, color: c.unread ? INK : '#71717a', fontWeight: c.unread ? 600 : 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.messages.length ? c.messages[c.messages.length - 1].text : 'Say hi 👋'}
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
              <Avatar initials={iv.initials} size={52} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15.5, color: INK }}>{iv.name}</div>
                <div style={{ fontSize: 13, color: '#71717a', margin: '3px 0 9px' }}>{iv.note}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onAcceptInvite(iv.id)} style={{ flex: 1, padding: '9px 0', borderRadius: 10,
                    border: 'none', background: INK, color: '#fff', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>Accept</button>
                  <button onClick={() => onDeclineInvite(iv.id)} style={{ flex: 1, padding: '9px 0', borderRadius: 10,
                    border: '1px solid #d4d4d8', background: '#fff', color: '#52525b', fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}>Decline</button>
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

function ChatView({ convo, onBack, onBlock, onSend, onRefresh }) {
  const [text, setText] = useState('');
  const [menu, setMenu] = useState(false);
  const [sending, setSending] = useState(false);
  const scroller = useRef(null);
  const INK = F2F_INK;

  // Note: live refresh is handled by App's stable poll while on the Messages tab.
  useEffect(() => { if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight; });

  async function send() {
    const t = text.trim();
    if (!t || sending) return;
    setText(''); setSending(true);
    try { await onSend(convo.id, t); }
    catch (e) { console.error('send failed', e); setText(t); }
    finally { setSending(false); }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: F2F_BG }}>
      {/* chat header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #ececef', display: 'flex', alignItems: 'center',
        gap: 10, padding: `${F2F_TOP_SAFE - 14}px 14px 12px`, position: 'relative' }}>
        <button onClick={onBack} style={iconBtn}><Icon name="chevL" size={26} stroke={INK} /></button>
        <Avatar initials={convo.initials} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: INK }}>{convo.name}</div>
          {convo.shared?.length > 0 && (
            <div style={{ fontSize: 11.5, color: '#a1a1aa' }}>shares {convo.shared.join(', ')}</div>
          )}
        </div>
        <button onClick={() => setMenu(m => !m)} style={iconBtn}>
          <svg width="22" height="6" viewBox="0 0 22 6"><circle cx="3" cy="3" r="2.5" fill="#71717a"/><circle cx="11" cy="3" r="2.5" fill="#71717a"/><circle cx="19" cy="3" r="2.5" fill="#71717a"/></svg>
        </button>
        {menu && (
          <div style={{ position: 'absolute', top: F2F_TOP_SAFE + 30, right: 14, zIndex: 30,
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
      <div style={{ padding: `8px 12px ${F2F_BOT_SAFE}px`, background: '#fff', borderTop: '1px solid #ececef',
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <input value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }}
          placeholder="Message…" style={{ flex: 1, border: '1px solid #e4e4e7', borderRadius: 999,
          padding: '11px 16px', fontSize: 14.5, outline: 'none', background: F2F_BG }} />
        <button onClick={send} disabled={!text.trim() || sending} style={{
          width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: text.trim() && !sending ? INK : '#d4d4d8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" size={20} fill="#fff" stroke="#fff" sw={1.5} />
        </button>
      </div>
    </div>
  );
}

function MenuItem({ label, icon, onClick, danger }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%',
      padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14,
      fontWeight: 500, color: danger ? '#dc2626' : F2F_INK, borderBottom: '1px solid #f4f4f5' }}>
      <Icon name={icon} size={18} stroke={danger ? '#dc2626' : '#71717a'} /> {label}
    </button>
  );
}

function EmptyNote({ icon, title, sub }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 40px', color: '#71717a' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e7eae7', margin: '0 auto 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={26} stroke="#a1a1aa" />
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, color: F2F_INK }}>{title}</div>
      <p style={{ fontSize: 13.5, lineHeight: 1.5, maxWidth: 230, margin: '6px auto 0' }}>{sub}</p>
    </div>
  );
}

const rowStyle = { display: 'flex', gap: 12, padding: '12px 18px', cursor: 'pointer',
  borderBottom: '1px solid #ececef', alignItems: 'center', background: 'transparent' };
const iconBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' };
