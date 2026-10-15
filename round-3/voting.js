import { preferenceFields, settingsToVote, voteToSettings, validVote, sameVote, voteDescription, summariseVotes } from './vote-model.js';
import { makeFixedBlueLogo } from './blue-palette.js';

const defaultBackend = async () => (await import('./firebase-voting.js')).connectVoting();
const messageFor = error => error?.code === 'permission-denied'
  ? 'Voting is not available yet. Please try again later.'
  : error?.code === 'resource-exhausted'
    ? 'Voting is temporarily busy. Please try again later.'
    : 'Voting could not connect. Check your connection and try again.';
const percent = (count, total) => total ? Math.round(count / total * 100) : 0;
const element = (tag, className, text) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
};

export function mountVoting({ getSettings, setSettings, loadBackend = defaultBackend }) {
  const before = document.querySelector('#vote-before');
  const after = document.querySelector('#vote-after');
  const cast = document.querySelector('#cast-vote');
  const update = document.querySelector('#update-vote');
  const notice = document.querySelector('#vote-notice');
  const retry = document.querySelector('#retry-voting');
  const results = document.querySelector('#live-results');
  const resultsStatus = document.querySelector('#results-status');
  const resultsContent = document.querySelector('#results-content');
  const retryResults = document.querySelector('#retry-results');
  let backend, stopVote, stopResults, generation = 0, connectionTimer, saveTimer;
  let vote = null, ready = false, saving = false, edited = false, restored = false, disposed = false;
  let lastResults = null;

  function renderVote() {
    before.hidden = !!vote;
    after.hidden = !vote;
    results.hidden = !vote;
    cast.disabled = !ready || saving;
    cast.textContent = saving ? 'Saving your vote…' : 'Vote for this version';
    update.disabled = !ready || saving || sameVote(vote, settingsToVote(getSettings()));
    update.textContent = saving ? 'Updating your vote…' : 'Update my vote';
    if (vote) {
      document.querySelector('#your-vote').textContent = voteDescription(vote);
      document.querySelector('#vote-edit-hint').textContent = sameVote(vote, settingsToVote(getSettings()))
        ? 'Adjust the options above to change your vote.'
        : 'The preview has changed. Update your vote to save these options.';
    }
  }
  function renderResults(data) {
    const summary = summariseVotes(data.votes);
    lastResults = summary;
    document.querySelector('#vote-total').textContent = `${summary.total} ${summary.total === 1 ? 'vote' : 'votes'}`;
    const breakdowns = document.querySelector('#preference-breakdowns');
    breakdowns.replaceChildren();
    summary.preferences.forEach(field => {
      const group = element('div', 'preference-group');
      group.append(element('h3', '', field.label));
      field.options.forEach(option => {
        const row = element('div', 'preference-option');
        const label = element('span', 'preference-label', option.label);
        const track = element('div', 'preference-track');
        const value = percent(option.count, summary.total);
        track.setAttribute('role', 'meter');
        track.setAttribute('aria-label', `${field.label}: ${option.label}`);
        track.setAttribute('aria-valuemin', '0');
        track.setAttribute('aria-valuemax', '100');
        track.setAttribute('aria-valuenow', String(value));
        track.setAttribute('aria-valuetext', `${option.count} of ${summary.total} votes (${value}%)`);
        const bar = element('span');
        bar.style.width = `${value}%`;
        track.append(bar);
        row.append(label, track, element('span', 'preference-value', `${value}%`));
        group.append(row);
      });
      breakdowns.append(group);
    });
    const top = document.querySelector('#top-combinations');
    top.replaceChildren();
    summary.top.forEach((combination, index) => {
      const figure = element('figure', 'popular-combination');
      const logo = makeFixedBlueLogo(voteToSettings(combination.vote), 0);
      logo.setAttribute('viewBox', '160 150 760 680');
      const caption = element('figcaption');
      caption.append(element('h4', '', `${index + 1}. ${combination.count} ${combination.count === 1 ? 'vote' : 'votes'} · ${percent(combination.count, summary.total)}%`));
      const settings = element('dl', 'combination-settings');
      preferenceFields.forEach(field => {
        settings.append(element('dt', '', field.label), element('dd', '', field.options.find(option => option.value === combination.vote[field.key]).label));
      });
      caption.append(settings);
      figure.append(logo, caption);
      top.append(figure);
    });
    resultsContent.hidden = false;
    resultsStatus.textContent = data.cached ? 'Showing the last received results. Reconnecting…' : 'Results update automatically.';
    retryResults.hidden = true;
  }
  function listenForResults() {
    if (!vote || !backend || stopResults) return;
    resultsStatus.textContent = 'Loading live results…';
    stopResults = backend.watchResults(data => {
      if (!disposed && vote) renderResults(data);
    }, () => {
      if (disposed || !vote) return;
      resultsStatus.textContent = lastResults
        ? 'Results could not refresh. Showing the last received counts.'
        : 'Results are temporarily unavailable. Your vote is saved.';
      retryResults.hidden = false;
    });
  }
  function failConnection(error) {
    ready = false;
    clearTimeout(connectionTimer);
    notice.textContent = messageFor(error);
    retry.hidden = false;
    renderVote();
  }
  async function connect() {
    const attempt = ++generation;
    ready = false;
    stopVote?.(); stopVote = null;
    stopResults?.(); stopResults = null;
    clearTimeout(connectionTimer);
    notice.textContent = 'Connecting to voting…';
    retry.hidden = true;
    renderVote();
    connectionTimer = setTimeout(() => {
      if (!disposed && attempt === generation) failConnection(new Error('Connection timeout'));
    }, 15000);
    try {
      const connected = await loadBackend();
      if (disposed || attempt !== generation) return;
      backend = connected;
      stopVote = backend.watchVote(snapshot => {
        if (disposed || attempt !== generation || snapshot.pending || snapshot.cached) return;
        clearTimeout(connectionTimer);
        ready = true;
        retry.hidden = true;
        notice.textContent = '';
        vote = validVote(snapshot.vote) ? { ...snapshot.vote } : null;
        if (!restored) {
          restored = true;
          if (vote && !edited && !new URLSearchParams(location.hash.slice(1)).has('logo')) setSettings(voteToSettings(vote));
        }
        if (!vote) {
          stopResults?.(); stopResults = null;
          lastResults = null;
          resultsContent.hidden = true;
          document.querySelector('#vote-total').textContent = '';
        }
        renderVote();
        listenForResults();
      }, error => {
        if (disposed || attempt !== generation) return;
        stopResults?.(); stopResults = null;
        failConnection(error);
      });
    } catch (error) {
      if (!disposed && attempt === generation) failConnection(error);
    }
  }
  async function saveVote() {
    if (!backend || !ready || saving) return;
    const selection = settingsToVote([...getSettings()]);
    if (!validVote(selection) || sameVote(vote, selection)) return;
    saving = true;
    notice.textContent = '';
    retry.hidden = true;
    renderVote();
    saveTimer = setTimeout(() => {
      if (!disposed && saving) notice.textContent = 'Your vote is waiting for a connection. Keep this page open; it will confirm once saved.';
    }, 10000);
    try {
      await backend.save(selection);
      if (disposed) return;
      // The server-confirmed own-vote listener is the source of truth.
      notice.textContent = '';
      renderVote();
    } catch (error) {
      if (!disposed) {
        notice.textContent = messageFor(error);
        retry.hidden = false;
      }
    } finally {
      clearTimeout(saveTimer);
      if (!disposed) { saving = false; renderVote(); }
    }
  }
  const onSelectionChanged = () => { edited = true; renderVote(); };
  const onRetry = () => { if (!saving) connect(); };
  const onRetryResults = () => { stopResults?.(); stopResults = null; listenForResults(); };
  cast.addEventListener('click', saveVote);
  update.addEventListener('click', saveVote);
  retry.addEventListener('click', onRetry);
  retryResults.addEventListener('click', onRetryResults);
  connect();
  return {
    selectionChanged: onSelectionChanged,
    destroy() {
      disposed = true; generation++;
      clearTimeout(connectionTimer); clearTimeout(saveTimer);
      stopVote?.(); stopResults?.();
      cast.removeEventListener('click', saveVote);
      update.removeEventListener('click', saveVote);
      retry.removeEventListener('click', onRetry);
      retryResults.removeEventListener('click', onRetryResults);
    },
  };
}
