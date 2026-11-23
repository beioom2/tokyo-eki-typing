// かな → ローマ字 柔軟判定エンジン
// shi/si/ci, chi/ti, tsu/tu, っ(子音重ね/ltu/xtu), ん(nn/n'/xn/文脈次第で n・m),
// 拗音の分割入力(ki+lyo), 長音の省略(とうきょう→tokyo, おおつか→otsuka) などに対応する。

const ROMA_TABLE = (() => {
  const t = {
    あ: ["a"], い: ["i", "yi"], う: ["u", "wu", "whu"], え: ["e"], お: ["o"],
    か: ["ka", "ca"], き: ["ki"], く: ["ku", "cu", "qu"], け: ["ke"], こ: ["ko", "co"],
    さ: ["sa"], し: ["shi", "si", "ci"], す: ["su"], せ: ["se", "ce"], そ: ["so"],
    た: ["ta"], ち: ["chi", "ti"], つ: ["tsu", "tu"], て: ["te"], と: ["to"],
    な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
    は: ["ha"], ひ: ["hi"], ふ: ["fu", "hu"], へ: ["he"], ほ: ["ho"],
    ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
    や: ["ya"], ゆ: ["yu"], よ: ["yo"],
    ら: ["ra"], り: ["ri"], る: ["ru"], れ: ["re"], ろ: ["ro"],
    わ: ["wa"], を: ["wo"],
    が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
    ざ: ["za"], じ: ["ji", "zi"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
    だ: ["da"], ぢ: ["di"], づ: ["du"], で: ["de"], ど: ["do"],
    ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
    ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
    ぁ: ["la", "xa"], ぃ: ["li", "xi"], ぅ: ["lu", "xu"], ぇ: ["le", "xe"], ぉ: ["lo", "xo"],
    ゃ: ["lya", "xya"], ゅ: ["lyu", "xyu"], ょ: ["lyo", "xyo"], ゎ: ["lwa", "xwa"],
    っ: ["ltu", "xtu", "ltsu", "xtsu"],
    ー: ["-"],
    // 特殊な拗音
    しゃ: ["sha", "sya"], しゅ: ["shu", "syu"], しぇ: ["she", "sye"], しょ: ["sho", "syo"],
    ちゃ: ["cha", "tya", "cya"], ちゅ: ["chu", "tyu", "cyu"], ちぇ: ["che", "tye", "cye"], ちょ: ["cho", "tyo", "cyo"],
    じゃ: ["ja", "zya", "jya"], じゅ: ["ju", "zyu", "jyu"], じぇ: ["je", "zye", "jye"], じょ: ["jo", "zyo", "jyo"],
    うぃ: ["wi", "whi"], うぇ: ["we", "whe"], うぉ: ["who"],
    ふぁ: ["fa"], ふぃ: ["fi"], ふぇ: ["fe"], ふぉ: ["fo"],
    てぃ: ["thi"], でぃ: ["dhi"], でゅ: ["dhu"],
  };
  // 規則的な拗音(きゃ→kya 等)
  const youon = { き: "ky", に: "ny", ひ: "hy", み: "my", り: "ry", ぎ: "gy", び: "by", ぴ: "py", ぢ: "dy" };
  Object.entries(youon).forEach(([k, c]) => {
    t[k + "ゃ"] = [c + "a"];
    t[k + "ゅ"] = [c + "u"];
    t[k + "ょ"] = [c + "o"];
  });
  return t;
})();

// 各かなの母音(長音省略の判定に使う)
const KANA_VOWEL = {};
Object.entries(ROMA_TABLE).forEach(([k, rs]) => {
  if (k.length === 1) KANA_VOWEL[k] = rs[0].slice(-1);
});

const N_NEEDS_DOUBLE = new Set("あいうえおなにぬねのやゆよん".split(""));
const M_BEFORE = new Set("ばびぶべぼぱぴぷぺぽまみむめも".split(""));

function toHiragana(str) {
  return str.replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
}

// 入力の正規化: 全角英数→半角、大文字→小文字、空白除去
function normalizeTyped(str) {
  return str
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * kana に対して typed が
 *   2: 完全一致(入力完了) / 1: 途中まで正しい / 0: 誤り
 * のいずれかを返す。
 */
function judgeRomaji(kanaRaw, typed) {
  const kana = toHiragana(kanaRaw);
  const memo = new Map();

  function vowelOfPrev(i) {
    return i > 0 ? KANA_VOWEL[kana[i - 1]] : null;
  }

  // 現在位置 i で選べる「(消費かな数, ローマ字候補)」の一覧
  function options(i) {
    const list = [];
    const two = kana.substr(i, 2);
    if (two.length === 2 && ROMA_TABLE[two]) ROMA_TABLE[two].forEach((r) => list.push([2, r]));
    const ch = kana[i];

    if (ch === "ん") {
      ["nn", "n'", "xn"].forEach((r) => list.push([1, r]));
      const next = kana[i + 1];
      if (next === undefined || !N_NEEDS_DOUBLE.has(next)) list.push([1, "n"]);
      if (next !== undefined && M_BEFORE.has(next)) list.push([1, "m"]);
    } else if (ROMA_TABLE[ch]) {
      ROMA_TABLE[ch].forEach((r) => list.push([1, r]));
    }

    // 長音の省略: とう→to, おお→o, ゆう→yu, ー→(なし)
    const pv = vowelOfPrev(i);
    if ((ch === "う" && (pv === "o" || pv === "u")) || (ch === "お" && pv === "o") || ch === "ー") {
      list.push([1, ""]);
    }
    return list;
  }

  // っ: 次のかなの先頭子音を重ねる
  function sokuonConsonants(i) {
    const set = new Set();
    if (kana[i] !== "っ" || i + 1 >= kana.length) return set;
    options(i + 1).forEach(([, r]) => {
      const c = r[0];
      if (c && !"aiueon".includes(c)) set.add(c);
    });
    return set;
  }

  function f(i, j) {
    const key = i * 1000 + j;
    if (memo.has(key)) return memo.get(key);
    let best = 0;
    if (i === kana.length) {
      best = j === typed.length ? 2 : 0;
    } else {
      const rest = typed.slice(j);
      if (rest.length === 0) best = 1;
      for (const [len, r] of options(i)) {
        if (best === 2) break;
        if (rest.startsWith(r)) {
          best = Math.max(best, f(i + len, j + r.length));
        } else if (rest.length > 0 && r.startsWith(rest)) {
          best = Math.max(best, 1);
        }
      }
      if (best < 2 && rest.length > 0 && sokuonConsonants(i).has(rest[0])) {
        best = Math.max(best, f(i + 1, j + 1));
      }
    }
    memo.set(key, best);
    return best;
  }

  return f(0, 0);
}

if (typeof module !== "undefined") {
  module.exports = { judgeRomaji, normalizeTyped, toHiragana };
}
