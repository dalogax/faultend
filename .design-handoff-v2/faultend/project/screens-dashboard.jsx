/* eslint-disable */
// Faultend · Server Dashboard (two-column traffic + rules)

const SAMPLE_TRAFFIC = [
  { t: '20:25:18', m: 'GET',    p: '/users/42',           s: 200, d: 42,  r: ['proxy'],                       rn: 'Forward users' },
  { t: '20:25:17', m: 'GET',    p: '/users/42/orders',    s: 200, d: 118, r: ['mock', 'delay'],               rn: 'Mock user orders' },
  { t: '20:25:14', m: 'POST',   p: '/orders',             s: 503, d: 1812, r: ['proxy', 'delay'],             rn: 'Flaky writes', err: true, slow: true },
  { t: '20:25:11', m: 'GET',    p: '/products/77',        s: 200, d: 295, r: ['proxy', 'transform'],          rn: 'Strip prices' },
  { t: '20:25:08', m: 'DELETE', p: '/posts/1',            s: 204, d: 22,  r: ['proxy'],                       rn: 'Forward all' },
  { t: '20:25:05', m: 'POST',   p: '/api/v2/sync',        s: 200, d: 612, r: ['mock', 'delay', 'transform'],  rn: 'Sync stub' },
  { t: '20:25:01', m: 'POST',   p: '/posts',              s: 201, d: 88,  r: ['mock'],                        rn: 'Mock orders' },
  { t: '20:24:58', m: 'GET',    p: '/todos/1',            s: 200, d: 14,  r: ['proxy'],                       rn: 'Forward all' },
  { t: '20:24:55', m: 'GET',    p: '/products/12',        s: 200, d: 268, r: ['proxy', 'transform'],          rn: 'Strip prices' },
  { t: '20:24:51', m: 'GET',    p: '/users/5',            s: 200, d: 250, r: ['proxy'],                       rn: 'Forward users' },
  { t: '20:24:49', m: 'PATCH',  p: '/users/3/settings',   s: 204, d: 88,  r: ['proxy', 'transform'],          rn: 'Scrub PII' },
  { t: '20:24:46', m: 'GET',    p: '/users/4/orders',     s: 200, d: 142, r: ['mock', 'delay'],               rn: 'Mock user orders' },
  { t: '20:24:42', m: 'GET',    p: '/users/4',            s: 200, d: 251, r: ['proxy'],                       rn: 'Forward users' },
  { t: '20:24:39', m: 'OPTIONS',p: '/users',              s: 204, d: 3,   r: ['proxy'],                       rn: 'Forward all' },
  { t: '20:24:37', m: 'GET',    p: '/health',             s: 200, d: 6,   r: ['proxy'],                       rn: 'Forward all' },
  { t: '20:24:34', m: 'GET',    p: '/users/3',            s: 200, d: 251, r: ['proxy'],                       rn: 'Forward users' },
  { t: '20:24:30', m: 'GET',    p: '/users/2',            s: 200, d: 252, r: ['proxy'],                       rn: 'Forward users' },
  { t: '20:24:27', m: 'GET',    p: '/users/1',            s: 200, d: 251, r: ['proxy'],                       rn: 'Forward users' },
];

// Each rule has 1–3 labels.
// First label is always either 'mock' or 'proxy' (the base action).
// Then optionally 'delay' (latency injection) and/or 'transform' (post-processor).
const SAMPLE_RULES = [
  { pri: 200, m: 'GET',    pat: '^/users/[0-9]+$',         labels: ['mock'],                       name: 'Mock orders',         on: true,  hits: 412 },
  { pri: 190, m: 'GET',    pat: '^/users/[0-9]+/orders$',  labels: ['mock', 'delay'],              name: 'Mock user orders',    on: true,  hits: 118 },
  { pri: 180, m: 'POST',   pat: '^/orders$',               labels: ['proxy', 'delay'],             name: 'Flaky writes',        on: true,  hits: 8   },
  { pri: 150, m: 'GET',    pat: '^/products/[0-9]+$',      labels: ['proxy', 'transform'],         name: 'Strip prices',        on: true,  hits: 256 },
  { pri: 140, m: 'POST',   pat: '^/api/v2/.*$',            labels: ['mock', 'delay', 'transform'], name: 'Sync stub',           on: true,  hits: 64  },
  { pri: 120, m: 'PATCH',  pat: '^/users/[0-9]+/settings$',labels: ['proxy', 'transform'],         name: 'Scrub PII',           on: false, hits: 88  },
  { pri: 100, m: '*',      pat: '.*',                      labels: ['proxy'],                      name: 'Forward all',         on: true,  hits: 1284 },
];

