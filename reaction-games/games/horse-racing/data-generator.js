// ====================================
// Data Generator - Horse & Jockey Names
// ====================================

const HorseNames = [
    // A 型：皇室、權威與榮耀型 (Royal & Power)
    'King’s Legacy (王權遺產)', 'Grand Duke (大公爵)', 'Crown Jewel (皇冠明珠)', 'Noble Baron (顯赫男爵)',
    'Royal Cavalier (皇家騎士)', 'Sovereign Lord (至高領主)', 'Empress Guard (女皇衛隊)', 'Imperial Shield (帝國之盾)',
    'Golden Throne (黃金王座)', 'Supreme Commander (最高統帥)', 'Dynasty Warrior (王朝勇士)', 'Iron Chancellor (鋼鐵宰相)',
    'Monarch’s Path (君王之路)', 'Aristocrat (名門貴族)', 'Majestic Glory (雄偉榮光)', 'Palace Guard (宮廷禁衛)',
    'Regal Standard (皇家準則)', 'Dominion Power (領地威權)', 'Heir Apparent (法定繼承人)', 'Viceroy (總督)',
    'High Chancellor (大總理)', 'Royal Salute (皇家禮炮)', 'Eternal Kingdom (永恆國度)', 'Knights Templar (聖殿騎士)',
    'Glorious Reign (輝煌統治)', 'Silver Scepter (銀色權杖)', 'Noble Heritage (高貴血統)', 'Excalibur (王者之劍)',
    'Royal Gallantry (皇家英勇)', 'Crest of Honor (榮榮譽勳章)',

    // B 型：天文、神話與自然型 (Celestial & Mythic)
    'Supernova (超新星)', 'Solar Flare (太陽耀斑)', 'Cosmic Dust (宇宙星塵)', 'Nebula Dream (星雲之夢)',
    'Stellar Voyager (星際旅者)', 'Galactic Hero (銀河英雄)', 'Lunar Shadow (月影)', 'Aurora Borealis (極光)',
    'Comet Tail (彗星之尾)', 'Star Gazing (仰望星空)', 'Poseidon (波賽頓)', 'Ares Blade (阿瑞斯之刃)',
    'Apollo’s Chariot (阿波羅戰車)', 'Hermes Wings (赫密斯之翼)', 'Thunder Zeus (雷霆宙斯)', 'Athena’s Wisdom (雅典娜智慧)',
    'Valhalla Gate (英靈殿之門)', 'Odin’s Eye (奧丁之眼)', 'Valkyrie Flight (女武神飛行)', 'Titan’s Strength (泰坦巨力)',
    'Gaia Spirit (蓋亞靈魂)', 'Icarus Rise (伊卡洛斯崛起)', 'Prometheus Fire (普羅米修斯之火)', 'Medusa Stare (美杜莎之視)',
    'Orion’s Belt (獵戶腰帶)', 'Pegasus Wing (天馬之翼)', 'Eclipse Nova (新星蝕)', 'Stardust Memory (星塵回憶)',
    'Zenith Point (天頂之點)', 'Celestial Dawn (神聖破曉)',

    // C 型：速度、地理與遠征型 (Speed & Geography)
    'Sonic Boom (音爆)', 'Lightning Bolt (電光石火)', 'Velocity Prime (極速核心)', 'Mach Speed (馬赫速度)',
    'Rapid Fire (連環快火)', 'Turbo Charge (渦輪增壓)', 'Bullet Train (子彈列車)', 'Aero Dash (破風衝刺)',
    'Jet stream (噴射氣流)', 'Nitro Express (硝基快車)', 'Alpine Peak (阿爾卑斯巔峰)', 'Saharan Wind (撒哈拉之風)',
    'Everest Reach (喜馬拉雅征服)', 'Pacific Rim (環太平洋)', 'Arctic Frost (極地冰霜)', 'Amazon Wild (亞馬遜荒野)',
    'Atlantic Wave (大西洋浪潮)', 'Canyon Runner (峽谷奔行者)', 'Icelandic Fire (冰島之火)', 'Danube Rhythm (多瑙河律動)',
    'Nile Voyager (尼羅河旅者)', 'Himalayan Gold (雪山黃金)', 'Siberian Tiger (西伯利亞虎)', 'Gobi Dust (戈壁塵埃)',
    'Cape Town Mist (開普敦之霧)', 'Tokyo Drift (東京飄移)', 'London Fog (倫敦霧都)', 'Parisian Night (巴黎之夜)',
    'Venetian Blue (威尼斯之藍)', 'Manhattan Skyline (曼哈頓天際)'
];

