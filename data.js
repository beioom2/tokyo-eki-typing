// 東京 駅名当てタイピングゲーム - データ定義
// 路線図は正確な地理座標ではなく、覚えやすさを優先した簡略化した模式図です。
// 各駅は中心からの角度(angle: 0=真上/北, 時計回り)と半径(radius: 1.0=山手線の環)で位置を指定します。

const LINE_COLORS = {
  yamanote: "#80C241",
  chuo: "#F15A22",
  sobu: "#FFD400",
  ginza: "#F39700",
  marunouchi: "#E60012",
  hibiya: "#9CAEB7",
  toeiAsakusa: "#E85298",
};

const LINE_NAMES = {
  yamanote: "山手線",
  chuo: "中央線",
  sobu: "総武線",
  ginza: "銀座線",
  marunouchi: "丸ノ内線",
  hibiya: "日比谷線",
  toeiAsakusa: "都営浅草線",
};

// 各路線の描画順(駅を結ぶ順番)。yamanote は closed:true で環状に閉じる。
const LINES = [
  {
    id: "yamanote",
    closed: true,
    order: [
      "tokyo","kanda","akihabara","okachimachi","ueno","uguisudani","nippori",
      "nishi-nippori","tabata","komagome","sugamo","otsuka","ikebukuro","mejiro",
      "takadanobaba","shin-okubo","shinjuku","yoyogi","harajuku","shibuya","ebisu",
      "meguro","gotanda","osaki","shinagawa","takanawa-gateway","tamachi",
      "hamamatsucho","shimbashi","yurakucho"
    ],
  },
  {
    id: "chuo",
    closed: false,
    order: ["tokyo","kanda","ochanomizu","suidobashi","iidabashi","ichigaya","yotsuya","shinjuku","nakano","kichijoji"],
  },
  {
    id: "sobu",
    closed: false,
    order: ["akihabara","ryogoku","kinshicho"],
  },
  {
    id: "ginza",
    closed: false,
    order: ["shibuya","omotesando","gaienmae","aoyama-itchome","akasaka-mitsuke","toranomon","shimbashi","ginza","kyobashi","nihombashi","kanda","ueno","asakusa"],
  },
  {
    id: "marunouchi",
    closed: false,
    order: ["shinjuku","yotsuya","kokkaigijidomae","kasumigaseki","ginza","tokyo","otemachi","ochanomizu","ikebukuro"],
  },
  {
    id: "hibiya",
    closed: false,
    order: ["roppongi","kamiyacho","kasumigaseki","hibiya","ginza","akihabara","ueno","minowa","kita-senju"],
  },
  {
    id: "toeiAsakusa",
    closed: false,
    order: ["oshiage","asakusabashi","higashi-ginza","shimbashi"],
  },
];

