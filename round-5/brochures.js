const companies = ['realty', 'development', 'pm'];
function showCompany(key) {
  if (!companies.includes(key)) key = 'realty';
  document.querySelectorAll('.company').forEach(section => { section.hidden = section.id !== key; });
  document.querySelectorAll('[data-company]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.company === key)));
  history.replaceState(null, '', '#' + key);
}
document.querySelectorAll('[data-company]').forEach(button => button.addEventListener('click', () => showCompany(button.dataset.company)));
document.getElementById('print').addEventListener('click', () => window.print());
window.addEventListener('hashchange', () => showCompany(location.hash.slice(1)));
showCompany(location.hash.slice(1));
