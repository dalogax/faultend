/* eslint-disable */
// Faultend · Mobile (phone) screens.
//
// The desktop product is a two-pane developer console; on phones the same
// data has to be expressed within ~390px. We keep the brand chassis intact
// — monochrome ink scale, sharp corners, JetBrains Mono for everything
// load-bearing, signal amber for fault. Three things change:
//
//  1. The two columns (Traffic + Rules) become tabs. A bottom tab bar
//     surfaces TRAFFIC / RULES / STATS / MORE — the dashboard's metric
//     strip gets a tab of its own rather than being squeezed into a header.
//  2. Rows replace tables. A 6-column data grid does not survive on
//     mobile; each traffic / rule / server entry becomes a 2-line row.
//  3. Drawers become full-screen sheets. The 520px right drawer pattern
//     doesn't apply, so create-rule, traffic-detail, settings etc. all
//     present as full sheets with a chrome header.
//
// Everything below renders inside an <IOSDevice> from ios-frame.jsx.

const { useState: useStateMobile } = React;

/* ============================================================
   PHONE SHELL — iOS bezel + Faultend app interior
   ============================================================ */
function PhoneShell({ children, theme = 'light', dark, height = 874 }) {
  // `dark` only flips the iOS chrome (status bar text / home indicator)
  const bezelDark = dark ?? (theme === 'dark');
  return (
    <IOSDevice width={402} height={height} dark={bezelDark}>
      <div
        className={`ft ft-theme-${theme}`}
        style={{
          position: 'absolute',
          top: 54,        // below status bar
          bottom: 0,      // home indicator floats over content
          left: 0, right: 0,
          background: 'var(--ft-bg)',
          color: 'var(--ft-fg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </IOSDevice>
  );
}

/* ============================================================
   APP CHROME — mobile top bar + bottom tab bar
   ============================================================ */
function MTopBar({ left, title, right, url, sub, eyebrow }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: 'var(--ft-surface)',
      borderBottom: '1px solid var(--ft-border-strong)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 44, padding: '0 8px 0 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {left}
          {eyebrow && (
            <div style={{
              fontFamily: 'var(--ft-mono)', fontSize: 10,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--ft-fg-faint)',
            }}>{eyebrow}</div>
          )}
          {title && (
            <div style={{
              fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em',
              color: 'var(--ft-fg-strong)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{title}</div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {right}
        </div>
      </div>
      {url && (
        <div style={{
          padding: '6px 12px 8px',
          background: 'var(--ft-surface-2)',
          borderTop: '1px solid var(--ft-hairline)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            height: 24, padding: '0 8px', flex: 1,
            background: 'var(--ft-surface)',
            border: '1px solid var(--ft-border)',
            fontFamily: 'var(--ft-mono)', fontSize: 11,
            color: 'var(--ft-fg-strong)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{url}</span>
          <button style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 24, height: 24,
            border: '1px solid var(--ft-border)',
            background: 'var(--ft-surface)',
            color: 'var(--ft-fg-muted)',
          }}><Icon.Copy /></button>
        </div>
      )}
      {sub && (
        <div style={{
          padding: '4px 12px 6px',
          fontFamily: 'var(--ft-mono)', fontSize: 10,
          letterSpacing: '0.08em', color: 'var(--ft-fg-faint)',
          background: 'var(--ft-surface-2)',
          borderTop: '1px solid var(--ft-hairline)',
        }}>{sub}</div>
      )}
    </div>
  );
}

function IconBtn({ children, ...rest }) {
  return (
    <button {...rest} className="ft-iconbtn--mobile">{children}</button>
  );
}

function MBackBtn() {
  return (
    <button className="ft-iconbtn--mobile" style={{ marginLeft: -8 }}>
      <svg viewBox="0 0 16 16" width="18" height="18" fill="none">
        <path d="M10 2 L4 8 L10 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square"/>
      </svg>
    </button>
  );
}

function MTabBar({ active = 'traffic', server }) {
  const tabs = [
    { id: 'traffic',  label: 'Traffic',  icon: <TabGlyph.Traffic /> },
    { id: 'rules',    label: 'Rules',    icon: <TabGlyph.Rules />   },
    { id: 'settings', label: 'Settings', icon: <TabGlyph.Settings /> },
  ];
  return (
    <div className="ft-mbar ft-mbar--tabs">
      {tabs.map(t => (
        <button key={t.id} style={{
          flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
          padding: '0 4px',
          background: t.id === active ? 'var(--ft-surface-2)' : 'transparent',
          color: t.id === active ? 'var(--ft-fg-strong)' : 'var(--ft-fg-muted)',
          borderTop: t.id === active ? '2px solid var(--ft-ink-12)' : '2px solid transparent',
          marginTop: -1,
        }}>
          <span style={{ color: 'inherit' }}>{t.icon}</span>
          <span style={{
            fontSize: 10, fontFamily: 'var(--ft-mono)',
            letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

const TabGlyph = {
  Traffic: () => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <path d="M2 4 H14 M2 8 H10 M2 12 H12" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  ),
  Rules: () => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <rect x="2" y="3" width="12" height="3" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="2" y="10" width="12" height="3" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  Settings: () => (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M8 1.5 V3.4 M8 12.6 V14.5 M1.5 8 H3.4 M12.6 8 H14.5 M3.4 3.4 L4.8 4.8 M11.2 11.2 L12.6 12.6 M3.4 12.6 L4.8 11.2 M11.2 4.8 L12.6 3.4" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
};

/* ============================================================
   01 · LOGIN
   ----
   The desktop login is a two-panel layout: a dark "hero" panel on the
   left, a light sign-in panel on the right. Mobile only has one column,
   so we have to commit. `theme` here drives the whole screen rather
   than just the chrome:
     light → light cream bg, dark text, amber/black accents
     dark  → black hero, light text (mirrors desktop's left panel)
   ============================================================ */
function MobileLogin({ theme = 'light' }) {
  const isDark = theme === 'dark';

  // Resolve concrete colors so the screen reads the same regardless of
  // which Faultend theme tokens happen to be active.
  const bg       = isDark ? '#0a0a09' : '#fafaf7';
  const surface  = isDark ? '#131312' : '#ffffff';
  const ink      = isDark ? '#f6f4ef' : '#0a0a09';
  const muted    = isDark ? 'rgba(246,244,239,0.62)' : 'rgba(10,10,9,0.60)';
  const faint    = isDark ? 'rgba(246,244,239,0.40)' : 'rgba(10,10,9,0.40)';
  const border   = isDark ? 'rgba(246,244,239,0.18)' : 'rgba(10,10,9,0.18)';
  const accent   = isDark ? '#f1b73a' : '#b88300';
  const codeBg   = isDark ? 'rgba(246,244,239,0.04)' : 'rgba(10,10,9,0.04)';

  return (
    <PhoneShell theme={theme} dark={isDark}>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: bg, color: ink,
        padding: '20px 22px 28px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaultendMark size={22} color={ink} />
          <span style={{ fontSize: 14, letterSpacing: '-0.01em' }}>faultend</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18, position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 10, fontFamily: 'var(--ft-mono)',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: faint,
          }}>
            resilience is rehearsed.
          </div>
          <div style={{
            fontSize: 30, lineHeight: 1.08, letterSpacing: '-0.02em',
            fontWeight: 400, color: ink,
          }}>
            The proxy that lets you{' '}
            <span style={{ color: accent }}>break</span>{' '}
            your own backend.
          </div>
          <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>
            Inject latency, errors and mocked responses to test how
            gracefully your app fails.
          </div>

          <div style={{
            marginTop: 6, padding: '10px 12px',
            background: codeBg, border: `1px solid ${border}`,
            display: 'flex', flexDirection: 'column', gap: 6,
            fontFamily: 'var(--ft-mono)', fontSize: 11, color: muted,
          }}>
            <div>$ curl yourapp.faultend.com/users/42</div>
            <div>
              → <span style={{ color: accent }}>503 Service Unavailable</span>
              <br/>{'  '}injected by rule "flaky-users"
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative', zIndex: 1 }}>
          <button style={{
            height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: ink, color: bg,
            border: `2px solid ${ink}`,
            fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
          }}>
            <GoogleG /> Continue with Google
          </button>
          <button style={{
            height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: surface, color: ink,
            border: `2px solid ${ink}`,
            fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
          }}>
            <GitHubMark /> Continue with GitHub
          </button>
        </div>

        {/* corner watermark */}
        <div style={{ position: 'absolute', right: -120, bottom: -160, opacity: isDark ? 0.06 : 0.04, pointerEvents: 'none' }}>
          <FaultendMark size={360} color={ink} />
        </div>
      </div>
    </PhoneShell>
  );
}

/* ============================================================
   02 · SERVER LIST
   ============================================================ */
const MOBILE_SERVERS = [
  { id: 'yourapp',         host: 'yourapp.faultend.com',         activity: '12s ago', traffic: 1284, rules: 5, status: 'live', sub: 'me',         shared: 4 },
  { id: 'yourapp-staging', host: 'yourapp-staging.faultend.com', activity: '2m ago',  traffic: 412,  rules: 3, status: 'live', sub: 'me',         shared: 4 },
  { id: 'yourapp-beta',    host: 'yourapp-beta.faultend.com',    activity: '4h ago',  traffic: 88,   rules: 2, status: 'idle', sub: 'me',         shared: 2 },
  { id: 'payments',        host: 'payments.faultend.com',        activity: '20s ago', traffic: 942,  rules: 8, status: 'warn', sub: 'priya.r',    shared: 8 },
  { id: 'notifications',   host: 'notifications.faultend.com',   activity: '1d ago',  traffic: 0,    rules: 0, status: 'idle', sub: 'me',         shared: 0 },
  { id: 'mobile-mock',     host: 'mobile.faultend.com',          activity: '3d ago',  traffic: 56,   rules: 4, status: 'off',  sub: 'lev.k',      shared: 3 },
];

function MobileServerList({ theme = 'light' }) {
  return (
    <PhoneShell theme={theme}>
      <MTopBar
        left={<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
          <FaultendMark size={18} />
          <span style={{ fontSize: 13, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ft-fg-strong)' }}>faultend</span>
        </div>}
        right={<>
          <IconBtn><Icon.Plus /></IconBtn>
          <IconBtn><Icon.SignOut /></IconBtn>
        </>}
      />

      {/* Summary strip — 2×2 grid (vs 1×4 on desktop) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--ft-border)', background: 'var(--ft-surface)' }}>
        <MStat label="Servers"     value="6"     sub="2 live · 1 paused" />
        <MStat label="Req · 24h"   value="2,782" sub="+18% vs prev" right />
        <MStat label="p95"         value="318ms" sub="across all" mono top />
        <MStat label="Rules"       value="22"    sub="6 servers" right top />
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--ft-mono)', fontSize: 10, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'var(--ft-fg-faint)',
          }}>Servers · 6</span>
        </div>

        {MOBILE_SERVERS.map(s => <ServerRow key={s.id} s={s} />)}

        <div style={{ height: 12 }} />
      </div>
    </PhoneShell>
  );
}

function MStat({ label, value, sub, warn, mono, right, top }) {
  return (
    <div style={{
      padding: '12px 14px',
      borderRight: right ? 'none' : '1px solid var(--ft-border)',
      borderTop:   top   ? '1px solid var(--ft-hairline)' : 'none',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ fontSize: 10, color: 'var(--ft-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{
        fontSize: 20,
        fontFamily: mono ? 'var(--ft-mono)' : 'var(--ft-font)',
        color: warn ? 'var(--ft-amber-ink)' : 'var(--ft-fg-strong)',
        letterSpacing: mono ? 0 : '-0.01em', lineHeight: 1.1,
      }}>{value}</div>
      <div style={{ fontSize: 10, color: warn ? 'var(--ft-amber-ink)' : 'var(--ft-fg-faint)' }}>{sub}</div>
    </div>
  );
}

function ServerRow({ s }) {
  const dot = s.status === 'live' ? 'live' : s.status === 'warn' ? 'warn' : 'off';
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch',
      padding: '12px 12px',
      borderBottom: '1px solid var(--ft-hairline)',
      background: 'var(--ft-surface)',
      gap: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 4 }}>
        <Dot kind={dot} />
      </div>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 14, color: 'var(--ft-fg-strong)', fontWeight: 500 }}>{s.id}</span>
          <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-faint)' }}>{s.activity}</span>
        </div>
        <span className="ft-mono" style={{
          fontSize: 11, color: 'var(--ft-fg-muted)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{s.host}</span>
        {s.status === 'warn' && (
          <span style={{ fontSize: 11, color: 'var(--ft-amber-ink)' }}>elevated error rate</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
          <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>
            <span style={{ color: 'var(--ft-fg-strong)' }}>{s.traffic.toLocaleString()}</span> req
          </span>
          <span className="sep" style={{ width: 1, height: 10, background: 'var(--ft-border)' }} />
          <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>
            <span style={{ color: 'var(--ft-fg-strong)' }}>{s.rules}</span> rules
          </span>
          <span className="sep" style={{ width: 1, height: 10, background: 'var(--ft-border)' }} />
          <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-faint)' }}>
            {s.sub === 'me' ? (s.shared ? `shared · ${s.shared}` : 'private') : `@${s.sub}`}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Icon.ChevRight style={{ color: 'var(--ft-fg-faint)' }} />
      </div>
    </div>
  );
}

/* ============================================================
   03 · DASHBOARD — Traffic tab
   ============================================================ */
function MobileDashboardTraffic({ theme = 'light' }) {
  return (
    <PhoneShell theme={theme}>
      <MTopBar
        left={<MBackBtn />}
        title="yourapp"
        right={<><IconBtn><Icon.Settings /></IconBtn><IconBtn><Icon.SignOut /></IconBtn></>}
        url="yourapp.faultend.com"
      />

      {/* Filter bar — mirrors the desktop Traffic filter row. */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        background: 'var(--ft-surface-2)',
        borderBottom: '1px solid var(--ft-hairline)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px',
          overflowX: 'auto',
        }}>
          <Icon.Filter style={{ color: 'var(--ft-fg-muted)', flexShrink: 0 }} />
          <FilterChipM label="method" value="all" />
          <FilterChipM label="status" value="all" />
          <FilterChipM label="rule"   value="all" />
          <button className="ft-chip--mobile" style={{ flexShrink: 0, marginLeft: 'auto', gap: 6, color: 'var(--ft-fg-muted)' }}>
            <Icon.Trash />
            <span>clear</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px 8px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: 22, top: 7, color: 'var(--ft-fg-faint)' }}>
            <Icon.Search />
          </span>
          <input
            className="ft-input ft-input--mono"
            placeholder="filter path · regex supported"
            style={{ height: 28, fontSize: 11, paddingLeft: 30, flex: 1 }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {SAMPLE_TRAFFIC.slice(0, 12).map((r, i) => <TrafficRowMobile key={i} r={r} highlight={i === 2} />)}
      </div>

      <MTabBar active="traffic" />
    </PhoneShell>
  );
}

function FilterChipM({ label, value }) {
  return (
    <button className="ft-chip--mobile" style={{ flexShrink: 0 }}>
      <span className="label">{label}</span>
      <span className="value">{value}</span>
      <Icon.ChevDown style={{ color: 'var(--ft-fg-faint)' }} />
    </button>
  );
}

function TrafficRowMobile({ r, highlight }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px',
      borderBottom: '1px solid var(--ft-hairline)',
      background: highlight ? 'var(--ft-amber-bg)' : 'var(--ft-surface)',
    }}>
      <Badge kind={`m-${r.m}`}>{r.m}</Badge>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="ft-mono" style={{
          fontSize: 12, color: 'var(--ft-fg-strong)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{r.p}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span className="ft-mono" style={{ fontSize: 10, color: 'var(--ft-fg-faint)' }}>{r.t}</span>
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-end' }}>
            {r.r.map((lab) => <Badge key={lab} kind={`a-${lab}`}>{lab}</Badge>)}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <Badge kind={statusKind(r.s)}>{r.s}</Badge>
        <span className="ft-mono" style={{
          fontSize: 11,
          color: r.err ? 'var(--ft-red-ink)' : r.slow ? 'var(--ft-amber-ink)' : 'var(--ft-fg-muted)',
        }}>{r.d}<span style={{ opacity: 0.5 }}>ms</span></span>
      </div>
    </div>
  );
}

function MobileDashboardRules({ theme = 'light' }) {
  return (
    <PhoneShell theme={theme}>
      <MTopBar
        left={<MBackBtn />}
        title="yourapp"
        right={<><IconBtn><Icon.Settings /></IconBtn><IconBtn><Icon.SignOut /></IconBtn></>}
        url="yourapp.faultend.com"
      />

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px',
        background: 'var(--ft-surface-2)',
        borderBottom: '1px solid var(--ft-hairline)',
      }}>
        <span style={{
          fontFamily: 'var(--ft-mono)', fontSize: 10,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--ft-fg-muted)',
        }}>7 rules · evaluated top → bottom</span>
        <Btn size="sm"><Icon.Plus /> New</Btn>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        {SAMPLE_RULES.map((r, i) => <RuleRowMobile key={i} r={r} />)}
      </div>

      <MTabBar active="rules" />
    </PhoneShell>
  );
}

function RuleRowMobile({ r }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 10,
      padding: '12px',
      borderBottom: '1px solid var(--ft-hairline)',
      background: 'var(--ft-surface)',
      opacity: r.on ? 1 : 0.55,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 2 }}>
        <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-faint)' }}>{r.pri}</span>
        <span style={{ color: 'var(--ft-fg-faint)' }}><Icon.Drag /></span>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--ft-fg-strong)', fontWeight: 500 }}>{r.name}</span>
          <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 3, justifyContent: 'flex-end' }}>
            {r.labels.map((lab) => <Badge key={lab} kind={`a-${lab}`}>{lab}</Badge>)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Badge kind={r.m === '*' ? 'a-pass' : `m-${r.m}`}>{r.m}</Badge>
          <span className="ft-mono" style={{
            fontSize: 11, color: 'var(--ft-fg-muted)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
          }}>{r.pat}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
          <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-faint)' }}>
            <span style={{ color: 'var(--ft-fg-strong)' }}>{r.hits.toLocaleString()}</span> hits
          </span>
          <Toggle checked={r.on} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   05 · DASHBOARD — Settings tab
   ----
   Renders the full server-settings form inline (matching the desktop
   Settings drawer feature-for-feature) rather than as navigation rows
   that would imply child screens. The tab bar replaces a footer button
   bar — destructive actions sit inline at the end of the form.
   ============================================================ */
function MobileDashboardMore({ theme = 'light' }) {
  return (
    <PhoneShell theme={theme}>
      <MTopBar
        left={<MBackBtn />}
        title="yourapp · settings"
        right={<IconBtn><Icon.SignOut /></IconBtn>}
        url="yourapp.faultend.com"
      />

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SheetSection title="Behaviour">
          <SettingRowM label="Recording" desc="Capture every request that flows through this proxy.">
            <Toggle checked />
          </SettingRowM>
          <SettingRowM label="Default latency" desc="Apply to proxied requests with no matching rule.">
            <span className="ft-mono" style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>0ms</span>
          </SettingRowM>
          <div style={{ marginTop: 8 }}>
            <Field label="Preserve headers" hint="Forwarded verbatim to the upstream on every proxied request.">
              <input className="ft-input ft-input--mono" defaultValue="authorization, x-request-id, x-trace" />
            </Field>
          </div>
        </SheetSection>

        <SheetSection title="Sharing · 3 collaborators">
          <CollabM name="dev@faultend.io" role="Owner" />
          <CollabM name="qa@faultend.io"  role="Edit" />
          <CollabM name="ops@faultend.io" role="View" />

          <div style={{
            marginTop: 8,
            border: '1px solid var(--ft-border)',
            background: 'var(--ft-surface-2)',
            padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>Share by link</span>
                <span style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>Anyone with the link can view this server.</span>
              </div>
              <Toggle checked />
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--ft-border-strong)', background: 'var(--ft-surface)' }}>
              <span className="ft-mono" style={{
                flex: 1, padding: '0 10px',
                display: 'flex', alignItems: 'center',
                fontSize: 11, color: 'var(--ft-fg-strong)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>https://faultend.com/share/sv_a9c2-3041</span>
              <button className="ft-iconbtn--mobile" style={{ borderLeft: '1px solid var(--ft-border)', width: 44, height: 36 }}>
                <Icon.Copy />
              </button>
            </div>
          </div>
        </SheetSection>

        {/* Destructive actions sit inline (the tab bar takes the place of
            a sheet footer here). */}
        <SheetSection title="Danger zone">
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Btn variant="ghost"><Icon.Copy /> Export</Btn>
            <DangerConfirmBtn idleText="Delete server" armedText="Click again to confirm" />
          </div>
        </SheetSection>

        <div style={{ height: 12 }} />
      </div>

      <MTabBar active="settings" />
    </PhoneShell>
  );
}

/* ============================================================
   07 · SHEET — Traffic detail (full-screen modal)
   ============================================================ */
function MobileTrafficDetail({ theme = 'light', height }) {
  return (
    <PhoneShell theme={theme} height={height}>
      <SheetHeader
        eyebrow="Request · f_a9c2-3041"
        title="POST /api/v2/sync"
      />
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '14px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <SheetSection title="Overview">
          <SheetRow label="method">  <Badge kind="m-POST" lg>POST</Badge></SheetRow>
          <SheetRow label="path">    <span className="ft-mono" style={{ color: 'var(--ft-fg-strong)' }}>/api/v2/sync</span></SheetRow>
          <SheetRow label="status">  <Badge kind="s-2xx" lg>200 OK</Badge></SheetRow>
          <SheetRow label="duration"><span className="ft-mono">612ms</span></SheetRow>
          <SheetRow label="time">    <span className="ft-mono" style={{ color: 'var(--ft-fg-muted)' }}>20:25:05.124Z</span></SheetRow>
          <SheetRow label="target">  <span className="ft-mono" style={{ color: 'var(--ft-fg-muted)', wordBreak: 'break-all' }}>api.yourapp.com</span></SheetRow>
        </SheetSection>

        <SheetSection title="Matched rule" right={<Badge outline>matched</Badge>}>
          <div style={{ border: '1px solid var(--ft-border)', background: 'var(--ft-surface-2)', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', gap: 3 }}>
                <Badge kind="a-mock">mock</Badge>
                <Badge kind="a-delay">delay</Badge>
                <Badge kind="a-transform">transform</Badge>
              </div>
              <span className="ft-mono" style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>POST · ^/api/v2/.*$</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="ft-mono" style={{ fontSize: 10, color: 'var(--ft-fg-muted)' }}>Sync stub · priority 140 · rule_42</span>
              <Btn size="sm" variant="ghost"><Icon.Edit /> Edit</Btn>
            </div>
          </div>
        </SheetSection>

        <SheetSection title="Request headers" right={<Btn size="sm" variant="ghost"><Icon.Copy /></Btn>}>
          <pre className="ft-code" style={{ margin: 0, fontSize: 11 }}>{`host:           yourapp.faultend.com
accept:         */*
user-agent:     curl/8.5.0
x-request-id:   r_2f5e-1140
content-length: 0`}</pre>
          <div style={{ fontSize: 11, color: 'var(--ft-fg-faint)', marginTop: 6 }}>// no request body</div>
        </SheetSection>

        <SheetSection title="Response · injected">
          <pre className="ft-code" style={{ margin: 0, fontSize: 11 }}>{`{
  "id":     7421,
  "status": "queued",
  "ts":     1715724305124
}`}</pre>
        </SheetSection>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4, paddingBottom: 8 }}>
          <Btn><Icon.Plus /> Create rule from this</Btn>
        </div>
      </div>
    </PhoneShell>
  );
}

function SheetHeader({ eyebrow, title }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      padding: '12px 12px 12px 14px',
      borderBottom: '1px solid var(--ft-border-strong)',
      background: 'var(--ft-surface)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        {eyebrow && (
          <div style={{
            fontFamily: 'var(--ft-mono)', fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'var(--ft-fg-faint)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{eyebrow}</div>
        )}
        <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--ft-fg-strong)' }}>{title}</div>
      </div>
      <IconBtn><Icon.X /></IconBtn>
    </div>
  );
}

function SheetSection({ title, right, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--ft-border-strong)', paddingBottom: 6 }}>
        <span style={{
          fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--ft-fg-muted)',
        }}>{title}</span>
        {right}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
    </div>
  );
}

function SheetRow({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', alignItems: 'center', padding: '4px 0', fontSize: 12 }}>
      <span style={{ fontSize: 10, color: 'var(--ft-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

/* ============================================================
   08 · SHEET — Create rule
   ============================================================ */
function MobileCreateRule({ theme = 'light', height }) {
  return (
    <PhoneShell theme={theme} height={height}>
      <SheetHeader eyebrow="New rule · yourapp" title="Create rule" />

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <SheetSection title="Match">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Field label="Priority" required>
              <input className="ft-input ft-input--mono" defaultValue="100" />
            </Field>
            <Field label="Method">
              <div style={{ position: 'relative' }}>
                <select className="ft-input" defaultValue="ALL" style={{ appearance: 'none', paddingRight: 26 }}>
                  <option value="ALL">* (Any)</option>
                  <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
                </select>
                <span style={{ position: 'absolute', right: 10, top: 11, color: 'var(--ft-fg-muted)' }}><Icon.ChevDown /></span>
              </div>
            </Field>
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Path pattern" required hint="JS-flavoured regex.">
              <input className="ft-input ft-input--mono" defaultValue="^/users/[0-9]+$" />
            </Field>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ft-fg-strong)', marginTop: 10 }}>
            <Toggle checked /> Enabled
          </label>
        </SheetSection>

        <SheetSection title="Action">
          <div style={{ display: 'flex', border: '1px solid var(--ft-border-strong)' }}>
            <MActionTab active>Mock</MActionTab>
            <MActionTab>Proxy</MActionTab>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
            <Field label="Status" required>
              <input className="ft-input ft-input--mono" defaultValue="200" />
            </Field>
            <Field label="Content type">
              <input className="ft-input ft-input--mono" defaultValue="application/json" />
            </Field>
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Response body">
              <textarea
                className="ft-input ft-input--mono"
                rows={6}
                style={{ fontSize: 11, lineHeight: 1.5 }}
                defaultValue={`{
  "id":    {{random(1,1000)}},
  "name":  "John Doe",
  "email": "john@example.com",
  "ts":    {{timestamp()}}
}`}
              />
            </Field>
          </div>
        </SheetSection>

        <SheetSection title="Latency" right={<Toggle checked />}>
          <div style={{ display: 'flex', border: '1px solid var(--ft-border-strong)' }}>
            <RadioPill>Fixed</RadioPill>
            <RadioPill active>Range</RadioPill>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
            <Field label="Min · ms"><input className="ft-input ft-input--mono" defaultValue="100" /></Field>
            <Field label="Max · ms"><input className="ft-input ft-input--mono" defaultValue="500" /></Field>
          </div>
        </SheetSection>

        <SheetSection title="Transform" right={<Toggle checked />}>
          <div style={{ fontSize: 12, color: 'var(--ft-fg-muted)', lineHeight: 1.5 }}>
            Run a function on the response before it returns to the client. Mutate body, rewrite headers, override status.
          </div>
          <div style={{ border: '1px solid var(--ft-border-strong)', background: 'var(--ft-surface)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr' }}>
              {/* gutter */}
              <pre className="ft-mono" style={{
                margin: 0, padding: '8px 0', textAlign: 'right',
                fontSize: 10.5, lineHeight: '16px', color: 'var(--ft-fg-faint)',
                background: 'var(--ft-surface-2)', borderRight: '1px solid var(--ft-border)',
                userSelect: 'none',
              }}>{`1\n2\n3\n4\n5\n6`}</pre>
              {/* code */}
              <pre className="ft-mono" style={{
                margin: 0, padding: '8px 10px',
                fontSize: 10.5, lineHeight: '16px', color: 'var(--ft-fg-strong)',
                whiteSpace: 'pre', overflow: 'auto', background: 'transparent',
              }}>
{`// res.status, res.headers, res.body mutable
if (req.headers['x-debug']) {
  res.body.debug = { ruleId: rule.id };
}
res.body.email = res.body.email.replace(/@.+$/, '@redacted');
res.headers['x-faultend-touched'] = '1';`}
              </pre>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 8px', borderTop: '1px solid var(--ft-border)',
              background: 'var(--ft-surface-2)',
            }}>
              <span className="ft-mono" style={{ fontSize: 9, color: 'var(--ft-fg-faint)', letterSpacing: '0.04em' }}>
                runs after mock/proxy · before latency
              </span>
              <Btn variant="ghost" size="sm">Snippets ▾</Btn>
            </div>
          </div>
          <div style={{ fontSize: 10, fontFamily: 'var(--ft-mono)', color: 'var(--ft-fg-faint)' }}>
            sandboxed · 50ms timeout · no fs / no net
          </div>
        </SheetSection>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4, paddingBottom: 8 }}>
          <Btn>Save rule</Btn>
        </div>
      </div>
    </PhoneShell>
  );
}

