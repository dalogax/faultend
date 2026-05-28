/* eslint-disable */
// Faultend · Component artboards. Re-uses atoms.jsx primitives.

/* ----- A · Buttons ----- */
function ABButtons() {
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="02 / Components" title="Button system" hint="Three weights of action — fill, stroke, ghost — and a destructive variant. Icon mode is a 28px square." />

      <div style={{ padding: '24px 32px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>
        <ComponentRow title="Variants">
          <Btn>Save rule</Btn>
          <Btn variant="secondary">Cancel</Btn>
          <Btn variant="ghost">Refresh</Btn>
          <Btn variant="danger">Delete rule</Btn>
          <Btn disabled>Disabled</Btn>
        </ComponentRow>

        <ComponentRow title="Sizes">
          <Btn>Default · 32</Btn>
          <Btn size="sm">Small · 24</Btn>
          <Btn icon><Icon.Plus /></Btn>
          <Btn icon variant="secondary"><Icon.Edit /></Btn>
          <Btn icon variant="ghost"><Icon.Trash /></Btn>
        </ComponentRow>

        <ComponentRow title="With icon + keyboard">
          <Btn><Icon.Plus /> Create rule</Btn>
          <Btn variant="ghost"><Icon.Refresh /> Refresh</Btn>
          <Btn variant="secondary">Save</Btn>
        </ComponentRow>

        <ComponentRow title="States · primary">
          <Btn>Rest</Btn>
          <Btn style={{ background: '#5a5854' }}>Hover</Btn>
          <Btn style={{ background: '#1c1c1a' }}>Active</Btn>
          <Btn disabled>Disabled</Btn>
        </ComponentRow>

        <ComponentRow title="States · secondary">
          <Btn variant="secondary">Rest</Btn>
          <Btn variant="secondary" style={{ background: '#f4f4f3' }}>Hover</Btn>
          <Btn variant="secondary" style={{ background: '#ebebe9' }}>Active</Btn>
          <Btn variant="secondary" disabled>Disabled</Btn>
        </ComponentRow>

        <div style={{ background: 'var(--ft-surface-2)', border: '1px solid var(--ft-border)', padding: 14, fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)' }}>
          <span style={{ color: 'var(--ft-fg-strong)' }}>{'//'} usage</span>{' '}
          Primary fills the single CTA per surface. Ghost is for repeatable actions in toolbars (Refresh, Clear). Danger never primary — only inside confirmation dialogs.
        </div>
      </div>
    </div>
  );
}

function ComponentRow({ title, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'center', gap: 24, borderBottom: '1px solid var(--ft-hairline)', paddingBottom: 20 }}>
      <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-faint)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>{children}</div>
    </div>
  );
}

/* ----- B · Form controls ----- */
function ABForms() {
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="02 / Components" title="Form atoms" hint="Inputs sit on strong black hairlines. Required fields signal with an amber tick — never a red asterisk." />

      <div style={{ padding: '24px 32px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Field label="Server ID" hint="Alphanumeric and hyphens. Must start with a letter.">
            <input className="ft-input" defaultValue="yourapp" />
          </Field>

          <Field label="Priority" required>
            <input className="ft-input ft-input--mono" defaultValue="200" style={{ width: 120 }} />
          </Field>

          <Field label="Path pattern" required hint="JavaScript-flavoured regex.">
            <input className="ft-input ft-input--mono" defaultValue="^/users/[0-9]+$" />
          </Field>

          <Field label="Method">
            <div style={{ position: 'relative' }}>
              <select className="ft-input" defaultValue="ALL" style={{ appearance: 'none', paddingRight: 30 }}>
                <option value="ALL">* (All methods)</option>
                <option>GET</option><option>POST</option><option>PUT</option>
              </select>
              <span style={{ position: 'absolute', right: 10, top: 11, color: 'var(--ft-fg-muted)', pointerEvents: 'none' }}><Icon.ChevDown /></span>
            </div>
          </Field>

          <Field label="Response body" hint="Supports {{timestamp()}}, {{uuid()}}, {{random(n,m)}}.">
            <textarea className="ft-input" defaultValue={`{\n  "id": 1,\n  "name": "John Doe",\n  "email": "john@example.com"\n}`} rows={5} />
          </Field>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)', marginBottom: 12 }}>Radio group</div>
            <div style={{ display: 'flex', gap: 0, border: '1px solid var(--ft-border-strong)' }}>
              <RadioPill active>Proxy</RadioPill>
              <RadioPill>Mock</RadioPill>
              <RadioPill>Fault</RadioPill>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)', marginBottom: 12 }}>Toggle &amp; checkbox</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ft-fg-strong)' }}>
                <Toggle checked={true} /> Rule enabled
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ft-fg-strong)' }}>
                <Toggle checked={false} /> Auto-refresh traffic
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ft-fg-strong)' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#0a0a09', width: 14, height: 14 }} /> Inject across all replicas
              </label>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)', marginBottom: 12 }}>Latency picker</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 0, border: '1px solid var(--ft-border-strong)' }}>
                <RadioPill>None</RadioPill>
                <RadioPill>Fixed</RadioPill>
                <RadioPill active>Range</RadioPill>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Min · ms"><input className="ft-input ft-input--mono" defaultValue="100" /></Field>
                <Field label="Max · ms"><input className="ft-input ft-input--mono" defaultValue="500" /></Field>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)', marginBottom: 12 }}>Error state</div>
            <Field label="Target URL" required>
              <input className="ft-input ft-input--mono" defaultValue="not-a-url" style={{ borderColor: 'var(--ft-red)', boxShadow: 'inset 0 0 0 1px var(--ft-red)' }} />
              <div style={{ fontSize: 11, color: 'var(--ft-red)', marginTop: 4 }}>Must be a valid http(s):// URL.</div>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="ft-field">
      <div className="ft-field-label">{label}{required && <span className="req">*</span>}</div>
      {children}
      {hint && <div className="ft-field-hint">{hint}</div>}
    </div>
  );
}