function ScreenDashboard({ theme = 'light', focus = null }) {
  // focus: 'traffic-detail' | 'create-rule' | 'create-server' | 'settings' | 'confirm' | null
  const server = { id: 'yourapp', url: 'https://yourapp.faultend.com' };

  return (
    <Frame theme={theme}>
      <TopBar server={server} showSettings />

      {/* Two-column main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.35fr 1fr', minHeight: 0, position: 'relative' }}>
        <TrafficColumn />
        <RulesColumn />

        {/* Drawer overlay */}
        {focus && (
          <>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 }} />
            <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 520, zIndex: 2 }}>
              {focus === 'traffic-detail' && <DrawerTrafficDetail />}
              {focus === 'create-rule'    && <DrawerCreateRule mode="proxy" />}
              {focus === 'create-server'  && <DrawerCreateServer />}
              {focus === 'settings'       && <DrawerSettings />}
            </div>
          </>
        )}
      </div>

      <StatusBar items={[
        ['live',  'proxy.up'], null,
        [null,    'up 14h 22m'], null,
        [null,    'yourapp.faultend.com'], null,
        [null,    '1,284 req · 12.4 req/s'],
        null,
        ['warn',  '1 rule paused'],
        'spacer',
        [null,    'p50 42ms'], null, [null, 'p95 318ms'], null, [null, 'err 4.1%'],
      ]} />
    </Frame>
  );
}

function ProxyToolbar() {
  return (
    <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid var(--ft-border)', background: 'var(--ft-surface)' }}>
      <ToolbarMetric label="STATUS"        value={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Dot kind="live" /> running</span>} />
      <ToolbarMetric label="REQUESTS · 24H" value="1,284" mono />
      <ToolbarMetric label="THROUGHPUT"    value="12.4/s" mono sub="↗ +8%" />
      <ToolbarMetric label="ERROR RATE"    value="4.1%"   mono sub="↗ +0.9%" warn />
      <ToolbarMetric label="P50 · P95"     value="42 · 318ms" mono />
      <ToolbarMetric label="ACTIVE RULES"  value="6 / 7"  sub="1 paused" />
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderLeft: '1px solid var(--ft-border)' }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--ft-mono)', color: 'var(--ft-fg-faint)', letterSpacing: '0.08em' }}>LIVE</span>
        <Toggle checked />
      </div>
    </div>
  );
}

function ToolbarMetric({ label, value, sub, mono, warn }) {
  return (
    <div style={{ padding: '10px 18px', borderRight: '1px solid var(--ft-border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--ft-mono)', color: 'var(--ft-fg-faint)', letterSpacing: '0.12em' }}>{label}</div>
      <div style={{
        fontSize: 15, fontFamily: mono ? 'var(--ft-mono)' : 'var(--ft-font)',
        color: warn ? 'var(--ft-amber-ink)' : 'var(--ft-fg-strong)',
        letterSpacing: mono ? 0 : '-0.01em',
      }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: warn ? 'var(--ft-amber-ink)' : 'var(--ft-fg-faint)' }}>{sub}</div>}
    </div>
  );
}

