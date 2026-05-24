/* eslint-disable */
// Faultend · Marketing landing page — MOBILE
//
// Same product story, expressed inside ~390px. The desktop landing is a
// wide editorial doc with split heroes, 3-col feature grids and 3-col
// step rows. None of those survive on phones, so the mobile version is
// a single vertical column with stronger horizontal rules and mono
// captions as the structural element.
//
// Presented as a series of separate iPhone frames — one per landing
// section — rather than one infinitely tall sheet. Easier to compare
// alongside the desktop landing in the canvas.

/* ----- NAV ----------------------------------------------------------- */
function MNavM() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      height: 48, padding: '0 14px',
      borderBottom: '1px solid var(--ft-border-strong)',
      background: 'var(--ft-surface)',
      gap: 10,
    }}>
      <FaultendMark size={18} />
      <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em', color: 'var(--ft-fg-strong)' }}>faultend</span>
      <span style={{ flex: 1 }} />
      <a href="#screens" className="ft-btn ft-btn--sm" style={{ height: 28, padding: '0 10px', fontSize: 12 }}>Try it now →</a>
    </div>
  );
}

/* ----- HERO ---------------------------------------------------------- */
function MarketingHeroM() {
  return (
    <section style={{
      position: 'relative',
      padding: '28px 18px 24px',
      background: 'var(--ft-bg)',
      borderBottom: '1px solid var(--ft-border-strong)',
      display: 'flex', flexDirection: 'column', gap: 18,
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: -90, top: -60, opacity: 0.05, pointerEvents: 'none' }}>
        <FaultendMark size={320} />
      </div>

      <div className="ft-mono" style={{
        fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'var(--ft-fg-muted)',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        position: 'relative',
      }}>
        <span style={{ width: 6, height: 6, background: 'var(--ft-amber-pure)' }} />
        a proxy for testing resilience
      </div>

      <h1 style={{
        fontSize: 34, lineHeight: 1.04, letterSpacing: '-0.025em',
        fontWeight: 400, color: 'var(--ft-fg-strong)',
        margin: 0, position: 'relative',
      }}>
        Test your app’s resilience by{' '}
        <span style={{ display: 'inline-block', position: 'relative', color: 'var(--ft-fg-strong)' }}>
          <span style={{ position: 'relative', zIndex: 1 }}>breaking</span>
          <span style={{
            position: 'absolute', left: -3, right: -3, bottom: 1, height: 9,
            background: 'var(--ft-amber-bg)', borderBottom: '2px solid var(--ft-amber-pure)',
            zIndex: 0,
          }} />
        </span>{' '}its backend.
      </h1>

      <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ft-fg-muted)', margin: 0, position: 'relative' }}>
        A lightweight proxy that helps you validate how your mobile and web apps
        behave when their backends misbehave. Route traffic, inspect every
        request, and inject failures — all from one dashboard.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
        <a href="#screens" className="ft-btn" style={{
          height: 42, padding: '0 14px', fontSize: 13,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          Try it now →
        </a>
      </div>

      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        fontFamily: 'var(--ft-mono)', fontSize: 11,
        color: 'var(--ft-fg-muted)', position: 'relative',
        padding: '10px 12px',
        background: 'var(--ft-surface-2)',
        border: '1px solid var(--ft-border)',
      }}>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>$ curl yourapp.faultend.com/users/42</div>
        <div style={{ color: 'var(--ft-fg-faint)' }}>
          → <span style={{ color: 'var(--ft-amber-ink)' }}>503 Service Unavailable</span>
        </div>
        <div style={{ color: 'var(--ft-fg-faint)' }}>
          {'  '}injected by rule "flaky-users"
        </div>
      </div>

      {/* compact resilience preview — mirrors desktop's traffic table */}
      <div className="ft-card" style={{ overflow: 'hidden', position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 10px', borderBottom: '1px solid var(--ft-border)',
          background: 'var(--ft-surface-2)',
          fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-muted)',
        }}>
          <FaultendMark size={10} />
          <span style={{ color: 'var(--ft-fg-strong)' }}>yourapp</span>
          <span style={{ color: 'var(--ft-fg-faint)' }}>·</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>resilience</span>
          <span className="ft-badge s-2xx">12 OK</span>
          <span className="ft-badge s-5xx">1 FAULT</span>
        </div>
        <div>
          {[
            ['GET',    '/users/42',         200,  42, 'ok'],
            ['POST',   '/orders',           503,1812, 'fault'],
            ['GET',    '/products',         500, 295, 'deg'],
            ['DELETE', '/posts/1',          403,   9, 'deg'],
            ['GET',    '/health',           200,   6, 'ok'],
          ].map(([m, path, st, ms, res], i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '52px 1fr 50px 64px',
              alignItems: 'center', gap: 6,
              padding: '8px 10px',
              borderBottom: i === 4 ? 'none' : '1px solid var(--ft-hairline)',
              background: 'var(--ft-surface)',
            }}>
              <Badge kind={`m-${m}`}>{m}</Badge>
              <span style={{
                fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-strong)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>{path}</span>
              <Badge kind={statusKind(st)}>{st}</Badge>
              <span className="ft-mono" style={{
                fontSize: 10, textAlign: 'right',
                color: res === 'fault' ? 'var(--ft-red-ink)' : res === 'deg' ? 'var(--ft-amber-ink)' : 'var(--ft-fg-muted)',
              }}>{ms}<span style={{ opacity: 0.5 }}>ms</span></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- WHY (feature stack) ------------------------------------------ */
function FeatureCellM({ num, title, body, demo }) {
  return (
    <div style={{
      padding: '20px 18px',
      borderBottom: '1px solid var(--ft-border)',
      display: 'flex', flexDirection: 'column', gap: 10,
      background: 'var(--ft-surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="ft-mono" style={{ fontSize: 10, color: 'var(--ft-fg-faint)' }}>{num}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--ft-hairline)' }} />
      </div>
      <h3 style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--ft-fg-strong)', margin: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'var(--ft-fg-muted)', margin: 0 }}>
        {body}
      </p>
      <div style={{ paddingTop: 2 }}>{demo}</div>
    </div>
  );
}

function MarketingWhyM() {
  return (
    <section style={{ background: 'var(--ft-surface-2)', borderBottom: '1px solid var(--ft-border-strong)' }}>
      <div style={{ padding: '28px 18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="ft-mono" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)' }}>
          ── Why Faultend
        </div>
        <h2 style={{ fontSize: 26, lineHeight: 1.12, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ft-fg-strong)', margin: 0 }}>
          A proxy that inspects, mocks, and breaks your HTTP traffic.
        </h2>
        <div style={{ fontSize: 12.5, color: 'var(--ft-fg-muted)', lineHeight: 1.55 }}>
          Point your client at a Faultend URL instead of your backend. Every request is logged and can be intercepted with a rule.
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--ft-border)' }}>
        <FeatureCellM num="01" title="Real-time inspection"
          body="Every request and response, streamed live. Full visibility into method, path, status, timing, headers, and body."
          demo={
            <div className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>
              <span style={{ color: '#5cd97b' }}>●</span> last updated · just now
            </div>
          }
        />
        <FeatureCellM num="02" title="One-click mocking"
          body="Click any logged request to turn it into a mock rule. Edit status, body, and latency — no manual config."
          demo={
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <Badge kind="m-GET">GET</Badge>
              <span className="ft-mono" style={{ fontSize: 11.5, color: 'var(--ft-fg-strong)' }}>/users/42</span>
              <span style={{ marginLeft: 'auto' }}><Badge kind="a-mock">MOCK</Badge></span>
            </div>
          }
        />
        <FeatureCellM num="03" title="Multi-backend routing"
          body="Match by regex path and HTTP method, ordered by priority. Each rule proxies to its own upstream."
          demo={
            <div className="ft-mono" style={{ fontSize: 10.5, color: 'var(--ft-fg-strong)', display: 'flex', flexDirection: 'column', gap: 3, lineHeight: 1.4 }}>
              <div><span style={{ color: 'var(--ft-fg-faint)' }}>^/payments/.*</span></div>
              <div>{'  '}→ secondbackend.faultend.com</div>
              <div><span style={{ color: 'var(--ft-fg-faint)' }}>.*</span></div>
              <div>{'  '}→ yourapp.faultend.com</div>
            </div>
          }
        />
        <FeatureCellM num="04" title="Failure injection"
          body="Return any status code, any body. Add fixed delays or random latency. Make a flaky endpoint flaky on demand."
          demo={
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <Badge kind="s-5xx">503</Badge>
              <Badge kind="a-delay">100–500ms</Badge>
              <Badge kind="a-mock">MOCK</Badge>
            </div>
          }
        />
        <FeatureCellM num="05" title="Flexible responses"
          body="Compose responses with templates — timestamps, UUIDs, randoms — or forward the upstream and transform what comes back."
          demo={
            <div className="ft-mono" style={{ fontSize: 10.5, color: 'var(--ft-fg-strong)', display: 'flex', flexDirection: 'column', gap: 3, lineHeight: 1.4 }}>
              <div>
                <span style={{ color: 'var(--ft-fg-muted)' }}>{'{ '}</span>
                id: <span style={{ color: 'var(--ft-amber-ink)' }}>{'{{uuid()}}'}</span>
                <span style={{ color: 'var(--ft-fg-muted)' }}>{' }'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--ft-fg-faint)' }}>set </span>
                $.user.email <span style={{ color: 'var(--ft-fg-faint)' }}>=</span>{' '}
                <span style={{ color: 'var(--ft-amber-ink)' }}>null</span>
              </div>
            </div>
          }
        />
        <FeatureCellM num="06" title="Share & collaborate"
          body="Invite teammates to a server with view or edit access. Rule changes apply for everyone in real time."
          demo={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex' }}>
                {['JM', 'AK', 'RS'].map((s, i) => (
                  <div key={s} style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'var(--ft-surface-1)',
                    border: '1px solid var(--ft-border-strong)',
                    marginLeft: i === 0 ? 0 : -6,
                    fontFamily: 'var(--ft-mono)', fontSize: 9.5,
                    color: 'var(--ft-fg-strong)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{s}</div>
                ))}
              </div>
              <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>
                3 editors · <span style={{ color: 'var(--ft-fg-strong)' }}>live</span>
              </span>
            </div>
          }
        />
      </div>
    </section>
  );
}

/* ----- HOW IT WORKS -------------------------------------------------- */
function StepRowM({ n, title, body, code, badge }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 10,
      padding: '24px 18px',
      borderBottom: '1px solid var(--ft-hairline)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{
          fontFamily: 'var(--ft-mono)', fontSize: 32, lineHeight: 1,
          color: 'var(--ft-fg-strong)', letterSpacing: '-0.04em',
        }}>{n}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--ft-hairline)' }} />
        {badge}
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--ft-fg-strong)', margin: 0 }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ft-fg-muted)', margin: 0 }}>
        {body}
      </p>
      {code && (
        <div className="ft-code" style={{ fontSize: 11, lineHeight: 1.5, overflow: 'auto' }}>{code}</div>
      )}
    </div>
  );
}

