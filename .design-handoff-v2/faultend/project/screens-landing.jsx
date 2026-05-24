/* eslint-disable */
// Faultend · Marketing landing page (faultend.com — restyled)
// Restated in the in-house design language: monochrome, sharp-edged, mono
// captions, amber strictly as signal. Same vocabulary as the app itself.
//
// Scope: only the features that actually exist in the product —
//   · Google sign-in (or dev login, local only)
//   · Server list (id + proxy URL)
//   · Traffic log (method/path/status/time/rule)
//   · Rules with priority / regex path / method / action (proxy | mock)
//   · Mock action: status code, JSON body w/ template vars, fixed/range latency
//   · Import/export server config as JSON
// No pricing section, no CLI, no self-hosting copy — none of that ships today.

function MarketingNav() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 56,
      padding: '0 32px',
      borderBottom: '1px solid var(--ft-border-strong)',
      background: 'var(--ft-surface)',
      gap: 32,
    }}>
      <FaultendLogo size={22} />
      <div style={{ flex: 1 }} />
      <nav style={{ display: 'flex', alignItems: 'center', gap: 28, fontSize: 13, color: 'var(--ft-fg-muted)' }}>
        <a>Why Faultend</a>
        <a>How it works</a>
      </nav>
      <div style={{ width: 1, height: 18, background: 'var(--ft-border)' }} />
      <a href="#screens" className="ft-btn ft-btn--sm">Try it now →</a>
    </div>
  );
}

