/* eslint-disable */
// Faultend · foundations cards (color, type, spacing, motion)
// Each component is an artboard body — wrap in a div with className="ft" + theme.

const FT_INK_TOKENS = [
  ['ink-0', '#ffffff', 'Surface'],
  ['ink-1', '#fafafa', 'Canvas'],
  ['ink-2', '#f4f4f3', 'Alt surface'],
  ['ink-3', '#ebebe9', 'Hairline'],
  ['ink-4', '#dedcd8', 'Border'],
  ['ink-5', '#c4c2bd', 'Strong border'],
  ['ink-7', '#8a8884', 'Faint text'],
  ['ink-9', '#5a5854', 'Muted text'],
  ['ink-10','#3a3936', 'Secondary text'],
  ['ink-11','#1c1c1a', 'Primary text'],
  ['ink-12','#0a0a09', 'Strong fg / fill'],
];

const FT_METHODS = [
  ['GET',     '#dce8f5', '#1e3a5f'],
  ['POST',    '#d5e8dc', '#1b4332'],
  ['PUT',     '#f0dcc2', '#5c3d1f'],
  ['PATCH',   '#dae5e0', '#2e4f47'],
  ['DELETE',  '#f0cacd', '#5c1f22'],
  ['OPTIONS', '#e0d5ee', '#3f2a5c'],
  ['HEAD',    '#eeeac8', '#4f4818'],
];

const FT_STATUS = [
  ['2xx · Success',      '#d5e8dc', '#1b4332', '200'],
  ['3xx · Redirect',     '#c9dde3', '#1f4146', '304'],
  ['4xx · Client Error', '#f0e3b8', '#5c4318', '404'],
  ['5xx · Server Error', '#f0cacd', '#5c1f22', '500'],
];

const FT_ACTIONS = [
  ['mock',  '#dcdff5', '#1f2659', 'Synthetic response'],
  ['proxy', '#cfe8dc', '#1a3f2a', 'Forward to backend'],
  ['fault', '#fff1c2', '#5c4318', 'Inject HTTP error'],
  ['delay', '#e8dfd0', '#4f3a1f', 'Add latency'],
  ['pass',  '#ebebe9', '#3a3936', 'No-op / unmatched'],
];

/* ---------------- Card chrome ---------------- */
function ABHeader({ eyebrow, title, hint }) {
  return (
    <div style={{ padding: '24px 32px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{eyebrow}</div>
      <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ft-fg-strong)' }}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: 'var(--ft-fg-muted)', marginTop: 2 }}>{hint}</div>}
    </div>
  );
}

/* ---------------- A · Color — Neutrals ---------------- */
function ABColorNeutrals() {
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="01 / Foundations · Color" title="Ink scale" hint="11 neutrals — the entire interface is built from these." />
      <div style={{ padding: '24px 32px 32px', display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 0, marginTop: 16 }}>
        {FT_INK_TOKENS.map(([name, hex, role], i) => (
          <div key={name} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 140, background: hex, borderRight: i < 10 ? '1px solid var(--ft-border)' : 'none', borderBottom: '1px solid var(--ft-border-strong)' }} />
            <div style={{ padding: '10px 8px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-strong)' }}>{name}</div>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)' }}>{hex}</div>
              <div style={{ fontSize: 11, color: 'var(--ft-fg-muted)', marginTop: 2 }}>{role}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '0 32px 24px', marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <SignalRow name="Signal · Amber" desc="Used ONLY for fault indicators. Never decorative." swatches={[
          ['amber-bg',   '#fff4d1'],
          ['amber-line', '#e5c168'],
          ['amber-pure', '#e5a100'],
          ['amber-ink',  '#6b4d00'],
        ]} />
        <SignalRow name="Danger · Red" desc="Destructive confirmations and 5xx responses." swatches={[
          ['red-bg',     '#fbe6e6'],
          ['red',        '#c32d2d'],
          ['red-ink',    '#5c1212'],
          ['ink-12',     '#0a0a09'],
        ]} />
      </div>
    </div>
  );
}