const JockeyNames = {
    '英國': [
        'William Sterling (威廉·斯特林)', 'James Hastings (詹姆斯·海斯廷斯)', 'Oliver Beckett (奧利弗·貝克特)',
        'Harry Mortimer (哈利·莫提梅)', 'George Spencer (喬治·史賓賽)', 'Thomas Radcliffe (湯瑪斯·雷德克里夫)',
        'Edward Vaughan (艾德華·沃恩)', 'Charles Pemberton (查爾斯·彭伯頓)', 'Richard Granville (理查·格蘭維爾)',
        'Arthur Kingsley (亞瑟·金斯利)', 'Freddie Moore (佛萊迪·摩亞)', 'Simon Whitfield (賽門·惠特菲爾德)',
        'Robert Langton (羅伯特·蘭頓)', 'Alistair Cook (艾利斯泰爾·庫克)', 'Jack Harrington (傑克·哈林頓)',
        'Toby Marlowe (托比·馬洛)', 'Luke Northcott (盧克·諾斯考特)', 'Philip Ashton (菲利普·艾希頓)',
        'Ben Cavendish (班·卡文迪許)', 'Miles Thornton (麥爾斯·桑頓)'
    ],
    '法國': [
        'Julien Beaumont (朱利安·博蒙特)', 'Pierre Lefebvre (皮埃爾·勒費弗爾)', 'Maxime Morel (馬克西姆·莫雷爾)',
        'Olivier Peslier (奧利弗·佩斯利)', 'Clement Deshayes (克萊門特·德賽)', 'Thierry Dupont (蒂埃里·杜邦)',
        'Romain Giraud (羅曼·吉羅)', 'Antoine Mercier (安托萬·梅西耶)', 'Hugo Chevalier (雨果·謝瓦利埃)',
        'Benoit Garnier (班諾·加尼爾)', 'Fabrice Lemaire (法布里斯·勒梅爾)', 'Matthieu Roussel (馬修·魯塞爾)',
        'Alexis Pouchin (亞歷克西·普欽)', 'Laurent Vidal (羅倫·維達爾)', 'Stephane Pasquier (斯蒂芬·帕斯奎爾)',
        'Gerald Mossé (巫斯義/傑拉德·莫瑟)', 'Franck Blondel (法蘭克·布隆代爾)', 'Jean-Bernard Eyquem (尚-伯納德·艾奎姆)',
        'Sylvain Ruis (西爾萬·魯伊斯)', 'Yannick Boudot (布度)'
    ],
    '美國': [
        'Caleb Rodriguez (迦勒·羅德里格斯)', 'Tyler Vance (泰勒·范斯)', 'Austin Miller (奧斯丁·米勒)',
        'Garrett Stone (加勒特·史東)', 'Braden Walker (布雷登·沃克)', 'Chase Jenkins (蔡斯·詹金斯)',
        'Flavien Pratt (弗拉維安·普拉特)', 'Irad Ortiz (奧提茲)', 'Joel Rosario (羅沙里奧)',
        'Luis Saez (路易斯·塞茲)', 'Mike Smith (麥克·史密斯)', 'John Velazquez (約翰·維拉斯奎茲)',
        'Dakota Mitchell (達科塔·米契爾)', 'Colton Rivers (科爾頓·里維斯)', 'Shane Sellers (謝恩·塞勒斯)',
        'Corey Nakatani (中谷·科里)', 'Robby Albarado (羅比·阿爾巴拉多)', 'Kent Desormeaux (肯特·德索莫)',
        'Victor Espinoza (維克多·艾斯皮諾薩)', 'Pat Day (派特·戴)'
    ],
    '愛爾蘭': [
        'Shane O\'Sullivan (謝恩·歐蘇利文)', 'Cian McCormack (基恩·麥考馬克)', 'Dermot Weld (德莫特·韋爾德)',
        'Pat Smullen (斯圖恩)', 'Seamie Heffernan (赫夫南)', 'Donnacha O\'Brien (唐納卡·歐伯倫)',
        'Killian Leonard (基利安·里奧納德)', 'Conor Hoban (康諾·霍班)', 'Declan McDonogh (德克蘭·麥克唐納)',
        'Wayne Lordan (韋恩·勞敦)', 'Rory Cleary (羅里·克里)', 'Billy Lee (比利·李)',
        'Colin Keane (柯林·基恩)', 'Gary Carroll (蓋瑞·卡羅)', 'Niall McCullagh (奈爾·麥庫拉)',
        'Padraig Beggy (帕德拉格·貝吉)', 'Danny Sheehy (丹尼·希希)', 'Tom Madden (湯姆·馬登)',
        'Kevin Manning (凱文·曼寧)', 'Oisin Orr (奧辛·歐爾)'
    ],
    '日本': [
        '武 豐 (Take Yutaka)', '福永 祐一 (Fukunaga Yuichi)', '川田 將雅 (Kawada Yuga)',
        '戶崎 圭太 (Tozaki Keita)', '橫山 武史 (Yokoyama Takeshi)', '坂井 瑠星 (Sakai Ryusei)',
        '松山 弘平 (Matsuyama Kohei)', '三浦 皇成 (Miura Kosei)', '內田 博幸 (Uchida Hiroyuki)',
        '岩田 康誠 (Iwata Yasunari)', '池添 謙一 (Ikezoe Kenichi)', '濱中 俊 (Hamanaka Suguru)',
        '北村 友一 (Kitamura Yuichi)', '荻野 極 (Ogino Kiwami)', '團野 大成 (Danno Taisei)',
        '鮫島 克駿 (Samejima Katsuma)', '津村 明秀 (Tsumura Akihide)', '菅原 明良 (Sugawara Akira)',
        '西村 淳也 (Nishimura Atsuya)', '藤岡 佑介 (Fujioka Yusuke)'
    ],
    '澳洲': [
        'Damian Lane (連達文)', 'James McDonald (麥道朗)', 'Zac Purton (潘頓)',
        'Hugh Bowman (布文)', 'Blake Shinn (薛恩)', 'Mark Zahra (扎拉)',
        'Nash Rawiller (羅理雅)', 'Craig Williams (威廉斯)', 'Kerrin McEvoy (麥維凱)',
        'Lachlan Mitchell (米契爾)', 'Ben Thompson (湯普新)', 'Jamie Kah (嘉里)',
        'Rachel King (金美琪)', 'Brenton Avdulla (艾道拿)', 'Tommy Berry (貝力斯)',
        'Sam Clipperton (祈普敦)', 'Tim Clark (郭立基)', 'Luke Nolen (諾倫)',
        'Regan Bayliss (貝力斯)', 'Damien Oliver (岳禮華)'
    ],
    '華人': [
        '林志豪', '陳冠宇', '張建中', '徐世勳', '黃文雄',
        '王承恩', '蔡政翰', '李睿祥', '周大為', '洪嘉駿',
        '覃勇 (Qin Yong)', '王超 (Wang Chao)', '張強 (Zhang Qiang)', '劉三平', '黎加飛',
        '巴特巴依爾 (蒙裔)', '白雲', '陳黎', '雙英', '麻連凱'
    ],
    '非洲': [
        'Anton Marcus (安東·馬庫斯)', 'Piere Strydom (史卓棟)', 'Gavin Lerena (利敬國)',
        'Lyle Hewitson (希威森)', 'Muzi Yeni (耶尼)', 'Richard Fourie (傅弘海)',
        'S\'manga Khumalo (庫馬羅)', 'Grant van Niekerk (范德禮)', 'Aldo Domeyer (多梅耶)',
        'Bernard Fayd\'Herbe (費德亥)', 'Callan Murray (馬雅樂)', 'Justin Snaith (史奈斯)',
        'Luke Ferraris (霍宏聲)', 'Anthony Delpech (戴圖理)', 'Warren Kennedy (肯尼迪)',
        'Keagan de Melo (迪美羅)', 'Derreck David (戴維德)', 'Sean Veale (維爾)',
        'Raymond Danielson (丹尼遜)', 'Craig Zackey (扎基)'
    ],
    '印度': [
        'Suraj Narredu (納瑞杜)', 'Trevor Patel (帕特爾)', 'P. S. Chouhan (喬漢)',
        'Sandesh Akhade (阿卡德)', 'Y. S. Srinath (斯里納斯)', 'Neeraj Rawal (拉瓦爾)',
        'Akshay Kumar (庫馬爾)', 'C. S. Jodha (喬達)', 'Imran Chisty (奇斯蒂)',
        'Deepak Singh (辛格)', 'Dashrath Singh (達斯拉特)', 'A. Sandesh (桑德什)',
        'S. Zervan (澤凡)', 'David Allan (大衛·艾倫)', 'Yash Narredu (雅許·納瑞杜)',
        'N. S. Parmar (帕瑪)', 'S. Saqlain (薩克萊恩)', 'Vivek G. (維韋克)',
        'S. Antony Raj (安東尼·拉吉)', 'Hindu Singh (希杜·辛格)'
    ]
};