function MarketingHowM() {
  return (
    <section style={{ borderBottom: '1px solid var(--ft-border-strong)', background: 'var(--ft-bg)' }}>
      <div style={{ padding: '28px 18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="ft-mono" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)' }}>
          ── How it works
        </div>
        <h2 style={{ fontSize: 26, lineHeight: 1.12, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ft-fg-strong)', margin: 0 }}>
          Five steps. Zero changes to your app.
        </h2>
        <span className="ft-mono" style={{ fontSize: 10.5, color: 'var(--ft-fg-faint)' }}>~3 min · skim</span>
      </div>

      <div style={{ borderTop: '1px solid var(--ft-border-strong)' }}>
        <StepRowM n="1"
          title="Point your app at Faultend"
          body="Create a server, give it an ID, point your app at the proxy URL we hand back. Every request flows through and gets logged."
          code={`API_BASE_URL=https://yourapp.faultend.com`}
          badge={<span className="ft-badge s-3xx">PROXY</span>}
        />
        <StepRowM n="2"
          title="Create routing rules"
          body="Match each request by HTTP method and a regex path. Rules are evaluated in priority order — first match wins."
          code={`200  GET  ^/users/[0-9]+$  → mock
180  GET  ^/products$      → mock
100  *    .*                → proxy`}
          badge={<span className="ft-badge a-proxy">5 RULES</span>}
        />
        <StepRowM n="3"
          title="Use your app normally"
          body="Watch every call land in the traffic log: method, path, status, time, and which rule matched."
          code={`GET    /users/5    200    250ms  ✓
GET    /products   500    295ms  ✓
DELETE /posts/1    403      9ms  ✓`}
          badge={<span className="ft-badge s-5xx">REC</span>}
        />
        <StepRowM n="4"
          title="Inject failures on demand"
          body="Switch any rule to Mock mode. Pick a status code, write a JSON body, dial in a delay. Toggle on or off live."
          code={`Mock   ^/products$   500   {}
Latency  range  100–500ms`}
          badge={<span className="ft-badge a-mock">MOCK</span>}
        />
        <StepRowM n="5"
          title="Validate resilience"
          body="Watch your app retry, back off, degrade, and recover — pinpoint which endpoints are making it easy to break."
          code={`/users/:id      PASS      resilient
/products       DEGRADE   stale cache
/orders         HARD DEP  blocks
/notifications  HARD DEP  hangs`}
          badge={<span className="ft-badge s-2xx">VERDICT</span>}
        />
      </div>
    </section>
  );
}

/* ----- CTA + FOOTER -------------------------------------------------- */
function MarketingCTAM() {
  return (
    <section style={{
      padding: '36px 18px 40px',
      background: 'var(--ft-ink-12)',
      color: 'var(--ft-ink-0)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: -80, top: -100, opacity: 0.06, pointerEvents: 'none' }}>
        <FaultendMark size={340} stroke="#fafafa" />
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="ft-mono" style={{ fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
          ── ready?
        </div>
        <h2 style={{ fontSize: 32, lineHeight: 1.05, letterSpacing: '-0.025em', fontWeight: 400, margin: 0 }}>
          Build apps that{' '}
          <span style={{ color: 'var(--ft-amber-pure)' }}>fail well.</span>
        </h2>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, margin: 0 }}>
          Try it now — create your first fault server and have a proxy URL in under a minute. Nothing to install.
        </p>
        <a href="#screens" className="ft-btn ft-btn--secondary" style={{
          height: 44, fontSize: 14,
          justifyContent: 'center', display: 'inline-flex', alignItems: 'center',
          marginTop: 4,
        }}>
          Try it now →
        </a>
        <div className="ft-mono" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
          hosted · one URL per server
        </div>
      </div>
    </section>
  );
}

function MarketingFooterM() {
  const cols = [
    ['Product',  ['Overview', 'Try it now']],
    ['Company',  ['About', 'Contact']],
    ['Legal',    ['Privacy', 'Terms']],
  ];
  return (
    <footer style={{
      padding: '24px 18px 20px',
      background: 'var(--ft-surface)',
      borderTop: '1px solid var(--ft-border)',
      display: 'flex', flexDirection: 'column', gap: 22,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <FaultendLogo size={18} />
        <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--ft-fg-muted)', margin: 0 }}>
          A proxy for testing how your app behaves when the network — or the backend behind it — misbehaves.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {cols.map(([title, items]) => (
          <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="ft-mono" style={{ fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)' }}>
              {title}
            </div>
            {items.map((i) => (
              <a key={i} style={{ fontSize: 12, color: 'var(--ft-fg-muted)' }}>{i}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{
        borderTop: '1px solid var(--ft-hairline)', paddingTop: 12,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--ft-mono)', fontSize: 10, color: 'var(--ft-fg-faint)',
      }}>
        <span>© 2026 faultend</span>
        <span>faultend.com</span>
      </div>
    </footer>
  );
}

/* ----- SECTION SHELLS — drop the marketing section into a phone bezel  */
function MobileLandingShell({ theme = 'light', height, children }) {
  return (
    <PhoneShell theme={theme} height={height}>
      <div style={{
        flex: 1, minHeight: 0, overflow: 'hidden',
        background: 'var(--ft-bg)',
        display: 'flex', flexDirection: 'column',
      }}>
        <MNavM />
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {children}
        </div>
      </div>
    </PhoneShell>
  );
}

function MobileLandingHero({ theme = 'light' }) {
  return (
    <MobileLandingShell theme={theme} height={1140}>
      <MarketingHeroM />
    </MobileLandingShell>
  );
}

function MobileLandingWhy({ theme = 'light' }) {
  return (
    <MobileLandingShell theme={theme} height={1400}>
      <MarketingWhyM />
    </MobileLandingShell>
  );
}

function MobileLandingHow({ theme = 'light' }) {
  return (
    <MobileLandingShell theme={theme} height={1500}>
      <MarketingHowM />
    </MobileLandingShell>
  );
}

function MobileLandingCTA({ theme = 'light' }) {
  return (
    <MobileLandingShell theme={theme} height={900}>
      <MarketingCTAM />
      <MarketingFooterM />
    </MobileLandingShell>
  );
}

/* Full mobile landing in one tall frame — for end-to-end review */
function MobileLandingFull({ theme = 'light' }) {
  return (
    <PhoneShell theme={theme} height={4500}>
      <div style={{
        flex: 1, minHeight: 0,
        background: 'var(--ft-bg)',
        display: 'flex', flexDirection: 'column',
      }}>
        <MNavM />
        <MarketingHeroM />
        <MarketingWhyM />
        <MarketingHowM />
        <MarketingCTAM />
        <MarketingFooterM />
      </div>
    </PhoneShell>
  );
}

Object.assign(window, {
  MobileLandingHero, MobileLandingWhy, MobileLandingHow, MobileLandingCTA,
  MobileLandingFull,
});