/* ----- HERO ---------------------------------------------------------- */
function MarketingHero() {
  return (
    <section style={{
      position: 'relative',
      padding: '88px 64px 72px',
      background: 'var(--ft-bg)',
      borderBottom: '1px solid var(--ft-border-strong)',
      overflow: 'hidden',
    }}>
      {/* Faint watermark mark, far right */}
      <div style={{ position: 'absolute', right: -160, top: -120, opacity: 0.05, pointerEvents: 'none' }}>
        <FaultendMark size={620} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 64, alignItems: 'stretch', position: 'relative' }}>
        {/* Left: copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div className="ft-mono" style={{
            fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--ft-fg-muted)',
            display: 'inline-flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ width: 6, height: 6, background: 'var(--ft-amber-pure)' }} />
            a proxy for testing resilience
          </div>

          <h1 style={{
            fontSize: 64, lineHeight: 1.02, letterSpacing: '-0.025em',
            fontWeight: 400, color: 'var(--ft-fg-strong)',
            maxWidth: 720,
          }}>
            Test your app’s<br/>
            resilience by{' '}
            <span style={{
              display: 'inline-block', position: 'relative',
              color: 'var(--ft-fg-strong)',
            }}>
              <span style={{ position: 'relative', zIndex: 1 }}>breaking</span>
              <span style={{
                position: 'absolute', left: -4, right: -4, bottom: 2, height: 14,
                background: 'var(--ft-amber-bg)', borderBottom: '2px solid var(--ft-amber-pure)',
                zIndex: 0,
              }} />
            </span>
            {' '}its backend.
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.55, color: 'var(--ft-fg-muted)', maxWidth: 560 }}>
            A lightweight proxy that helps you validate how your mobile and web applications behave when their
            backends misbehave. Route traffic, inspect every request, and inject failures — all from one dashboard.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <a href="#screens" className="ft-btn" style={{ height: 40, padding: '0 18px', fontSize: 14, display: 'inline-flex', alignItems: 'center' }}>
              Try it now →
            </a>
          </div>

          <div style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            fontFamily: 'var(--ft-mono)', fontSize: 12,
            color: 'var(--ft-fg-muted)', marginTop: 8,
          }}>
            <div>$ curl https://yourapp.faultend.com/users/42</div>
            <div style={{ color: 'var(--ft-fg-faint)' }}>
              → <span style={{ color: 'var(--ft-amber-ink)' }}>503 Service Unavailable</span> · injected by rule "flaky-users"
            </div>
          </div>
        </div>

        {/* Right: live proxy preview — matches the actual dashboard chrome */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          <div className="ft-card" style={{ overflow: 'hidden' }}>
            {/* mock chrome */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderBottom: '1px solid var(--ft-border)',
              background: 'var(--ft-surface-2)',
              fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-muted)',
            }}>
              <FaultendMark size={12} />
              <span style={{ color: 'var(--ft-fg-strong)' }}>yourapp</span>
              <span style={{ color: 'var(--ft-fg-faint)' }}>·</span>
              <span>resilience report</span>
              <span style={{ flex: 1 }} />
              <span className="ft-badge s-2xx">12 OK</span>
              <span className="ft-badge a-delay">3 DEG</span>
              <span className="ft-badge s-5xx">1 FAULT</span>
            </div>

            {/* endpoint resilience table */}
            <table className="ft-table" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 64 }} />
                <col />
                <col style={{ width: 64 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 96 }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Status</th>
                  <th>Time</th>
                  <th>Resilient</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['GET',    '/users/42',         200,  42, 'ok'],
                  ['GET',    '/users/42/orders',  200, 118, 'ok'],
                  ['POST',   '/orders',           503,1812, 'fault'],
                  ['GET',    '/products',         500, 295, 'deg'],
                  ['DELETE', '/posts/1',          403,   9, 'deg'],
                  ['GET',    '/users/5',          200, 250, 'ok'],
                  ['PATCH',  '/users/3/settings', 204,  88, 'ok'],
                  ['GET',    '/health',           200,   6, 'ok'],
                ].map(([m, path, st, ms, res], i) => (
                  <tr key={i}>
                    <td><Badge kind={`m-${m}`}>{m}</Badge></td>
                    <td style={{ fontFamily: 'var(--ft-mono)', fontSize: 12, color: 'var(--ft-fg-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path}</td>
                    <td><Badge kind={statusKind(st)}>{st}</Badge></td>
                    <td><LatBar ms={ms} max={res === 'fault' ? 2000 : 300} kind={res === 'fault' ? 'err' : (ms > 200 ? 'slow' : '')} /></td>
                    <td><Badge kind={res === 'ok' ? 's-2xx' : res === 'deg' ? 'a-delay' : 's-5xx'}>{res === 'ok' ? 'OK' : res === 'deg' ? 'DEGRADED' : 'FAULTED'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- WHY (feature grid) ------------------------------------------- */
function FeatureCell({ num, title, body, demo }) {
  return (
    <div style={{
      padding: '28px 28px 24px',
      borderRight: '1px solid var(--ft-border)',
      borderBottom: '1px solid var(--ft-border)',
      display: 'flex', flexDirection: 'column', gap: 14,
      minHeight: 280,
      background: 'var(--ft-surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-faint)' }}>{num}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--ft-hairline)' }} />
      </div>
      <h3 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--ft-fg-strong)' }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--ft-fg-muted)' }}>
        {body}
      </p>
      <div style={{ flex: 1 }} />
      {demo}
    </div>
  );
}

function MarketingWhy() {
  return (
    <section style={{ background: 'var(--ft-surface-2)', borderBottom: '1px solid var(--ft-border-strong)' }}>
      <div style={{ padding: '64px 64px 0', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 32 }}>
        <div>
          <div className="ft-mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)' }}>
            ── Why Faultend
          </div>
          <h2 style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ft-fg-strong)', marginTop: 12, maxWidth: 640 }}>
            A proxy that inspects, mocks, and breaks your HTTP traffic.
          </h2>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ft-fg-muted)', maxWidth: 280, lineHeight: 1.6 }}>
          Point your client at a Faultend URL instead of your backend. Every request is logged and can be intercepted with a rule — mock the response, inject a delay, or return a 5xx.
        </div>
      </div>

      <div style={{ padding: '40px 64px 0' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          border: '1px solid var(--ft-border)',
          borderRight: 0, borderBottom: 0,
        }}>
          <FeatureCell num="01" title="Real-time inspection"
            body="Every request and response, streamed live. Full visibility into method, path, status, timing, headers, and body — no log diving."
            demo={
              <div className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-muted)' }}>
                <span style={{ color: '#5cd97b' }}>●</span> last updated · just now
              </div>
            }
          />
          <FeatureCell num="02" title="One-click mocking"
            body="Click any logged request to turn it into a mock rule. Edit the status code, response body, and latency — no manual config."
            demo={
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <Badge kind="m-GET">GET</Badge>
                <span className="ft-mono" style={{ fontSize: 12, color: 'var(--ft-fg-strong)' }}>/users/42</span>
                <span style={{ marginLeft: 'auto' }}><Badge kind="a-mock">MOCK</Badge></span>
              </div>
            }
          />
          <FeatureCell num="03" title="Multi-backend routing"
            body="Match by regex path and HTTP method, ordered by priority. Each rule proxies to its own upstream — perfect for microservices."
            demo={
              <div className="ft-mono" style={{ fontSize: 11.5, color: 'var(--ft-fg-strong)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><span style={{ color: 'var(--ft-fg-faint)' }}>^/payments/.* </span>→ yoursecondbackend.faultend.com</div>
                <div><span style={{ color: 'var(--ft-fg-faint)' }}>.*             </span>→ yourapp.faultend.com</div>
              </div>
            }
          />
          <FeatureCell num="04" title="Failure injection"
            body="Return any status code, any body. Add fixed delays or random latency in a range. Make a flaky endpoint flaky on demand."
            demo={
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Badge kind="s-5xx">503</Badge>
                <Badge kind="a-delay">100–500ms</Badge>
                <Badge kind="a-mock">MOCK</Badge>
              </div>
            }
          />
          <FeatureCell num="05" title="Flexible responses"
            body="Compose responses from templates with timestamps, UUIDs, and randoms — or forward to the real upstream and transform what comes back: patch JSON fields, swap status codes, strip headers. Realistic mocks without realistic payloads; edge cases without backend changes."
            demo={
              <div className="ft-mono" style={{ fontSize: 11.5, color: 'var(--ft-fg-strong)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>
                  <span style={{ color: 'var(--ft-fg-muted)' }}>{'{ '}</span>
                  id: <span style={{ color: 'var(--ft-amber-ink)' }}>{'{{uuid()}}'}</span>, ts: <span style={{ color: 'var(--ft-amber-ink)' }}>{'{{timestamp()}}'}</span>
                  <span style={{ color: 'var(--ft-fg-muted)' }}>{' }'}</span>
                </div>
                <div><span style={{ color: 'var(--ft-fg-faint)' }}>set </span>$.user.email <span style={{ color: 'var(--ft-fg-faint)' }}>=</span> <span style={{ color: 'var(--ft-amber-ink)' }}>null</span></div>
              </div>
            }
          />
          <FeatureCell num="06" title="Share & collaborate"
            body="Invite teammates to a server with view or edit access. Rule changes apply for everyone in real time — useful for pairing on a flaky bug or handing a repro to QA."
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
                      letterSpacing: 0,
                    }}>{s}</div>
                  ))}
                </div>
                <span className="ft-mono" style={{ fontSize: 11.5, color: 'var(--ft-fg-muted)' }}>
                  3 editors · <span style={{ color: 'var(--ft-fg-strong)' }}>live</span>
                </span>
              </div>
            }
          />
        </div>
      </div>
      <div style={{ height: 64 }} />
    </section>
  );
}

