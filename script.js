// 東京 駅名当てタイピングゲーム - ゲームロジック

const CHALLENGE_SECONDS = 100;
// 100秒チャレンジ: 発車タイマー・コンボ・得点
const DEPART_BASE_SEC = 2.5; // 1問の制限時間 = 基本 + 1キーあたり × 最短ローマ字の文字数
const DEPART_PER_KEY_SEC = 0.4;
const DEPART_MAPONLY_EXTRA_SEC = 2; // 駅名を隠すモードは思い出す時間を足す
const COMBO_STEP = 5; // この数ごとに残り時間を加算
const COMBO_BONUS_SEC = 3;
const POINTS_PER_KEY = 10;
const POINTS_PER_STATION = 50;
const RANKS = [["S", 15000], ["A", 10000], ["B", 6000], ["C", 3000], ["D", 0]];
const HINT_PENALTY = 10;
const PASS_PENALTY = 10;
const STORAGE_PREFIX = "tokyoEkiTyping.";
// タッチ操作の端末(スマホ・タブレット)かどうか。入力方式と出題の表示方法を切り替える
const IS_TOUCH = window.matchMedia("(pointer: coarse)").matches;
document.body.classList.toggle("touch", IS_TOUCH);

const stationById = {};
STATIONS.forEach((s) => { stationById[s.id] = s; });

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

// ---------- 地図描画(Leaflet + 地名ラベルなしの地図タイル) ----------
// 背景地図に駅名が出ると答えが分かってしまうため、ラベルなしの Esri World Light Gray Base を使う
const legendEl = document.getElementById("legend");
const markerById = {};
const mapLabels = []; // { tip, timer }
let pulseMarker = null;

const map = L.map("map", {
  keyboard: false, // 入力欄でのタイピングと競合させない
  zoomSnap: 0.25,
  minZoom: 10,
  maxZoom: 17,
});
L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
  maxNativeZoom: 16,
  maxZoom: 19,
  attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ ／ 駅位置 &copy; OpenStreetMap contributors",
}).addTo(map);

const allBounds = L.latLngBounds(STATIONS.map((s) => [s.lat, s.lng]));

// ズームに応じて駅の丸の大きさを変える(引いたときに重なりすぎないように)
function stationRadius(s) {
  const base = s.lines.length > 1 ? 7 : 5;
  const z = map.getZoom();
  const scale = z <= 12 ? 0.7 : z <= 13 ? 0.85 : 1;
  return base * scale;
}

function markerEl(id) {
  return markerById[id].getElement();
}

