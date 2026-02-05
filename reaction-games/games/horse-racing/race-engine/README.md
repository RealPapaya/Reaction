# 賽馬物理引擎開發流程

## 📁 專案結構

```
race-engine/
├── core/                    # 核心物理模組
│   ├── FrenetCoordinates.js # Frenet 座標系統
│   ├── PhysicsEngine.js     # 物理引擎（離心力、體力系統）
│   └── SteeringBehaviors.js # 轉向行為（避障、超車、分離）
├── ai/                      # AI 決策系統
│   └── JockeyAI.js         # 騎師 AI（戰術、盒子效應）
├── RaceSimulator.js        # 主模擬器（整合所有模組）
├── test-simulator.html     # 🧪 測試模擬器（開發用）
├── debug-test.html         # 除錯測試頁面
└── collision-resolution.js # 碰撞解決邏輯（已整合入 RaceSimulator）
```

## 🔄 開發流程（重要！）

### 原則：**先在模擬器調整，再整合到主遊戲**

```mermaid
graph LR
    A[發現問題/新需求] --> B[在 test-simulator.html 複現]
    B --> C[修改對應模組]
    C --> D{測試通過?}
    D -->|否| C
    D -->|是| E[git commit]
    E --> F[整合到主遊戲 game.js]
    F --> G[全場景測試]
```

### 步驟說明

#### 1️⃣ **在測試模擬器中開發**
```bash
# 開啟測試頁面
open test-simulator.html

# 觀察問題，例如：
# - 馬匹卡頓
# - 超車不明顯
# - 視覺碰撞
```

#### 2️⃣ **定位並修改對應模組**
| 問題類型 | 修改檔案 | 範例 |
|---------|---------|------|
| 轉向/超車行為 | `core/SteeringBehaviors.js` | 調整 `OVERTAKE_FORCE` |
| 速度/體力系統 | `core/PhysicsEngine.js` | 修改 `staminaDecayRate` |
| 碰撞/分離邏輯 | `RaceSimulator.js` → `resolveCollisions()` | 調整 `minDistance` |
| AI 決策 | `ai/JockeyAI.js` | 修改戰術權重 |
| 座標/賽道 | `core/FrenetCoordinates.js` | 調整曲率計算 |

#### 3️⃣ **在測試模擬器中驗證**
- 重新整理 `test-simulator.html`
- 多跑幾場，確保隨機性正常
- 檢查除錯資訊（右上角顯示）

#### 4️⃣ **整合到主遊戲**
```javascript
// 在 ../game.js 中
import { RaceSimulator } from './race-engine/RaceSimulator.js';

// 取代舊的 race-engine.js 邏輯
const simulator = new RaceSimulator(horses, trackPath);
simulator.startRace();
```

#### 5️⃣ **全場景測試**
- 8 匹馬並進
- 投注系統
- 結算系統
- 觀賽 UI

## ⚙️ 常用調整參數

### 轉向行為 (`SteeringBehaviors.js`)
```javascript
this.RAIL_ATTRACTION = 0.1;      // 內欄吸引力
this.OVERTAKE_FORCE = 2.5;       // 超車力度
this.SPEED_DIFF_THRESHOLD = 0.8; // 速度差閾值（觸發超車）
```

### 物理引擎 (`PhysicsEngine.js`)
```javascript
this.FRICTION = 0.998;              // 摩擦力
this.CENTRIFUGAL_STRENGTH = 0.10;   // 離心力強度
this.SPEED_SMOOTHING = 0.2;         // 速度平滑係數
```

### 碰撞解決 (`RaceSimulator.js`)
```javascript
const minDistance = 2.0;                // 最小安全距離（米）
const longitudinalCorrection = 0.25;    // 縱向位置修正強度
const speedCorrection = 0.20;           // 速度阻尼強度
```

## 🐛 常見問題排查

| 現象 | 可能原因 | 解決方向 |
|-----|---------|---------|
| 馬匹前後卡頓 | 碰撞修正太強 | 降低 `longitudinalCorrection` |
| 視覺上重疊 | 視覺尺寸 ≠ 物理尺寸 | 檢查 `HORSE_VISUAL_WIDTH` |
| 不會超車 | 超車力被其他力抵消 | 提高 `OVERTAKE_FORCE`，降低 `RAIL_ATTRACTION` |
| 每場結果一樣 | 隨機性不足 | 檢查 `stamina`、`startDelay` 初始化 |
| 離心力太強 | 曲率跳變 | 檢查 `applyCentrifugalForceSmooth()` |

## 📊 開發優先級

1. **性能** - 60 FPS @ 8 匹馬
2. **隨機性** - 每場結果不同
3. **真實感** - 符合賽馬物理直覺
4. **遊戲性** - 投注策略有效

## 🔧 快速命令

```bash
# 啟動測試模擬器
open race-engine/test-simulator.html

# 啟動主遊戲
open index.html

# 檢查所有模組
ls race-engine/core/*.js race-engine/ai/*.js race-engine/RaceSimulator.js
```

## 📝 Commit 規範

```
feat(physics): 增加體力系統隨機性
fix(steering): 修正超車時的內欄吸引干擾
perf(collision): 優化碰撞檢測算法
docs(readme): 更新開發流程說明
```

---

**記住：所有調整都先在 `test-simulator.html` 驗證，再整合到主遊戲！**
