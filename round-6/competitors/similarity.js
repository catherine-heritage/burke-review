// Burke Colour Explorer · Cayman competitor similarity
// Data: competitors/cayman-atlas.json (extracted from Cayman_Property_Brand_Colour_Atlas.html).
// Scores describe colour similarity only. They are not a measure of consumer confusion or trademark clearance.

const labCache = new Map();
const toLin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
export function oklab(h) {
  if (labCache.has(h)) return labCache.get(h);
  const n = parseInt(h.slice(1), 16), [r, g, b] = [n >> 16 & 255, n >> 8 & 255, n & 255].map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const v = [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  labCache.set(h, v); return v;
}
// ΔE in OKLab × 100. Roughly: < 5 same colour, 5–12 close, 12–20 related, > 25 different.
// Dark colours compress in OKLab, so navy, green-ink and brown-black would all read as "the same". Below L 0.45 the
// hue/chroma axes are weighted up (×1.8) so deep primaries are compared by their hue as a viewer would.
export const dE = (a, b) => { const x = oklab(a), y = oklab(b); const k = Math.max(x[0], y[0]) < 0.45 ? 1.8 : 1; return Math.hypot(x[0] - y[0], (x[1] - y[1]) * k, (x[2] - y[2]) * k) * 100; };
export const chroma = h => { const [, a, b] = oklab(h); return Math.hypot(a, b); };
// ΔE ≤ 3 → 1 (same colour), ΔE 10 → 0.5 (clearly related), ΔE ≥ 17 → 0.
const sim = d => Math.max(0, Math.min(1, 1 - (d - 3) / 14));

export const SECTORS = {
  group: { label: 'Property and built environment', rel: null, adj: null },
  realty: { label: 'Real estate', rel: ['Real estate'], adj: ['Property management', 'Development', 'Other'] },
  development: { label: 'Development and construction', rel: ['Development', 'Construction'], adj: ['Architecture and design', 'Real estate', 'Surveying and consultancy'] },
  pm: { label: 'Property management', rel: ['Property management'], adj: ['Real estate', 'Surveying and consultancy'] }
};
export const EXCLUDE = new Set(['heritage-holdings']);

export function prepare(company) {
  const cols = (company.palette || []).filter(p => /^#[0-9a-f]{6}$/i.test(p.hex)).map(p => {
    const hex = p.hex.toUpperCase(), [L] = oklab(hex), C = chroma(hex);
    let kind = 'brand';
    if (/ground/i.test(p.role) || /white wordmark/i.test(p.role) || (L > 0.93 && C < 0.03)) kind = 'ground';
    else if (/navigation background/i.test(p.role)) kind = 'web';
    else if (C < 0.03) kind = 'neutral';
    const provisional = /provisional|screenshot/i.test(p.role);
    const conf = (p.accuracy === 'Extracted' ? 1 : 0.85) * (provisional ? 0.75 : 1);
    return { hex, role: p.role, accuracy: p.accuracy, kind, provisional, conf, w: conf * (kind === 'neutral' ? 0.35 : 1) };
  });
  const usable = cols.filter(c => c.kind !== 'ground');
  const brand = usable.filter(c => c.kind !== 'neutral');
  const flags = [];
  if (!cols.length) flags.push('No colours recorded');
  else if (!brand.length) flags.push('Only neutral colours recorded');
  else if (usable.length === 1) flags.push('Single recorded colour; role hierarchy unknown');
  if (cols.some(c => c.provisional)) flags.push('Includes provisional directory samples');
  if (!company.logo) flags.push('Logo unavailable');
  const extracted = cols.length && cols.every(c => c.accuracy === 'Extracted');
  const evidence = !cols.length ? 'No recorded palette' : (extracted ? 'Extracted' : cols.some(c => c.accuracy === 'Extracted') ? 'Extracted + sampled' : 'Sampled') + ' · ' + (company.logoEvidence || 'source unknown');
  const quality = !brand.length ? 'low' : cols.some(c => c.provisional) || !company.logo ? 'medium' : extracted ? 'high' : 'good';
  return { ...company, cols, usable, brand, flags, evidence, quality };
}

export function relevance(sector, k) {
  const s = SECTORS[k];
  if (!s || !s.rel) return { tier: 'rel', w: 1 };
  if (s.rel.includes(sector)) return { tier: 'rel', w: 1 };
  if (s.adj.includes(sector)) return { tier: 'adj', w: 0.75 };
  return { tier: 'other', w: 0.55 };
}

