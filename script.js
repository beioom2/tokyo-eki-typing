// 東京 駅名当てタイピングゲーム - ゲームロジック

const SVG_NS = "http://www.w3.org/2000/svg";
const CENTER = { x: 400, y: 400 };
const RX = 260;
const RY = 300;
const CHALLENGE_SECONDS = 100;
const HINT_PENALTY = 10;
const PASS_PENALTY = 10;
const STORAGE_PREFIX = "tokyoEkiTyping.";

const stationById = {};
STATIONS.forEach((s) => { stationById[s.id] = s; });

function computePosition(station) {
  const rad = (station.angle * Math.PI) / 180;
  const x = CENTER.x + RX * station.radius * Math.sin(rad);
  const y = CENTER.y - RY * station.radius * Math.cos(rad);
  return { x, y };
}
STATIONS.forEach((s) => { const p = computePosition(s); s.x = p.x; s.y = p.y; });

// ---------- localStorage(使えない環境でも動くように) ----------
function storageGet(key, fallback) {
  try {
    const v = localStorage.getItem(STORAGE_PREFIX + key);
    return v === null ? fallback : JSON.parse(v);
  } catch (e) { return fallback; }
}
function storageSet(key, value) {
  try { localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value)); } catch (e) { /* noop */ }
}

// ---------- 地図描画 ----------
const mapEl = document.getElementById("map");
const legendEl = document.getElementById("legend");
const circleById = {};
const labelLayer = document.createElementNS(SVG_NS, "g");