function SignalRow({ name, desc, swatches }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ft-fg-strong)' }}>{name}</div>
      <div style={{ fontSize: 12, color: 'var(--ft-fg-muted)', marginTop: 2 }}>{desc}</div>
      <div style={{ display: 'flex', marginTop: 10, border: '1px solid var(--ft-border)' }}>
        {swatches.map(([n, hex], i) => (
          <div key={n} style={{ flex: 1, borderRight: i < swatches.length - 1 ? '1px solid var(--ft-border)' : 'none' }}>
            <div style={{ height: 56, background: hex }} />
            <div style={{ padding: '6px 8px', borderTop: '1px solid var(--ft-border)' }}>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-strong)' }}>{n}</div>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 9, color: 'var(--ft-fg-faint)' }}>{hex}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- B · Color — Badges ---------------- */
function ABColorBadges() {
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="01 / Foundations · Color" title="Signal palette" hint="The only chroma in the UI lives inside badges — method, status, and rule action." />

      <div style={{ padding: '24px 32px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <SwatchSectionHeader>HTTP Method</SwatchSectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FT_METHODS.map(([m, bg, fg]) => (
              <div key={m} style={{ display: 'grid', gridTemplateColumns: '88px 1fr 1fr', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--ft-hairline)' }}>
                <Badge kind={`m-${m}`} lg>{m}</Badge>
                <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)' }}>{bg}</div>
                <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)' }}>{fg}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <SwatchSectionHeader>Status family</SwatchSectionHeader>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FT_STATUS.map(([label, bg, fg, code]) => (
              <div key={code} style={{ display: 'grid', gridTemplateColumns: '88px 1fr 1fr', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--ft-hairline)' }}>
                <Badge kind={`s-${code[0]}xx`} lg>{code}</Badge>
                <div style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>{label}</div>
                <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)' }}>{bg}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>
        <SwatchSectionHeader>Rule action</SwatchSectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, border: '1px solid var(--ft-border)' }}>
          {FT_ACTIONS.map(([a, bg, fg, desc], i) => (
            <div key={a} style={{ padding: 16, borderRight: i < FT_ACTIONS.length - 1 ? '1px solid var(--ft-border)' : 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Badge kind={`a-${a}`} lg>{a}</Badge>
              <div style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>{desc}</div>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)' }}>{bg}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SwatchSectionHeader({ children }) {
  return (
    <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)', borderBottom: '1px solid var(--ft-border-strong)', paddingBottom: 8, marginBottom: 12 }}>
      {children}
    </div>
  );
}

/* ---------------- C · Typography ---------------- */
function ABTypography() {
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="01 / Foundations · Type" title="Inter Variable & JetBrains Mono" hint="Sans for prose. Mono for telemetry — paths, IDs, durations, status codes. Numbers always tabular." />

      <div style={{ padding: '24px 32px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <SwatchSectionHeader>Inter · UI</SwatchSectionHeader>
          <TypeRow size={36} weight={400} label="36 / Display"     line={1.1} text="Resilience is rehearsed." />
          <TypeRow size={26} weight={500} label="26 / Title"       line={1.2} text="yourapp · Traffic" />
          <TypeRow size={20} weight={500} label="20 / Subtitle"    line={1.3} text="Matched rule" />
          <TypeRow size={16} weight={400} label="16 / Body large"  line={1.5} text="Forward all GET /users to the production gateway." />
          <TypeRow size={13} weight={400} label="13 / Body · default" line={1.45} text="Higher priority rules are evaluated first." />
          <TypeRow size={12} weight={400} label="12 / Caption"     line={1.4} text="Updated 2 seconds ago" muted />
          <TypeRow size={11} weight={500} label="11 / Eyebrow"     line={1.3} text="MATCHED RULE" upper letterSp=".12em" muted />
        </div>
        <div>
          <SwatchSectionHeader>JetBrains Mono · Telemetry</SwatchSectionHeader>
          <TypeRow size={20} weight={400} label="20 / Mono · prominent"  mono text="295ms" />
          <TypeRow size={14} weight={400} label="14 / Mono · path"       mono text="GET  /users/42/orders" />
          <TypeRow size={13} weight={400} label="13 / Mono · field"      mono text="x-fault-id: f_a9c2-3041" />
          <TypeRow size={12} weight={400} label="12 / Mono · table cell" mono text="https://yourapp.faultend.com" />
          <TypeRow size={11} weight={400} label="11 / Mono · meta"       mono text="2026-05-14T20:25:05.124Z" muted />

          <div style={{ marginTop: 24 }}>
            <SwatchSectionHeader>Tabular numbers</SwatchSectionHeader>
            <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 13, color: 'var(--ft-fg-strong)', display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px 16px', fontFeatureSettings: '"tnum","zero"' }}>
              <span>requests</span><span style={{ textAlign: 'right' }}>1,284,019</span>
              <span>p50 latency</span><span style={{ textAlign: 'right' }}>  42ms</span>
              <span>p95 latency</span><span style={{ textAlign: 'right' }}> 318ms</span>
              <span>p99 latency</span><span style={{ textAlign: 'right' }}>1,902ms</span>
              <span>error rate</span><span style={{ textAlign: 'right' }}>  0.041</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 32px 32px' }}>
        <div style={{ background: 'var(--ft-surface-2)', border: '1px solid var(--ft-border)', padding: 16, fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)' }}>
          <span style={{ color: 'var(--ft-fg-strong)' }}>{'//'} principle </span>
          One sans, one mono, one weight per role. Hierarchy comes from size and color — never from bold runs of prose. Mono signals "machine-truth": a value that came from the system and shouldn't be edited.
        </div>
      </div>
    </div>
  );
}

function TypeRow({ size, weight, line, label, text, mono, upper, muted, letterSp }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', alignItems: 'baseline', padding: '10px 0', borderBottom: '1px solid var(--ft-hairline)', gap: 16 }}>
      <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{
        fontFamily: mono ? 'var(--ft-mono)' : 'var(--ft-font)',
        fontSize: size, fontWeight: weight, lineHeight: line || 1.4,
        textTransform: upper ? 'uppercase' : 'none',
        letterSpacing: letterSp || (size >= 26 ? '-0.015em' : '-0.005em'),
        color: muted ? 'var(--ft-fg-muted)' : 'var(--ft-fg-strong)'
      }}>{text}</div>
    </div>
  );
}

/* ---------------- D · Spacing & layout ---------------- */
function ABSpacing() {
  const steps = [
    ['sp-1',  2,  'Hairline / icon tweak'],
    ['sp-2',  4,  'Badge padding · gaps'],
    ['sp-3',  8,  'Button padding · tight stack'],
    ['sp-4', 12,  'Default gap · table cell'],
    ['sp-5', 16,  'Section padding'],
    ['sp-6', 24,  'Drawer body gap'],
    ['sp-7', 32,  'Page padding'],
    ['sp-8', 48,  'Large hero gap'],
    ['sp-9', 64,  'Full-page padding'],
  ];
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="01 / Foundations · Spacing" title="9-step scale · 2px base" hint="No magic numbers. All gaps, paddings, and margins ride the 2 / 4 / 8 grid." />

      <div style={{ padding: '24px 32px 32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          {steps.map(([name, px, use]) => (
            <div key={name} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--ft-hairline)', gap: 16 }}>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-strong)' }}>--ft-{name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ display: 'block', height: 14, width: px, background: 'var(--ft-ink-12)' }} />
                <span style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>{use}</span>
              </div>
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-faint)', textAlign: 'right' }}>{px}px</div>
            </div>
          ))}
        </div>

        <div>
          <SwatchSectionHeader>Borders & lines</SwatchSectionHeader>
          <BorderRow label="hairline · row separator">
            <div style={{ height: 0, borderTop: '1px solid #ebebe9' }} />
          </BorderRow>
          <BorderRow label="border · standard">
            <div style={{ height: 0, borderTop: '1px solid #dedcd8' }} />
          </BorderRow>
          <BorderRow label="border-strong · section / input">
            <div style={{ height: 0, borderTop: '1px solid #0a0a09' }} />
          </BorderRow>
          <BorderRow label="border-focus · 2px inset">
            <div style={{ height: 0, borderTop: '2px solid #0a0a09' }} />
          </BorderRow>

          <div style={{ marginTop: 32 }}>
            <SwatchSectionHeader>Corner radius</SwatchSectionHeader>
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end' }}>
              <div style={{ width: 80, height: 80, background: 'var(--ft-ink-12)' }} />
              <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 12, color: 'var(--ft-fg-strong)' }}>
                radius = 0
                <div style={{ fontSize: 11, color: 'var(--ft-fg-muted)', marginTop: 4 }}>Always. Sharp edges are the brand.</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            <SwatchSectionHeader>Elevation</SwatchSectionHeader>
            <div style={{ fontSize: 12, color: 'var(--ft-fg-muted)' }}>
              No shadows. Depth comes from <span style={{ color: 'var(--ft-fg-strong)' }}>1px borders</span> and <span style={{ color: 'var(--ft-fg-strong)' }}>surface contrast</span> only.
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
              <div style={{ width: 80, height: 56, background: 'var(--ft-ink-1)', border: '1px solid var(--ft-border)', display: 'grid', placeItems: 'center', fontSize: 11, color: 'var(--ft-fg-muted)' }}>bg</div>
              <div style={{ width: 80, height: 56, background: 'var(--ft-surface)', border: '1px solid var(--ft-border)', display: 'grid', placeItems: 'center', fontSize: 11, color: 'var(--ft-fg-muted)' }}>surface</div>
              <div style={{ width: 80, height: 56, background: 'var(--ft-surface)', border: '1px solid var(--ft-border-strong)', display: 'grid', placeItems: 'center', fontSize: 11, color: 'var(--ft-fg-strong)' }}>raised</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BorderRow({ label, children }) {
  return (
    <div style={{ padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 8, borderBottom: '1px solid var(--ft-hairline)' }}>
      <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)' }}>{label}</div>
      {children}
    </div>
  );
}

