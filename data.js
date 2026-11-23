// 東京 駅名当てタイピングゲーム - データ定義
// 各駅の位置は実際の緯度経度(lat/lng)。OpenStreetMap の駅データを元にしている(© OpenStreetMap contributors, ODbL)。
// 路線は駅同士を直線で結んだ簡略表示で、実際の線路の経路ではない。

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

// STATIONS: id, kanji, kana(読み。入力判定とヒントに使用), romaji(判定エンジンで表せない慣用表記の別名), lat, lng, lines
const STATIONS = [
  // ---- 山手線 ----
  { id: "tokyo", kanji: "東京", kana: "とうきょう", romaji: ["toukyou","tokyo"], lat: 35.68061, lng: 139.76644, lines: ["yamanote","chuo","marunouchi"] },
  { id: "kanda", kanji: "神田", kana: "かんだ", romaji: ["kanda"], lat: 35.69275, lng: 139.77090, lines: ["yamanote","chuo","ginza","hibiya"] },
  { id: "akihabara", kanji: "秋葉原", kana: "あきはばら", romaji: ["akihabara"], lat: 35.69855, lng: 139.77431, lines: ["yamanote","sobu","hibiya"] },
  { id: "okachimachi", kanji: "御徒町", kana: "おかちまち", romaji: ["okachimachi"], lat: 35.70695, lng: 139.77463, lines: ["yamanote"] },
  { id: "ueno", kanji: "上野", kana: "うえの", romaji: ["ueno"], lat: 35.71231, lng: 139.77676, lines: ["yamanote","ginza","hibiya"] },
  { id: "uguisudani", kanji: "鶯谷", kana: "うぐいすだに", romaji: ["uguisudani"], lat: 35.72170, lng: 139.77792, lines: ["yamanote"] },
  { id: "nippori", kanji: "日暮里", kana: "にっぽり", romaji: ["nippori"], lat: 35.72848, lng: 139.77100, lines: ["yamanote"] },
  { id: "nishi-nippori", kanji: "西日暮里", kana: "にしにっぽり", romaji: ["nishinippori"], lat: 35.73284, lng: 139.76733, lines: ["yamanote"] },
  { id: "tabata", kanji: "田端", kana: "たばた", romaji: ["tabata"], lat: 35.73737, lng: 139.76171, lines: ["yamanote"] },
  { id: "komagome", kanji: "駒込", kana: "こまごめ", romaji: ["komagome"], lat: 35.73629, lng: 139.74700, lines: ["yamanote"] },
  { id: "sugamo", kanji: "巣鴨", kana: "すがも", romaji: ["sugamo"], lat: 35.73360, lng: 139.73882, lines: ["yamanote"] },
  { id: "otsuka", kanji: "大塚", kana: "おおつか", romaji: ["ootsuka","otsuka"], lat: 35.73169, lng: 139.72859, lines: ["yamanote"] },
  { id: "ikebukuro", kanji: "池袋", kana: "いけぶくろ", romaji: ["ikebukuro"], lat: 35.72996, lng: 139.71051, lines: ["yamanote","marunouchi"] },
  { id: "mejiro", kanji: "目白", kana: "めじろ", romaji: ["mejiro"], lat: 35.72119, lng: 139.70646, lines: ["yamanote"] },
  { id: "takadanobaba", kanji: "高田馬場", kana: "たかだのばば", romaji: ["takadanobaba"], lat: 35.71290, lng: 139.70418, lines: ["yamanote"] },
  { id: "shin-okubo", kanji: "新大久保", kana: "しんおおくぼ", romaji: ["shinookubo","shinokubo"], lat: 35.70130, lng: 139.70024, lines: ["yamanote"] },
  { id: "shinjuku", kanji: "新宿", kana: "しんじゅく", romaji: ["shinjuku"], lat: 35.69033, lng: 139.69978, lines: ["yamanote","chuo","marunouchi"] },
  { id: "yoyogi", kanji: "代々木", kana: "よよぎ", romaji: ["yoyogi"], lat: 35.68376, lng: 139.70184, lines: ["yamanote"] },
  { id: "harajuku", kanji: "原宿", kana: "はらじゅく", romaji: ["harajuku"], lat: 35.67021, lng: 139.70243, lines: ["yamanote"] },
  { id: "shibuya", kanji: "渋谷", kana: "しぶや", romaji: ["shibuya"], lat: 35.65871, lng: 139.70164, lines: ["yamanote","ginza"] },
  { id: "ebisu", kanji: "恵比寿", kana: "えびす", romaji: ["ebisu"], lat: 35.64671, lng: 139.70943, lines: ["yamanote"] },
  { id: "meguro", kanji: "目黒", kana: "めぐろ", romaji: ["meguro"], lat: 35.63329, lng: 139.71575, lines: ["yamanote"] },
  { id: "gotanda", kanji: "五反田", kana: "ごたんだ", romaji: ["gotanda"], lat: 35.62616, lng: 139.72399, lines: ["yamanote"] },
  { id: "osaki", kanji: "大崎", kana: "おおさき", romaji: ["oosaki","osaki"], lat: 35.61939, lng: 139.72849, lines: ["yamanote"] },
  { id: "shinagawa", kanji: "品川", kana: "しながわ", romaji: ["shinagawa"], lat: 35.62845, lng: 139.73907, lines: ["yamanote"] },
  { id: "takanawa-gateway", kanji: "高輪ゲートウェイ", kana: "たかなわゲートウェイ", romaji: ["takanawagateway"], lat: 35.63540, lng: 139.74066, lines: ["yamanote"] },
  { id: "tamachi", kanji: "田町", kana: "たまち", romaji: ["tamachi"], lat: 35.64574, lng: 139.74768, lines: ["yamanote"] },
  { id: "hamamatsucho", kanji: "浜松町", kana: "はままつちょう", romaji: ["hamamatsuchou","hamamatsucho"], lat: 35.65511, lng: 139.75706, lines: ["yamanote"] },
  { id: "shimbashi", kanji: "新橋", kana: "しんばし", romaji: ["shimbashi","shinbashi"], lat: 35.66603, lng: 139.75909, lines: ["yamanote","ginza","toeiAsakusa"] },
  { id: "yurakucho", kanji: "有楽町", kana: "ゆうらくちょう", romaji: ["yuurakuchou","yurakucho"], lat: 35.67546, lng: 139.76259, lines: ["yamanote"] },

  // ---- 中央線 ----
  { id: "ochanomizu", kanji: "御茶ノ水", kana: "おちゃのみず", romaji: ["ochanomizu"], lat: 35.70009, lng: 139.76452, lines: ["chuo","marunouchi"] },
  { id: "suidobashi", kanji: "水道橋", kana: "すいどうばし", romaji: ["suidoubashi","suidobashi"], lat: 35.70278, lng: 139.75439, lines: ["chuo"] },
  { id: "iidabashi", kanji: "飯田橋", kana: "いいだばし", romaji: ["iidabashi"], lat: 35.70178, lng: 139.74483, lines: ["chuo"] },
  { id: "ichigaya", kanji: "市ヶ谷", kana: "いちがや", romaji: ["ichigaya"], lat: 35.69208, lng: 139.73666, lines: ["chuo"] },
  { id: "yotsuya", kanji: "四ツ谷", kana: "よつや", romaji: ["yotsuya"], lat: 35.68554, lng: 139.73001, lines: ["chuo","marunouchi"] },
  { id: "nakano", kanji: "中野", kana: "なかの", romaji: ["nakano"], lat: 35.70583, lng: 139.66563, lines: ["chuo"] },
  { id: "kichijoji", kanji: "吉祥寺", kana: "きちじょうじ", romaji: ["kichijouji","kichijoji"], lat: 35.70268, lng: 139.58035, lines: ["chuo"] },

  // ---- 総武線 ----
  { id: "ryogoku", kanji: "両国", kana: "りょうごく", romaji: ["ryougoku","ryogoku"], lat: 35.69633, lng: 139.79519, lines: ["sobu"] },
  { id: "kinshicho", kanji: "錦糸町", kana: "きんしちょう", romaji: ["kinshichou","kinshicho"], lat: 35.69653, lng: 139.81450, lines: ["sobu"] },

  // ---- 銀座線 ----
  { id: "omotesando", kanji: "表参道", kana: "おもてさんどう", romaji: ["omotesandou","omotesando"], lat: 35.66516, lng: 139.71254, lines: ["ginza"] },
  { id: "gaienmae", kanji: "外苑前", kana: "がいえんまえ", romaji: ["gaienmae"], lat: 35.67046, lng: 139.71788, lines: ["ginza"] },
  { id: "aoyama-itchome", kanji: "青山一丁目", kana: "あおやまいっちょうめ", romaji: ["aoyamaicchome"], lat: 35.67278, lng: 139.72402, lines: ["ginza"] },
  { id: "akasaka-mitsuke", kanji: "赤坂見附", kana: "あかさかみつけ", romaji: ["akasakamitsuke"], lat: 35.67632, lng: 139.73753, lines: ["ginza"] },
  { id: "toranomon", kanji: "虎ノ門", kana: "とらのもん", romaji: ["toranomon"], lat: 35.67019, lng: 139.75006, lines: ["ginza"] },
  { id: "ginza", kanji: "銀座", kana: "ぎんざ", romaji: ["ginza"], lat: 35.67212, lng: 139.76410, lines: ["ginza","marunouchi","hibiya"] },
  { id: "kyobashi", kanji: "京橋", kana: "きょうばし", romaji: ["kyoubashi","kyobashi"], lat: 35.67670, lng: 139.77004, lines: ["ginza"] },
  { id: "nihombashi", kanji: "日本橋", kana: "にほんばし", romaji: ["nihombashi","nihonbashi"], lat: 35.68204, lng: 139.77457, lines: ["ginza"] },
  { id: "asakusa", kanji: "浅草", kana: "あさくさ", romaji: ["asakusa"], lat: 35.71129, lng: 139.79685, lines: ["ginza"] },

  // ---- 丸ノ内線 ----
  { id: "kokkaigijidomae", kanji: "国会議事堂前", kana: "こっかいぎじどうまえ", romaji: ["kokkaigijidoumae","kokkaigijidomae"], lat: 35.67412, lng: 139.74449, lines: ["marunouchi"] },
  { id: "kasumigaseki", kanji: "霞ヶ関", kana: "かすみがせき", romaji: ["kasumigaseki"], lat: 35.67352, lng: 139.75180, lines: ["marunouchi","hibiya"] },
  { id: "otemachi", kanji: "大手町", kana: "おおてまち", romaji: ["ootemachi","otemachi"], lat: 35.68577, lng: 139.76480, lines: ["marunouchi"] },

  // ---- 日比谷線 ----
  { id: "roppongi", kanji: "六本木", kana: "ろっぽんぎ", romaji: ["roppongi"], lat: 35.66321, lng: 139.73165, lines: ["hibiya"] },
  { id: "kamiyacho", kanji: "神谷町", kana: "かみやちょう", romaji: ["kamiyachou","kamiyacho"], lat: 35.66296, lng: 139.74505, lines: ["hibiya"] },
  { id: "hibiya", kanji: "日比谷", kana: "ひびや", romaji: ["hibiya"], lat: 35.67480, lng: 139.75963, lines: ["hibiya"] },
  { id: "minowa", kanji: "三ノ輪", kana: "みのわ", romaji: ["minowa"], lat: 35.72955, lng: 139.79130, lines: ["hibiya"] },
  { id: "kita-senju", kanji: "北千住", kana: "きたせんじゅ", romaji: ["kitasenju"], lat: 35.74941, lng: 139.80494, lines: ["hibiya"] },

  // ---- 都営浅草線 ----
  { id: "oshiage", kanji: "押上", kana: "おしあげ", romaji: ["oshiage"], lat: 35.71060, lng: 139.81340, lines: ["toeiAsakusa"] },
  { id: "asakusabashi", kanji: "浅草橋", kana: "あさくさばし", romaji: ["asakusabashi"], lat: 35.69740, lng: 139.78550, lines: ["toeiAsakusa"] },
  { id: "higashi-ginza", kanji: "東銀座", kana: "ひがしぎんざ", romaji: ["higashiginza"], lat: 35.66975, lng: 139.76710, lines: ["toeiAsakusa"] },
];