/* ----- HOW IT WORKS -------------------------------------------------- */
function StepRow({ n, title, body, code, badge }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '80px 1fr 1.1fr',
      gap: 32, padding: '32px 0',
      borderBottom: '1px solid var(--ft-hairline)',
      alignItems: 'start',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{
          fontFamily: 'var(--ft-mono)', fontSize: 42, lineHeight: 1,
          color: 'var(--ft-fg-strong)', letterSpacing: '-0.04em',
        }}>{n}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.015em', color: 'var(--ft-fg-strong)' }}>
          {title}
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--ft-fg-muted)' }}>
          {body}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {badge}
        {code && <div className="ft-code" style={{ fontSize: 12 }}>{code}</div>}
      </div>
    </div>
  );
}

function MarketingHow() {
  return (
    <section style={{ padding: '88px 64px', borderBottom: '1px solid var(--ft-border-strong)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, marginBottom: 32 }}>
        <div>
          <div className="ft-mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)' }}>
            ── How it works
          </div>
          <h2 style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: '-0.02em', fontWeight: 400, color: 'var(--ft-fg-strong)', marginTop: 12 }}>
            Five steps. Zero changes to your app.
          </h2>
        </div>
        <span className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-faint)' }}>~3 min · skim</span>
      </div>

      <div style={{ borderTop: '1px solid var(--ft-border-strong)' }}>
        <StepRow n="1"
          title="Point your app at Faultend"
          body="Create a server, give it an ID, and point your app at the proxy URL we hand back. Every request flows through and gets logged."
          code={`API_BASE_URL=https://yourapp.faultend.com`}
          badge={<span className="ft-badge s-3xx ft-badge--lg">PROXY · transparent</span>}
        />
        <StepRow n="2"
          title="Create routing rules"
          body="Match each request by HTTP method and a regex path pattern. Rules are evaluated in priority order — the first match wins."
          code={`200  GET   ^/users/[0-9]+$   → mock
180  GET   ^/products$       → mock
100  *     .*                → proxy`}
          badge={<span className="ft-badge a-proxy ft-badge--lg">5 RULES · ordered</span>}
        />
        <StepRow n="3"
          title="Use your app normally"
          body="Watch every call land in the traffic log: method, path, status, time, and whether a rule matched. Filter by method, status, or path."
          code={`GET    /users/5    200    250ms   ✓
GET    /products   500    295ms   ✓
DELETE /posts/1    403      9ms   ✓`}
          badge={<span className="ft-badge s-5xx ft-badge--lg">REC · live stream</span>}
        />
        <StepRow n="4"
          title="Inject failures on demand"
          body="Switch any rule to Mock mode. Pick a status code, write a JSON body, and dial in a fixed delay or a random range. Toggle it on or off live."
          code={`Mock   ^/products$   500   {}
Latency  range  100–500ms`}
          badge={<span className="ft-badge a-mock ft-badge--lg">MOCK · armed</span>}
        />
        <StepRow n="5"
          title="Validate resilience"
          body="Watch your app retry, back off, degrade, and recover — and pinpoint exactly which endpoints are making it easy to break. Each rule rolls up into a verdict so you can see what your app survives and what it depends on."
          code={`GET    /users/:id      PASS       resilient
GET    /products       DEGRADE    stale cache served
POST   /orders         HARD DEP   checkout blocks
GET    /notifications  HARD DEP   session screen hangs`}
          badge={<span className="ft-badge s-2xx ft-badge--lg">VERDICT · mostly resilient</span>}
        />
      </div>
    </section>
  );
}