function TrafficColumn() {
  return (
    <div style={{ borderRight: '1px solid var(--ft-border)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <ColumnHeader
        title="Traffic"
        count="1,284"
        right={<>
          <Btn variant="ghost" size="sm"><Icon.Refresh /> Refresh</Btn>
          <Btn variant="ghost" size="sm"><Icon.Trash /> Clear</Btn>
        </>}
      />

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--ft-surface-2)', borderBottom: '1px solid var(--ft-hairline)' }}>
        <Icon.Filter style={{ color: 'var(--ft-fg-muted)' }} />
        <FilterChip label="method"  value="all" />
        <FilterChip label="status"  value="all" />
        <FilterChip label="rule"    value="all" />
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: 7, color: 'var(--ft-fg-faint)' }}><Icon.Search /></span>
          <input className="ft-input ft-input--mono" placeholder="filter path · regex supported" style={{ paddingLeft: 32, height: 28, fontSize: 12 }} />
        </div>
        <button style={{
          flexShrink: 0,
          height: 28, padding: '0 10px',
          fontFamily: 'var(--ft-mono)', fontSize: 11,
          background: 'var(--ft-surface)', border: '1px solid var(--ft-border)',
          color: 'var(--ft-fg-muted)', letterSpacing: '0.04em',
        }}>clear</button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <table className="ft-table" style={{ minWidth: '100%' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr>
              <th style={{ width: 76 }}>Time</th>
              <th style={{ width: 76 }}>Method</th>
              <th>Path</th>
              <th style={{ width: 84 }}>Status</th>
              <th style={{ width: 130 }}>Duration</th>
              <th style={{ width: 180 }}>Rule</th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_TRAFFIC.map((r, i) => (
              <tr key={i} style={{ background: i === 2 ? 'var(--ft-amber-bg)' : undefined }}>
                <td className="muted ft-mono" style={{ fontSize: 11 }}>{r.t}</td>
                <td><Badge kind={`m-${r.m}`}>{r.m}</Badge></td>
                <td className="ft-mono" style={{ color: 'var(--ft-fg-strong)' }}>{r.p}</td>
                <td><Badge kind={statusKind(r.s)}>{r.s}</Badge></td>
                <td><LatBar ms={r.d} max={r.slow ? 2000 : 300} kind={r.err ? 'err' : (r.d > 200 ? 'slow' : '')} /></td>
                <td>
                  <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 3 }}>
                    {r.r.map((lab) => (
                      <Badge key={lab} kind={`a-${lab}`}>{lab}</Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({ label, value }) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 26, padding: '0 10px',
      background: 'var(--ft-surface)', border: '1px solid var(--ft-border)',
      fontSize: 12, color: 'var(--ft-fg-strong)',
    }}>
      <span style={{ color: 'var(--ft-fg-muted)' }}>{label}</span>
      <span className="ft-mono" style={{ fontSize: 11 }}>{value}</span>
      <Icon.ChevDown style={{ color: 'var(--ft-fg-faint)' }} />
    </button>
  );
}

function RulesColumn() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <ColumnHeader
        title="Rules"
        count="7"
        right={<Btn size="sm"><Icon.Plus /> New rule</Btn>}
      />

      {/* Priority hint */}
      <div style={{ padding: '8px 16px', background: 'var(--ft-surface-2)', borderBottom: '1px solid var(--ft-hairline)', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>Higher priority rules evaluate first. Drag <Icon.Drag style={{ verticalAlign: 'middle', margin: '0 2px' }} /> to reorder.</span>
        <span style={{ fontSize: 11, color: 'var(--ft-fg-faint)', fontFamily: 'var(--ft-mono)' }}>evaluated top → bottom</span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
        <table className="ft-table">
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr>
              <th style={{ width: 24 }}></th>
              <th style={{ width: 50 }}>Pri</th>
              <th>Pattern</th>
              <th style={{ width: 168 }}>Action</th>
              <th style={{ width: 66, textAlign: 'right' }}>Hits</th>
              <th style={{ width: 44 }}>On</th>
              <th style={{ width: 56 }}></th>
            </tr>
          </thead>
          <tbody>
            {SAMPLE_RULES.map((r, i) => (
              <tr key={i} style={{ opacity: r.on ? 1 : 0.55 }}>
                <td style={{ color: 'var(--ft-fg-faint)', cursor: 'grab' }}><Icon.Drag /></td>
                <td className="num">{r.pri}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="ft-mono">
                    <Badge kind={r.m === '*' ? 'a-pass' : `m-${r.m}`}>{r.m}</Badge>
                    <span style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>{r.pat}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 3 }}>
                    {r.labels.map((lab) => (
                      <Badge key={lab} kind={`a-${lab}`}>{lab}</Badge>
                    ))}
                  </div>
                </td>
                <td className="num" style={{ textAlign: 'right' }}>{r.hits.toLocaleString()}</td>
                <td><Toggle checked={r.on} /></td>
                <td style={{ display: 'flex', gap: 4 }}>
                  <Btn icon variant="ghost" size="sm"><Icon.Edit /></Btn>
                  <Btn icon variant="ghost" size="sm"><Icon.Trash /></Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColumnHeader({ title, count, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--ft-border-strong)', background: 'var(--ft-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ft-fg-strong)' }}>{title}</h2>
        <span className="ft-meta">{count}</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>{right}</div>
    </div>
  );
}

Object.assign(window, { ScreenDashboard, ProxyToolbar, TrafficColumn, RulesColumn });
