// ── Auth — sign up / log in (Supabase email + password) ────────────────────
import { useState } from 'react'
import { Icon, F2F_INK, F2F_GREEN, F2F_TOP_SAFE, F2F_BOT_SAFE } from './ui.jsx'
import { supabase } from './supabaseClient.js'

export function AuthScreen() {
  const INK = F2F_INK, GREEN = F2F_GREEN;
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const isSignup = mode === 'signup';

  async function submit(e) {
    e?.preventDefault();
    setError(null); setNotice(null);
    if (!email.trim() || !password) { setError('Email and password are required.'); return; }
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { first_name: firstName.trim() } },
        });
        if (error) throw error;
        // If email confirmation is ON, there's no session yet.
        if (!data.session) {
          setNotice('Check your email to confirm your account, then log in.');
          setMode('login');
        }
        // If confirmation is OFF, onAuthStateChange in App picks up the session.
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    width: '100%', boxSizing: 'border-box', border: '1px solid #e4e4e7',
    borderRadius: 12, padding: '13px 14px', fontSize: 15, outline: 'none',
    background: '#fff', color: INK,
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ height: F2F_TOP_SAFE }} />
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* brand */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ width: 76, height: 76, borderRadius: 22, background: INK, margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="zot" size={40} stroke="#fff" sw={2.4} />
          </div>
          <h1 style={{ fontSize: 27, fontWeight: 800, color: INK, margin: '0 0 6px', letterSpacing: -0.5 }}>Friend2Friend</h1>
          <p style={{ fontSize: 14, color: '#71717a', margin: 0 }}>
            {isSignup ? 'Create an account to start connecting.' : 'Welcome back — log in to continue.'}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {isSignup && (
            <input value={firstName} onChange={e => setFirstName(e.target.value)}
              placeholder="First name" autoComplete="given-name" style={inputStyle} />
          )}
          <input value={email} onChange={e => setEmail(e.target.value)} type="email"
            placeholder="Email" autoComplete="email" style={inputStyle} />
          <input value={password} onChange={e => setPassword(e.target.value)} type="password"
            placeholder="Password" autoComplete={isSignup ? 'new-password' : 'current-password'} style={inputStyle} />

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
              <Icon name="info" size={15} stroke="#dc2626" /> {error}
            </div>
          )}
          {notice && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: GREEN, fontSize: 13, fontWeight: 600 }}>
              <Icon name="check" size={15} stroke={GREEN} /> {notice}
            </div>
          )}

          <button type="submit" disabled={busy} style={{
            marginTop: 4, width: '100%', padding: '15px', borderRadius: 14, border: 'none',
            background: busy ? '#d4d4d8' : INK, color: '#fff', fontWeight: 700, fontSize: 16,
            cursor: busy ? 'default' : 'pointer' }}>
            {busy ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: '#71717a' }}>
          {isSignup ? 'Already have an account?' : 'New here?'}{' '}
          <span onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(null); setNotice(null); }}
            style={{ color: INK, fontWeight: 700, cursor: 'pointer' }}>
            {isSignup ? 'Log in' : 'Create one'}
          </span>
        </div>
      </div>
      <div style={{ height: F2F_BOT_SAFE + 8 }} />
    </div>
  );
}
