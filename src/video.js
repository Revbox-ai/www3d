const video       = document.getElementById('tour');
const scrollDriver = document.getElementById('scroll-driver');
const progressLine = document.getElementById('progress-line');
const hint         = document.getElementById('hint');
const loader       = document.getElementById('loader');
const loaderFill   = document.getElementById('loader-fill');

// 300px scroll = 1 second of video — gives smooth, comfortable control
const PX_PER_SECOND = 300;

// ─── Set page height once we know video duration ──────────────────────────────
video.addEventListener('loadedmetadata', () => {
  scrollDriver.style.height = `calc(100vh + ${Math.ceil(video.duration * PX_PER_SECOND)}px)`;
});

// ─── Loading progress ─────────────────────────────────────────────────────────
function updateLoader() {
  if (!video.duration) return;
  const end = video.buffered.length > 0 ? video.buffered.end(video.buffered.length - 1) : 0;
  const pct  = Math.min(100, (end / video.duration) * 100);
  loaderFill.style.width = `${pct}%`;
  if (pct >= 99) loader.classList.add('hidden');
}

video.addEventListener('progress',      updateLoader);
video.addEventListener('canplaythrough', () => {
  loaderFill.style.width = '100%';
  setTimeout(() => loader.classList.add('hidden'), 350);
});

// ─── Scroll → video time ──────────────────────────────────────────────────────
let targetTime = 0;
let ticking    = false;
let hintHidden = false;

function seekVideo() {
  video.currentTime = targetTime;
  progressLine.style.width = `${(targetTime / (video.duration || 1)) * 100}%`;
  ticking = false;
}

window.addEventListener('scroll', () => {
  // Hide hint on first real scroll
  if (!hintHidden && window.scrollY > 40) {
    hint.classList.add('hidden');
    hintHidden = true;
  }

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  if (maxScroll <= 0 || !video.duration) return;

  targetTime = Math.max(0, Math.min((window.scrollY / maxScroll) * video.duration, video.duration));

  if (!ticking) {
    ticking = true;
    requestAnimationFrame(seekVideo);
  }
}, { passive: true });