/* ----- CTA + FOOTER -------------------------------------------------- */
function MarketingCTA() {
  return (
    <section style={{
      padding: '96px 64px',
      background: 'var(--ft-ink-12)',
      color: 'var(--ft-ink-0)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', right: -120, top: -160, opacity: 0.06, pointerEvents: 'none' }}>
        <FaultendMark size={560} stroke="#fafafa" />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 64, position: 'relative' }}>
        <div style={{ maxWidth: 720 }}>
          <div className="ft-mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
            ── ready?
          </div>
          <h2 style={{ fontSize: 52, lineHeight: 1.05, letterSpacing: '-0.025em', fontWeight: 400, marginTop: 12 }}>
            Build apps that{' '}
            <span style={{ color: 'var(--ft-amber-pure)' }}>fail well.</span>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', maxWidth: 540, lineHeight: 1.55, marginTop: 18 }}>
            Try it now — create your first fault server and have a proxy URL in under a minute. Nothing to install.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}>
          <a href="#screens" className="ft-btn ft-btn--secondary" style={{ height: 44, fontSize: 14, justifyContent: 'center', display: 'inline-flex', alignItems: 'center' }}>
            Try it now →
          </a>
          <div className="ft-mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'center' }}>
            hosted · one URL per server
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketingFooter() {
  const cols = [
    ['Product',  ['Overview', 'Try it now']],
    ['Company',  ['About', 'Contact']],
    ['Legal',    ['Privacy', 'Terms']],
  ];
  return (
    <footer style={{
      padding: '40px 64px 28px',
      background: 'var(--ft-surface)',
      borderTop: '1px solid var(--ft-border)',
      display: 'flex', flexDirection: 'column', gap: 32,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(3, 1fr)', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FaultendLogo size={20} />
          <p style={{ fontSize: 12, lineHeight: 1.55, color: 'var(--ft-fg-muted)', maxWidth: 280 }}>
            A proxy for testing how your app behaves when the network — or the backend behind it — misbehaves.
          </p>
          <div className="ft-mono" style={{ fontSize: 11, color: 'var(--ft-fg-faint)' }}>
            © 2026 faultend
          </div>
        </div>
        {cols.map(([title, items]) => (
          <div key={title} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="ft-mono" style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ft-fg-faint)' }}>
              {title}
            </div>
            {items.map((i) => (
              <a key={i} style={{ fontSize: 13, color: 'var(--ft-fg-muted)' }}>{i}</a>
            ))}
          </div>
        ))}
      </div>
      <div style={{
        borderTop: '1px solid var(--ft-hairline)', paddingTop: 16,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: 'var(--ft-mono)', fontSize: 11, color: 'var(--ft-fg-faint)',
      }}>
        <span>Built for developers who care about resilience.</span>
        <span>faultend.com</span>
      </div>
    </footer>
  );
}

/* ----- COMPOSITE SCREEN --------------------------------------------- */
function ScreenLanding({ theme = 'light' }) {
  return (
    <div className={`ft ft-theme-${theme}`} style={{
      width: '100%',
      background: 'var(--ft-bg)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <MarketingHero />
      <MarketingWhy />
      <MarketingHow />
      <MarketingCTA />
      <MarketingFooter />
    </div>
  );
}

Object.assign(window, {
  ScreenLanding,
  MarketingNav, MarketingHero,
  MarketingWhy, MarketingHow,
  MarketingCTA, MarketingFooter,
});