// burke: [{ hex, role, key: 'P'|'S'|'B'|'A2', w }]
export function scorePalette(burke, comp) {
  const U = comp.usable;
  if (!U.length) return null;
  const P = burke.find(b => b.key === 'P'), S = burke.find(b => b.key === 'S');
  const best = b => { let m = { s: 0, d: 99, c: null }; U.forEach(c => { const d = dE(b.hex, c.hex), s = sim(d) * c.w; if (s > m.s) m = { s, d, c }; }); return m; };
  const mm = burke.map(b => ({ b, ...best(b) }));
  const g = key => mm.find(x => x.b.key === key) || { s: 0 };
  const mP = g('P').s, mS = g('S').s, mAcc = Math.max(g('B').s, g('A2').s);
  let pair = 0;
  if (P && S && U.length >= 2) {
    U.forEach((c1, i) => U.forEach((c2, j) => { if (i !== j) pair = Math.max(pair, Math.min(sim(dE(P.hex, c1.hex)) * c1.w, sim(dE(S.hex, c2.hex)) * c2.w)); }));
  } else if (U.length < 2) pair = 0.35 * mP + 0.6 * mS;
  else pair = mP;
  const brand = comp.brand.length ? comp.brand : U;
  const covered = brand.filter(c => burke.some(b => sim(dE(b.hex, c.hex)) >= 0.5)).length / brand.length * (S && U.length < 2 ? 0.5 : 1);
  const score = S
    ? 100 * (0.45 * pair + 0.25 * mS + 0.08 * mP + 0.08 * mAcc + 0.14 * covered)
    : 100 * (0.6 * mP + 0.15 * mAcc + 0.25 * covered);
  const strongest = S ? mS : mP; // the shared primary alone is reported at Group level, not per subsidiary
  const level = (score >= 62 && (pair >= 0.6 || (U.length === 1 && (S ? mS : mP) >= 0.85))) ? 2 : (score >= 45 || strongest >= 0.6) ? 1 : 0;
  const similar = mm.filter(x => x.c && x.s >= 0.45).map(x => ({ role: x.b.role, a: x.b.hex, b: x.c.hex, d: x.d, theirRole: x.c.kind === 'web' ? 'website background' : x.c.kind === 'neutral' ? 'neutral' : 'logo colour' }));
  const differ = [
    ...mm.filter(x => x.b.w >= 0.9 && (!x.c || x.s < 0.3)).map(x => 'No counterpart to Burke ' + x.b.role.toLowerCase() + ' ' + x.b.hex),
    ...brand.filter(c => !burke.some(b => sim(dE(b.hex, c.hex)) >= 0.45)).map(c => 'Their ' + c.hex + (c.kind === 'web' ? ' website background' : '') + ' has no Burke match')
  ];
  return { score: Math.round(score), level, pair, mP, mS, similar, differ };
}

export const LEVELS = ['Distinct in the recorded sample', 'Some overlap', 'Close resemblance'];

// Secondary-colour matching: one Burke colour vs every recorded logo colour, all sectors.
export const lch = h => { const [L, a, b] = oklab(h); return [L, Math.hypot(a, b), (Math.atan2(b, a) * 180 / Math.PI + 360) % 360]; };
export const plainDE = (a, b) => { const x = oklab(a), y = oklab(b); return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) * 100; };
const FAM = [['Red', 345, 33], ['Orange', 33, 62], ['Gold and yellow', 62, 110], ['Green', 110, 175], ['Teal', 175, 215], ['Blue', 215, 290], ['Purple', 290, 345]];
export function family(hex) {
  const [, C, H] = lch(hex);
  if (C < 0.045) return 'Neutral';
  const f = FAM.find(([, a, b]) => a > b ? (H >= a || H < b) : (H >= a && H < b));
  return f ? f[0] : 'Neutral';
}
export const NEAR = { close: 8, similar: 16 };
export function colourMatches(hex, comps) {
  const fam = family(hex);
  if (fam === 'Neutral') return { fam, list: [] };
  const list = [];
  comps.forEach(c => {
    if (EXCLUDE.has(c.id)) return;
    let best = null;
    (c.cols || []).forEach(x => { if (x.kind === 'ground' || family(x.hex) !== fam) return; const d = plainDE(hex, x.hex); if (!best || d < best.d) best = { hex: x.hex, role: x.role, accuracy: x.accuracy, provisional: x.provisional, d }; });
    if (best) list.push({ comp: c, match: best, level: best.d <= NEAR.close ? 2 : best.d <= NEAR.similar ? 1 : 0 });
  });
  list.sort((a, b) => a.match.d - b.match.d);
  return { fam, list };
}

export function rank(burke, comps, k, scope, limit = 5) {
  return comps.map(c => {
    if (EXCLUDE.has(c.id)) return null;
    const r = relevance(c.sector, k);
    if (scope === 'rel' && r.tier !== 'rel') return null;
    const s = scorePalette(burke, c);
    return s && { comp: c, rel: r, ...s, rank: s.score * (scope === 'rel' ? 1 : 1) };
  }).filter(Boolean).sort((a, b) => b.rank - a.rank).slice(0, limit);
}

// Worst relevant-sector result for one Burke company. Used for discreet warning dots and the generator.
export function risk(burke, comps, k) {
  let top = { score: 0, level: 0, comp: null };
  comps.forEach(c => {
    if (EXCLUDE.has(c.id)) return;
    const r = relevance(c.sector, k); const s = scorePalette(burke, c);
    if (!s) return;
    const eff = s.score * r.w, lvl = r.tier === 'rel' ? s.level : Math.min(s.level, 1);
    if (lvl > top.level || (lvl === top.level && eff > top.score)) top = { score: eff, level: lvl, comp: c, raw: s.score };
  });
  return top;
}
