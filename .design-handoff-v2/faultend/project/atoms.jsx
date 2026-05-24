/* eslint-disable */
// Faultend · shared atoms + iconography
// Exposed on window so other babel scripts can read them.

const { useState, useEffect, useRef } = React;

/* ----- LOGO ----------------------------------------------------------
   The original Faultend mark — a hand-traced lightning arrow that reads
   as "an in-flight request, interrupted". Kept as the canonical brand.
   The `stroke` prop is accepted for API compatibility but the mark is a
   filled glyph; treat the value as a fill color.
-------------------------------------------------------------------- */
function FaultendMark({ size = 22, stroke = 'currentColor', color }) {
  const fill = color || stroke;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <g transform="translate(0,1024) scale(0.1,-0.1)" fill={fill} stroke="none">
        <path d="M4803 6933 c-98 -119 -314 -383 -481 -587 -374 -457 -349 -429 -364 -424 -7 3 -79 85 -160 183 -191 231 -222 263 -288 294 -81 38 -155 34 -460 -27 -219 -44 -591 -117 -1230 -241 -820 -159 -805 -156 -841 -197 -47 -54 -52 -81 -52 -265 1 -195 8 -231 54 -275 28 -27 36 -29 102 -28 40 0 160 17 267 38 107 20 290 55 405 76 116 22 296 56 400 75 105 20 298 56 430 81 132 24 310 58 395 75 229 46 268 36 385 -98 143 -162 185 -215 185 -232 0 -9 -412 -532 -915 -1161 -503 -629 -915 -1148 -915 -1152 0 -5 185 -7 412 -6 l412 3 77 95 c41 52 163 205 269 340 312 394 418 528 515 650 50 63 190 239 310 390 119 151 225 281 233 288 40 32 54 19 231 -218 95 -126 190 -244 212 -261 22 -17 62 -40 89 -50 87 -33 84 -33 830 82 179 27 370 57 425 65 55 8 154 24 220 34 66 11 228 35 360 55 132 19 371 55 530 80 160 24 393 60 519 79 238 37 278 36 257 -2 -5 -9 -95 -131 -200 -271 -105 -140 -189 -256 -187 -258 5 -5 142 53 381 162 105 48 237 109 295 135 523 237 1171 543 1211 571 38 27 52 61 38 92 -17 38 3 30 -519 217 -308 111 -837 298 -1205 426 -148 52 -280 99 -293 104 -52 23 -54 10 -7 -42 153 -167 280 -303 350 -376 86 -90 96 -107 68 -116 -23 -6 -209 -34 -688 -101 -214 -30 -640 -90 -945 -135 -1123 -163 -1050 -153 -1103 -141 -27 6 -65 23 -85 38 -69 50 -332 374 -332 408 0 19 278 368 729 915 180 217 661 818 661 824 0 3 -182 6 -404 6 l-405 0 -178 -217z" />
      </g>
    </svg>
  );
}

function FaultendLogo({ size = 22, withWord = true, word = 'faultend' }) {
  return (
    <span className="ft-logo">
      <span className="ft-logo-mark" style={{ width: size, height: size }}>
        <FaultendMark size={size} />
      </span>
      {withWord && (
        <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.02em' }}>
          {word}
        </span>
      )}
    </span>
  );
}

/* ----- ICONS (minimal stroke set) ----------------------------------- */
const Icon = {
  Search: (p) => <svg viewBox="0 0 16 16" width="14" height="14" fill="none" {...p}><circle cx="7" cy="7" r="4.5" stroke="currentColor"/><path d="M10.5 10.5 L14 14" stroke="currentColor" strokeLinecap="square"/></svg>,
  Plus: (p)   => <svg viewBox="0 0 16 16" width="12" height="12" fill="none" {...p}><path d="M8 2 L8 14 M2 8 L14 8" stroke="currentColor" strokeWidth="1.4"/></svg>,
  X: (p)      => <svg viewBox="0 0 16 16" width="12" height="12" fill="none" {...p}><path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" strokeWidth="1.4"/></svg>,
  Edit: (p)   => <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}><path d="M2 14 L2 11 L11 2 L14 5 L5 14 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="miter"/></svg>,
  Trash: (p)  => <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}><path d="M3 4 L13 4 M5 4 L5 2 L11 2 L11 4 M4 4 L5 14 L11 14 L12 4 M7 7 L7 12 M9 7 L9 12" stroke="currentColor" strokeWidth="1.2"/></svg>,
  Copy: (p)   => <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}><rect x="3" y="3" width="9" height="9" stroke="currentColor" strokeWidth="1.2"/><path d="M6 3 L6 1 L14 1 L14 9 L12 9" stroke="currentColor" strokeWidth="1.2"/></svg>,
  ChevDown: (p) => <svg viewBox="0 0 12 12" width="10" height="10" fill="none" {...p}><path d="M2 4 L6 8 L10 4" stroke="currentColor" strokeWidth="1.4"/></svg>,
  ChevRight: (p) => <svg viewBox="0 0 12 12" width="10" height="10" fill="none" {...p}><path d="M4 2 L8 6 L4 10" stroke="currentColor" strokeWidth="1.4"/></svg>,
  Refresh: (p) => <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}><path d="M13 4 A6 6 0 1 0 14 9" stroke="currentColor" strokeWidth="1.2"/><path d="M13 1.5 L13 4 L10.5 4" stroke="currentColor" strokeWidth="1.2"/></svg>,
  Settings: (p) => <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}><circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 1.5 V3 M8 13 V14.5 M1.5 8 H3 M13 8 H14.5 M3.5 3.5 L4.5 4.5 M11.5 11.5 L12.5 12.5 M3.5 12.5 L4.5 11.5 M11.5 4.5 L12.5 3.5" stroke="currentColor" strokeWidth="1.1"/></svg>,
  Drag: (p)   => <svg viewBox="0 0 12 16" width="10" height="14" fill="none" {...p}><circle cx="4" cy="3" r="1" fill="currentColor"/><circle cx="8" cy="3" r="1" fill="currentColor"/><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="4" cy="13" r="1" fill="currentColor"/><circle cx="8" cy="13" r="1" fill="currentColor"/></svg>,
  Bolt: (p)   => <svg viewBox="0 0 16 16" width="12" height="12" fill="none" {...p}><path d="M9 1 L3 9 L7.5 9 L6.5 15 L13 7 L8.5 7 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="miter"/></svg>,
  Filter: (p) => <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}><path d="M2 3 L14 3 L10 8 L10 13 L6 11 L6 8 Z" stroke="currentColor" strokeWidth="1.2"/></svg>,
  Dot: (p)    => <svg viewBox="0 0 8 8" width="6" height="6" {...p}><circle cx="4" cy="4" r="3" fill="currentColor"/></svg>,
  SignOut: (p)=> <svg viewBox="0 0 16 16" width="15" height="15" fill="none" {...p}><path d="M9 2 H2 V14 H9" stroke="currentColor" strokeWidth="1.2"/><path d="M6 8 H14 M11 5 L14 8 L11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square"/></svg>,
  Folder: (p) => <svg viewBox="0 0 16 16" width="13" height="13" fill="none" {...p}><path d="M1.5 4 L1.5 13 L14.5 13 L14.5 5.5 L7.5 5.5 L6 4 Z" stroke="currentColor" strokeWidth="1.2"/></svg>,
};

