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
  tozai: "#009BBF",
  chiyoda: "#00BB85",
  yurakucho: "#C1A470",
  hanzomon: "#8F76D6",
  namboku: "#00AC9B",
  fukutoshin: "#9C5E31",
};

const LINE_NAMES = {
  yamanote: "山手線",
  chuo: "中央線",
  sobu: "総武線",
  ginza: "銀座線",
  marunouchi: "丸ノ内線",
  hibiya: "日比谷線",
  toeiAsakusa: "都営浅草線",
  tozai: "東西線",
  chiyoda: "千代田線",
  yurakucho: "有楽町線",
  hanzomon: "半蔵門線",
  namboku: "南北線",
  fukutoshin: "副都心線",
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
  {
    id: "tozai",
    closed: false,
    order: ["nakano","takadanobaba","waseda","iidabashi","kudanshita","otemachi","nihombashi","kayabacho","monzen-nakacho","toyocho","kasai"],
  },
  {
    id: "chiyoda",
    closed: false,
    order: ["kita-senju","nishi-nippori","nezu","shin-ochanomizu","otemachi","hibiya","kasumigaseki","kokkaigijidomae","akasaka","nogizaka","omotesando","meiji-jingumae","yoyogi-uehara"],
  },
  {
    id: "yurakucho",
    closed: false,
    order: ["ikebukuro","gokokuji","iidabashi","ichigaya","nagatacho","sakuradamon","yurakucho","tsukishima","toyosu","shin-kiba"],
  },
  {
    id: "hanzomon",
    closed: false,
    order: ["shibuya","omotesando","aoyama-itchome","nagatacho","hanzomon","kudanshita","jimbocho","otemachi","mitsukoshimae","suitengumae","kiyosumi-shirakawa","kinshicho","oshiage"],
  },
  {
    id: "namboku",
    closed: false,
    order: ["meguro","shirokanedai","azabu-juban","roppongi-itchome","tameike-sanno","nagatacho","yotsuya","ichigaya","iidabashi","korakuen","todaimae","komagome","oji","akabane-iwabuchi"],
  },
  {
    id: "fukutoshin",
    closed: false,
    order: ["ikebukuro","zoshigaya","nishi-waseda","higashi-shinjuku","shinjuku-sanchome","kita-sando","meiji-jingumae","shibuya"],
  },
];

