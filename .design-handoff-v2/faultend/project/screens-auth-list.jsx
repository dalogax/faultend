/* eslint-disable */
// Faultend · Login + Server List screens

/* ----- LOGIN ----- */
function ScreenLogin({ theme = 'light' }) {
  return (
    <Frame theme={theme}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr' }}>
        {/* Left: mark side panel */}
        <div style={{
          background: theme === 'light' ? 'var(--ft-ink-12)' : 'var(--ft-ink-0)',
          color: theme === 'light' ? 'var(--ft-ink-0)' : 'var(--ft-ink-12)',
          padding: '48px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FaultendMark size={28} stroke={theme === 'light' ? '#fafafa' : '#0a0a09'} />
            <span style={{ fontSize: 16, letterSpacing: '-0.01em' }}>faultend</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 460 }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--ft-mono)', letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.55 }}>resilience is rehearsed.</div>
            <div style={{ fontSize: 44, lineHeight: 1.08, letterSpacing: '-0.02em', fontWeight: 400 }}>
              The proxy that lets you<br/>
              <span style={{ color: theme === 'light' ? '#f1b73a' : '#e5a100' }}>break</span> your own backend.
            </div>
            <div style={{ fontSize: 13, opacity: 0.65, maxWidth: 380, lineHeight: 1.6 }}>
              Faultend intercepts requests between your app and any upstream — letting you inject latency, errors, and mocked responses to test how gracefully your code fails.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: 'var(--ft-mono)', fontSize: 11, opacity: 0.55 }}>
            <div>$ curl https://yourapp.faultend.com/users/42</div>
            <div style={{ opacity: 0.7 }}>→ <span style={{ color: '#f1b73a' }}>503 Service Unavailable</span> · injected by rule "flaky-users"</div>
          </div>

          {/* corner watermark */}
          <div style={{ position: 'absolute', right: -120, bottom: -180, opacity: 0.06 }}>
            <FaultendMark size={520} stroke={theme === 'light' ? '#fafafa' : '#0a0a09'} />
          </div>
        </div>

        {/* Right: sign-in panel */}
        <div style={{ background: 'var(--ft-surface)', display: 'grid', placeItems: 'center', padding: 48 }}>
          <div style={{ width: 360, display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)' }}>Sign in</div>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.015em', marginTop: 6, color: 'var(--ft-fg-strong)' }}>Welcome back.</div>
              <div style={{ fontSize: 13, color: 'var(--ft-fg-muted)', marginTop: 4 }}>Manage your fault servers and mock rules.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button className="ft-btn ft-btn--secondary" style={{ height: 40, justifyContent: 'center' }}>
                <GoogleG /> Continue with Google
              </button>
              <button className="ft-btn ft-btn--ghost" style={{ height: 40, justifyContent: 'center' }}>
                <GitHubMark /> Continue with GitHub
              </button>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function GoogleG() { return <svg width="16" height="16" viewBox="0 0 16 16"><path fill="#4285F4" d="M15.7 8.2c0-.6-.05-1.1-.16-1.6H8v3.05h4.3c-.18 1-.74 1.85-1.6 2.4v2h2.55c1.5-1.37 2.45-3.4 2.45-5.85z"/><path fill="#34A853" d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.55-2c-.7.47-1.6.74-2.75.74-2.1 0-3.9-1.42-4.54-3.33H.84v2.07A8 8 0 0 0 8 16z"/><path fill="#FBBC05" d="M3.46 9.47A4.8 4.8 0 0 1 3.2 8c0-.51.1-1 .26-1.47V4.46H.84A8 8 0 0 0 0 8c0 1.3.3 2.5.84 3.54l2.62-2.07z"/><path fill="#EA4335" d="M8 3.17c1.17 0 2.23.4 3.06 1.2L13.3 2.1A8 8 0 0 0 8 0 8 8 0 0 0 .84 4.46l2.62 2.07C4.1 4.6 5.9 3.17 8 3.17z"/></svg>; }
function GitHubMark() { return <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.5c-2.22.48-2.7-.94-2.7-.94-.36-.92-.88-1.16-.88-1.16-.72-.5.06-.48.06-.48.8.06 1.22.83 1.22.83.7 1.21 1.85.86 2.3.66.07-.52.28-.86.5-1.06-1.77-.2-3.64-.88-3.64-3.93 0-.87.31-1.58.82-2.14-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.6 7.6 0 0 1 4 0c1.52-1.04 2.19-.82 2.19-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.14 0 3.06-1.87 3.72-3.65 3.92.29.25.54.74.54 1.5v2.22c0 .21.15.46.55.38A8 8 0 0 0 8 0z"/></svg>; }

/* ----- SERVER LIST ----- */
function ScreenServerList() {
  const servers = [
    { id: 'yourapp',          url: 'https://yourapp.faultend.com',          created: 'May 12', activity: '12s ago', traffic: 1284, rules: 5, status: 'live', owner: 'me',         shared: 4 },
    { id: 'yourapp-staging',  url: 'https://yourapp-staging.faultend.com',  created: 'May 09', activity: '2m ago',  traffic: 412,  rules: 3, status: 'live', owner: 'me',         shared: 4 },
    { id: 'yourapp-beta',     url: 'https://yourapp-beta.faultend.com',     created: 'May 02', activity: '4h ago',  traffic: 88,   rules: 2, status: 'idle', owner: 'me',         shared: 2 },
    { id: 'payments',         url: 'https://payments.faultend.com',         created: 'Apr 28', activity: '20s ago', traffic: 942,  rules: 8, status: 'warn', owner: 'priya.r',    shared: 8 },
    { id: 'notifications',    url: 'https://notifications.faultend.com',    created: 'Apr 22', activity: '1d ago',  traffic: 0,    rules: 0, status: 'idle', owner: 'me',         shared: 0 },
    { id: 'mobile-mock',      url: 'https://mobile.faultend.com',           created: 'Apr 14', activity: '3d ago',  traffic: 56,   rules: 4, status: 'off',  owner: 'lev.k',      shared: 3 },
  ];

  return (
    <Frame>
      <TopBar showCenter={false} />
      <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
        <div className="ft-section-h">
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn size="sm"><Icon.Plus /> New server</Btn>
          </div>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid var(--ft-border)', marginBottom: 24, background: 'var(--ft-surface)' }}>
          <Stat label="Servers"        value="6"      sub="2 live · 1 paused" />
          <Stat label="Requests · 24h" value="2,782"  sub="+18% vs prev" />
          <Stat label="p95 latency"    value="318ms"  sub="across all servers" mono />
          <Stat label="Active rules"   value="22"     sub="across 6 servers" />
        </div>

        {/* Server table */}
        <div style={{ border: '1px solid var(--ft-border-strong)', background: 'var(--ft-surface)' }}>
          <table className="ft-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Server</th>
                <th>Endpoint</th>
                <th style={{ width: 110 }}>Created</th>
                <th style={{ width: 110 }}>Last activity</th>
                <th style={{ width: 180 }}>Sharing</th>
                <th style={{ width: 100, textAlign: 'right' }}>Traffic</th>
                <th style={{ width: 90, textAlign: 'right' }}>Rules</th>
                <th style={{ width: 32 }}></th>
              </tr>
            </thead>
            <tbody>
              {servers.map(s => (
                <tr key={s.id}>
                  <td><Dot kind={s.status === 'live' ? 'live' : s.status === 'warn' ? 'warn' : 'off'} /></td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: 'var(--ft-fg-strong)' }}>{s.id}</span>
                      {s.status === 'warn' && <span style={{ fontSize: 11, color: 'var(--ft-amber-ink)' }}>elevated error rate</span>}
                    </div>
                  </td>
                  <td className="ft-mono" style={{ color: 'var(--ft-fg-muted)' }}>{s.url}</td>
                  <td className="muted">{s.created}</td>
                  <td className="muted">{s.activity}</td>
                  <td><SharedCell count={s.shared} owner={s.owner} /></td>
                  <td className="num" style={{ textAlign: 'right' }}>{s.traffic.toLocaleString()}</td>
                  <td className="num" style={{ textAlign: 'right' }}>{s.rules}</td>
                  <td><Btn icon variant="ghost"><Icon.ChevRight /></Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </Frame>
  );
}

function PeopleGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
      <circle cx="6" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M1.5 13 C2.5 10.2 4.2 9.2 6 9.2 C7.8 9.2 9.5 10.2 10.5 13" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="11.2" cy="6" r="1.7" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M10 9.4 C11.2 9.2 13.5 9.8 14.5 12.4" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function PersonGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2.5 13.5 C3.5 10.5 5.7 9.4 8 9.4 C10.3 9.4 12.5 10.5 13.5 13.5" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  );
}

function SharedCell({ count, owner }) {
  const ownedByMe = owner === 'me';

  // Shared with me by someone else
  if (!ownedByMe) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ft-fg-muted)' }}>
        <span style={{ color: 'var(--ft-fg-faint)' }}><PersonGlyph /></span>
        <span style={{ color: 'var(--ft-fg-strong)' }}>Shared with me</span>
        <span className="ft-mono" style={{ color: 'var(--ft-fg-faint)', fontSize: 11 }}>· @{owner}</span>
      </span>
    );
  }

  // I own it, not shared
  if (!count) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ft-fg-muted)' }}>
        <span style={{ color: 'var(--ft-fg-faint)' }}><PersonGlyph /></span>
        <span>Private</span>
      </span>
    );
  }

  // I own it, shared with N people
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ft-fg-muted)' }}>
      <span style={{ color: 'var(--ft-fg-faint)' }}><PeopleGlyph /></span>
      <span style={{ color: 'var(--ft-fg-strong)' }}>Shared</span>
      <span className="ft-mono" style={{ color: 'var(--ft-fg-faint)', fontSize: 11 }}>· {count}</span>
    </span>
  );
}

function Stat({ label, value, sub, warn, mono }) {
  return (
    <div style={{ padding: '16px 20px', borderRight: '1px solid var(--ft-border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 11, color: 'var(--ft-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{
        fontSize: 24,
        fontFamily: mono ? 'var(--ft-mono)' : 'var(--ft-font)',
        color: warn ? 'var(--ft-amber-ink)' : 'var(--ft-fg-strong)',
        letterSpacing: mono ? 0 : '-0.01em',
      }}>{value}</div>
      <div style={{ fontSize: 11, color: warn ? 'var(--ft-amber-ink)' : 'var(--ft-fg-faint)' }}>{sub}</div>
    </div>
  );
}

Object.assign(window, { ScreenLogin, ScreenServerList });