const Flags = {
    '英國': '🇬🇧',
    '法國': '🇫🇷',
    '美國': '🇺🇸',
    '愛爾蘭': '🇮🇪',
    '日本': '🇯🇵',
    '澳洲': '🇦🇺',
    '華人': '🇹🇼',
    '非洲': '🇿🇦',
    '印度': '🇮🇳'
};

const HorseColors = ['棕色', '黑色', '白色', '灰色', '栗色', '花斑'];
const Genders = ['公', '母', '閹'];

// ====================================
// Random Utilities
// ====================================

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
}

function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ====================================
// Horse Name Generator
// ====================================

function createHorseNameGenerator() {
    const usedNames = new Set();

    return function () {
        let name;
        do {
            name = randomChoice(HorseNames);
        } while (usedNames.has(name) && usedNames.size < HorseNames.length);

        usedNames.add(name);
        return name;
    };
}

const horseGenerator = createHorseNameGenerator();

// ====================================
// Jockey Name Generator
// ====================================

// ====================================
// Jockey Data Generator
// ====================================

function createJockeyGenerator() {
    const usedNames = new Set();
    const countries = Object.keys(JockeyNames);

    return function () {
        let country, name;
        let attempts = 0;

        do {
            country = randomChoice(countries);
            name = randomChoice(JockeyNames[country]);
            attempts++;
        } while (usedNames.has(name) && attempts < 100);

        usedNames.add(name);
        return { name, country };
    };
}