function RadioPill({ active, children }) {
  return (
    <button
      type="button"
      style={{
        flex: 1,
        height: 32,
        background: active ? 'var(--ft-ink-12)' : 'var(--ft-surface)',
        color: active ? 'var(--ft-fg-on-fill)' : 'var(--ft-fg-strong)',
        fontSize: 12,
        fontFamily: 'var(--ft-font)',
        borderRight: '1px solid var(--ft-border-strong)',
        padding: '0 16px',
        cursor: 'pointer',
      }}
      onClick={(e) => e.preventDefault()}
    >{children}</button>
  );
}

/* ----- C · Badges, toggles, kbd, status pills ----- */
function ABBadgesEtc() {
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="02 / Components" title="Badges, indicators, hints" hint="Three badge families share one shape. Action badges carry the most meaning — they reveal what a rule does at a glance." />

      <div style={{ padding: '24px 32px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignContent: 'start' }}>
        <ComponentRow title="Method">
          <Badge kind="m-GET">GET</Badge>
          <Badge kind="m-POST">POST</Badge>
          <Badge kind="m-PUT">PUT</Badge>
          <Badge kind="m-PATCH">PATCH</Badge>
          <Badge kind="m-DELETE">DELETE</Badge>
          <Badge kind="m-OPTIONS">OPTIONS</Badge>
          <Badge kind="m-HEAD">HEAD</Badge>
        </ComponentRow>

        <ComponentRow title="Status">
          <Badge kind="s-2xx">200</Badge>
          <Badge kind="s-2xx">204</Badge>
          <Badge kind="s-3xx">301</Badge>
          <Badge kind="s-4xx">404</Badge>
          <Badge kind="s-4xx">429</Badge>
          <Badge kind="s-5xx">500</Badge>
          <Badge kind="s-5xx">503</Badge>
        </ComponentRow>

        <ComponentRow title="Action · atoms">
          <Badge kind="a-mock">mock</Badge>
          <Badge kind="a-proxy">proxy</Badge>
          <Badge kind="a-delay">delay</Badge>
          <Badge kind="a-transform">transform</Badge>
        </ComponentRow>

        <ComponentRow title="Action · combinations">
          <span style={{ display: 'inline-flex', gap: 3 }}>
            <Badge kind="a-mock">mock</Badge>
          </span>
          <span style={{ display: 'inline-flex', gap: 3 }}>
            <Badge kind="a-proxy">proxy</Badge>
            <Badge kind="a-delay">delay</Badge>
          </span>
          <span style={{ display: 'inline-flex', gap: 3 }}>
            <Badge kind="a-mock">mock</Badge>
            <Badge kind="a-transform">transform</Badge>
          </span>
          <span style={{ display: 'inline-flex', gap: 3 }}>
            <Badge kind="a-proxy">proxy</Badge>
            <Badge kind="a-delay">delay</Badge>
            <Badge kind="a-transform">transform</Badge>
          </span>
        </ComponentRow>

        <ComponentRow title="Outline · meta">
          <Badge outline>json</Badge>
          <Badge outline>regex</Badge>
          <Badge outline>local</Badge>
          <Badge outline>shared</Badge>
        </ComponentRow>

        <ComponentRow title="Toggles">
          <Toggle checked /> <Toggle checked={false} />
        </ComponentRow>

        <ComponentRow title="Inline duration">
          <LatBar ms={11} max={300} />
          <LatBar ms={42} max={300} />
          <LatBar ms={251} max={300} />
          <LatBar ms={295} max={300} kind="err" />
        </ComponentRow>

        <ComponentRow title="Status dots">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}><Dot kind="live" /> proxy.up</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}><Dot kind="warn" /> 2 rules paused</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}><Dot kind="off" /> backend unreachable</span>
        </ComponentRow>
      </div>
    </div>
  );
}