function buildMap() {
  LINES.forEach((line) => {
    const pts = line.order.map((id) => [stationById[id].lat, stationById[id].lng]);
    const opts = { color: LINE_COLORS[line.id], weight: 5, opacity: 0.85, lineCap: "round", lineJoin: "round", interactive: false };
    (line.closed ? L.polygon(pts, { ...opts, fill: false }) : L.polyline(pts, opts)).addTo(map);
  });

  map.fitBounds(allBounds, { padding: [16, 16] });

  STATIONS.forEach((s) => {
    const m = L.circleMarker([s.lat, s.lng], {
      radius: stationRadius(s),
      weight: s.lines.length > 1 ? 3 : 2,
      color: "#4a5568",
      fillColor: "#ffffff",
      fillOpacity: 1,
      interactive: false,
      className: "station-dot" + (s.lines.length > 1 ? " interchange" : ""),
    }).addTo(map);
    markerById[s.id] = m;
  });

  map.on("zoomend", () => {
    STATIONS.forEach((s) => markerById[s.id].setRadius(stationRadius(s)));
  });

  LINES.forEach((line) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="swatch" style="background:${LINE_COLORS[line.id]}"></span>${LINE_NAMES[line.id]}`;
    legendEl.appendChild(li);
  });

  const resetBtn = document.getElementById("btn-map-reset");
  resetBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    map.fitBounds(allBounds, { padding: [16, 16] });
    if (state.playing) inputEl.focus();
  });
}

// 出題中の駅が画面の端に近すぎると吹き出しを出す余白がないので、必要な分だけ地図をずらす
// (上はステータス表示、下は凡例・出典表示があるため広めに空ける)
const EDGE_MARGIN = { left: 90, right: 90, top: 130, bottom: 190 };
function keepStationAwayFromEdges(ll) {
  const pt = map.latLngToContainerPoint(ll);
  const size = map.getSize();
  // スマホでは画面下にキーボードと出題バーが重なるので、実際に見えている範囲の上側に駅を収める
  const visibleH = IS_TOUCH ? Math.min(size.y, visibleViewportHeight() - playPanel.offsetHeight - 16) : size.y;
  const edge = IS_TOUCH ? { left: 40, right: 40, top: 70, bottom: 30 } : EDGE_MARGIN;
  const m = {
    left: Math.min(edge.left, size.x / 2),
    right: Math.min(edge.right, size.x / 2),
    top: Math.min(edge.top, visibleH / 2),
    bottom: Math.min(edge.bottom, visibleH / 2),
  };
  const dx = pt.x < m.left ? pt.x - m.left : pt.x > size.x - m.right ? pt.x - (size.x - m.right) : 0;
  const dy = pt.y < m.top ? pt.y - m.top : pt.y > visibleH - m.bottom ? pt.y - (visibleH - m.bottom) : 0;
  if (dx || dy) map.panBy([dx, dy], { animate: true });
}

// 出題中の駅を目立たせる(脈打つリング)
function setPulse(s) {
  clearPulse();
  const ll = L.latLng(s.lat, s.lng);
  pulseMarker = L.marker(ll, {
    icon: L.divIcon({ className: "pulse-icon", html: "<span></span>", iconSize: [34, 34] }),
    interactive: false,
    keyboard: false,
    zIndexOffset: 1000,
  }).addTo(map);
  keepStationAwayFromEdges(ll);
}

function clearPulse() {
  if (pulseMarker) { pulseMarker.remove(); pulseMarker = null; }
}

// 正解した駅の名前を地図上に一瞬表示する
function showMapLabel(s) {
  const tip = L.tooltip({ permanent: true, direction: "top", offset: [0, -8], className: "map-label" })
    .setLatLng([s.lat, s.lng])
    .setContent(s.kanji)
    .addTo(map);
  const entry = { tip, timer: null };
  entry.timer = setTimeout(() => {
    hideAndRemoveTip(tip);
    const i = mapLabels.indexOf(entry);
    if (i >= 0) mapLabels.splice(i, 1);
  }, 1200);
  mapLabels.push(entry);
}

// Leaflet は削除時に 200ms かけてフェードするが、CSS アニメーションが透明度を上書きするので先に隠す
function hideAndRemoveTip(tip) {
  const el = tip.getElement();
  if (el) el.classList.add("gone");
  tip.remove();
}

function clearMapLabels() {
  mapLabels.forEach(({ tip, timer }) => { clearTimeout(timer); hideAndRemoveTip(tip); });
  mapLabels.length = 0;
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
const pointsLabel = document.getElementById("points-label");
const comboLabel = document.getElementById("combo-label");
const departFill = document.getElementById("depart-fill");
const bonusPop = document.getElementById("bonus-pop");

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
  // 100秒チャレンジ用
  points: 0,
  combo: 0,
  maxCombo: 0,
  bonusSec: 0,
  missedTrains: 0,
  qMiss: 0, // 今の問題でのミスタイプ数
  qHint: false, // 今の問題でヒントを使ったか
  qStart: 0,
  qLimitMs: 0,
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
  const ch = storageGet(bestKey("challengeScore", sk), null);
  bestListEl.textContent =
    `自己ベスト(${sk ? "駅名表示あり" : "地図のみ"}): ` +
    `全駅制覇 ${c !== null ? c.toFixed(2) + "秒" : "-"} / 100秒 ${ch !== null ? ch.toLocaleString() + "点" : "-"}`;
}
renderBestList();

function startGame(mode) {
  clearActiveHighlight();
  STATIONS.forEach((st) => markerEl(st.id).classList.remove("done"));
  clearMapLabels();

  state.mode = mode;
  state.showKanji = showKanjiEl.checked;
  state.playing = true;
  document.body.classList.add("playing");
  state.locked = false;
  state.pool = shuffledStationIds();
  state.total = state.pool.length;
  state.hintCount = 0;
  state.passCount = 0;
  state.score = 0;
  state.miss = 0;
  state.typed = 0;
  state.penaltyMs = 0;
  state.points = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.bonusSec = 0;
  state.missedTrains = 0;
  state.startTime = performance.now();
  document.body.classList.toggle("mode-challenge", mode === "challenge");

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
  STATIONS.forEach((st) => markerEl(st.id).classList.remove("active", "correct-flash", "pass-flash"));
  clearPulse();
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
  imeWarnEl.hidden = true; // 前の問題で出た日本語入力の警告は消す
  state.revealedHintChars = 0;
  state.lastValid = "";
  inputEl.value = "";
  inputEl.classList.remove("valid", "invalid", "shake");
  markerEl(state.current).classList.add("active");
  markerById[state.current].bringToFront();
  setPulse(s);
  state.locked = false;
  state.qMiss = 0;
  state.qHint = false;
  if (state.mode === "challenge") {
    const keys = Math.min(...s.romaji.map((r) => r.length));
    const sec = DEPART_BASE_SEC + DEPART_PER_KEY_SEC * keys + (state.showKanji ? 0 : DEPART_MAPONLY_EXTRA_SEC);
    state.qLimitMs = sec * 1000;
    state.qStart = performance.now();
    updateDepartBar(1);
  }
  updateProgress();
  placeBubble(true);
}

// ---------- 100秒チャレンジ: 発車タイマー・コンボ・得点 ----------
function comboMultiplier(combo) {
  return combo >= 30 ? 3 : combo >= 20 ? 2 : combo >= 10 ? 1.5 : 1;
}

function resetCombo() {
  state.combo = 0;
}

function updateDepartBar(ratio) {
  const r = Math.max(0, Math.min(1, ratio));
  departFill.style.width = `${r * 100}%`;
  departFill.classList.toggle("warn", r <= 0.5 && r > 0.25);
  departFill.classList.toggle("danger", r <= 0.25);
}

function showBonus(text) {
  bonusPop.textContent = text;
  bonusPop.classList.remove("show");
  void bonusPop.offsetWidth; // アニメーションを再生し直す
  bonusPop.classList.add("show");
}

// 発車時刻を過ぎた: 乗り遅れとして答えを見せて次へ(時間のペナルティはなし、コンボは途切れる)
function missTrain() {
  if (!state.playing || state.locked) return;
  const s = stationById[state.current];
  state.locked = true;
  state.missedTrains++;
  resetCombo();
  clearPulse();
  markerEl(s.id).classList.remove("active");
  markerEl(s.id).classList.add("pass-flash");
  revealAnswer(s);
  hintEl.textContent = `乗り遅れ！ 答え: ${s.kana}`;
  hintEl.classList.add("answer");
  updateDepartBar(0);
  setTimeout(() => {
    if (state.playing) nextQuestion();
  }, 900);
}

function rankOf(points) {
  return RANKS.find(([, min]) => points >= min)[0];
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
  pointsLabel.textContent = state.points.toLocaleString();
  comboLabel.textContent = state.combo;
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
  if (state.mode === "challenge" && !state.locked && state.current) {
    const left = state.qLimitMs - (performance.now() - state.qStart);
    updateDepartBar(left / state.qLimitMs);
    if (left <= 0) missTrain();
  }
  state.timerHandle = requestAnimationFrame(tick);
}

function accuracyText() {
  const total = state.typed + state.miss;
  return total === 0 ? "-" : `${((state.typed / total) * 100).toFixed(1)}%`;
}

function finishGame() {
  state.playing = false;
  document.body.classList.remove("playing");
  if (state.timerHandle) cancelAnimationFrame(state.timerHandle);
  clearActiveHighlight();
  playPanel.hidden = true;
  placeBubble(true); // 引き出し線も隠す
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
    const isBest = prevBest === null || totalSec < prevBest;
    if (isBest) {
      storageSet(key, totalSec);
      resultBest.textContent = `🎉 自己ベスト更新！(${kindLabel})`;
    } else {
      resultBest.textContent = `自己ベスト(${kindLabel}): ${prevBest.toFixed(2)}秒`;
    }
    state.shareText =
      `${GAME_TITLE} 全駅制覇(${kindLabel})を ${totalSec.toFixed(2)}秒でクリア！${isBest ? "(自己ベスト更新)" : ""}\n` +
      `${state.total}駅 / ミス${state.miss}回 / 正確率${accuracyText()}`;
  } else {
    // 実際に遊んだ時間(コンボで延長した分を含む)で平均打鍵速度を出す
    const playedSec = Math.max(1, (performance.now() - state.startTime) / 1000);
    const rank = rankOf(state.points);
    resultTitle.textContent = `タイムアップ！ ランク ${rank}`;
    resultDetail.textContent =
      `得点: ${state.points.toLocaleString()}点\n` +
      `正解: ${state.score}駅 / 乗り遅れ: ${state.missedTrains}駅\n` +
      `打鍵数: ${state.typed} / 平均 ${(state.typed / playedSec).toFixed(1)} 打/秒\n` +
      `最大コンボ: ${state.maxCombo} / ボーナス +${state.bonusSec}秒\n` +
      `ミスタイプ: ${state.miss}回 / 正確率: ${accuracyText()}\n` +
      `ヒント: ${state.hintCount}回 / パス: ${state.passCount}回`;
    const scoreKey = bestKey("challengeScore", state.showKanji);
    const prevScore = storageGet(scoreKey, null);
    const isBest = prevScore === null || state.points > prevScore;
    if (isBest) {
      storageSet(scoreKey, state.points);
      resultBest.textContent = `🎉 自己ベスト更新！(${kindLabel})`;
    } else {
      resultBest.textContent = `自己ベスト(${kindLabel}): ${prevScore.toLocaleString()}点`;
    }
    state.shareText =
      `${GAME_TITLE} 100秒チャレンジ(${kindLabel})で ${state.points.toLocaleString()}点・ランク ${rank}！${isBest ? "(自己ベスト更新)" : ""}\n` +
      `正解${state.score}駅 / 最大コンボ${state.maxCombo} / 平均${(state.typed / playedSec).toFixed(1)}打/秒`;
  }
  renderBestList();
  document.getElementById("btn-retry").focus();
}

// ---------- X(旧 Twitter)でシェア ----------
// 投稿画面(Web インテント)を新しいタブで開くだけなので、トークンやサーバーは不要
const GAME_TITLE = "東京駅名当てタイピング";
const SHARE_URL = "https://beioom2.github.io/tokyo-eki-typing/"; // 投稿文に載せるゲームの公開 URL
const SHARE_HASHTAGS = ["東京駅名当てタイピング", "タイピング"];

function shareToX() {
  if (!state.shareText) return;
  // ゲームの URL は本文に直接書く(url パラメータだと末尾に付くだけで分かりにくいため使わない)
  const text = `${state.shareText}\nプレイはこちら👉 ${SHARE_URL}`;
  const params = new URLSearchParams({ text, hashtags: SHARE_HASHTAGS.join(",") });
  window.open(`https://x.com/intent/post?${params}`, "_blank", "noopener,noreferrer");
}
document.getElementById("btn-share").addEventListener("click", shareToX);

function revealAnswer(s) {
  kanjiEl.textContent = s.kanji;
  kanjiEl.classList.remove("hidden-name");
  showMapLabel(s);
}

function handleCorrect() {
  const s = stationById[state.current];
  const c = markerEl(state.current);
  state.locked = true;
  clearPulse();
  c.classList.remove("active");
  c.classList.add("correct-flash", "done");
  state.score++;
  if (state.mode === "challenge") {
    // ミスもヒントもなく正解したときだけコンボが続く
    if (state.qMiss === 0 && !state.qHint) {
      state.combo++;
      state.maxCombo = Math.max(state.maxCombo, state.combo);
      if (state.combo % COMBO_STEP === 0) {
        state.penaltyMs -= COMBO_BONUS_SEC * 1000;
        state.bonusSec += COMBO_BONUS_SEC;
        showBonus(`${state.combo}コンボ！ +${COMBO_BONUS_SEC}秒`);
      }
    }
    state.points += Math.round(POINTS_PER_STATION * comboMultiplier(state.combo));
  }
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
  state.qHint = true;
  resetCombo();
}

// パス: 答えを見せて次へ。全駅制覇モードでは後でもう一度出題される
function pass() {
  if (!state.playing || state.locked) return;
  const s = stationById[state.current];
  state.locked = true;
  state.passCount++;
  state.penaltyMs += PASS_PENALTY * 1000;
  resetCombo();
  if (state.mode === "complete") {
    const pos = Math.floor(Math.random() * (state.pool.length + 1));
    state.pool.splice(pos, 0, s.id);
  }
  clearPulse();
  markerEl(s.id).classList.remove("active");
  markerEl(s.id).classList.add("pass-flash");
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

// 入力文字列 val を判定して反映する(キー入力方式・入力欄方式で共通)
function applyTyped(val) {
  if (!state.playing || state.locked) return;
  if (val === state.lastValid) return;

  const s = stationById[state.current];
  const result = val.length === 0 ? 1 : judge(s, val);

  if (result === 0) {
    // 誤入力は入力欄に残さず、ミスとして数える
    state.miss++;
    state.qMiss++;
    if (state.mode === "challenge") resetCombo();
    missLabel.textContent = state.miss;
    inputEl.value = state.lastValid;
    flashInvalid();
    return;
  }

  if (val.length > state.lastValid.length) {
    const added = val.length - state.lastValid.length;
    state.typed += added;
    if (state.mode === "challenge") state.points += Math.round(added * POINTS_PER_KEY * comboMultiplier(state.combo));
  }
  state.lastValid = val;
  inputEl.value = val;
  inputEl.classList.remove("invalid", "shake");
  inputEl.classList.toggle("valid", val.length > 0);
  if (result === 2) handleCorrect();
}

// PC: 入力欄を読み取り専用にしてキー押下から直接判定する(ローマ字のみ受け付ける)。
// IME は編集可能な欄でしか動かないので、日本語入力モードのままでもローマ字で入力できる。
// スマホ等(タッチ操作)は読み取り専用だとキーボードが出ないため、入力欄で受け付けて日本語は弾く。
const USE_KEY_INPUT = !IS_TOUCH;
if (USE_KEY_INPUT) {
  inputEl.readOnly = true;
  inputEl.classList.add("key-input");
} else {
  // URL 用の入力欄にすると、多くのスマホで最初から英字キーボードが出る(日本語キーボードからの切り替えが不要)
  inputEl.type = "url";
  inputEl.setAttribute("enterkeyhint", "done");
}

function isAsciiOnly(str) {
  return !/[^\x00-\x7F！-～]/.test(str);
}

// キーイベントから入力文字を取り出す。IME にキーが渡った場合(key が "Process")は物理キーから判定する
function keyToChar(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  let ch = null;
  if (e.key && e.key.length === 1) {
    ch = normalizeTyped(e.key);
  } else if (e.key === "Process" || e.key === "Unidentified") {
    const m = /^Key([A-Z])$/.exec(e.code) || /^Digit(\d)$/.exec(e.code);
    if (m) ch = m[1].toLowerCase();
    else if (e.code === "Minus") ch = "-";
  }
  return ch && /^[a-z0-9'\-]$/.test(ch) ? ch : null;
}

function handleTypingKey(e) {
  if (e.key === "Backspace") {
    e.preventDefault();
    applyTyped(state.lastValid.slice(0, -1));
    return true;
  }
  const ch = keyToChar(e);
  if (!ch) return false;
  e.preventDefault();
  imeWarnEl.hidden = true;
  applyTyped(state.lastValid + ch);
  return true;
}

inputEl.addEventListener("input", (e) => {
  if (USE_KEY_INPUT) return;
  // Android のキーボード(Gboard 等)は英字でも予測変換のため「変換中」扱いで入力してくる。
  // 英数字だけなら変換中でも1文字ずつ判定し、日本語が入っているときだけ確定を待つ。
  if (e.isComposing && !isAsciiOnly(inputEl.value)) return;
  if (!state.playing || state.locked) {
    inputEl.value = state.lastValid;
    return;
  }
  const val = normalizeTyped(inputEl.value);

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
  applyTyped(val);
});

inputEl.addEventListener("compositionend", () => {
  if (USE_KEY_INPUT) return;
  // 日本語で確定された場合は警告して取り消す。英数字ならここでも判定する(確定時に input が来ないブラウザ向け)
  if (!isAsciiOnly(inputEl.value)) {
    imeWarnEl.hidden = false;
    inputEl.value = state.lastValid;
  } else if (state.playing && !state.locked) {
    const val = normalizeTyped(inputEl.value);
    if (val !== state.lastValid && /^[a-z0-9'\-]*$/.test(val)) applyTyped(val);
  }
});

// ---------- キー操作 ----------
document.addEventListener("keydown", (e) => {
  // プレイ中は入力欄にフォーカスがなくてもタイピングを受け付ける
  if (USE_KEY_INPUT && state.playing && handleTypingKey(e)) return;

  const onButton = e.target instanceof HTMLButtonElement;
  const onCheckbox = e.target instanceof HTMLInputElement && e.target.type === "checkbox";

  if (e.key === "Escape") {
    if (state.playing) { e.preventDefault(); pass(); }
    return;
  }
  if (e.key === "Enter") {
    if (e.isComposing) return;
    // スマホのキーボードの「完了」でヒントが出てしまわないよう、タッチ端末ではヒントは画面のボタンで出す
    if (state.playing && IS_TOUCH) { e.preventDefault(); return; }
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

// 地図をドラッグ・ズームした後も入力を続けられるようにする
// (スマホでは地図を動かすたびにキーボードが開閉しないよう、タップしたときだけ入力欄に戻す)
map.on("click", () => { if (state.playing && document.activeElement !== inputEl) inputEl.focus(); });
map.on("moveend", () => {
  if (!IS_TOUCH && state.playing && document.activeElement !== inputEl) inputEl.focus({ preventScroll: true });
});
playPanel.addEventListener("click", () => inputEl.focus());

// ---------- スマホ: ヒント・パスのボタンと、キーボードに合わせた出題バーの位置 ----------
function bindTouchButton(id, action) {
  const btn = document.getElementById(id);
  // pointerdown を止めると入力欄からフォーカスが外れず、キーボードが閉じない
  btn.addEventListener("pointerdown", (e) => e.preventDefault());
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    action();
    inputEl.focus({ preventScroll: true });
  });
}
bindTouchButton("btn-touch-hint", () => useHint());
bindTouchButton("btn-touch-pass", () => pass());

function visibleViewportHeight() {
  return window.visualViewport ? window.visualViewport.height : window.innerHeight;
}

// iOS などキーボードが開いてもページの高さが変わらないブラウザでは、隠れた高さ分だけ出題バーを持ち上げる
function updateKeyboardInset() {
  const vv = window.visualViewport;
  const inset = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
  document.documentElement.style.setProperty("--kb", `${Math.round(inset)}px`);
  if (IS_TOUCH && state.playing && state.current) {
    const s = stationById[state.current];
    keepStationAwayFromEdges(L.latLng(s.lat, s.lng));
  }
}
if (IS_TOUCH && window.visualViewport) {
  window.visualViewport.addEventListener("resize", updateKeyboardInset);
  window.visualViewport.addEventListener("scroll", updateKeyboardInset);
}

// ---------- 出題の吹き出し ----------
// 出題中の駅の近くに吹き出しを出し、引き出し線で駅とつなぐ。
// 右上・左上・右下・左下・真上・真下・右・左の候補から、隠れる駅が最も少なく、
// 画面や重ねている UI(ステータス・凡例・ボタン)にかからない位置を選ぶ。
const leaderEl = document.getElementById("leader");
const BUBBLE_GAP = 44; // 駅から吹き出しまでの距離(px)
const BUBBLE_DIRS = ["ne", "nw", "se", "sw", "n", "s", "e", "w"]; // 同点のときはこの順で優先
let bubbleDir = "ne";

function screenRect(el) {
  if (!el || el.hidden || el.offsetParent === null) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
}

function rectsOverlap(a, b, pad = 0) {
  return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
}

function bubbleCandidates(x, y, w, h) {
  const g = BUBBLE_GAP;
  return {
    ne: [x + g, y - g - h],
    nw: [x - g - w, y - g - h],
    se: [x + g, y + g],
    sw: [x - g - w, y + g],
    n: [x - w / 2, y - g - 16 - h],
    s: [x - w / 2, y + g + 16],
    e: [x + g + 16, y - h / 2],
    w: [x - g - 16 - w, y - h / 2],
  };
}

function clampToViewport(left, top, w, h) {
  return [
    Math.min(Math.max(left, 8), window.innerWidth - w - 8),
    Math.min(Math.max(top, 8), window.innerHeight - h - 8),
  ];
}

// 吹き出しを重ねたくない UI(ステータス・凡例・ボタン・出典表示)の画面上の範囲
function bubbleObstacles() {
  return [
    document.getElementById("status-bar"),
    document.getElementById("legend"),
    document.getElementById("btn-map-reset"),
    document.querySelector(".leaflet-control-zoom"),
    document.querySelector(".leaflet-control-attribution"),
  ].map(screenRect).filter(Boolean);
}

// その位置に置くと UI に重なるか、出題中の駅そのものを隠してしまうか
function bubblePlacementBlocked(left, top, w, h, x, y) {
  const r = { left, top, right: left + w, bottom: top + h };
  if (x > r.left - 14 && x < r.right + 14 && y > r.top - 14 && y < r.bottom + 14) return true;
  return bubbleObstacles().some((o) => rectsOverlap(r, o, 6));
}

function chooseBubbleDir(x, y, w, h) {
  const obstacles = bubbleObstacles();
  const mapRect = map.getContainer().getBoundingClientRect();
  const points = STATIONS.filter((st) => st.id !== state.current).map((st) => {
    const p = map.latLngToContainerPoint([st.lat, st.lng]);
    return [mapRect.left + p.x, mapRect.top + p.y];
  });

  let best = bubbleDir;
  let bestScore = Infinity;
  const cands = bubbleCandidates(x, y, w, h);
  BUBBLE_DIRS.forEach((dir, order) => {
    // 画面からはみ出す候補も、実際に表示するときと同じく画面内へ押し込んだ位置で評価する
    const [left, top] = clampToViewport(cands[dir][0], cands[dir][1], w, h);
    const r = { left, top, right: left + w, bottom: top + h };
    let score = order * 0.01; // 同点時の優先順
    // 押し込んだ結果、出題中の駅そのものを隠してしまう位置は使わない
    if (x > r.left - 14 && x < r.right + 14 && y > r.top - 14 && y < r.bottom + 14) score += 1000;
    obstacles.forEach((o) => { if (rectsOverlap(r, o, 6)) score += 500; });
    points.forEach(([px, py]) => {
      if (px > r.left - 10 && px < r.right + 10 && py > r.top - 10 && py < r.bottom + 10) score += 1;
    });
    if (score < bestScore) { bestScore = score; best = dir; }
  });
  return best;
}

// rechoose: true のときは向きを選び直す(新しい問題・ズーム・移動終了時)。
// ドラッグ中は向きを固定したまま位置だけ追従させ、吹き出しが飛び回らないようにする。
function placeBubble(rechoose) {
  // スマホでは吹き出しではなく、画面下(キーボードの上)に固定したバーとして CSS で配置する
  if (IS_TOUCH || playPanel.hidden || !state.playing || !state.current) {
    leaderEl.hidden = true;
    return;
  }
  const s = stationById[state.current];
  const mapRect = map.getContainer().getBoundingClientRect();
  const p = map.latLngToContainerPoint([s.lat, s.lng]);
  const x = mapRect.left + p.x;
  const y = mapRect.top + p.y;
  const w = playPanel.offsetWidth;
  const h = playPanel.offsetHeight;

  if (rechoose) bubbleDir = chooseBubbleDir(x, y, w, h);
  // 画面外にはみ出す場合は画面内に収める
  let [left, top] = clampToViewport(...bubbleCandidates(x, y, w, h)[bubbleDir], w, h);
  // 地図の移動中でも、今の向きのままだと UI や出題駅に重なるならその場で選び直す
  if (!rechoose && bubblePlacementBlocked(left, top, w, h, x, y)) {
    bubbleDir = chooseBubbleDir(x, y, w, h);
    [left, top] = clampToViewport(...bubbleCandidates(x, y, w, h)[bubbleDir], w, h);
  }
  playPanel.style.left = `${left}px`;
  playPanel.style.top = `${top}px`;

  // 引き出し線: 駅から吹き出しの一番近い点まで
  const nx = Math.min(Math.max(x, left), left + w);
  const ny = Math.min(Math.max(y, top), top + h);
  const len = Math.hypot(nx - x, ny - y);
  leaderEl.hidden = len < 4;
  leaderEl.style.left = `${x}px`;
  leaderEl.style.top = `${y - 1}px`;
  leaderEl.style.width = `${len}px`;
  leaderEl.style.transform = `rotate(${Math.atan2(ny - y, nx - x)}rad)`;
}

map.on("move", () => placeBubble(false));
map.on("zoomend moveend", () => placeBubble(true));
window.addEventListener("resize", () => placeBubble(true));

// ---------- 操作方法のポップアップ ----------
const helpBtn = document.getElementById("btn-help");
const helpPop = document.getElementById("help-pop");
function setHelpOpen(open) {
  helpPop.hidden = !open;
  helpBtn.setAttribute("aria-expanded", String(open));
}
helpBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  setHelpOpen(helpPop.hidden);
  if (state.playing) inputEl.focus({ preventScroll: true });
});
document.addEventListener("click", (e) => {
  if (!helpPop.hidden && !helpPop.contains(e.target) && e.target !== helpBtn) setHelpOpen(false);
});
