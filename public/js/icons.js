// Minimal stroke icon set — inline SVG strings.

export const Icon = {
  plus:    '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true"><path d="M8 2 L8 14 M2 8 L14 8" stroke="currentColor" stroke-width="1.4"/></svg>',
  x:       '<svg viewBox="0 0 16 16" width="12" height="12" fill="none" aria-hidden="true"><path d="M3 3 L13 13 M13 3 L3 13" stroke="currentColor" stroke-width="1.4"/></svg>',
  edit:    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><path d="M2 14 L2 11 L11 2 L14 5 L5 14 Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="miter"/></svg>',
  trash:   '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><path d="M3 4 L13 4 M5 4 L5 2 L11 2 L11 4 M4 4 L5 14 L11 14 L12 4 M7 7 L7 12 M9 7 L9 12" stroke="currentColor" stroke-width="1.2"/></svg>',
  copy:    '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><rect x="3" y="3" width="9" height="9" stroke="currentColor" stroke-width="1.2"/><path d="M6 3 L6 1 L14 1 L14 9 L12 9" stroke="currentColor" stroke-width="1.2"/></svg>',
  refresh: '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><path d="M13 4 A6 6 0 1 0 14 9" stroke="currentColor" stroke-width="1.2"/><path d="M13 1.5 L13 4 L10.5 4" stroke="currentColor" stroke-width="1.2"/></svg>',
  chevronRight: '<svg viewBox="0 0 12 12" width="10" height="10" fill="none" aria-hidden="true"><path d="M4 2 L8 6 L4 10" stroke="currentColor" stroke-width="1.4"/></svg>',
  search:  '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><circle cx="7" cy="7" r="4.5" stroke="currentColor"/><path d="M10.5 10.5 L14 14" stroke="currentColor" stroke-linecap="square"/></svg>',
  filter:  '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><path d="M2 3 L14 3 L10 8 L10 13 L6 11 L6 8 Z" stroke="currentColor" stroke-width="1.2"/></svg>',
  person:  '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><circle cx="8" cy="5" r="2.4" stroke="currentColor" stroke-width="1.2"/><path d="M2.5 13.5 C3.5 10.5 5.7 9.4 8 9.4 C10.3 9.4 12.5 10.5 13.5 13.5" stroke="currentColor" stroke-width="1.2"/></svg>',
  people:  '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" aria-hidden="true"><circle cx="6" cy="5.5" r="2.2" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 13 C2.5 10.2 4.2 9.2 6 9.2 C7.8 9.2 9.5 10.2 10.5 13" stroke="currentColor" stroke-width="1.2"/><circle cx="11.2" cy="6" r="1.7" stroke="currentColor" stroke-width="1.2"/><path d="M10 9.4 C11.2 9.2 13.5 9.8 14.5 12.4" stroke="currentColor" stroke-width="1.2"/></svg>',
};

/** Lowercased badge-class suffix for an HTTP method. `*` maps to `any`. */
export function methodBadgeClass(method) {
  return method === '*' ? 'any' : method.toLowerCase();
}
