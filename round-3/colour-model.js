export const companyNames = ['Burke Group', 'Burke Realty', 'Burke Development', 'Burke Property Management'];
export const originalAccents = ['#768290', '#CC6E2F', '#81376D', '#317B82'];
export const defaultFamilies = [0, 1, 0, 1];
// Each family spans cooler and warmer, lighter and deeper corporate shades.
export const colourFamilies = [
  [
    { name: 'Navy', initial: '#768290', shades: ['#768290','#1B2E46','#34465F','#4B6175','#62778B','#3D5361','#5D687C','#243D52','#7A8792','#42576D','#586C78','#304255'] },
    { name: 'Gold', initial: '#B78352', shades: ['#B78352','#967044','#C29A62','#A98050','#B09468','#9B8053','#C1A775','#AA7545','#BC8D58','#90754D','#B9A078','#A68B63'] },
  ],
  [
    { name: 'Red', initial: '#A85649', shades: ['#A85649','#8F4945','#BA6C60','#A56C64','#934E53','#B57769','#9B5B51','#B96959','#8C5550','#AF716A','#A45149','#C07F70'] },
    { name: 'Orange', initial: '#CC6E2F', shades: ['#CC6E2F','#A9542F','#C17A46','#995232','#B98253','#A96842','#C1855B','#9E653D','#B85E35','#A87B45','#BC8A4E','#925B3E','#C07B62','#AC6046','#A06F55','#B28B5B','#8F512F','#BC724D'] },
  ],
  [
    { name: 'Purple', initial: '#81376D', shades: ['#81376D','#67405E','#77516F','#543D59','#82628B','#69658E','#8B6B89','#62476F','#765D83','#59445F','#8C7898','#705D78','#785269','#5D526F','#92799E','#63425B','#81758F','#734E7A','#6C607D'] },
    { name: 'Blue', initial: '#648EAB', shades: ['#648EAB','#5476A1','#597D94','#6B879C','#53788E','#62869C','#54718A','#708EA3','#45647D','#3B647C','#7896A8','#496E91','#687D98','#467984'] },
  ],
  [
    { name: 'Green', initial: '#41785C', shades: ['#41785C','#6E8664','#78865F','#587C68','#7D8B6A','#496B50','#65815B','#88956F','#3D6754','#75896E','#5D7350','#829583','#6B805D','#376452','#7B8552'] },
    { name: 'Teal', initial: '#317B82', shades: ['#317B82','#347B7C','#2F6668','#4E8987','#3C7475','#5C9390','#427F83','#326B70','#568A88','#3D737C','#60918B','#2D6262','#4B8180','#347B73','#426B66'] },
  ],
];
export function normaliseHex(value) {
  const hex = value.trim().replace(/^#/, '');
  if (/^[\da-f]{3}$/i.test(hex)) return '#' + [...hex].map(c => c + c).join('').toUpperCase();
  return /^[\da-f]{6}$/i.test(hex) ? '#' + hex.toUpperCase() : null;
}
function distance(a, b) {
  const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  const aa = rgb(a), bb = rgb(b);
  return Math.hypot(...aa.map((v, i) => v - bb[i]));
}
export function shuffleAccents(current, locked, families = defaultFamilies, random = Math.random) {
  const next = [...current];
  const reserved = current.filter((_, i) => i > 0 && locked[i]);
  current.forEach((hex, i) => {
    if (locked[i]) return;
    const shades = colourFamilies[i][families[i]].shades;
    const changed = shades.filter(shade => distance(shade, hex) >= 40);
    const options = changed.length ? changed : [...shades].sort((a,b) => distance(b,hex)-distance(a,hex)).slice(0,1);
    const distinct = i === 0 ? options : options.filter(shade => reserved.every(other => distance(shade, other) >= 50));
    const candidates = distinct.length ? distinct : [...options].sort((a,b) => Math.min(...reserved.map(other=>distance(b,other)))-Math.min(...reserved.map(other=>distance(a,other)))).slice(0,1);
    next[i] = candidates[Math.floor(random() * candidates.length)];
    if (i > 0) reserved.push(next[i]);
  });
  return next;
}
