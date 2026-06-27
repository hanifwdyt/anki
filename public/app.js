'use strict';
/* anki.hanif.app — SRS flashcard kanji N5. Vanilla, state di localStorage. */

const $ = (s) => document.querySelector(s);
const DECK = (window.N5_KANJI || []);
const TOTAL = DECK.length;
const NEW_LIMIT = 12;
const STORE_KEY = 'anki.n5.v1';
const SND_KEY = 'anki.sound';

// ── Persistence ──
let state = load();
function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; } }
function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

// ── SRS core (interval dalam menit) ──
function computeNext(st, g) {
  const isNew = !st || !st.reps;
  let ease = (st && st.ease) || 2.5;
  let interval;
  if (isNew) {
    interval = [1, 6, 1440, 5760][g];            // Lagi / Susah / Bagus / Gampang
  } else {
    const base = st.interval || 1440;
    if (g === 0)      { interval = 1;                              ease = Math.max(1.3, ease - 0.2); }
    else if (g === 1) { interval = Math.max(base * 1.2, base + 1440); ease = Math.max(1.3, ease - 0.15); }
    else if (g === 2) { interval = base * ease; }
    else              { interval = base * ease * 1.3;             ease = ease + 0.15; }
  }
  return { interval: Math.round(Math.min(interval, 365 * 1440)), ease };
}
function applyGrade(k, g) {
  const st = state[k] || { reps: 0, ease: 2.5, interval: 0, lapses: 0 };
  const nx = computeNext(st, g);
  st.ease = nx.ease;
  st.interval = nx.interval;
  st.reps = g === 0 ? 0 : (st.reps || 0) + 1;
  if (g === 0) st.lapses = (st.lapses || 0) + 1;
  st.due = Date.now() + nx.interval * 60000;
  st.seen = true;
  state[k] = st;
  save();
}
const isLearned = (st) => st && st.reps > 0 && st.interval >= 1440;
function fmtInterval(min) {
  if (min < 1) return '<1m';
  if (min < 60) return Math.round(min) + 'm';
  if (min < 1440) return Math.round(min / 60) + 'j';
  return Math.round(min / 1440) + 'h';
}

// ── Stats ──
function deckStats() {
  const now = Date.now();
  let learned = 0, dueNow = 0, seen = 0;
  for (const card of DECK) {
    const st = state[card.k];
    if (st && st.seen) seen++;
    if (isLearned(st)) learned++;
    if (st && st.due && st.due <= now) dueNow++;
  }
  const newRemain = TOTAL - seen;
  const sessionSize = dueNow + Math.min(newRemain, NEW_LIMIT);
  return { learned, dueNow, seen, newRemain, sessionSize };
}

// ════════════════════ HOME ════════════════════
const DECKS_META = [
  { id: 'n5k', name: 'Kanji N5', desc: 'Kanji inti JLPT N5', mini: '漢', active: true },
  { id: 'hira', name: 'Hiragana', desc: 'あ い う え お', mini: 'あ', active: false },
  { id: 'kata', name: 'Katakana', desc: 'ア イ ウ エ オ', mini: 'ア', active: false },
  { id: 'n5v', name: 'Kosakata N5', desc: 'Vocab dasar', mini: '語', active: false },
];

function renderHome() {
  const s = deckStats();
  const grid = $('#deckGrid');
  grid.innerHTML = '';
  for (const d of DECKS_META) {
    if (d.active) {
      const pct = Math.round((s.learned / TOTAL) * 100);
      const el = document.createElement('button');
      el.className = 'deck';
      el.innerHTML = `
        <div class="deck-mini">${d.mini}</div>
        <h3 class="deck-name">${d.name}</h3>
        <p class="deck-desc">${d.desc}</p>
        <div class="deck-stats">
          <div class="deck-stat due"><b>${s.sessionSize}</b><small>SIAP DIULANG</small></div>
          <div class="deck-stat"><b>${s.learned}<span style="color:var(--ink-3);font-weight:500">/${TOTAL}</span></b><small>DIPELAJARI</small></div>
        </div>
        <div class="deck-bar"><i style="width:${pct}%"></i></div>
        <span class="deck-cta">${s.sessionSize ? 'Mulai belajar' : 'Semua nempel — ulang lagi'}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>`;
      el.addEventListener('click', startSession);
      grid.appendChild(el);
      // animate bar after paint
      requestAnimationFrame(() => { const bar = el.querySelector('.deck-bar > i'); bar.style.width = '0'; requestAnimationFrame(() => bar.style.width = pct + '%'); });
    } else {
      const el = document.createElement('button');
      el.className = 'deck locked';
      el.disabled = true;
      el.innerHTML = `
        <span class="deck-soon">Segera</span>
        <div class="deck-mini">${d.mini}</div>
        <h3 class="deck-name">${d.name}</h3>
        <p class="deck-desc">${d.desc}</p>`;
      grid.appendChild(el);
    }
  }
  $('#resetWrap').hidden = s.seen === 0;
}

