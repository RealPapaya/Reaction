# Frenet Fix - Spline + Arc-Length (ZH/EN)

## 中文筆記

### 症狀 (Symptom)
內圈馬匹在彎道時出現「向後閃現」的視覺問題。

### 原因 (Root Cause)
原本的 Frenet 轉換使用 **多段直線 (polyline segments)**。
線段交界處的切線 (tangent) 與法線 (normal) 會發生**突變**。
當應用橫向偏移 `d` 時，這些突變會被放大，導致計算出的世界座標發生瞬移（跳動）。

### 修正 (Fix)
採用以下方案：
1. 使用 **Catmull-Rom spline** 建立平滑的賽道中心線。
2. 建立 **等弧長取樣 (Arc-length sampling)** 查找表 (`sampleS`)，確保 `s` 座標對應真實距離。
3. `frenetToWorld()` 改為對取樣點進行插值，獲取連續且平滑的 **位置、切線與法線**。
4. 彎道半徑計算改用 **三點共圓 (3-point circumcircle)** 法，消除無效值或閃爍 (`∞/N/A`)。

### 為什麼有效 (Why It Works)
Spline 的特性保證了切線的連續性 (C1 連續)，因此法線也是連續變化的。這消除了線段交界處的「折角」，讓 inner lane 的軌跡變得平滑。

### 可調參數 (Tunables)
- `sampleSpacing`: 取樣點間距（越小越平滑，但記憶體與計算量增加）。
- `curvatureSampleDelta`: 計算曲率時的取樣跨度。

### Debug 提示 (Debug Tips)
- 觀察內圈馬匹過彎時是否平滑流暢。
- `CornerDebugger` 顯示的彎道半徑應平滑變化，不應頻繁跳出 `∞` 或 `N/A`。

---

## English Notes

### Symptom
Inner-lane horses "flash backward" briefly while cornering.

### Root Cause
The old Frenet conversion used **polyline segments**. Segment boundaries create **discontinuous tangents/normals**, so the offset point (using `d`) jumps—more visible on tighter inner lanes.

### Fix
1. Use a **Catmull-Rom spline** as the centerline.
2. Build an **arc-length lookup table** (`sampleS`) at fixed spacing.
3. `frenetToWorld()` interpolates smooth position/tangent/normal from samples.
4. Corner radius uses **3-point circumcircle** curvature, removing `∞/N/A` flicker.

### Why It Works
Spline tangents are continuous, so normals are continuous too. This removes the visual "snap" at segment joins.

### Tunables
- `sampleSpacing`: smaller = smoother but heavier.
- `curvatureSampleDelta`: curvature sampling distance.

### Debug Tips
- Inner lane should look smooth through turns.
- Corner radius should change smoothly (no rapid `∞/N/A`).