/* ---------------- E · Brand mark ---------------- */
function ABBrand() {
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="00 / Brand" title="Mark, wordmark, lockup" hint="A hand-traced lightning arrow — a request mid-flight, interrupted. The mark is the only piece of the system that isn't geometric." />
      <div style={{ flex: 1, padding: '24px 32px 32px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
        <div style={{ background: 'var(--ft-surface)', border: '1px solid var(--ft-border)', display: 'grid', placeItems: 'center', padding: 32, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 12, left: 16, fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Primary lockup</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <FaultendMark size={140} />
            <div style={{ fontSize: 56, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--ft-fg-strong)' }}>faultend</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <MarkTile label="48px"><FaultendMark size={48} /></MarkTile>
            <MarkTile label="32px"><FaultendMark size={32} /></MarkTile>
            <MarkTile label="20px"><FaultendMark size={20} /></MarkTile>
            <MarkTile label="reversed" dark><FaultendMark size={32} stroke="#fafafa" /></MarkTile>
          </div>

          <div style={{ background: 'var(--ft-surface)', border: '1px solid var(--ft-border)', padding: 16 }}>
            <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>App icon · 64px</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, background: 'var(--ft-ink-12)', display: 'grid', placeItems: 'center' }}>
                <FaultendMark size={42} stroke="#fafafa" />
              </div>
              <div style={{ width: 64, height: 64, background: 'var(--ft-amber-pure)', display: 'grid', placeItems: 'center' }}>
                <FaultendMark size={42} stroke="#1c1c1a" />
              </div>
              <div style={{ width: 64, height: 64, background: 'var(--ft-surface)', border: '1px solid var(--ft-border-strong)', display: 'grid', placeItems: 'center' }}>
                <FaultendMark size={42} />
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--ft-surface-2)', border: '1px solid var(--ft-border)', padding: 16, fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)', lineHeight: 1.6 }}>
            <div style={{ color: 'var(--ft-fg-strong)' }}>{'//'} usage</div>
            <div>min size       20px</div>
            <div>clear-space    ¼ of mark height on every side</div>
            <div>color          mono — black, white, or signal amber</div>
            <div style={{ marginTop: 6, color: 'var(--ft-fg-faint)' }}>never recolor, rotate, or apply effects.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkTile({ label, children, dark }) {
  return (
    <div style={{ background: dark ? 'var(--ft-ink-12)' : 'var(--ft-surface)', border: '1px solid var(--ft-border)', height: 100, display: 'grid', placeItems: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 8, left: 10, fontFamily: 'var(--ft-mono)', fontSize: 10, color: dark ? 'rgba(255,255,255,.5)' : 'var(--ft-fg-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
      {children}
    </div>
  );
}

/* ---------------- F · Mobile tap targets ---------------- */
function ABMobileTaps() {
  // Inline tap-targets sized for thumb use. iOS HIG min is 44×44 for
  // icon-only controls; chips relax to 36px because their label gives
  // the eye a larger visual target. Sheet footers reuse the regular
  // 32px Btn — sized like the desktop drawer — but live inside the
  // .ft-mbar chassis so they share height with the bottom tab bar.
  return (
    <div className="ft ft-theme-light" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ABHeader eyebrow="01 / Foundations · Mobile" title="Tap targets" hint="Inline icon buttons and chips get bumped to thumb size. Sheet footers and the tab bar share a single bar height." />

      <div style={{ padding: '24px 32px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <SwatchSectionHeader>Inline tap targets</SwatchSectionHeader>
          <TapRow label="icon · 44×44" spec=".ft-iconbtn--mobile">
            <button className="ft-iconbtn--mobile"><Icon.X /></button>
            <button className="ft-iconbtn--mobile"><Icon.Settings /></button>
            <button className="ft-iconbtn--mobile"><Icon.Plus /></button>
            <button className="ft-iconbtn--mobile"><Icon.SignOut /></button>
          </TapRow>
          <TapRow label="filter chip · 36px" spec=".ft-chip--mobile">
            <button className="ft-chip--mobile">
              <span className="label">method</span>
              <span className="value">all</span>
              <Icon.ChevDown style={{ color: 'var(--ft-fg-faint)' }} />
            </button>
            <button className="ft-chip--mobile">
              <span className="label">status</span>
              <span className="value">2xx</span>
              <Icon.ChevDown style={{ color: 'var(--ft-fg-faint)' }} />
            </button>
          </TapRow>
          <TapRow label="input · 36px" spec=".ft-input + height: 36">
            <input className="ft-input ft-input--mono" placeholder="filter path" style={{ height: 36, fontSize: 13, flex: 1 }} />
          </TapRow>
        </div>

        <div>
          <SwatchSectionHeader>Footer actions · default Btn</SwatchSectionHeader>
          <div style={{ fontSize: 12, color: 'var(--ft-fg-muted)', lineHeight: 1.55, marginBottom: 12 }}>
            On-sheet primary actions reuse the regular <span className="ft-mono" style={{ color: 'var(--ft-fg-strong)' }}>Btn</span> (32px) — no jumbo size on mobile. The bottom bar carries them; the sheet header's <span className="ft-mono" style={{ color: 'var(--ft-fg-strong)' }}>×</span> covers cancel/close.
          </div>
          <TapRow label="primary" spec="<Btn>">
            <Btn>Save rule</Btn>
          </TapRow>
          <TapRow label="ghost" spec="variant=&quot;ghost&quot;">
            <Btn variant="ghost"><Icon.Copy /> Export</Btn>
          </TapRow>
          <TapRow label="danger" spec="variant=&quot;danger&quot;">
            <Btn variant="danger">Delete server</Btn>
          </TapRow>
        </div>
      </div>

      <div style={{ padding: '24px 32px 32px' }}>
        <SwatchSectionHeader>Bottom bar · sheet footer + tab bar share height</SwatchSectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Sheet footer demo */}
          <div style={{ border: '1px solid var(--ft-border)', background: 'var(--ft-surface)' }}>
            <div style={{
              padding: '16px', fontFamily: 'var(--ft-mono)', fontSize: 11,
              color: 'var(--ft-fg-muted)', borderBottom: '1px solid var(--ft-hairline)',
              letterSpacing: '0.04em',
            }}>{'//'} sheet footer — <span style={{ color: 'var(--ft-fg-strong)' }}>.ft-mbar.ft-mbar--footer</span></div>
            <div className="ft-mbar ft-mbar--footer" style={{ justifyContent: 'flex-end' }}>
              <Btn>Save rule</Btn>
            </div>
          </div>

          {/* Tab bar demo */}
          <div style={{ border: '1px solid var(--ft-border)', background: 'var(--ft-surface)' }}>
            <div style={{
              padding: '16px', fontFamily: 'var(--ft-mono)', fontSize: 11,
              color: 'var(--ft-fg-muted)', borderBottom: '1px solid var(--ft-hairline)',
              letterSpacing: '0.04em',
            }}>{'//'} tab bar — <span style={{ color: 'var(--ft-fg-strong)' }}>MTabBar</span></div>
            <div className="ft-mbar ft-mbar--tabs">
              <TabSample label="Traffic" active />
              <TabSample label="Rules" />
              <TabSample label="Settings" />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, padding: 14, background: 'var(--ft-surface-2)', border: '1px solid var(--ft-border)', fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)', lineHeight: 1.6 }}>
          <div style={{ color: 'var(--ft-fg-strong)' }}>{'//'} principle</div>
          <div>icon tap floor   44px (iOS HIG)</div>
          <div>chip / input     36px — dense inline filters</div>
          <div>footer Btn       32px — same as desktop drawer; right-aligned</div>
          <div>bar height       64px — tab bar + sheet footer match</div>
          <div>bottom inset     14px — home indicator clearance</div>
        </div>
      </div>
    </div>
  );
}

function TapRow({ label, spec, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--ft-hairline)' }}>
      <div style={{ width: 150, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>{label}</div>
        <div style={{ fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)' }}>{spec}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>{children}</div>
    </div>
  );
}

function TabSample({ label, active }) {
  return (
    <button style={{
      flex: 1,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
      padding: '0 4px',
      background: active ? 'var(--ft-surface-2)' : 'transparent',
      color: active ? 'var(--ft-fg-strong)' : 'var(--ft-fg-muted)',
      borderTop: active ? '2px solid var(--ft-ink-12)' : '2px solid transparent',
      marginTop: -1,
    }}>
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
        <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.3"/>
      </svg>
      <span style={{
        fontSize: 10, fontFamily: 'var(--ft-mono)',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>{label}</span>
    </button>
  );
}

Object.assign(window, {
  ABColorNeutrals, ABColorBadges, ABTypography, ABSpacing, ABBrand, ABMobileTaps,
});