// ════════════════════ SESSION ════════════════════
let queue = [];        // array of card objects
let sessionStats = { again: 0, good: 0, total: 0 };
let current = null;
let flipped = false;

function buildQueue() {
  const now = Date.now();
  const due = [], fresh = [];
  for (const card of DECK) {
    const st = state[card.k];
    if (st && st.seen) { if (st.due && st.due <= now) due.push(card); }
    else fresh.push(card);
  }
  // sedikit acak biar ga monoton
  shuffle(fresh);
  shuffle(due);
  return [...due, ...fresh.slice(0, NEW_LIMIT)];
}
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (i * 2654435761 + Date.now() / 1000 + i) % (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

function startSession() {
  queue = buildQueue();
  sessionStats = { again: 0, good: 0, total: 0 };
  if (queue.length === 0) { showDone(true); return; }
  initialQueueLen = queue.length;
  show('review');
  nextCard();
}
let initialQueueLen = 0;
let doneSoFar = 0;

function nextCard() {
  if (queue.length === 0) { showDone(false); return; }
  current = queue.shift();
  flipped = false;
  renderCard();
}

const SUITS = ['s-red', 's-blue', 's-green', 's-yellow'];
function renderCard() {
  const c = current;
  const tile = $('#tile');
  tile.classList.remove('flipped');
  // re-trigger deal animation di scene (jangan di .tile — bentrok sama transform flip)
  const scene = document.querySelector('.tile-scene');
  scene.classList.remove('dealing'); void scene.offsetWidth; scene.classList.add('dealing');

  const suit = $('#tileSuit');
  suit.className = 'tile-suit ' + SUITS[DECK.indexOf(c) % 4];

  $('#tileKanji').textContent = c.k;
  $('#backKanji').textContent = c.k;
  $('#backMeaning').textContent = c.m;

  // readings
  const rr = $('#backReadings');
  rr.innerHTML = '';
  const addRow = (tag, cls, vals) => {
    if (!vals || !vals.length) return;
    const row = document.createElement('div');
    row.className = 'reading-row';
    row.innerHTML = `<span class="reading-tag ${cls}">${tag}</span><span class="reading-val">${vals.slice(0, 3).join('・')}</span>`;
    rr.appendChild(row);
  };
  addRow('on', 'on', c.on);
  addRow('kun', 'kun', c.kun);

  const ex = $('#backExample');
  if (c.ex) ex.innerHTML = `<span class="ex-w">${c.ex.w}</span><span class="ex-r">(${c.ex.r})</span><span class="ex-m">${c.ex.m}</span>`;
  else ex.innerHTML = '';

  // predicted intervals
  const st = state[c.k];
  $('#lblAgain').textContent = fmtInterval(computeNext(st, 0).interval);
  $('#lblHard').textContent = fmtInterval(computeNext(st, 1).interval);
  $('#lblGood').textContent = fmtInterval(computeNext(st, 2).interval);
  $('#lblEasy').textContent = fmtInterval(computeNext(st, 3).interval);

  // UI: show flip CTA, hide grades
  $('#flipCta').hidden = false;
  $('#gradeRow').hidden = true;
  updateProgress();
}

function flip() {
  if (flipped) return;
  flipped = true;
  $('#tile').classList.add('flipped');
  $('#flipCta').hidden = true;
  $('#gradeRow').hidden = false;
  sound('flip');
}

function grade(g) {
  if (!flipped) return;
  applyGrade(current.k, g);
  sessionStats.total++;
  if (g === 0) { sessionStats.again++; queue.splice(Math.min(3, queue.length), 0, current); } // ulang lagi sesi ini
  else { sessionStats.good++; doneSoFar++; }
  sound(g === 0 ? 'again' : 'good');
  nextCard();
}

function updateProgress() {
  const denom = initialQueueLen || 1;
  const pct = Math.min(100, Math.round((doneSoFar / denom) * 100));
  $('#revFill').style.width = pct + '%';
  $('#revCount').textContent = `${doneSoFar}/${initialQueueLen}`;
}

// ════════════════════ DONE ════════════════════
function showDone(emptyAll) {
  show('done');
  const emojis = ['🀄', '🎉', '✨', '🍡', '🌸'];
  $('#doneEmoji').textContent = emptyAll ? '🌸' : emojis[(sessionStats.total) % emojis.length];
  $('#doneTitle').textContent = emptyAll ? 'Semua nempel!' : 'Sesi beres!';
  $('#doneSub').textContent = emptyAll
    ? 'Ga ada kartu yang due sekarang. Balik lagi nanti pas waktunya ngulang.'
    : 'Mantap. Kanji lo makin nempel — konsisten ya.';
  const s = deckStats();
  $('#doneStats').innerHTML = `
    <div class="d-stat c-green"><b>${sessionStats.good}</b><small>diingat</small></div>
    <div class="d-stat c-red"><b>${sessionStats.again}</b><small>diulang</small></div>
    <div class="d-stat"><b>${s.learned}</b><small>total dipelajari</small></div>`;
  if (!emptyAll && sessionStats.total > 0) confetti();
}

// ════════════════════ Screen switch ════════════════════
function show(id) {
  for (const el of document.querySelectorAll('.screen')) el.classList.toggle('is-active', el.id === id);
  window.scrollTo(0, 0);
}

// ════════════════════ Confetti ════════════════════
function confetti() {
  const cv = $('#confetti');
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const colors = ['#4285f4', '#ea4335', '#fbbc05', '#34a853', '#ffffff'];
  const P = [];
  for (let i = 0; i < 140; i++) {
    P.push({ x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.32,
      vx: (Math.random() - 0.5) * 9, vy: Math.random() * -11 - 4,
      g: 0.32 + Math.random() * 0.15, s: 5 + Math.random() * 7,
      rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.5,
      c: colors[i % colors.length], life: 0 });
  }
  let frame = 0;
  (function run() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    let alive = false;
    for (const p of P) {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      if (p.y < innerHeight + 40) alive = true;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - p.life / 130);
      ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.62);
      ctx.restore();
    }
    frame++;
    if (alive && frame < 200) requestAnimationFrame(run);
    else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
}

