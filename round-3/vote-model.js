export const preferenceFields = [
  { key: 'spacing', label: 'Icon spacing', options: [{ value: 0, label: 'Original' }, { value: 1, label: 'Wider' }] },
  { key: 'shape', label: 'Icon shape', options: [{ value: 0, label: 'Original' }, { value: 1, label: 'Curved' }] },
  { key: 'weight', label: 'Group weight', options: [{ value: 0, label: 'Original' }, { value: 1, label: 'Bold' }] },
  { key: 'tracking', label: 'Letter spacing', options: [{ value: 0, label: 'Original' }, { value: 1, label: 'Tighter' }] },
  { key: 'colour', label: 'Colour treatment', options: [{ value: 0, label: 'Original' }, { value: 2, label: 'Single-colour icon' }, { value: 1, label: 'Single-colour text' }] },
];
export const settingsToVote = settings => Object.fromEntries(preferenceFields.map((field, i) => [field.key, settings[i]]));
export const voteToSettings = vote => preferenceFields.map(field => vote[field.key]);
export function validVote(vote) {
  return !!vote && typeof vote === 'object' && !Array.isArray(vote)
    && Object.keys(vote).length === 5
    && preferenceFields.every(field => Number.isInteger(vote[field.key]) && field.options.some(option => option.value === vote[field.key]));
}
export const voteKey = vote => voteToSettings(vote).join('');
export const sameVote = (a, b) => !!a && !!b && voteKey(a) === voteKey(b);
export const voteDescription = vote => preferenceFields.map(field => `${field.label}: ${field.options.find(option => option.value === vote[field.key]).label}`).join(' · ');
export function summariseVotes(votes) {
  const valid = votes.filter(validVote);
  const counts = preferenceFields.map(field => ({ ...field, options: field.options.map(option => ({ ...option, count: 0 })) }));
  const combinations = new Map();
  valid.forEach(vote => {
    counts.forEach(field => { field.options.find(option => option.value === vote[field.key]).count++; });
    const key = voteKey(vote);
    if (!combinations.has(key)) combinations.set(key, { key, vote, count: 0 });
    combinations.get(key).count++;
  });
  return { total: valid.length, preferences: counts, top: [...combinations.values()].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)).slice(0, 3) };
}