function MActionTab({ active, children }) {
  return (
    <button style={{
      flex: 1, height: 36,
      background: active ? 'var(--ft-ink-12)' : 'var(--ft-surface)',
      color: active ? 'var(--ft-fg-on-fill)' : 'var(--ft-fg-strong)',
      borderRight: '1px solid var(--ft-border-strong)',
      fontSize: 13,
    }}>{children}</button>
  );
}

/* ============================================================
   09 · SHEET — Add server
   ============================================================ */
function MobileAddServer({ theme = 'light', tab = 'manual', height }) {
  return (
    <PhoneShell theme={theme} height={height}>
      <SheetHeader eyebrow="New" title="Add fault server" />

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ft-border-strong)' }}>
          <DrawerTabM active={tab === 'manual'}>Manual</DrawerTabM>
          <DrawerTabM active={tab === 'import'}>Import from file</DrawerTabM>
        </div>

        {tab === 'manual' && (
          <SheetSection title="Identity">
            <Field label="Server ID" required hint="Alphanumeric and hyphens · must start with a letter · used as subdomain.">
              <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--ft-border-strong)' }}>
                <input className="ft-input ft-input--mono" defaultValue="yourapp" style={{ border: 'none', flex: 1, height: 36 }} />
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '0 10px',
                  background: 'var(--ft-surface-2)', borderLeft: '1px solid var(--ft-border)',
                  fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)',
                }}>.faultend.com</span>
              </div>
            </Field>
          </SheetSection>
        )}

        {tab === 'import' && (
          <SheetSection title="Import">
            <Field label="Source file" required hint="Faultend export (.json) or OpenAPI 3 spec.">
              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '24px 16px',
                border: '1px dashed var(--ft-border-strong)',
                background: 'var(--ft-surface-2)',
                cursor: 'pointer',
              }}>
                <span style={{ color: 'var(--ft-fg-muted)' }}><Icon.Folder /></span>
                <span style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>Drop a file or tap to browse</span>
                <span className="ft-mono" style={{ fontSize: 10, color: 'var(--ft-fg-faint)' }}>
                  .json · .yaml · .yml · max 4MB
                </span>
              </label>
            </Field>
            <Field label="Server ID" required>
              <input className="ft-input ft-input--mono" placeholder="derived from filename" />
            </Field>
          </SheetSection>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4, paddingBottom: 8 }}>
          <Btn>Create server</Btn>
        </div>
      </div>
    </PhoneShell>
  );
}