/* ----- PRIMITIVES --------------------------------------------------- */
function Badge({ kind, children, lg, outline }) {
  // kind: 'm-GET' | 's-2xx' | 'a-mock' | 'a-fault' | ...
  const cls = ['ft-badge', kind, lg && 'ft-badge--lg', outline && 'ft-badge--outline']
    .filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}

function Toggle({ checked = true, onChange }) {
  return (
    <label className="ft-toggle">
      <input type="checkbox" checked={checked} onChange={onChange} readOnly />
      <span className="ft-toggle-slider" />
    </label>
  );
}

function Btn({ variant = 'primary', size, icon, children, ...rest }) {
  const cls = ['ft-btn',
    variant === 'secondary' && 'ft-btn--secondary',
    variant === 'ghost' && 'ft-btn--ghost',
    variant === 'danger' && 'ft-btn--danger',
    size === 'sm' && 'ft-btn--sm',
    size === 'mobile' && 'ft-btn--mobile',
    icon === true && 'ft-btn--icon'].filter(Boolean).join(' ');
  // Guard against any callers that pass `icon` through a wrapper: never
  // forward it (or `variant` / `size`) to the underlying DOM button.
  const { icon: _i, variant: _v, size: _s, ...domRest } = rest;
  return <button className={cls} {...domRest}>{children}</button>;
}

function Kbd({ children }) { return <span className="ft-kbd">{children}</span>; }

/* DangerConfirmBtn — replaces destructive confirmation popups.
   First click arms the button (text changes, fill goes red); second
   click fires onConfirm. Auto-disarms after 3s. Pass `armed` to force
   the visual state for static artboards. */
function DangerConfirmBtn({
  size,
  idleText = 'Delete server',
  armedText = 'Click again to confirm',
  onConfirm,
  armed: armedProp,
  style,
  ...rest
}) {
  const [armed, setArmed] = useState(false);
  const isArmed = armedProp !== undefined ? armedProp : armed;

  useEffect(() => {
    if (armedProp !== undefined || !armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed, armedProp]);

  const armedStyle = isArmed ? {
    backgroundColor: 'var(--ft-red)',
    color: '#ffffff',
    borderColor: 'var(--ft-red)',
  } : null;

  return (
    <Btn
      variant="danger"
      size={size}
      style={{ ...armedStyle, ...style }}
      onClick={() => {
        if (armedProp !== undefined) return;
        if (armed) { setArmed(false); onConfirm && onConfirm(); }
        else       { setArmed(true); }
      }}
      {...rest}
    >
      {isArmed ? armedText : idleText}
    </Btn>
  );
}

/* Latency bar — gives a quick visual ranking inside the traffic table.
   value in ms, max is the row scale (we'll pass ~300ms typical). */
function LatBar({ ms, max = 300, kind }) {
  const pct = Math.max(2, Math.min(100, (ms / max) * 100));
  let cls = '';
  if (kind === 'err') cls = 'err';
  else if (ms >= max * 0.66) cls = 'slow';
  return (
    <span className="ft-lat">
      <span className="ft-lat-bar"><i className={cls} style={{ width: `${pct}%` }} /></span>
      <span>{ms}<span style={{ opacity: 0.5 }}>ms</span></span>
    </span>
  );
}

/* Status / method label helpers */
const STATUS_LABEL = { 200: 'OK', 201: 'Created', 204: 'No Content', 301: 'Moved', 304: 'Not Modified', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 429: 'Too Many', 500: 'Server Error', 502: 'Bad Gateway', 503: 'Unavailable' };
const statusKind = (s) => s < 300 ? 's-2xx' : s < 400 ? 's-3xx' : s < 500 ? 's-4xx' : 's-5xx';

/* Expose to window so other Babel scripts can use them */
Object.assign(window, {
  FaultendMark, FaultendLogo, Icon, Badge, Toggle, Btn, Kbd, LatBar, DangerConfirmBtn,
  STATUS_LABEL, statusKind,
});
