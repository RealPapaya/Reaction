// ====================================
// Frenet Coordinate System
// 將賽道路徑與馬匹位置分離，支持連續的橫向移動
// ====================================

class FrenetCoordinate {
    constructor(trackPath) {
        this.path = trackPath; // 賽道中心線的點陣列 [{x, y}, ...]
        this.pathLength = this.calculatePathLength();
        this.segments = this.buildSegments();
    }

    // ====================================
    // 路徑計算
    // ====================================

    calculatePathLength() {
        let length = 0;
        for (let i = 1; i < this.path.length; i++) {
            const dx = this.path[i].x - this.path[i - 1].x;
            const dy = this.path[i].y - this.path[i - 1].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    buildSegments() {
        // 預先計算每個線段的資訊，提升性能
        const segments = [];
        let accumulatedDistance = 0;

        for (let i = 1; i < this.path.length; i++) {
            const p1 = this.path[i - 1];
            const p2 = this.path[i];

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const heading = Math.atan2(dy, dx);

            segments.push({
                startPoint: p1,
                endPoint: p2,
                startDistance: accumulatedDistance,
                endDistance: accumulatedDistance + length,
                length: length,
                heading: heading,
                normal: {
                    x: -Math.sin(heading),
                    y: Math.cos(heading)
                }
            });

            accumulatedDistance += length;
        }

        return segments;
    }

    // ====================================
    // 座標轉換：Frenet → World
    // ====================================

    frenetToWorld(s, d) {
        // s: 縱向距離（沿著賽道中心線，0 到 pathLength）
        // d: 橫向偏移（距離中心線，正數=外側，負數=內側）
        // 返回: {x, y, heading}

        // 確保 s 在有效範圍內
        s = Math.max(0, Math.min(s, this.pathLength));

        // 找到對應的線段
        const segment = this.findSegment(s);
        if (!segment) {
            // 超出範圍，返回終點
            const last = this.path[this.path.length - 1];
            return { x: last.x, y: last.y, heading: 0 };
        }

        // 計算在線段內的進度百分比
        const segmentProgress = (s - segment.startDistance) / segment.length;

        // 計算中心線上的點
        const centerX = segment.startPoint.x +
            (segment.endPoint.x - segment.startPoint.x) * segmentProgress;
        const centerY = segment.startPoint.y +
            (segment.endPoint.y - segment.startPoint.y) * segmentProgress;

        // 加上橫向偏移（沿著法向量）
        const worldX = centerX + segment.normal.x * d;
        const worldY = centerY + segment.normal.y * d;

        return {
            x: worldX,
            y: worldY,
            heading: segment.heading
        };
    }

    // ====================================
    // 座標轉換：World → Frenet
    // ====================================

    worldToFrenet(x, y) {
        // 找到最近的線段和投影點
        let minDistance = Infinity;
        let bestS = 0;
        let bestD = 0;

        for (const segment of this.segments) {
            // 計算點到線段的投影
            const projection = this.projectPointToSegment(x, y, segment);

            if (projection.distance < minDistance) {
                minDistance = projection.distance;
                bestS = projection.s;
                bestD = projection.d;
            }
        }

        return { s: bestS, d: bestD };
    }

    projectPointToSegment(px, py, segment) {
        const p1 = segment.startPoint;
        const p2 = segment.endPoint;

        // 向量計算
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            // 線段退化為點
            const dist = Math.sqrt((px - p1.x) ** 2 + (py - p1.y) ** 2);
            return { s: segment.startDistance, d: dist, distance: dist };
        }

        // 計算投影參數 t (0-1)
        let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t)); // 限制在線段內

        // 投影點
        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;

        // 距離
        const distance = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);

        // 判斷在左側還是右側（用叉積）
        const cross = (px - p1.x) * dy - (py - p1.y) * dx;
        const d = cross > 0 ? distance : -distance;

        // 計算 s
        const s = segment.startDistance + t * segment.length;

        return { s, d, distance };
    }

    // ====================================
    // 輔助方法
    // ====================================

    findSegment(s) {
        // 二分搜尋找到對應的線段
        let left = 0;
        let right = this.segments.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const segment = this.segments[mid];

            if (s < segment.startDistance) {
                right = mid - 1;
            } else if (s > segment.endDistance) {
                left = mid + 1;
            } else {
                return segment;
            }
        }

        // 如果找不到，返回最接近的
        return this.segments[Math.min(left, this.segments.length - 1)];
    }

    // ====================================
    // 彎道計算
    // ====================================

    getCornerRadiusAt(s) {
        // 計算該位置的曲率半徑
        // 如果是直線，返回 Infinity
        // 如果是彎道，返回半徑值

        const segment = this.findSegment(s);
        if (!segment) return Infinity;

        // 簡化版本：檢查前後線段的角度變化
        const segmentIndex = this.segments.indexOf(segment);

        if (segmentIndex === 0 || segmentIndex === this.segments.length - 1) {
            return Infinity; // 起點和終點視為直線
        }

        const prevSegment = this.segments[segmentIndex - 1];
        const nextSegment = this.segments[segmentIndex + 1];

        // 計算角度變化
        const angle1 = prevSegment.heading;
        const angle2 = segment.heading;
        const angle3 = nextSegment.heading;

        const deltaAngle = Math.abs(angle3 - angle1);

        if (deltaAngle < 0.05) {
            // 接近直線（角度變化小於3度）
            return Infinity;
        }

        // 簡化的曲率半徑估算
        // 實際應該用三點計算圓的半徑，這裡用角度變化近似
        const avgSegmentLength = (prevSegment.length + segment.length + nextSegment.length) / 3;
        const radius = avgSegmentLength / deltaAngle;

        return Math.max(20, radius); // 最小半徑20米
    }

    getActualDistance(s1, s2, d) {
        // 計算從 s1 到 s2，在橫向偏移 d 時的實際距離
        // 考慮彎道外側需要跑更遠

        const nominalDistance = Math.abs(s2 - s1);

        // 簡化計算：檢查這段路徑的平均曲率
        const midS = (s1 + s2) / 2;
        const cornerRadius = this.getCornerRadiusAt(midS);

        if (cornerRadius === Infinity) {
            // 直線段，距離相同
            return nominalDistance;
        }

        // 彎道段，外側多跑距離
        // 實際半徑 = 彎道中心半徑 + 橫向偏移
        const actualRadius = cornerRadius + d;
        const ratio = actualRadius / cornerRadius;

        return nominalDistance * ratio;
    }

    // ====================================
    // 賽道資訊
    // ====================================

    getTrackWidth() {
        // 返回賽道寬度（暫定8個跑道 × 1.5米）
        return 12;
    }

    isValidPosition(s, d) {
        // 檢查位置是否在賽道範圍內
        return s >= 0 && s <= this.pathLength &&
            d >= 0 && d <= this.getTrackWidth();
    }
}

// 導出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrenetCoordinate;
}
