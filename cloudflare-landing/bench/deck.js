const slides = [...document.querySelectorAll('.slide')];
const previous = document.getElementById('previous');
const next = document.getElementById('next');
const presentation = document.getElementById('presentation');
const fullscreenButton = document.getElementById('deck-fullscreen');
const fullscreenStatus = document.getElementById('fullscreen-status');
let index = 0;
function showSlide(value, focus = false) {
  index = Math.max(0, Math.min(slides.length - 1, value));
  slides.forEach((slide, i) => { slide.hidden = i !== index; });
  document.getElementById('slide-count').textContent = `${index + 1} / ${slides.length}`;
  document.getElementById('progress').style.width = `${100 * (index + 1) / slides.length}%`;
  previous.disabled = index === 0; next.disabled = index === slides.length - 1;
  history.replaceState(null, '', `#slide-${index + 1}`);
  if (focus) slides[index].querySelector('h1,h2').focus({ preventScroll: true });
}
function hashIndex() {
  const match = location.hash.match(/^#slide-([1-9]\d*)$/);
  return match ? Number(match[1]) - 1 : 0;
}
previous.addEventListener('click', () => showSlide(index - 1, true));
next.addEventListener('click', () => showSlide(index + 1, true));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && presentation.classList.contains('expanded')) {
    presentation.classList.remove('expanded');
    syncFullscreen();
    fullscreenButton.focus();
    return;
  }
  if (e.altKey || e.ctrlKey || e.metaKey || ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
  const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: slides.length - 1 }[e.key];
  if (target !== undefined) { e.preventDefault(); showSlide(target, true); }
});
window.addEventListener('hashchange', () => showSlide(hashIndex()));
document.getElementById('deck-print').hidden = false;
document.getElementById('deck-print').addEventListener('click', () => window.print());
document.getElementById('deck-controls').hidden = false;
function syncFullscreen() {
  const active = document.fullscreenElement === presentation || presentation.classList.contains('expanded');
  fullscreenButton.textContent = active ? 'sair da tela cheia ×' : 'tela cheia ⛶';
  fullscreenButton.setAttribute('aria-pressed', String(active));
  document.body.classList.toggle('presenting', active);
  if (!active) fullscreenStatus.textContent = '';
}
fullscreenButton.hidden = false;
fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement === presentation) {
      await document.exitFullscreen();
    } else if (presentation.classList.contains('expanded')) {
      presentation.classList.remove('expanded');
    } else if (presentation.requestFullscreen && document.fullscreenEnabled) {
      await presentation.requestFullscreen();
    } else {
      presentation.classList.add('expanded');
      fullscreenStatus.textContent = 'Apresentação ampliada. Use o botão sair para voltar.';
    }
  } catch {
    if (!document.fullscreenElement) {
      presentation.classList.add('expanded');
      fullscreenStatus.textContent = 'Apresentação ampliada. Use o botão sair para voltar.';
    }
  }
  syncFullscreen();
});
document.addEventListener('fullscreenchange', syncFullscreen);
showSlide(hashIndex());