// STATIONS: id, kanji, kana(読み。入力判定とヒントに使用), romaji(判定エンジンで表せない慣用表記の別名), angle, radius, lines
const STATIONS = [
  // ---- 山手線 ----
  { id: "tokyo", kanji: "東京", kana: "とうきょう", romaji: ["toukyou","tokyo"], angle: 100, radius: 1.0, lines: ["yamanote","chuo","marunouchi"] },
  { id: "kanda", kanji: "神田", kana: "かんだ", romaji: ["kanda"], angle: 92, radius: 1.0, lines: ["yamanote","chuo","ginza","hibiya"] },
  { id: "akihabara", kanji: "秋葉原", kana: "あきはばら", romaji: ["akihabara"], angle: 84, radius: 1.0, lines: ["yamanote","sobu","hibiya"] },
  { id: "okachimachi", kanji: "御徒町", kana: "おかちまち", romaji: ["okachimachi"], angle: 76, radius: 1.0, lines: ["yamanote"] },
  { id: "ueno", kanji: "上野", kana: "うえの", romaji: ["ueno"], angle: 68, radius: 1.0, lines: ["yamanote","ginza","hibiya"] },
  { id: "uguisudani", kanji: "鶯谷", kana: "うぐいすだに", romaji: ["uguisudani"], angle: 58, radius: 1.0, lines: ["yamanote"] },
  { id: "nippori", kanji: "日暮里", kana: "にっぽり", romaji: ["nippori"], angle: 50, radius: 1.0, lines: ["yamanote"] },
  { id: "nishi-nippori", kanji: "西日暮里", kana: "にしにっぽり", romaji: ["nishinippori"], angle: 42, radius: 1.0, lines: ["yamanote"] },
  { id: "tabata", kanji: "田端", kana: "たばた", romaji: ["tabata"], angle: 33, radius: 1.0, lines: ["yamanote"] },
  { id: "komagome", kanji: "駒込", kana: "こまごめ", romaji: ["komagome"], angle: 22, radius: 1.0, lines: ["yamanote"] },
  { id: "sugamo", kanji: "巣鴨", kana: "すがも", romaji: ["sugamo"], angle: 11, radius: 1.0, lines: ["yamanote"] },
  { id: "otsuka", kanji: "大塚", kana: "おおつか", romaji: ["ootsuka","otsuka"], angle: 0, radius: 1.0, lines: ["yamanote"] },
  { id: "ikebukuro", kanji: "池袋", kana: "いけぶくろ", romaji: ["ikebukuro"], angle: 349, radius: 1.0, lines: ["yamanote","marunouchi"] },
  { id: "mejiro", kanji: "目白", kana: "めじろ", romaji: ["mejiro"], angle: 338, radius: 1.0, lines: ["yamanote"] },
  { id: "takadanobaba", kanji: "高田馬場", kana: "たかだのばば", romaji: ["takadanobaba"], angle: 325, radius: 1.0, lines: ["yamanote"] },
  { id: "shin-okubo", kanji: "新大久保", kana: "しんおおくぼ", romaji: ["shinookubo","shinokubo"], angle: 312, radius: 1.0, lines: ["yamanote"] },
  { id: "shinjuku", kanji: "新宿", kana: "しんじゅく", romaji: ["shinjuku"], angle: 298, radius: 1.0, lines: ["yamanote","chuo","marunouchi"] },
  { id: "yoyogi", kanji: "代々木", kana: "よよぎ", romaji: ["yoyogi"], angle: 288, radius: 1.0, lines: ["yamanote"] },
  { id: "harajuku", kanji: "原宿", kana: "はらじゅく", romaji: ["harajuku"], angle: 278, radius: 1.0, lines: ["yamanote"] },
  { id: "shibuya", kanji: "渋谷", kana: "しぶや", romaji: ["shibuya"], angle: 263, radius: 1.0, lines: ["yamanote","ginza"] },
  { id: "ebisu", kanji: "恵比寿", kana: "えびす", romaji: ["ebisu"], angle: 248, radius: 1.0, lines: ["yamanote"] },
  { id: "meguro", kanji: "目黒", kana: "めぐろ", romaji: ["meguro"], angle: 233, radius: 1.0, lines: ["yamanote"] },
  { id: "gotanda", kanji: "五反田", kana: "ごたんだ", romaji: ["gotanda"], angle: 218, radius: 1.0, lines: ["yamanote"] },
  { id: "osaki", kanji: "大崎", kana: "おおさき", romaji: ["oosaki","osaki"], angle: 203, radius: 1.0, lines: ["yamanote"] },
  { id: "shinagawa", kanji: "品川", kana: "しながわ", romaji: ["shinagawa"], angle: 188, radius: 1.0, lines: ["yamanote"] },
  { id: "takanawa-gateway", kanji: "高輪ゲートウェイ", kana: "たかなわゲートウェイ", romaji: ["takanawagateway"], angle: 178, radius: 1.0, lines: ["yamanote"] },
  { id: "tamachi", kanji: "田町", kana: "たまち", romaji: ["tamachi"], angle: 168, radius: 1.0, lines: ["yamanote"] },
  { id: "hamamatsucho", kanji: "浜松町", kana: "はままつちょう", romaji: ["hamamatsuchou","hamamatsucho"], angle: 157, radius: 1.0, lines: ["yamanote"] },
  { id: "shimbashi", kanji: "新橋", kana: "しんばし", romaji: ["shimbashi","shinbashi"], angle: 143, radius: 1.0, lines: ["yamanote","ginza","toeiAsakusa"] },
  { id: "yurakucho", kanji: "有楽町", kana: "ゆうらくちょう", romaji: ["yuurakuchou","yurakucho"], angle: 122, radius: 1.0, lines: ["yamanote"] },

  // ---- 中央線 ----
  { id: "ochanomizu", kanji: "御茶ノ水", kana: "おちゃのみず", romaji: ["ochanomizu"], angle: 80, radius: 0.55, lines: ["chuo","marunouchi"] },
  { id: "suidobashi", kanji: "水道橋", kana: "すいどうばし", romaji: ["suidoubashi","suidobashi"], angle: 55, radius: 0.5, lines: ["chuo"] },
  { id: "iidabashi", kanji: "飯田橋", kana: "いいだばし", romaji: ["iidabashi"], angle: 30, radius: 0.5, lines: ["chuo"] },
  { id: "ichigaya", kanji: "市ヶ谷", kana: "いちがや", romaji: ["ichigaya"], angle: 5, radius: 0.5, lines: ["chuo"] },
  { id: "yotsuya", kanji: "四ツ谷", kana: "よつや", romaji: ["yotsuya"], angle: 335, radius: 0.5, lines: ["chuo","marunouchi"] },
  { id: "nakano", kanji: "中野", kana: "なかの", romaji: ["nakano"], angle: 298, radius: 1.15, lines: ["chuo"] },
  { id: "kichijoji", kanji: "吉祥寺", kana: "きちじょうじ", romaji: ["kichijouji","kichijoji"], angle: 298, radius: 1.35, lines: ["chuo"] },

  // ---- 総武線 ----
  { id: "ryogoku", kanji: "両国", kana: "りょうごく", romaji: ["ryougoku","ryogoku"], angle: 80, radius: 1.15, lines: ["sobu"] },
  { id: "kinshicho", kanji: "錦糸町", kana: "きんしちょう", romaji: ["kinshichou","kinshicho"], angle: 78, radius: 1.3, lines: ["sobu"] },

  // ---- 銀座線 ----
  { id: "omotesando", kanji: "表参道", kana: "おもてさんどう", romaji: ["omotesandou","omotesando"], angle: 255, radius: 0.85, lines: ["ginza"] },
  { id: "gaienmae", kanji: "外苑前", kana: "がいえんまえ", romaji: ["gaienmae"], angle: 248, radius: 0.85, lines: ["ginza"] },
  { id: "aoyama-itchome", kanji: "青山一丁目", kana: "あおやまいっちょうめ", romaji: ["aoyamaicchome"], angle: 240, radius: 0.75, lines: ["ginza"] },
  { id: "akasaka-mitsuke", kanji: "赤坂見附", kana: "あかさかみつけ", romaji: ["akasakamitsuke"], angle: 222, radius: 0.65, lines: ["ginza"] },
  { id: "toranomon", kanji: "虎ノ門", kana: "とらのもん", romaji: ["toranomon"], angle: 190, radius: 0.6, lines: ["ginza"] },
  { id: "ginza", kanji: "銀座", kana: "ぎんざ", romaji: ["ginza"], angle: 130, radius: 0.7, lines: ["ginza","marunouchi","hibiya"] },
  { id: "kyobashi", kanji: "京橋", kana: "きょうばし", romaji: ["kyoubashi","kyobashi"], angle: 118, radius: 0.65, lines: ["ginza"] },
  { id: "nihombashi", kanji: "日本橋", kana: "にほんばし", romaji: ["nihombashi","nihonbashi"], angle: 106, radius: 0.6, lines: ["ginza"] },
  { id: "asakusa", kanji: "浅草", kana: "あさくさ", romaji: ["asakusa"], angle: 58, radius: 1.25, lines: ["ginza"] },

  // ---- 丸ノ内線 ----
  { id: "kokkaigijidomae", kanji: "国会議事堂前", kana: "こっかいぎじどうまえ", romaji: ["kokkaigijidoumae","kokkaigijidomae"], angle: 210, radius: 0.4, lines: ["marunouchi"] },
  { id: "kasumigaseki", kanji: "霞ヶ関", kana: "かすみがせき", romaji: ["kasumigaseki"], angle: 195, radius: 0.4, lines: ["marunouchi","hibiya"] },
  { id: "otemachi", kanji: "大手町", kana: "おおてまち", romaji: ["ootemachi","otemachi"], angle: 100, radius: 0.45, lines: ["marunouchi"] },

  // ---- 日比谷線 ----
  { id: "roppongi", kanji: "六本木", kana: "ろっぽんぎ", romaji: ["roppongi"], angle: 225, radius: 0.55, lines: ["hibiya"] },
  { id: "kamiyacho", kanji: "神谷町", kana: "かみやちょう", romaji: ["kamiyachou","kamiyacho"], angle: 205, radius: 0.55, lines: ["hibiya"] },
  { id: "hibiya", kanji: "日比谷", kana: "ひびや", romaji: ["hibiya"], angle: 150, radius: 0.55, lines: ["hibiya"] },
  { id: "minowa", kanji: "三ノ輪", kana: "みのわ", romaji: ["minowa"], angle: 45, radius: 1.1, lines: ["hibiya"] },
  { id: "kita-senju", kanji: "北千住", kana: "きたせんじゅ", romaji: ["kitasenju"], angle: 30, radius: 1.5, lines: ["hibiya"] },

  // ---- 都営浅草線 ----
  { id: "oshiage", kanji: "押上", kana: "おしあげ", romaji: ["oshiage"], angle: 50, radius: 1.5, lines: ["toeiAsakusa"] },
  { id: "asakusabashi", kanji: "浅草橋", kana: "あさくさばし", romaji: ["asakusabashi"], angle: 75, radius: 1.15, lines: ["toeiAsakusa"] },
  { id: "higashi-ginza", kanji: "東銀座", kana: "ひがしぎんざ", romaji: ["higashiginza"], angle: 135, radius: 0.75, lines: ["toeiAsakusa"] },
];
