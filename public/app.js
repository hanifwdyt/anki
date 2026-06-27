'use strict';
/* anki.hanif.app — flashcard kanji & kosakata N5. Simpel: ketuk kartu balik, ketuk lagi lanjut. */

const $ = (s) => document.querySelector(s);
const SEEN_KEY = 'anki.seen.v2';
const SND_KEY = 'anki.sound';
const ROMAJI_KEY = 'anki.romaji';
let romajiOn = localStorage.getItem(ROMAJI_KEY) !== '0';  // default ON

// ── Kana → Romaji (Hepburn) ──
const ROMA = {
  あ:'a',い:'i',う:'u',え:'e',お:'o',
  か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',
  さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',
  た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',
  な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',
  は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',
  ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',
  や:'ya',ゆ:'yu',よ:'yo',
  ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',
  わ:'wa',ゐ:'i',ゑ:'e',を:'o',ん:'n',
  が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',
  ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',
  だ:'da',ぢ:'ji',づ:'zu',で:'de',ど:'do',
  ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',
  ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po',
  きゃ:'kya',きゅ:'kyu',きょ:'kyo',
  しゃ:'sha',しゅ:'shu',しょ:'sho',
  ちゃ:'cha',ちゅ:'chu',ちょ:'cho',
  にゃ:'nya',にゅ:'nyu',にょ:'nyo',
  ひゃ:'hya',ひゅ:'hyu',ひょ:'hyo',
  みゃ:'mya',みゅ:'myu',みょ:'myo',
  りゃ:'rya',りゅ:'ryu',りょ:'ryo',
  ぎゃ:'gya',ぎゅ:'gyu',ぎょ:'gyo',
  じゃ:'ja',じゅ:'ju',じょ:'jo',
  びゃ:'bya',びゅ:'byu',びょ:'byo',
  ぴゃ:'pya',ぴゅ:'pyu',ぴょ:'pyo',
};
function kanaToRomaji(input) {
  // katakana → hiragana dulu biar satu map
  const s = [...(input || '')].map((ch) => {
    const c = ch.codePointAt(0);
    return (c >= 0x30a1 && c <= 0x30f6) ? String.fromCodePoint(c - 0x60) : ch;
  }).join('');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const one = s[i], two = s.substr(i, 2);
    if (one === 'っ') { // sokuon: gandakan konsonan berikutnya
      const nr = ROMA[s.substr(i + 1, 2)] || ROMA[s[i + 1]] || '';
      if (nr) out += nr.startsWith('ch') ? 't' : nr[0];
      continue;
    }
    if (one === 'ー') { out += out.slice(-1) || ''; continue; } // vokal panjang
    if (ROMA[two]) { out += ROMA[two]; i++; continue; }
    if (ROMA[one]) { out += ROMA[one]; continue; }
    out += one;
  }
  return out;
}
const romajiOf = (vals) => vals.map(kanaToRomaji).join(' · ');

// ── Decks ──
const DECKS = [
  { id: 'kanji', name: 'Kanji N5', desc: 'Kanji inti JLPT N5', mini: '漢', type: 'kanji', cards: window.N5_KANJI || [] },
  { id: 'vocab', name: 'Kosakata N5', desc: 'Kata umum JLPT N5', mini: '語', type: 'vocab', cards: window.N5_VOCAB || [] },
];
const cardKey = (deck, c) => deck.type === 'kanji' ? c.k : c.w;

// ── Seen state (per deck) ──
let seen = loadSeen();
function loadSeen() { try { return JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch { return {}; } }
function saveSeen() { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); }
function markSeen(deck, c) {
  (seen[deck.id] = seen[deck.id] || {})[cardKey(deck, c)] = 1;
  saveSeen();
}
function seenCount(deck) {
  const s = seen[deck.id] || {};
  return deck.cards.reduce((n, c) => n + (s[cardKey(deck, c)] ? 1 : 0), 0);
}

// ════════════════════ HOME ════════════════════
function renderHome() {
  const grid = $('#deckGrid');
  grid.innerHTML = '';
  let anySeen = false;
  for (const d of DECKS) {
    const total = d.cards.length;
    const sc = seenCount(d);
    if (sc) anySeen = true;
    const pct = total ? Math.round((sc / total) * 100) : 0;
    const el = document.createElement('button');
    el.className = 'deck';
    el.innerHTML = `
      <div class="deck-mini">${d.mini}</div>
      <h3 class="deck-name">${d.name}</h3>
      <p class="deck-desc">${d.desc}</p>
      <div class="deck-stats">
        <div class="deck-stat"><b>${total}</b><small>KARTU</small></div>
        <div class="deck-stat seen"><b>${sc}</b><small>DILIHAT</small></div>
      </div>
      <div class="deck-bar"><i></i></div>
      <span class="deck-cta">Mulai
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>`;
    el.addEventListener('click', () => startSession(d.id));
    grid.appendChild(el);
    requestAnimationFrame(() => { const bar = el.querySelector('.deck-bar > i'); requestAnimationFrame(() => bar.style.width = pct + '%'); });
  }
  $('#resetWrap').hidden = !anySeen;
}

// ════════════════════ SESSION ════════════════════
let deck = null;
let queue = [];
let total = 0;
let viewed = 0;
let current = null;
let flipped = false;

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
let _seed = (Date.now() >>> 0) || 1;
function rand() { _seed = (_seed * 1664525 + 1013904223) >>> 0; return _seed / 4294967296; }

