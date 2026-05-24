/* eslint-disable */
// Faultend · Drawer & dialog overlays. Each renders a 520px-wide panel,
// designed to layer on top of <ScreenDashboard>.

function DrawerHeader({ eyebrow, title, sub, onClose }) {
  return (
    <div className="ft-drawer-header">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{eyebrow}</div>
        <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--ft-fg-strong)', textTransform: 'none', letterSpacing: '-0.015em' }}>{title}</h2>
        {sub && <div style={{ fontSize: 12, color: 'var(--ft-fg-muted)' }}>{sub}</div>}
      </div>
      <Btn icon variant="ghost"><Icon.X /></Btn>
    </div>
  );
}

function DrawerSectionHead({ children, count, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--ft-border-strong)', paddingBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ft-fg-muted)' }}>{children}</span>
        {count && <span style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)' }}>{count}</span>}
      </div>
      {right}
    </div>
  );
}

function DRow({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', alignItems: 'center', padding: '6px 0', fontSize: 13 }}>
      <span style={{ fontSize: 11, color: 'var(--ft-fg-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div>{children}</div>
    </div>
  );
}

/* ============================================================
   TRAFFIC DETAIL
============================================================ */
function DrawerTrafficDetail() {
  return (
    <div className="ft-drawer" style={{ width: '100%', height: '100%' }}>
      <DrawerHeader
        eyebrow="Request · f_a9c2-3041"
        title="POST /api/v2/sync"
        sub="Inspected on yourapp"
      />
      <div className="ft-drawer-body">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <DrawerSectionHead>Overview</DrawerSectionHead>
          <DRow label="method">  <Badge kind="m-POST" lg>POST</Badge></DRow>
          <DRow label="path">    <span className="ft-mono" style={{ color: 'var(--ft-fg-strong)' }}>/api/v2/sync</span></DRow>
          <DRow label="status">  <Badge kind="s-2xx" lg>200 OK</Badge></DRow>
          <DRow label="duration"><span className="ft-mono">612ms</span></DRow>
          <DRow label="timestamp"><span className="ft-mono" style={{ color: 'var(--ft-fg-muted)' }}>2026-05-14T20:25:05.124Z</span></DRow>
          <DRow label="target">  <span className="ft-mono" style={{ color: 'var(--ft-fg-muted)' }}>https://api.yourapp.com</span></DRow>
          <DRow label="client">  <span className="ft-mono" style={{ color: 'var(--ft-fg-muted)' }}>127.0.0.1 · curl/8.5.0</span></DRow>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <DrawerSectionHead right={<Badge outline>matched</Badge>}>Matched rule</DrawerSectionHead>
          <div style={{ border: '1px solid var(--ft-border)', background: 'var(--ft-surface-2)', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', gap: 3 }}>
                  <Badge kind="a-mock">mock</Badge>
                  <Badge kind="a-delay">delay</Badge>
                  <Badge kind="a-transform">transform</Badge>
                </div>
                <span className="ft-mono" style={{ fontSize: 13, color: 'var(--ft-fg-strong)' }}>POST · ^/api/v2/.*$</span>
              </div>
              <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>Sync stub · priority 140 · rule_42</span>
            </div>
            <Btn size="sm" variant="ghost"><Icon.Edit /> Edit</Btn>
          </div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <DrawerSectionHead right={<Btn size="sm" variant="ghost"><Icon.Copy /> Copy</Btn>}>Request</DrawerSectionHead>
          <div style={{ border: '1px solid var(--ft-border)' }}>
            <div style={{ background: 'var(--ft-surface-2)', padding: '6px 10px', fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)', borderBottom: '1px solid var(--ft-border)' }}>headers</div>
            <pre className="ft-code" style={{ margin: 0, border: 'none' }}>{`host:           yourapp.faultend.com
accept:         */*
user-agent:     curl/8.5.0
x-request-id:   r_2f5e-1140
content-length: 0`}</pre>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ft-fg-faint)' }}>{'//'} no request body</div>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <DrawerSectionHead>Response</DrawerSectionHead>
          <div style={{ border: '1px solid var(--ft-border)' }}>
            <div style={{ background: 'var(--ft-surface-2)', padding: '6px 10px', fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)', borderBottom: '1px solid var(--ft-border)' }}>body · injected by rule</div>
            <pre className="ft-code" style={{ margin: 0, border: 'none' }}>{`{
  "id":     7421,
  "status": "queued",
  "ts":     1715724305124
}`}</pre>
          </div>
        </section>
      </div>

      <div className="ft-drawer-footer">
        <Btn size="sm"><Icon.Plus /> Create rule from this</Btn>
      </div>
    </div>
  );
}

/* ============================================================
   CREATE RULE
============================================================ */
function DrawerCreateRule({ mode = 'mock', transform = true }) {
  return (
    <div className="ft-drawer" style={{ width: '100%', height: '100%' }}>
      <DrawerHeader eyebrow="New rule · on yourapp" title="Create rule" sub="Define how this server should respond to matched requests." />
      <div className="ft-drawer-body">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DrawerSectionHead>Match</DrawerSectionHead>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
            <Field label="Priority" required>
              <input className="ft-input ft-input--mono" defaultValue="100" />
            </Field>
            <Field label="Method">
              <div style={{ position: 'relative' }}>
                <select className="ft-input" defaultValue="ALL" style={{ appearance: 'none', paddingRight: 30 }}>
                  <option value="ALL">* (Any method)</option>
                  <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
                </select>
                <span style={{ position: 'absolute', right: 10, top: 11, color: 'var(--ft-fg-muted)' }}><Icon.ChevDown /></span>
              </div>
            </Field>
          </div>
          <Field label="Path pattern" required hint="JavaScript-flavoured regex · evaluated against request path.">
            <input className="ft-input ft-input--mono" defaultValue="^/users/[0-9]+$" />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ft-fg-strong)' }}>
            <Toggle checked /> Enabled
          </label>
        </section>

        {/* ============ 1 · ACTION (proxy | mock) ============ */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DrawerSectionHead>Action</DrawerSectionHead>
          <div style={{ display: 'flex', border: '1px solid var(--ft-border-strong)' }}>
            <ActionTab kind="proxy" active={mode === 'proxy'}>Proxy</ActionTab>
            <ActionTab kind="mock"  active={mode === 'mock'}>Mock</ActionTab>
          </div>

          {mode === 'proxy' && (
            <Field label="Target URL" required hint="Where matched requests are forwarded.">
              <input className="ft-input ft-input--mono" defaultValue="https://api.yourapp.com" />
            </Field>
          )}

          {mode === 'mock' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12 }}>
                <Field label="Status code" required>
                  <input className="ft-input ft-input--mono" defaultValue="200" />
                </Field>
                <Field label="Content type">
                  <input className="ft-input ft-input--mono" defaultValue="application/json" />
                </Field>
              </div>
              <Field label="Response body" hint={<>Supports <span className="ft-mono">{'{{timestamp()}}'}</span>, <span className="ft-mono">{'{{uuid()}}'}</span>, <span className="ft-mono">{'{{random(min,max)}}'}</span>.</>}>
                <textarea className="ft-input" rows={6} defaultValue={`{\n  "id":    {{random(1,1000)}},\n  "name":  "John Doe",\n  "email": "john@example.com",\n  "ts":    {{timestamp()}}\n}`} />
              </Field>
            </>
          )}
        </section>

        {/* ============ 2 · TRANSFORM (JS post-processor) ============ */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <DrawerSectionHead right={<Toggle checked={transform} />}>
            Transform
          </DrawerSectionHead>
          <div style={{ fontSize: 12, color: 'var(--ft-fg-muted)', lineHeight: 1.55 }}>
            Run a function on the response before it returns to the client. Mutate the body, rewrite headers, override the status — whatever you need.
          </div>

          <div style={{ border: '1px solid var(--ft-border-strong)', background: 'var(--ft-surface)', opacity: transform ? 1 : 0.5 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr' }}>
              {/* gutter */}
              <pre className="ft-mono" style={{
                margin: 0, padding: '10px 0', textAlign: 'right',
                fontSize: 11.5, lineHeight: '18px', color: 'var(--ft-fg-faint)',
                background: 'var(--ft-surface-2)', borderRight: '1px solid var(--ft-border)',
                userSelect: 'none',
              }}>{`1\n2\n3\n4\n5\n6`}</pre>
              {/* code */}
              <pre className="ft-mono" style={{
                margin: 0, padding: '10px 12px',
                fontSize: 11.5, lineHeight: '18px', color: 'var(--ft-fg-strong)',
                whiteSpace: 'pre', overflow: 'auto', background: 'transparent',
              }}>
{`// res.status, res.headers, res.body are mutable
if (req.headers['x-debug']) {
  res.body.debug = { ruleId: rule.id };
}
res.body.email = res.body.email.replace(/@.+$/, '@redacted');
res.headers['x-faultend-touched'] = '1';`}
              </pre>
            </div>
            {/* footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderTop: '1px solid var(--ft-border)', background: 'var(--ft-surface-2)' }}>
              <span className="ft-mono" style={{ fontSize: 10, color: 'var(--ft-fg-faint)' }}>
                runs after mock or proxy · before latency
              </span>
              <Btn variant="ghost" size="sm">Snippets ▾</Btn>
            </div>
          </div>

          <div style={{ fontSize: 11, fontFamily: 'var(--ft-mono)', color: 'var(--ft-fg-faint)' }}>
            sandboxed · 50ms timeout · no fs / no net
          </div>
        </section>

        {/* ============ 3 · LATENCY (independent — applies to both) ============ */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DrawerSectionHead right={<Toggle checked />}>Latency</DrawerSectionHead>
          <div style={{ display: 'flex', border: '1px solid var(--ft-border-strong)' }}>
            <RadioPill>Fixed</RadioPill>
            <RadioPill active>Range</RadioPill>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Min · ms"><input className="ft-input ft-input--mono" defaultValue="100" /></Field>
            <Field label="Max · ms"><input className="ft-input ft-input--mono" defaultValue="500" /></Field>
          </div>
        </section>
      </div>

      <div className="ft-drawer-footer">
        <Btn size="sm">Save rule</Btn>
      </div>
    </div>
  );
}

function ActionTab({ kind, active, children }) {
  const ind = { proxy: 'a-proxy', mock: 'a-mock' }[kind];
  return (
    <button style={{
      flex: 1,
      height: 40,
      display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
      background: active ? 'var(--ft-ink-12)' : 'var(--ft-surface)',
      color: active ? 'var(--ft-fg-on-fill)' : 'var(--ft-fg-strong)',
      borderRight: '1px solid var(--ft-border-strong)',
      fontSize: 13,
    }}>
      <span style={{
        display: 'inline-block', width: 8, height: 8,
        background: getComputedStyle ? '' : '',
      }} className={`ft-badge ${ind}`} />
      {children}
    </button>
  );
}

/* ============================================================
   CREATE SERVER
============================================================ */
function DrawerCreateServer() {
  return (
    <div className="ft-drawer" style={{ width: '100%', height: '100%' }}>
      <DrawerHeader eyebrow="New" title="Add fault server" />
      <div className="ft-drawer-body">
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ft-border-strong)' }}>
          <DrawerTab active>Manual</DrawerTab>
          <DrawerTab>Import from file</DrawerTab>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DrawerSectionHead>Identity</DrawerSectionHead>
          <Field label="Server ID" required hint="Alphanumeric and hyphens · must start with a letter · used as subdomain.">
            <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--ft-border-strong)' }}>
              <input className="ft-input ft-input--mono" defaultValue="yourapp" style={{ border: 'none', flex: 1, height: 34 }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 12px', background: 'var(--ft-surface-2)', borderLeft: '1px solid var(--ft-border)', fontFamily: 'var(--ft-mono)', fontSize: 12, color: 'var(--ft-fg-muted)' }}>.faultend.com</span>
            </div>
          </Field>
        </section>
      </div>

      <div className="ft-drawer-footer">
        <Btn size="sm">Create server</Btn>
      </div>
    </div>
  );
}

function DrawerTab({ active, children }) {
  return (
    <button style={{
      padding: '10px 16px',
      fontSize: 13,
      color: active ? 'var(--ft-fg-strong)' : 'var(--ft-fg-muted)',
      borderBottom: active ? '2px solid var(--ft-ink-12)' : '2px solid transparent',
      marginBottom: -1,
    }}>{children}</button>
  );
}

function SeedRow({ act, name, pat, on }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '1px solid var(--ft-border)', background: on ? 'var(--ft-surface)' : 'var(--ft-surface-2)' }}>
      <Toggle checked={on} />
      <Badge kind={`a-${act}`}>{act}</Badge>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, color: on ? 'var(--ft-fg-strong)' : 'var(--ft-fg-muted)' }}>{name}</span>
        <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-faint)' }}>{pat}</span>
      </div>
    </div>
  );
}

