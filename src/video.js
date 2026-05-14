const video        = document.getElementById('tour');
const scroller     = document.getElementById('scroller');
const scrollDriver = document.getElementById('scroll-driver');
const progressLine = document.getElementById('progress-line');
const hint         = document.getElementById('hint');
const loader       = document.getElementById('loader');
const loaderFill   = document.getElementById('loader-fill');

const PX_PER_SECOND = 300; // px scrollu na sekundę filmu

// ─── Ustaw wysokość scrollera po załadowaniu metadanych ───────────────────────
video.addEventListener('loadedmetadata', () => {
  scrollDriver.style.height = `calc(100vh + ${Math.ceil(video.duration * PX_PER_SECOND)}px)`;
});

// ─── Pasek ładowania ──────────────────────────────────────────────────────────
function updateLoader() {
  if (!video.duration) return;
  const buffered = video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0;
  const pct = Math.min(100, (buffered / video.duration) * 100);
  loaderFill.style.width = `${pct}%`;
  if (pct >= 99) loader.classList.add('hidden');
}

video.addEventListener('progress', updateLoader);
video.addEventListener('canplaythrough', () => {
  loaderFill.style.width = '100%';
  setTimeout(() => loader.classList.add('hidden'), 350);
});

// ─── Scroll → czas wideo ──────────────────────────────────────────────────────
let targetTime = 0;
let ticking    = false;
let hintHidden = false;

function seekVideo() {
  video.currentTime = targetTime;
  progressLine.style.width = `${(targetTime / (video.duration || 1)) * 100}%`;
  ticking = false;
}

scroller.addEventListener('scroll', () => {
  if (!hintHidden && scroller.scrollTop > 40) {
    hint.classList.add('hidden');
    hintHidden = true;
  }

  const maxScroll = scroller.scrollHeight - scroller.clientHeight;
  if (maxScroll <= 0 || !video.duration) return;

  targetTime = Math.max(0, Math.min((scroller.scrollTop / maxScroll) * video.duration, video.duration));

  if (!ticking) {
    ticking = true;
    requestAnimationFrame(seekVideo);
  }
}, { passive: true });
