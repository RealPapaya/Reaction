// ====================================
// Data Generator - Horse & Jockey Names
// ====================================

const HorseNames = [
    '閃電俠', '疾風', '烈焰', '冰霜', '雷霆',
    '星辰', '暴風', '幻影', '翔龍', '獵豹',
    '戰神', '勇者', '飛鷹', '火箭', '極速',
    '風暴', '霹靂', '閃光', '颶風', '神駒',
    '烈火', '寒冰', '電光', '追風', '逐雲',
    '天馬', '聖騎', '狂奔', '奔雷', '流星'
];

const JockeyNames = [
    '王大明', '李小華', '張三豐', '陳美美', '林志明',
    '黃建國', '吳佳佳', '鄭成功', '劉德華', '周傑倫',
    '馬英九', '蔡依林', '孫中山', '賴清德', '柯文哲',
    '韓國瑜', '宋楚瑜', '連戰', '朱立倫', '侯友宜',
    '蘇貞昌', '陳時中', '唐鳳', '蔣萬安', '黃珊珊'
];

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

function generateHorseName() {
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

// ====================================
// Jockey Name Generator
// ====================================

function generateJockeyName() {
    const usedNames = new Set();

    return function () {
        let name;
        do {
            name = randomChoice(JockeyNames);
        } while (usedNames.has(name) && usedNames.size < JockeyNames.length);

        usedNames.add(name);
        return name;
    };
}

// ====================================
// Jockey Class
// ====================================

class Jockey {
    constructor() {
        const nameGenerator = generateJockeyName();
        this.name = nameGenerator();
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
        const nameGenerator = generateHorseName();

        this.id = id;
        this.name = nameGenerator();
        this.age = randomInt(2, 8);             // 2-8 years old
        this.gender = randomChoice(Genders);
        this.weight = randomInt(450, 550);      // 450-550 kg
        this.height = randomInt(155, 170);      // 155-170 cm
        this.color = randomChoice(HorseColors);
        this.jockey = new Jockey();

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

    // Calculate total competitive factor
    get competitiveFactor() {
        return this.baseWinRate * this.ageFactor * this.jockey.skillLevel;
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