const jockeyGenerator = createJockeyGenerator();

// ====================================
// Jockey Class
// ====================================

class Jockey {
    constructor() {
        const data = jockeyGenerator();
        this.name = data.name;
        this.country = data.country;
        this.flag = Flags[data.country] || '🏁';
        this.weight = randomInt(48, 58);        // 48-58 kg
        this.experience = randomInt(1, 20);     // 1-20 years
        this.skillLevel = randomFloat(0.8, 1.2, 2); // Skill coefficient
    }
}

// ====================================
// Horse Class
// ====================================

class Horse {
    constructor(id) {
        this.id = id;
        this.name = horseGenerator();
        this.age = randomInt(3, 7);             // 3-7 years old (避免2歲vs8歲)
        this.gender = randomChoice(Genders);
        this.weight = randomInt(450, 550);      // 450-550 kg
        this.weightChange = randomInt(-10, 10); // Weight change from last race
        this.height = randomInt(155, 170);      // 155-170 cm
        this.color = randomChoice(HorseColors);
        this.jockey = new Jockey();

        // Calculated metadata - 改為 kg 單位
        this.weightCarried = randomInt(50, 60); // 50-60 kg (專業賽馬負磅範圍)

        // Performance Trend (Last 5 races)
        this.lastFiveTrend = Array.from({ length: 5 }, () => randomInt(1, 8));

        // Racing properties
        this.baseWinRate = randomFloat(0.05, 0.2, 3); // 5-20% base win rate
        this.odds = 0;
        this.previousOdds = 0;

        // Race state
        this.progress = 0;
        this.speed = 0;
        this.position = 0;
    }

    // Calculate optimal performance factor based on age
    get ageFactor() {
        if (this.age >= 4 && this.age <= 6) {
            return 1.1; // Peak performance
        } else if (this.age === 3 || this.age === 7) {
            return 1.05;
        } else {
            return 1.0;
        }
    }

    // 走勢評分系統 (近五場表現)
    get trendScore() {
        // 名次對應分數：第1名=10分，第2名=7分，第3名=5分，第4-8名遞減
        const scoreMap = { 1: 10, 2: 7, 3: 5, 4: 3, 5: 2, 6: 1, 7: 0.5, 8: 0 };
        // 最近的比賽權重更高 (最近35%, 次近25%, 依此類推)
        const weights = [0.35, 0.25, 0.2, 0.12, 0.08];

        return this.lastFiveTrend.reduce((total, rank, index) => {
            return total + (scoreMap[rank] || 0) * weights[index];
        }, 0);
    }

    // 體重變動狀態評估
    get conditionStatus() {
        const absChange = Math.abs(this.weightChange);
        if (absChange <= 5) return '穩定';
        if (absChange <= 10) return '不穩定';
        return '狀態差';
    }

    // 體重變動對狀態的影響係數
    get conditionFactor() {
        if (this.conditionStatus === '穩定') return 1.0;
        if (this.conditionStatus === '不穩定') return 0.9;
        return 0.8; // 狀態差
    }

    // 負磅懲罰係數 (每增加1kg，速度降低0.5%)
    get weightPenalty() {
        return 1 - ((this.weightCarried - 50) * 0.005);
    }

    // 重新設計的競爭力計算 (整合所有因素)
    get competitiveFactor() {
        const trendFactor = this.trendScore / 10; // 轉換為 0-1 範圍
        const ageFactor = this.ageFactor;
        const jockeyFactor = this.jockey.skillLevel;
        const weightPenalty = this.weightPenalty;
        const conditionFactor = this.conditionFactor;

        // 整合所有因素
        return this.baseWinRate * trendFactor * ageFactor * jockeyFactor * weightPenalty * conditionFactor;
    }
}

// ====================================
// Generate 8 Horses
// ====================================

function generateHorses() {
    const horses = [];
    for (let i = 1; i <= 8; i++) {
        horses.push(new Horse(i));
    }
    return horses;
}