// ════════════════════ Sound (WebAudio) ════════════════════
let actx = null;
let soundOn = localStorage.getItem(SND_KEY) !== '0';
function sound(type) {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    let f = 440, dur = 0.09, wav = 'triangle';
    if (type === 'flip')  { f = 300; wav = 'square'; dur = 0.07; }   // "clack" ubin
    if (type === 'good')  { f = 660; dur = 0.12; }
    if (type === 'again') { f = 200; dur = 0.13; }
    o.type = wav; o.frequency.setValueAtTime(f, t);
    if (type === 'good') o.frequency.exponentialRampToValueAtTime(f * 1.5, t + dur);
    if (type === 'again') o.frequency.exponentialRampToValueAtTime(f * 0.7, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(type === 'flip' ? 0.18 : 0.13, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  } catch {}
}
function renderSoundBtn() { $('#soundToggle').classList.toggle('muted', !soundOn); }

// ════════════════════ Events ════════════════════
$('#tile').addEventListener('click', flip);
$('#flipBtn').addEventListener('click', flip);
for (const b of document.querySelectorAll('.grade')) b.addEventListener('click', () => grade(+b.dataset.g));
$('#closeReview').addEventListener('click', () => { renderHome(); show('home'); });
$('#doneHome').addEventListener('click', () => { renderHome(); show('home'); });
$('#soundToggle').addEventListener('click', () => {
  soundOn = !soundOn; localStorage.setItem(SND_KEY, soundOn ? '1' : '0'); renderSoundBtn();
  if (soundOn) sound('good');
});
$('#resetBtn').addEventListener('click', () => {
  if (confirm('Reset semua progress belajar lo?')) { state = {}; save(); renderHome(); }
});

// keyboard: space/enter flip, 1-4 grade
document.addEventListener('keydown', (e) => {
  if (!$('#review').classList.contains('is-active')) return;
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!flipped) flip(); }
  else if (flipped && ['1', '2', '3', '4'].includes(e.key)) grade(+e.key - 1);
  else if (e.key === 'Escape') { renderHome(); show('home'); }
});
window.addEventListener('resize', () => { const cv = $('#confetti'); if (cv) { cv.width = 0; cv.height = 0; } });

// init
renderSoundBtn();
renderHome();