function Dot({ kind }) {
  const color  = kind === 'live' ? '#1aa052' : kind === 'warn' ? '#e5a100' : '#c4c2bd';
  // Sharp 1px outline instead of a blurred glow — keeps the square crisp.
  const ring   = kind === 'live' ? '0 0 0 2px rgba(26,160,82,0.18)'
               : kind === 'warn' ? '0 0 0 2px rgba(229,161,0,0.20)'
               : 'none';
  return <span style={{ width: 7, height: 7, background: color, boxShadow: ring, display: 'inline-block' }} />;
}

/* ----- D · Data display — table & code ----- */
function ABTables() {
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="02 / Components" title="Tables, code blocks, drawers" hint="Density-first patterns. Tables wear monospace numbers and inline latency bars. Drawers use uppercase eyebrow headers so titles don't compete with content." />

      <div style={{ padding: '24px 32px 32px', display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        <div style={{ border: '1px solid var(--ft-border-strong)' }}>
          <div style={{ background: 'var(--ft-surface)', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--ft-border-strong)' }}>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ft-fg-muted)' }}>Traffic table · sample</div>
            <div className="ft-meta">15 of 1,284 requests</div>
          </div>
          <table className="ft-table">
            <thead>
              <tr><th style={{ width: 80 }}>Method</th><th>Path</th><th style={{ width: 90 }}>Status</th><th style={{ width: 130 }}>Duration</th><th style={{ width: 160 }}>Rule</th></tr>
            </thead>
            <tbody>
              <SampleRow m="GET"    p="/users/42"          s={200} d={42}   labels={['proxy']} />
              <SampleRow m="GET"    p="/users/42/orders"   s={200} d={118}  labels={['mock', 'delay']} />
              <SampleRow m="GET"    p="/products/77"       s={200} d={295}  labels={['proxy', 'transform']} />
              <SampleRow m="POST"   p="/orders"            s={503} d={1812} labels={['proxy', 'delay']} err />
              <SampleRow m="POST"   p="/api/v2/sync"       s={200} d={612}  labels={['mock', 'delay', 'transform']} />
              <SampleRow m="DELETE" p="/posts/1"           s={204} d={9}    labels={['proxy']} muted />
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ border: '1px solid var(--ft-border-strong)' }}>
            <div style={{ background: 'var(--ft-surface)', padding: '8px 12px', borderBottom: '1px solid var(--ft-border)', fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)' }}>headers · request</div>
            <pre className="ft-code" style={{ margin: 0, border: 'none' }}>{`host:           yourapp.faultend.com
accept:         */*
user-agent:     curl/8.5.0
x-fault-id:     f_a9c2-3041
content-length: 0`}</pre>
          </div>

          <div style={{ border: '1px solid var(--ft-border-strong)' }}>
            <div style={{ background: 'var(--ft-surface)', padding: '8px 12px', borderBottom: '1px solid var(--ft-border)', fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)' }}>response · error</div>
            <pre className="ft-code ft-code--err" style={{ margin: 0, border: 'none' }}>{`HTTP/1.1 500 Internal Server Error
content-type: application/json

{
  "error": "ECONNREFUSED",
  "hint":  "backend timed out after 295ms"
}`}</pre>
          </div>

          <div style={{ border: '1px solid var(--ft-border)', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--ft-fg-muted)', textAlign: 'center' }}>
            <Icon.Folder />
            <div style={{ fontSize: 13, color: 'var(--ft-fg-strong)' }}>No traffic yet</div>
            <div style={{ fontSize: 11 }}>Send a request to <span className="ft-mono" style={{ color: 'var(--ft-fg-strong)' }}>:3000</span> to populate this view.</div>
            <Btn size="sm" variant="ghost" style={{ marginTop: 6 }}><Icon.Copy /> Copy proxy URL</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

function SampleRow({ m, p, s, d, labels = [], err, muted }) {
  return (
    <tr>
      <td><Badge kind={`m-${m}`}>{m}</Badge></td>
      <td className="ft-mono" style={{ color: muted ? 'var(--ft-fg-muted)' : 'var(--ft-fg-strong)' }}>{p}</td>
      <td><Badge kind={statusKind(s)}>{s}</Badge></td>
      <td><LatBar ms={d} max={d > 600 ? 2000 : 300} kind={err ? 'err' : (d > 200 ? 'slow' : undefined)} /></td>
      <td>
        <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 3 }}>
          {labels.map((lab) => <Badge key={lab} kind={`a-${lab}`}>{lab}</Badge>)}
        </div>
      </td>
    </tr>
  );
}

/* ----- E · Drawer chrome + dialog ----- */
function ABOverlays() {
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="02 / Components" title="Overlay patterns" hint="Drawer for forms & detail. Inline arm-then-fire for destructive actions — no centered confirm dialogs. Toast for non-blocking feedback." />

      <div style={{ padding: '24px 32px 32px', display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 24 }}>
        {/* Drawer mock */}
        <div style={{ height: 460, border: '1px solid var(--ft-border-strong)', display: 'flex', position: 'relative', overflow: 'hidden' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.35)' }} />
          <div className="ft-drawer" style={{ width: 360, position: 'absolute', right: 0, top: 0, bottom: 0 }}>
            <div className="ft-drawer-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Drawer · 600 → 100%</div>
                <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--ft-fg-strong)', textTransform: 'none', letterSpacing: '-0.01em' }}>Request details</h2>
              </div>
              <Btn icon variant="ghost"><Icon.X /></Btn>
            </div>
            <div className="ft-drawer-body">
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--ft-fg-muted)' }}>method</span><Badge kind="m-DELETE">DELETE</Badge>
                <span style={{ color: 'var(--ft-fg-muted)' }}>path</span><span className="ft-mono" style={{ color: 'var(--ft-fg-strong)' }}>/posts/1</span>
                <span style={{ color: 'var(--ft-fg-muted)' }}>status</span><Badge kind="s-2xx">204</Badge>
                <span style={{ color: 'var(--ft-fg-muted)' }}>duration</span><span className="ft-mono">9ms</span>
              </div>
              <div className="ft-strong-line" />
              <div className="ft-meta">{'//'} matched rule</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                <span>Forward all</span>
                <Badge kind="a-proxy" outline>proxy</Badge>
              </div>
            </div>
            <div className="ft-drawer-footer">
              <Btn variant="ghost" size="sm">Close</Btn>
              <Btn size="sm">Create rule from this</Btn>
            </div>
          </div>
        </div>

        {/* Dialog + toast */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Inline destructive confirmation — replaces the old centered
              dialog. First click arms (text + fill change), second
              fires. Three-second auto-disarm. */}
          <div style={{ height: 220, border: '1px solid var(--ft-border-strong)', padding: 16, background: 'var(--ft-surface)', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 10, left: 14, fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Inline confirm · no popup</div>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)', letterSpacing: '0.06em' }}>idle</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <DangerConfirmBtn size="sm" idleText="Delete server" armed={false} />
              </div>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)', letterSpacing: '0.06em', marginTop: 6 }}>armed · second click fires</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <DangerConfirmBtn size="sm" armedText="Click again to confirm" armed={true} />
              </div>
            </div>
          </div>

          <div style={{ height: 220, border: '1px solid var(--ft-border-strong)', padding: 16, background: 'var(--ft-surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 10, left: 14, fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Toasts · top-right</div>
            <Toast tone="ok">Rule saved · <span style={{ opacity: 0.5 }}>⌘Z to undo</span></Toast>
            <Toast>Rule disabled</Toast>
            <Toast tone="warn">Upstream p95 over 1.2s</Toast>
            <Toast tone="err">Failed to reach backend · retrying…</Toast>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toast({ tone, children }) {
  const map = { ok: 'var(--ft-ink-12)', warn: 'var(--ft-ink-12)', err: 'var(--ft-red)', undefined: 'var(--ft-ink-12)' };
  const dot = { ok: '#5cd97b', warn: 'var(--ft-amber-pure)', err: '#fff' };
  return (
    <div style={{
      background: tone === 'err' ? 'var(--ft-red)' : 'var(--ft-ink-12)',
      color: '#fafafa',
      padding: '8px 12px',
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 12, minWidth: 280,
      border: '1px solid ' + (tone === 'err' ? 'var(--ft-red)' : 'var(--ft-ink-12)'),
    }}>
      {dot[tone] && <span style={{ width: 6, height: 6, background: dot[tone], display: 'inline-block' }} />}
      <span>{children}</span>
    </div>
  );
}

Object.assign(window, { ABButtons, ABForms, ABBadgesEtc, ABTables, ABOverlays });