// STATIONS: id, kanji, kana(読み。入力判定とヒントに使用), romaji(判定エンジンで表せない慣用表記の別名), lat, lng, lines
const STATIONS = [
  // ---- 山手線 ----
  { id: "tokyo", kanji: "東京", kana: "とうきょう", romaji: ["toukyou","tokyo"], lat: 35.68061, lng: 139.76644, lines: ["yamanote","chuo","marunouchi"] },
  { id: "kanda", kanji: "神田", kana: "かんだ", romaji: ["kanda"], lat: 35.69275, lng: 139.77090, lines: ["yamanote","chuo","ginza"] },
  { id: "akihabara", kanji: "秋葉原", kana: "あきはばら", romaji: ["akihabara"], lat: 35.69855, lng: 139.77431, lines: ["yamanote","sobu","hibiya"] },
  { id: "okachimachi", kanji: "御徒町", kana: "おかちまち", romaji: ["okachimachi"], lat: 35.70695, lng: 139.77463, lines: ["yamanote"] },
  { id: "ueno", kanji: "上野", kana: "うえの", romaji: ["ueno"], lat: 35.71231, lng: 139.77676, lines: ["yamanote","ginza","hibiya"] },
  { id: "uguisudani", kanji: "鶯谷", kana: "うぐいすだに", romaji: ["uguisudani"], lat: 35.72170, lng: 139.77792, lines: ["yamanote"] },
  { id: "nippori", kanji: "日暮里", kana: "にっぽり", romaji: ["nippori"], lat: 35.72848, lng: 139.77100, lines: ["yamanote"] },
  { id: "nishi-nippori", kanji: "西日暮里", kana: "にしにっぽり", romaji: ["nishinippori"], lat: 35.73284, lng: 139.76733, lines: ["yamanote","chiyoda"] },
  { id: "tabata", kanji: "田端", kana: "たばた", romaji: ["tabata"], lat: 35.73737, lng: 139.76171, lines: ["yamanote"] },
  { id: "komagome", kanji: "駒込", kana: "こまごめ", romaji: ["komagome"], lat: 35.73629, lng: 139.74700, lines: ["yamanote","namboku"] },
  { id: "sugamo", kanji: "巣鴨", kana: "すがも", romaji: ["sugamo"], lat: 35.73360, lng: 139.73882, lines: ["yamanote"] },
  { id: "otsuka", kanji: "大塚", kana: "おおつか", romaji: ["ootsuka","otsuka"], lat: 35.73169, lng: 139.72859, lines: ["yamanote"] },
  { id: "ikebukuro", kanji: "池袋", kana: "いけぶくろ", romaji: ["ikebukuro"], lat: 35.72996, lng: 139.71051, lines: ["yamanote","marunouchi","yurakucho","fukutoshin"] },
  { id: "mejiro", kanji: "目白", kana: "めじろ", romaji: ["mejiro"], lat: 35.72119, lng: 139.70646, lines: ["yamanote"] },
  { id: "takadanobaba", kanji: "高田馬場", kana: "たかだのばば", romaji: ["takadanobaba"], lat: 35.71290, lng: 139.70418, lines: ["yamanote","tozai"] },
  { id: "shin-okubo", kanji: "新大久保", kana: "しんおおくぼ", romaji: ["shinookubo","shinokubo"], lat: 35.70130, lng: 139.70024, lines: ["yamanote"] },
  { id: "shinjuku", kanji: "新宿", kana: "しんじゅく", romaji: ["shinjuku"], lat: 35.69033, lng: 139.69978, lines: ["yamanote","chuo","marunouchi"] },
  { id: "yoyogi", kanji: "代々木", kana: "よよぎ", romaji: ["yoyogi"], lat: 35.68376, lng: 139.70184, lines: ["yamanote"] },
  { id: "harajuku", kanji: "原宿", kana: "はらじゅく", romaji: ["harajuku"], lat: 35.67021, lng: 139.70243, lines: ["yamanote"] },
  { id: "shibuya", kanji: "渋谷", kana: "しぶや", romaji: ["shibuya"], lat: 35.65871, lng: 139.70164, lines: ["yamanote","ginza","hanzomon","fukutoshin"] },
  { id: "ebisu", kanji: "恵比寿", kana: "えびす", romaji: ["ebisu"], lat: 35.64671, lng: 139.70943, lines: ["yamanote"] },
  { id: "meguro", kanji: "目黒", kana: "めぐろ", romaji: ["meguro"], lat: 35.63329, lng: 139.71575, lines: ["yamanote","namboku"] },
  { id: "gotanda", kanji: "五反田", kana: "ごたんだ", romaji: ["gotanda"], lat: 35.62616, lng: 139.72399, lines: ["yamanote"] },
  { id: "osaki", kanji: "大崎", kana: "おおさき", romaji: ["oosaki","osaki"], lat: 35.61939, lng: 139.72849, lines: ["yamanote"] },
  { id: "shinagawa", kanji: "品川", kana: "しながわ", romaji: ["shinagawa"], lat: 35.62845, lng: 139.73907, lines: ["yamanote"] },
  { id: "takanawa-gateway", kanji: "高輪ゲートウェイ", kana: "たかなわゲートウェイ", romaji: ["takanawagateway"], lat: 35.63540, lng: 139.74066, lines: ["yamanote"] },
  { id: "tamachi", kanji: "田町", kana: "たまち", romaji: ["tamachi"], lat: 35.64574, lng: 139.74768, lines: ["yamanote"] },
  { id: "hamamatsucho", kanji: "浜松町", kana: "はままつちょう", romaji: ["hamamatsuchou","hamamatsucho"], lat: 35.65511, lng: 139.75706, lines: ["yamanote"] },
  { id: "shimbashi", kanji: "新橋", kana: "しんばし", romaji: ["shimbashi","shinbashi"], lat: 35.66603, lng: 139.75909, lines: ["yamanote","ginza","toeiAsakusa"] },
  { id: "yurakucho", kanji: "有楽町", kana: "ゆうらくちょう", romaji: ["yuurakuchou","yurakucho"], lat: 35.67546, lng: 139.76259, lines: ["yamanote","yurakucho"] },

  // ---- 中央線 ----
  { id: "ochanomizu", kanji: "御茶ノ水", kana: "おちゃのみず", romaji: ["ochanomizu"], lat: 35.70009, lng: 139.76452, lines: ["chuo","marunouchi"] },
  { id: "suidobashi", kanji: "水道橋", kana: "すいどうばし", romaji: ["suidoubashi","suidobashi"], lat: 35.70278, lng: 139.75439, lines: ["chuo"] },
  { id: "iidabashi", kanji: "飯田橋", kana: "いいだばし", romaji: ["iidabashi"], lat: 35.70178, lng: 139.74483, lines: ["chuo","tozai","yurakucho","namboku"] },
  { id: "ichigaya", kanji: "市ヶ谷", kana: "いちがや", romaji: ["ichigaya"], lat: 35.69208, lng: 139.73666, lines: ["chuo","yurakucho","namboku"] },
  { id: "yotsuya", kanji: "四ツ谷", kana: "よつや", romaji: ["yotsuya"], lat: 35.68554, lng: 139.73001, lines: ["chuo","marunouchi","namboku"] },
  { id: "nakano", kanji: "中野", kana: "なかの", romaji: ["nakano"], lat: 35.70583, lng: 139.66563, lines: ["chuo","tozai"] },
  { id: "kichijoji", kanji: "吉祥寺", kana: "きちじょうじ", romaji: ["kichijouji","kichijoji"], lat: 35.70268, lng: 139.58035, lines: ["chuo"] },

  // ---- 総武線 ----
  { id: "ryogoku", kanji: "両国", kana: "りょうごく", romaji: ["ryougoku","ryogoku"], lat: 35.69633, lng: 139.79519, lines: ["sobu"] },
  { id: "kinshicho", kanji: "錦糸町", kana: "きんしちょう", romaji: ["kinshichou","kinshicho"], lat: 35.69653, lng: 139.81450, lines: ["sobu","hanzomon"] },

  // ---- 銀座線 ----
  { id: "omotesando", kanji: "表参道", kana: "おもてさんどう", romaji: ["omotesandou","omotesando"], lat: 35.66516, lng: 139.71254, lines: ["ginza","chiyoda","hanzomon"] },
  { id: "gaienmae", kanji: "外苑前", kana: "がいえんまえ", romaji: ["gaienmae"], lat: 35.67046, lng: 139.71788, lines: ["ginza"] },
  { id: "aoyama-itchome", kanji: "青山一丁目", kana: "あおやまいっちょうめ", romaji: ["aoyamaicchome"], lat: 35.67278, lng: 139.72402, lines: ["ginza","hanzomon"] },
  { id: "akasaka-mitsuke", kanji: "赤坂見附", kana: "あかさかみつけ", romaji: ["akasakamitsuke"], lat: 35.67632, lng: 139.73753, lines: ["ginza"] },
  { id: "toranomon", kanji: "虎ノ門", kana: "とらのもん", romaji: ["toranomon"], lat: 35.67019, lng: 139.75006, lines: ["ginza"] },
  { id: "ginza", kanji: "銀座", kana: "ぎんざ", romaji: ["ginza"], lat: 35.67212, lng: 139.76410, lines: ["ginza","marunouchi","hibiya"] },
  { id: "kyobashi", kanji: "京橋", kana: "きょうばし", romaji: ["kyoubashi","kyobashi"], lat: 35.67670, lng: 139.77004, lines: ["ginza"] },
  { id: "nihombashi", kanji: "日本橋", kana: "にほんばし", romaji: ["nihombashi","nihonbashi"], lat: 35.68204, lng: 139.77457, lines: ["ginza","tozai"] },
  { id: "asakusa", kanji: "浅草", kana: "あさくさ", romaji: ["asakusa"], lat: 35.71129, lng: 139.79685, lines: ["ginza"] },

  // ---- 丸ノ内線 ----
  { id: "kokkaigijidomae", kanji: "国会議事堂前", kana: "こっかいぎじどうまえ", romaji: ["kokkaigijidoumae","kokkaigijidomae"], lat: 35.67412, lng: 139.74449, lines: ["marunouchi","chiyoda"] },
  { id: "kasumigaseki", kanji: "霞ヶ関", kana: "かすみがせき", romaji: ["kasumigaseki"], lat: 35.67352, lng: 139.75180, lines: ["marunouchi","hibiya","chiyoda"] },
  { id: "otemachi", kanji: "大手町", kana: "おおてまち", romaji: ["ootemachi","otemachi"], lat: 35.68577, lng: 139.76480, lines: ["marunouchi","tozai","chiyoda","hanzomon"] },

  // ---- 日比谷線 ----
  { id: "roppongi", kanji: "六本木", kana: "ろっぽんぎ", romaji: ["roppongi"], lat: 35.66321, lng: 139.73165, lines: ["hibiya"] },
  { id: "kamiyacho", kanji: "神谷町", kana: "かみやちょう", romaji: ["kamiyachou","kamiyacho"], lat: 35.66296, lng: 139.74505, lines: ["hibiya"] },
  { id: "hibiya", kanji: "日比谷", kana: "ひびや", romaji: ["hibiya"], lat: 35.67480, lng: 139.75963, lines: ["hibiya","chiyoda"] },
  { id: "minowa", kanji: "三ノ輪", kana: "みのわ", romaji: ["minowa"], lat: 35.72955, lng: 139.79130, lines: ["hibiya"] },
  { id: "kita-senju", kanji: "北千住", kana: "きたせんじゅ", romaji: ["kitasenju"], lat: 35.74941, lng: 139.80494, lines: ["hibiya","chiyoda"] },

  // ---- 都営浅草線 ----
  { id: "oshiage", kanji: "押上", kana: "おしあげ", romaji: ["oshiage"], lat: 35.71060, lng: 139.81340, lines: ["toeiAsakusa","hanzomon"] },
  { id: "asakusabashi", kanji: "浅草橋", kana: "あさくさばし", romaji: ["asakusabashi"], lat: 35.69740, lng: 139.78550, lines: ["toeiAsakusa"] },
  { id: "higashi-ginza", kanji: "東銀座", kana: "ひがしぎんざ", romaji: ["higashiginza"], lat: 35.66975, lng: 139.76710, lines: ["toeiAsakusa"] },

  // ---- 東西線(東京メトロ) ----
  { id: "waseda", kanji: "早稲田", kana: "わせだ", romaji: ["waseda"], lat: 35.70580, lng: 139.72119, lines: ["tozai"] },
  { id: "kudanshita", kanji: "九段下", kana: "くだんした", romaji: ["kudanshita"], lat: 35.69550, lng: 139.75072, lines: ["tozai","hanzomon"] },
  { id: "kayabacho", kanji: "茅場町", kana: "かやばちょう", romaji: ["kayabacho"], lat: 35.67974, lng: 139.77958, lines: ["tozai"] },
  { id: "monzen-nakacho", kanji: "門前仲町", kana: "もんぜんなかちょう", romaji: ["monzennakacho"], lat: 35.67229, lng: 139.79507, lines: ["tozai"] },
  { id: "toyocho", kanji: "東陽町", kana: "とうようちょう", romaji: ["toyocho"], lat: 35.66960, lng: 139.81748, lines: ["tozai"] },
  { id: "kasai", kanji: "葛西", kana: "かさい", romaji: ["kasai"], lat: 35.66363, lng: 139.87269, lines: ["tozai"] },

  // ---- 千代田線(東京メトロ) ----
  { id: "nezu", kanji: "根津", kana: "ねづ", romaji: ["nezu"], lat: 35.71736, lng: 139.76573, lines: ["chiyoda"] },
  { id: "shin-ochanomizu", kanji: "新御茶ノ水", kana: "しんおちゃのみず", romaji: ["shinochanomizu"], lat: 35.69719, lng: 139.76555, lines: ["chiyoda"] },
  { id: "akasaka", kanji: "赤坂", kana: "あかさか", romaji: ["akasaka"], lat: 35.67217, lng: 139.73630, lines: ["chiyoda"] },
  { id: "nogizaka", kanji: "乃木坂", kana: "のぎざか", romaji: ["nogizaka"], lat: 35.66670, lng: 139.72634, lines: ["chiyoda"] },
  { id: "meiji-jingumae", kanji: "明治神宮前", kana: "めいじじんぐうまえ", romaji: ["meijijingumae"], lat: 35.66870, lng: 139.70485, lines: ["chiyoda","fukutoshin"] },
  { id: "yoyogi-uehara", kanji: "代々木上原", kana: "よよぎうえはら", romaji: ["yoyogiuehara"], lat: 35.66901, lng: 139.67979, lines: ["chiyoda"] },

  // ---- 有楽町線(東京メトロ) ----
  { id: "gokokuji", kanji: "護国寺", kana: "ごこくじ", romaji: ["gokokuji"], lat: 35.71908, lng: 139.72746, lines: ["yurakucho"] },
  { id: "nagatacho", kanji: "永田町", kana: "ながたちょう", romaji: ["nagatacho"], lat: 35.67830, lng: 139.73993, lines: ["yurakucho","hanzomon","namboku"] },
  { id: "sakuradamon", kanji: "桜田門", kana: "さくらだもん", romaji: ["sakuradamon"], lat: 35.67740, lng: 139.75158, lines: ["yurakucho"] },
  { id: "tsukishima", kanji: "月島", kana: "つきしま", romaji: ["tsukishima"], lat: 35.66465, lng: 139.78456, lines: ["yurakucho"] },
  { id: "toyosu", kanji: "豊洲", kana: "とよす", romaji: ["toyosu"], lat: 35.65493, lng: 139.79617, lines: ["yurakucho"] },
  { id: "shin-kiba", kanji: "新木場", kana: "しんきば", romaji: ["shinkiba"], lat: 35.64591, lng: 139.82666, lines: ["yurakucho"] },

  // ---- 半蔵門線(東京メトロ) ----
  { id: "hanzomon", kanji: "半蔵門", kana: "はんぞうもん", romaji: ["hanzomon"], lat: 35.68522, lng: 139.74158, lines: ["hanzomon"] },
  { id: "jimbocho", kanji: "神保町", kana: "じんぼうちょう", romaji: ["jimbocho","jinbocho"], lat: 35.69593, lng: 139.75720, lines: ["hanzomon"] },
  { id: "mitsukoshimae", kanji: "三越前", kana: "みつこしまえ", romaji: ["mitsukoshimae"], lat: 35.68600, lng: 139.77335, lines: ["hanzomon"] },
  { id: "suitengumae", kanji: "水天宮前", kana: "すいてんぐうまえ", romaji: ["suitengumae"], lat: 35.68252, lng: 139.78564, lines: ["hanzomon"] },
  { id: "kiyosumi-shirakawa", kanji: "清澄白河", kana: "きよすみしらかわ", romaji: ["kiyosumishirakawa"], lat: 35.68205, lng: 139.79876, lines: ["hanzomon"] },

  // ---- 南北線(東京メトロ) ----
  { id: "shirokanedai", kanji: "白金台", kana: "しろかねだい", romaji: ["shirokanedai"], lat: 35.63810, lng: 139.72657, lines: ["namboku"] },
  { id: "azabu-juban", kanji: "麻布十番", kana: "あざぶじゅうばん", romaji: ["azabujuban"], lat: 35.65518, lng: 139.73715, lines: ["namboku"] },
  { id: "roppongi-itchome", kanji: "六本木一丁目", kana: "ろっぽんぎいっちょうめ", romaji: ["roppongiitchome"], lat: 35.66497, lng: 139.73885, lines: ["namboku"] },
  { id: "tameike-sanno", kanji: "溜池山王", kana: "ためいけさんのう", romaji: ["tameikesanno"], lat: 35.67226, lng: 139.74169, lines: ["namboku"] },
  { id: "korakuen", kanji: "後楽園", kana: "こうらくえん", romaji: ["korakuen"], lat: 35.70780, lng: 139.75151, lines: ["namboku"] },
  { id: "todaimae", kanji: "東大前", kana: "とうだいまえ", romaji: ["todaimae"], lat: 35.71734, lng: 139.75818, lines: ["namboku"] },
  { id: "oji", kanji: "王子", kana: "おうじ", romaji: ["oji"], lat: 35.75396, lng: 139.73752, lines: ["namboku"] },
  { id: "akabane-iwabuchi", kanji: "赤羽岩淵", kana: "あかばねいわぶち", romaji: ["akabaneiwabuchi"], lat: 35.78345, lng: 139.72210, lines: ["namboku"] },

  // ---- 副都心線(東京メトロ) ----
  { id: "zoshigaya", kanji: "雑司が谷", kana: "ぞうしがや", romaji: ["zoshigaya"], lat: 35.72025, lng: 139.71478, lines: ["fukutoshin"] },
  { id: "nishi-waseda", kanji: "西早稲田", kana: "にしわせだ", romaji: ["nishiwaseda"], lat: 35.70793, lng: 139.70904, lines: ["fukutoshin"] },
  { id: "higashi-shinjuku", kanji: "東新宿", kana: "ひがししんじゅく", romaji: ["higashishinjuku"], lat: 35.69893, lng: 139.70770, lines: ["fukutoshin"] },
  { id: "shinjuku-sanchome", kanji: "新宿三丁目", kana: "しんじゅくさんちょうめ", romaji: ["shinjukusanchome"], lat: 35.69097, lng: 139.70444, lines: ["fukutoshin"] },
  { id: "kita-sando", kanji: "北参道", kana: "きたさんどう", romaji: ["kitasando"], lat: 35.67850, lng: 139.70541, lines: ["fukutoshin"] },
];
