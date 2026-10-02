const scenarios = {
  github: { usage: [1250, 850], reason: 'GitHub has quota available. Later providers are not evaluated.' },
  blacksmith: { usage: [1900, 850], reason: 'GitHub is at its reserve. Blacksmith has quota available.' },
  fallback: { usage: [null, null], reason: 'Usage is unknown for both quota providers. The configured fallback is selected.' },
};
const providers = [
  { name: 'GitHub-hosted', runner: 'ubuntu-latest', included: 2000, reserve: 100 },
  { name: 'Blacksmith', runner: 'blacksmith-4vcpu-ubuntu-2404', included: 3000, reserve: 100 },
  { name: 'Fallback', runner: 'other-provider-runner' },
];
const format = value => value === null || value === undefined ? '—' : value.toLocaleString('en-US');

function renderScenario(key) {
  const scenario = scenarios[key];
  let selectedIndex = -1;
  const rows = providers.map((provider, index) => {
    const used = scenario.usage[index];
    const remaining = used === null || used === undefined ? null : Math.max(0, provider.included - used);
    let decision = 'Not evaluated';
    let state = 'not-evaluated';
    if (selectedIndex === -1) {
      if (index === 2 || (remaining !== null && remaining > provider.reserve)) {
        selectedIndex = index;
        decision = 'Selected';
        state = 'selected';
      } else {
        decision = remaining === null ? 'Skip · usage unknown' : 'Skip · at reserve';
        state = '';
      }
    }
    return `<tr class="${state}"><th scope="row"><span class="order">${index + 1}</span>${provider.name}</th><td class="numeric">${format(provider.included)}</td><td class="numeric">${format(used)}</td><td class="numeric">${format(remaining)}</td><td class="numeric">${format(provider.reserve)}</td><td><span class="decision ${state === 'selected' ? 'chosen' : ''}">${decision}</span></td></tr>`;
  });
  document.querySelector('#provider-rows').innerHTML = rows.join('');
  document.querySelector('#selected-runner').textContent = providers[selectedIndex].runner;
  document.querySelector('#selection-reason').textContent = scenario.reason;
  document.querySelectorAll('[data-scenario]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === key)));
  const result = document.querySelector('.ledger-result');
  result.classList.remove('changed');
  requestAnimationFrame(() => result.classList.add('changed'));
}
document.querySelectorAll('[data-scenario]').forEach(button => button.addEventListener('click', () => renderScenario(button.dataset.scenario)));

document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    button.textContent = 'Copied';
    document.querySelector('#copy-status').textContent = `${button.getAttribute('aria-label')} copied to clipboard.`;
    setTimeout(() => { button.textContent = 'Copy'; }, 2000);
  } catch {
    button.textContent = 'Select text';
    document.querySelector('#copy-status').textContent = 'Clipboard access is unavailable. Select and copy the code manually.';
    const code = button.closest('.expression-strip, .code-block').querySelector('code');
    const range = document.createRange();
    range.selectNodeContents(code);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
}));

const sectionLinks = document.querySelectorAll('nav a[href^="#"]');
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    sectionLinks.forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
}, { rootMargin: '-10% 0px -60% 0px' });
sectionLinks.forEach(link => observer.observe(document.querySelector(link.hash)));