function buildMap() {
  LINES.forEach((line) => {
    const pts = line.order.map((id) => stationById[id]);
    let d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    if (line.closed) d += " Z";
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("class", "line-path");
    path.setAttribute("stroke", LINE_COLORS[line.id]);
    mapEl.appendChild(path);
  });

  STATIONS.forEach((s) => {
    const c = document.createElementNS(SVG_NS, "circle");
    c.setAttribute("cx", s.x.toFixed(1));
    c.setAttribute("cy", s.y.toFixed(1));
    c.setAttribute("r", s.lines.length > 1 ? 8 : 6);
    c.setAttribute("class", "station-dot" + (s.lines.length > 1 ? " interchange" : ""));
    mapEl.appendChild(c);
    circleById[s.id] = c;
  });

  mapEl.appendChild(labelLayer);

  LINES.forEach((line) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="swatch" style="background:${LINE_COLORS[line.id]}"></span>${LINE_NAMES[line.id]}`;
    legendEl.appendChild(li);
  });
}

// 正解した駅の名前を地図上に一瞬表示する
function showMapLabel(s) {
  const text = document.createElementNS(SVG_NS, "text");
  text.setAttribute("x", s.x.toFixed(1));
  text.setAttribute("y", (s.y - 16).toFixed(1));
  text.setAttribute("class", "map-label");
  text.textContent = s.kanji;
  labelLayer.appendChild(text);
  setTimeout(() => text.remove(), 1200);
}

function buildStationListReference() {
  const wrap = document.getElementById("station-list");
  LINES.forEach((line) => {
    const title = document.createElement("div");
    title.className = "line-group";
    title.style.color = LINE_COLORS[line.id];
    title.textContent = LINE_NAMES[line.id];
    wrap.appendChild(title);
    line.order.forEach((id) => {
      const s = stationById[id];
      const item = document.createElement("div");
      item.textContent = `${s.kanji}(${s.kana})`;
      wrap.appendChild(item);
    });
  });
}

buildMap();
buildStationListReference();

// ---------- DOM ----------
const idlePanel = document.getElementById("idle-panel");
const playPanel = document.getElementById("play-panel");
const resultPanel = document.getElementById("result-panel");
const modeLabel = document.getElementById("mode-label");
const timeLabel = document.getElementById("time-label");
const scoreLabel = document.getElementById("score-label");
const missLabel = document.getElementById("miss-label");
const kanjiEl = document.getElementById("current-kanji");
const linesEl = document.getElementById("current-lines");
const hintEl = document.getElementById("current-hint");
const inputEl = document.getElementById("typing-input");
const imeWarnEl = document.getElementById("ime-warning");
const progressEl = document.getElementById("progress");
const resultTitle = document.getElementById("result-title");
const resultDetail = document.getElementById("result-detail");
const resultBest = document.getElementById("result-best");
const showKanjiEl = document.getElementById("opt-show-kanji");
const bestListEl = document.getElementById("best-list");

showKanjiEl.checked = storageGet("showKanji", true);
showKanjiEl.addEventListener("change", () => {
  storageSet("showKanji", showKanjiEl.checked);
  renderBestList();
});

// ---------- ゲーム状態 ----------
let state = {
  mode: null, // "complete" | "challenge"
  showKanji: true,
  playing: false,
  locked: false, // 正解/パス直後の演出中は入力を受け付けない
  pool: [],
  total: 0,
  current: null,
  revealedHintChars: 0,
  hintCount: 0,
  passCount: 0,
  score: 0,
  miss: 0,
  typed: 0,
  startTime: 0,
  penaltyMs: 0,
  timerHandle: null,
  lastValid: "",
};

function shuffledStationIds() {
  const ids = STATIONS.map((s) => s.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

function bestKey(mode, showKanji) {
  return `best.${mode}.${showKanji ? "kanji" : "maponly"}`;
}

function renderBestList() {
  const sk = showKanjiEl.checked;
  const c = storageGet(bestKey("complete", sk), null);
  const ch = storageGet(bestKey("challenge", sk), null);
  bestListEl.textContent =
    `自己ベスト(${sk ? "駅名表示あり" : "地図のみ"}): ` +
    `全駅制覇 ${c !== null ? c.toFixed(2) + "秒" : "-"} / 100秒 ${ch !== null ? ch + "駅" : "-"}`;
}
renderBestList();

function startGame(mode) {
  clearActiveHighlight();
  Object.values(circleById).forEach((c) => c.classList.remove("done"));
  labelLayer.replaceChildren();

  state.mode = mode;
  state.showKanji = showKanjiEl.checked;
  state.playing = true;
  state.locked = false;
  state.pool = shuffledStationIds();
  state.total = state.pool.length;
  state.hintCount = 0;
  state.passCount = 0;
  state.score = 0;
  state.miss = 0;
  state.typed = 0;
  state.penaltyMs = 0;
  state.startTime = performance.now();

  modeLabel.textContent = mode === "complete" ? "全駅制覇" : "100秒";
  idlePanel.hidden = true;
  resultPanel.hidden = true;
  playPanel.hidden = false;
  updateStats();
  nextQuestion();
  inputEl.focus();

  if (state.timerHandle) cancelAnimationFrame(state.timerHandle);
  tick();
}

function clearActiveHighlight() {
  Object.values(circleById).forEach((c) => c.classList.remove("active", "correct-flash", "pass-flash"));
}

function renderLines(s) {
  linesEl.replaceChildren();
  s.lines.forEach((id) => {
    const b = document.createElement("span");
    b.className = "line-badge";
    b.style.borderColor = LINE_COLORS[id];
    b.textContent = LINE_NAMES[id];
    linesEl.appendChild(b);
  });
}

function nextQuestion() {
  clearActiveHighlight();
  if (state.mode === "complete") {
    if (state.pool.length === 0) { finishGame(); return; }
    state.current = state.pool.pop();
  } else {
    // 同じ駅が連続しないようにする
    let next;
    do {
      next = STATIONS[Math.floor(Math.random() * STATIONS.length)].id;
    } while (next === state.current && STATIONS.length > 1);
    state.current = next;
  }
  const s = stationById[state.current];
  kanjiEl.textContent = state.showKanji ? s.kanji : "？？？";
  kanjiEl.classList.toggle("hidden-name", !state.showKanji);
  renderLines(s);
  hintEl.textContent = " ";
  hintEl.classList.remove("answer");
  state.revealedHintChars = 0;
  state.lastValid = "";
  inputEl.value = "";
  inputEl.classList.remove("valid", "invalid", "shake");
  circleById[state.current].classList.add("active");
  state.locked = false;
  updateProgress();
}

function updateProgress() {
  if (state.mode === "complete") {
    progressEl.textContent = `${state.score} / ${state.total} 駅`;
  } else {
    progressEl.textContent = "";
  }
}

function currentElapsedMs() {
  return performance.now() - state.startTime + state.penaltyMs;
}

function currentRemainingMs() {
  return CHALLENGE_SECONDS * 1000 - (performance.now() - state.startTime) - state.penaltyMs;
}

function updateStats() {
  scoreLabel.textContent = state.score;
  missLabel.textContent = state.miss;
  if (state.mode === "challenge") {
    const remain = Math.max(0, currentRemainingMs()) / 1000;
    timeLabel.textContent = remain.toFixed(2);
    timeLabel.classList.toggle("danger", remain <= 10);
  } else {
    timeLabel.textContent = (currentElapsedMs() / 1000).toFixed(2);
    timeLabel.classList.remove("danger");
  }
}

function tick() {
  if (!state.playing) return;
  updateStats();
  if (state.mode === "challenge" && currentRemainingMs() <= 0) {
    finishGame();
    return;
  }
  state.timerHandle = requestAnimationFrame(tick);
}

function accuracyText() {
  const total = state.typed + state.miss;
  return total === 0 ? "-" : `${((state.typed / total) * 100).toFixed(1)}%`;
}

function finishGame() {
  state.playing = false;
  if (state.timerHandle) cancelAnimationFrame(state.timerHandle);
  clearActiveHighlight();
  playPanel.hidden = true;
  resultPanel.hidden = false;
  imeWarnEl.hidden = true;
  timeLabel.classList.remove("danger");

  const key = bestKey(state.mode, state.showKanji);
  const prevBest = storageGet(key, null);
  const kindLabel = state.showKanji ? "駅名表示あり" : "地図のみ";

  if (state.mode === "complete") {
    const totalSec = currentElapsedMs() / 1000;
    resultTitle.textContent = "全駅制覇！";
    resultDetail.textContent =
      `タイム: ${totalSec.toFixed(2)}秒\n` +
      `ヒント: ${state.hintCount}回 / パス: ${state.passCount}回 (計 +${state.hintCount * HINT_PENALTY + state.passCount * PASS_PENALTY}秒)\n` +
      `ミスタイプ: ${state.miss}回 / 正確率: ${accuracyText()}`;
    if (prevBest === null || totalSec < prevBest) {
      storageSet(key, totalSec);
      resultBest.textContent = `🎉 自己ベスト更新！(${kindLabel})`;
    } else {
      resultBest.textContent = `自己ベスト(${kindLabel}): ${prevBest.toFixed(2)}秒`;
    }
  } else {
    resultTitle.textContent = "タイムアップ！";
    resultDetail.textContent =
      `正解数: ${state.score}駅\n` +
      `ヒント: ${state.hintCount}回 / パス: ${state.passCount}回\n` +
      `ミスタイプ: ${state.miss}回 / 正確率: ${accuracyText()}`;
    if (prevBest === null || state.score > prevBest) {
      storageSet(key, state.score);
      resultBest.textContent = `🎉 自己ベスト更新！(${kindLabel})`;
    } else {
      resultBest.textContent = `自己ベスト(${kindLabel}): ${prevBest}駅`;
    }
  }
  renderBestList();
  document.getElementById("btn-retry").focus();
}

function revealAnswer(s) {
  kanjiEl.textContent = s.kanji;
  kanjiEl.classList.remove("hidden-name");
  showMapLabel(s);
}

function handleCorrect() {
  const s = stationById[state.current];
  const c = circleById[state.current];
  state.locked = true;
  c.classList.remove("active");
  c.classList.add("correct-flash", "done");
  state.score++;
  updateProgress();
  revealAnswer(s);
  setTimeout(() => {
    if (state.playing) nextQuestion();
  }, state.showKanji ? 150 : 400);
}

function useHint() {
  if (!state.playing || state.locked) return;
  const s = stationById[state.current];
  if (state.revealedHintChars >= s.kana.length) return;
  state.revealedHintChars++;
  hintEl.textContent = s.kana.slice(0, state.revealedHintChars).split("").join(" ") +
    " " + "・".repeat(Math.max(0, s.kana.length - state.revealedHintChars));
  state.hintCount++;
  state.penaltyMs += HINT_PENALTY * 1000;
}

// パス: 答えを見せて次へ。全駅制覇モードでは後でもう一度出題される
function pass() {
  if (!state.playing || state.locked) return;
  const s = stationById[state.current];
  state.locked = true;
  state.passCount++;
  state.penaltyMs += PASS_PENALTY * 1000;
  if (state.mode === "complete") {
    const pos = Math.floor(Math.random() * (state.pool.length + 1));
    state.pool.splice(pos, 0, s.id);
  }
  circleById[s.id].classList.remove("active");
  circleById[s.id].classList.add("pass-flash");
  revealAnswer(s);
  hintEl.textContent = `答え: ${s.kana}`;
  hintEl.classList.add("answer");
  setTimeout(() => {
    if (state.playing) nextQuestion();
  }, 1000);
}

// ---------- 入力判定 ----------
// 2: 完全一致 / 1: 途中まで正しい / 0: 誤り
function judge(s, typed) {
  let best = judgeRomaji(s.kana, typed);
  if (best === 2) return 2;
  for (const alias of s.romaji) {
    if (alias === typed) return 2;
    if (alias.startsWith(typed)) best = Math.max(best, 1);
  }
  return best;
}

function flashInvalid() {
  inputEl.classList.remove("valid", "shake");
  inputEl.classList.add("invalid");
  void inputEl.offsetWidth; // アニメーション再生のためのリフロー
  inputEl.classList.add("shake");
}

inputEl.addEventListener("input", (e) => {
  if (e.isComposing) return; // IME変換中は判定しない
  if (!state.playing || state.locked) {
    inputEl.value = state.lastValid;
    return;
  }
  const raw = inputEl.value;
  const val = normalizeTyped(raw);

  // 英数字以外(日本語入力など)が含まれていたら警告して取り消す
  if (/[^a-z0-9'\-]/.test(val)) {
    imeWarnEl.hidden = false;
    inputEl.value = state.lastValid;
    return;
  }
  imeWarnEl.hidden = true;

  if (val === state.lastValid) {
    inputEl.value = val;
    return;
  }

  const s = stationById[state.current];
  const result = judge(s, val);

  if (result === 0) {
    // 誤入力は入力欄に残さず、ミスとして数える
    state.miss++;
    missLabel.textContent = state.miss;
    inputEl.value = state.lastValid;
    flashInvalid();
    return;
  }

  if (val.length > state.lastValid.length) state.typed += val.length - state.lastValid.length;
  state.lastValid = val;
  inputEl.value = val;
  inputEl.classList.remove("invalid", "shake");
  inputEl.classList.add("valid");
  if (result === 2) handleCorrect();
});

inputEl.addEventListener("compositionend", () => {
  // IMEで確定された文字列は input イベントで弾かれるので、ここでは警告だけ出す
  if (/[^\x00-\x7F！-～]/.test(inputEl.value)) {
    imeWarnEl.hidden = false;
    inputEl.value = state.lastValid;
  }
});

// ---------- キー操作 ----------
document.addEventListener("keydown", (e) => {
  const onButton = e.target instanceof HTMLButtonElement;
  const onCheckbox = e.target instanceof HTMLInputElement && e.target.type === "checkbox";

  if (e.key === "Escape") {
    if (state.playing) { e.preventDefault(); pass(); }
    return;
  }
  if (e.key === "Enter") {
    if (e.isComposing) return;
    if (state.playing) {
      e.preventDefault();
      useHint();
    } else if (!onButton) {
      e.preventDefault();
      startGame(state.mode || "complete");
    }
    return;
  }
  if (e.code === "Space" && !state.playing && !onButton && !onCheckbox && document.activeElement !== inputEl) {
    e.preventDefault();
    startGame(state.mode || "complete");
  }
});

document.getElementById("btn-complete").addEventListener("click", () => startGame("complete"));
document.getElementById("btn-challenge").addEventListener("click", () => startGame("challenge"));
document.getElementById("btn-retry").addEventListener("click", () => startGame(state.mode || "complete"));
document.getElementById("btn-menu").addEventListener("click", () => {
  resultPanel.hidden = true;
  idlePanel.hidden = false;
});

document.getElementById("map-wrap").addEventListener("click", () => { if (state.playing) inputEl.focus(); });
playPanel.addEventListener("click", () => inputEl.focus());