/* ============================================================
   SETTINGS DRAWER
============================================================ */
function DrawerSettings() {
  return (
    <div className="ft-drawer" style={{ width: '100%', height: '100%' }}>
      <DrawerHeader eyebrow="Server" title="yourapp · settings" />
      <div className="ft-drawer-body">
        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DrawerSectionHead>Behaviour</DrawerSectionHead>
          <SettingRow label="Recording" desc="Capture every request that flows through this proxy.">
            <Toggle checked />
          </SettingRow>
          <SettingRow label="Default latency" desc="Apply to all proxied requests with no matching rule.">
            <span className="ft-mono" style={{ fontSize: 12 }}>0ms</span>
          </SettingRow>
          <Field label="Preserve headers" hint="Forwarded verbatim to the upstream on every proxied request.">
            <input className="ft-input ft-input--mono" defaultValue="authorization, x-request-id, x-trace" />
          </Field>
        </section>

        <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <DrawerSectionHead>Sharing · 3 collaborators</DrawerSectionHead>
          <Collab name="dev@faultend.io" role="Owner" />
          <Collab name="qa@faultend.io"  role="Edit" />
          <Collab name="ops@faultend.io" role="View" />

          {/* Link sharing — the actual mechanism. Anyone with the link
              joins at the role selected here. */}
          <div style={{
            marginTop: 6,
            border: '1px solid var(--ft-border)',
            background: 'var(--ft-surface-2)',
            padding: '10px 12px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>Share by link</span>
                <span style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>Anyone with the link can view this server.</span>
              </div>
              <Toggle checked />
            </div>
            <div style={{ display: 'flex', alignItems: 'stretch', border: '1px solid var(--ft-border-strong)', background: 'var(--ft-surface)' }}>
              <span className="ft-mono" style={{
                flex: 1, padding: '0 10px',
                display: 'flex', alignItems: 'center',
                fontSize: 12, color: 'var(--ft-fg-strong)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>https://faultend.com/share/sv_a9c2-3041-yourapp</span>
              <Btn size="sm" variant="ghost" style={{ border: 'none', borderLeft: '1px solid var(--ft-border)' }}><Icon.Copy /> Copy link</Btn>
            </div>
          </div>
        </section>

        <section style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Btn variant="ghost" size="sm"><Icon.Copy /> Export</Btn>
          <DangerConfirmBtn size="sm" idleText="Delete server" armedText="Click again to confirm" />
        </section>
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--ft-hairline)' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 13, color: 'var(--ft-fg-strong)' }}>{label}</span>
        <span style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>{desc}</span>
      </div>
      {children}
    </div>
  );
}

function Collab({ name, role }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--ft-hairline)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 24, height: 24, background: 'var(--ft-ink-12)', color: 'var(--ft-ink-0)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ft-mono)', fontSize: 11 }}>
          {name.slice(0,2).toUpperCase()}
        </div>
        <span style={{ fontSize: 13, color: 'var(--ft-fg-strong)' }} className="ft-mono">{name}</span>
      </div>
      <Badge outline>{role}</Badge>
    </div>
  );
}

Object.assign(window, {
  DrawerTrafficDetail, DrawerCreateRule,
  DrawerCreateServer, DrawerSettings,
});