function startSession(deckId) {
  deck = DECKS.find((d) => d.id === deckId);
  queue = shuffle([...deck.cards]);
  total = queue.length;
  viewed = 0;
  show('review');
  nextCard();
}

function nextCard() {
  if (queue.length === 0) { showDone(); return; }
  current = queue.shift();
  flipped = false;
  renderCard();
}

const SUITS = ['s-red', 's-blue', 's-green', 's-yellow'];
function renderCard() {
  const c = current;
  const tile = $('#tile');
  tile.classList.remove('flipped');
  const scene = $('.tile-scene');
  scene.classList.remove('dealing'); void scene.offsetWidth; scene.classList.add('dealing');

  $('#tileSuit').className = 'tile-suit ' + SUITS[viewed % 4];

  const front = deck.type === 'kanji' ? c.k : c.w;
  const fk = $('#tileKanji');
  fk.textContent = front;
  fk.className = 'tile-kanji w' + Math.min(4, [...front].length);

  // Back
  const bk = $('#backKanji');
  bk.textContent = front;
  bk.className = 'tile-kanji-sm w' + Math.min(4, [...front].length);

  const rr = $('#backReadings');
  rr.innerHTML = '';
  const ex = $('#backExample');
  ex.innerHTML = '';

  if (deck.type === 'kanji') {
    $('#backMeaning').textContent = c.m;
    const addRow = (tag, cls, vals) => {
      if (!vals || !vals.length) return;
      const vs = vals.slice(0, 3);
      const row = document.createElement('div');
      row.className = 'reading-row';
      const roma = romajiOn ? `<span class="reading-roma">${romajiOf(vs)}</span>` : '';
      row.innerHTML = `<span class="reading-tag ${cls}">${tag}</span><span class="reading-val">${vs.join('・')}</span>${roma}`;
      rr.appendChild(row);
    };
    addRow('on', 'on', c.on);
    addRow('kun', 'kun', c.kun);
    if (c.ex) {
      const exRoma = romajiOn ? ` <span class="ex-roma">${kanaToRomaji(c.ex.r)}</span>` : '';
      ex.innerHTML = `<span class="ex-w">${c.ex.w}</span><span class="ex-r">(${c.ex.r})</span><span class="ex-m">${c.ex.m}</span>${exRoma}`;
    }
  } else {
    // vocab: bacaan (kana) + romaji + arti
    const roma = romajiOn ? `<div class="reading-row"><span class="vocab-roma">${kanaToRomaji(c.r)}</span></div>` : '';
    rr.innerHTML = `<div class="reading-row"><span class="vocab-reading">${c.r}</span></div>${roma}`;
    $('#backMeaning').textContent = c.m;
  }
  updateProgress();
}

function tapCard() {
  if (!flipped) {
    flipped = true;
    $('#tile').classList.add('flipped');
    markSeen(deck, current);
    sound('flip');
    $('#revHint').textContent = 'Ketuk lagi buat lanjut';
  } else {
    viewed++;
    sound('flip');
    $('#revHint').textContent = 'Ketuk kartu buat lihat jawaban';
    nextCard();
  }
}

function updateProgress() {
  const pct = total ? Math.round((viewed / total) * 100) : 0;
  $('#revFill').style.width = pct + '%';
  $('#revCount').textContent = `${viewed}/${total}`;
}

// ════════════════════ DONE ════════════════════
function showDone() {
  show('done');
  $('#doneTitle').textContent = 'Selesai';
  $('#doneSub').textContent = `${total} kartu · ${deck.name}`;
}

// ════════════════════ Screen switch ════════════════════
function show(id) {
  for (const el of document.querySelectorAll('.screen')) el.classList.toggle('is-active', el.id === id);
  if (id === 'review') $('#revHint').textContent = 'Ketuk kartu buat lihat jawaban';
  window.scrollTo(0, 0);
}

// ════════════════════ Sound ════════════════════
let actx = null;
let soundOn = localStorage.getItem(SND_KEY) !== '0';
function sound() {
  if (!soundOn) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime;
    const o = actx.createOscillator(), g = actx.createGain();
    o.connect(g); g.connect(actx.destination);
    o.type = 'square'; o.frequency.setValueAtTime(300, t);  // "clack" ubin
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.start(t); o.stop(t + 0.1);
  } catch {}
}
function renderSoundBtn() { $('#soundToggle').classList.toggle('muted', !soundOn); }

// ════════════════════ Events ════════════════════
$('#tile').addEventListener('click', tapCard);
$('#stageTap').addEventListener('click', (e) => { if (e.target === e.currentTarget) tapCard(); });
$('#closeReview').addEventListener('click', () => { renderHome(); show('home'); });
$('#doneHome').addEventListener('click', () => { renderHome(); show('home'); });
$('#soundToggle').addEventListener('click', () => {
  soundOn = !soundOn; localStorage.setItem(SND_KEY, soundOn ? '1' : '0'); renderSoundBtn(); if (soundOn) sound();
});
$('#resetBtn').addEventListener('click', () => {
  if (confirm('Reset progress (kartu yang udah dilihat)?')) { seen = {}; saveSeen(); renderHome(); }
});
$('#romajiToggle').addEventListener('change', (e) => {
  romajiOn = e.target.checked;
  localStorage.setItem(ROMAJI_KEY, romajiOn ? '1' : '0');
});
document.addEventListener('keydown', (e) => {
  if (!$('#review').classList.contains('is-active')) return;
  if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); tapCard(); }
  else if (e.key === 'Escape') { renderHome(); show('home'); }
});

// init
$('#romajiToggle').checked = romajiOn;
renderSoundBtn();
renderHome();