function DrawerTabM({ active, children }) {
  return (
    <button style={{
      padding: '8px 14px',
      fontSize: 12,
      color: active ? 'var(--ft-fg-strong)' : 'var(--ft-fg-muted)',
      borderBottom: active ? '2px solid var(--ft-ink-12)' : '2px solid transparent',
      marginBottom: -1,
    }}>{children}</button>
  );
}

function SettingRowM({ label, desc, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid var(--ft-hairline)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingRight: 12 }}>
        <span style={{ fontSize: 13, color: 'var(--ft-fg-strong)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>{desc}</span>
      </div>
      {children}
    </div>
  );
}

function CollabM({ name, role }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 0', borderBottom: '1px solid var(--ft-hairline)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          width: 22, height: 22, background: 'var(--ft-ink-12)', color: 'var(--ft-ink-0)',
          display: 'grid', placeItems: 'center', fontFamily: 'var(--ft-mono)', fontSize: 10,
          flexShrink: 0,
        }}>{name.slice(0,2).toUpperCase()}</div>
        <span style={{
          fontSize: 12, color: 'var(--ft-fg-strong)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }} className="ft-mono">{name}</span>
      </div>
      <Badge outline>{role}</Badge>
    </div>
  );
}

Object.assign(window, {
  MobileLogin, MobileServerList,
  MobileDashboardTraffic, MobileDashboardRules, MobileDashboardMore,
  MobileTrafficDetail, MobileCreateRule, MobileAddServer,
});
