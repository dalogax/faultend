/* eslint-disable */
// Faultend · shared app chrome (top bar, status bar, dimmed surface)

function TopBar({ server, showCenter = true, showSettings = false }) {
  return (
    <div className="ft-topbar">
      <FaultendLogo size={20} />
      {showCenter && server && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, justifyContent: 'center' }}>
          <span className="urlchip">
            {server.url}
            <span style={{ color: 'var(--ft-fg-faint)' }}><Icon.Copy /></span>
          </span>
        </div>
      )}
      {!showCenter && <div style={{ flex: 1 }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showSettings && <Btn size="sm" variant="ghost">Settings</Btn>}
        <Btn size="sm" variant="ghost">Logout</Btn>
      </div>
    </div>
  );
}

function StatusBar({ items = [] }) {
  const def = items.length ? items : [
    ['live',  'proxy.up'],
    null,
    [null,    'yourapp.faultend.com'],
    null,
    [null,    '1,284 req · 12.4 req/s'],
    null,
    ['warn',  '2 rules paused'],
    'spacer',
    [null,    'p95 318ms'],
  ];
  return (
    <div className="ft-statusbar">
      {def.map((it, i) => {
        if (it === null) return <span key={i} className="sep" />;
        if (it === 'spacer') return <span key={i} style={{ flex: 1 }} />;
        const [dot, txt] = it;
        return (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {dot && <span className={`dot ${dot}`} />}
            <span>{txt}</span>
          </span>
        );
      })}
    </div>
  );
}

/* "Frame" — a fixed 1320×860 app viewport with rounded outer chrome */
function Frame({ width = 1320, height = 860, theme = 'light', children, label }) {
  return (
    <div className={`ft ft-theme-${theme}`} style={{ width, height, background: 'var(--ft-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
    </div>
  );
}

Object.assign(window, { TopBar, StatusBar, Frame });
