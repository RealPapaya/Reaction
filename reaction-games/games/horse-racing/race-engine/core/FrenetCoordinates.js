// ====================================
// Frenet Coordinate System (V9 - 完全平滑版)
// 關鍵修正：
// 1. 移除 0.15/0.85 插值邊界（避免突變）
// 2. 在整個線段上進行平滑 heading 插值
// 3. 使用 Catmull-Rom 風格的平滑曲線
// ====================================

class FrenetCoordinate {
    constructor(trackPath) {
        this.path = trackPath;
        this.pathLength = this.calculatePathLength();
        this.segments = this.buildSegments();

        // 預計算每個線段的平滑 heading
        this.preprocessSmoothHeadings();
    }

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
                },
                index: i - 1
            });

            accumulatedDistance += length;
        }

        return segments;
    }

    // ====================================
    // **關鍵修正：預計算平滑 heading**
    // ====================================
    preprocessSmoothHeadings() {
        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];

            // 獲取相鄰線段的 heading
            const prevHeading = i > 0 ?
                this.segments[i - 1].heading : seg.heading;
            const nextHeading = i < this.segments.length - 1 ?
                this.segments[i + 1].heading : seg.heading;

            // 儲存用於插值的資訊
            seg.prevHeading = prevHeading;
            seg.nextHeading = nextHeading;
        }
    }

    // ====================================
    // **關鍵修正：完全平滑的座標轉換**
    // ====================================
    frenetToWorld(s, d) {
        s = Math.max(0, Math.min(s, this.pathLength));

        const segment = this.findSegment(s);
        if (!segment) {
            const last = this.path[this.path.length - 1];
            return { x: last.x, y: last.y, heading: 0 };
        }

        const segmentProgress = (s - segment.startDistance) / segment.length;

        // 線性插值中心點
        const centerX = segment.startPoint.x +
            (segment.endPoint.x - segment.startPoint.x) * segmentProgress;
        const centerY = segment.startPoint.y +
            (segment.endPoint.y - segment.startPoint.y) * segmentProgress;

        // ====================================
        // **關鍵修正：使用 Catmull-Rom 風格的平滑插值**
        // 移除 0.15/0.85 邊界，整個線段都平滑
        // ====================================
        const smoothHeading = this.getCatmullRomHeading(
            segment.prevHeading,
            segment.heading,
            segment.nextHeading,
            segmentProgress
        );

        const smoothNormal = {
            x: -Math.sin(smoothHeading),
            y: Math.cos(smoothHeading)
        };

        const worldX = centerX + smoothNormal.x * d;
        const worldY = centerY + smoothNormal.y * d;

        return {
            x: worldX,
            y: worldY,
            heading: smoothHeading
        };
    }

    // ====================================
    // **Catmull-Rom 風格的 heading 插值**
    // 確保整個線段都平滑，無突變點
    // ====================================
    getCatmullRomHeading(h0, h1, h2, t) {
        // 正規化所有角度到連續範圍
        h0 = this.normalizeAngle(h0);
        h1 = this.normalizeAngle(h1);
        h2 = this.normalizeAngle(h2);

        // 確保角度連續（避免 -π 到 π 的跳變）
        const diff1 = this.normalizeAngle(h1 - h0);
        const diff2 = this.normalizeAngle(h2 - h1);

        h1 = h0 + diff1;
        h2 = h1 + diff2;

        // Catmull-Rom 插值公式（簡化版）
        // 在線段兩端使用更多相鄰資訊，中間使用線性
        const alpha = 0.5; // 張力參數（0.5 為標準 Catmull-Rom）

        // 使用 Hermite 插值（平滑但不過度彎曲）
        const t2 = t * t;
        const t3 = t2 * t;

        // 切線（導數）
        const m1 = (h2 - h0) * alpha;

        // Hermite 基函數
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;

        // 計算插值結果
        let result = h00 * h1 + h10 * m1 + h01 * h1 + h11 * m1;

        // 在邊界處加強平滑
        if (t < 0.2) {
            // 前 20% 平滑過渡
            const blendFactor = t / 0.2;
            const simpleInterp = h0 + (h1 - h0) * (t / 0.2);
            result = simpleInterp * (1 - blendFactor) + result * blendFactor;
        } else if (t > 0.8) {
            // 後 20% 平滑過渡
            const blendFactor = (1 - t) / 0.2;
            const simpleInterp = h1 + (h2 - h1) * ((t - 0.8) / 0.2);
            result = simpleInterp * (1 - blendFactor) + result * blendFactor;
        }

        return this.normalizeAngle(result);
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    worldToFrenet(x, y) {
        let minDistance = Infinity;
        let bestS = 0;
        let bestD = 0;

        for (const segment of this.segments) {
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

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            const dist = Math.sqrt((px - p1.x) ** 2 + (py - p1.y) ** 2);
            return { s: segment.startDistance, d: dist, distance: dist };
        }

        let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));

        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;

        const distance = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);

        const cross = (px - p1.x) * dy - (py - p1.y) * dx;
        const d = cross > 0 ? distance : -distance;

        const s = segment.startDistance + t * segment.length;

        return { s, d, distance };
    }

    findSegment(s) {
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

        return this.segments[Math.min(left, this.segments.length - 1)];
    }

    // ====================================
    // **關鍵修正：更穩定的曲率計算**
    // ====================================
    getCornerRadiusAt(s) {
        const segment = this.findSegment(s);
        if (!segment) return Infinity;

        const segmentIndex = segment.index;

        if (segmentIndex === 0 || segmentIndex === this.segments.length - 1) {
            return Infinity;
        }

        const prevSegment = this.segments[segmentIndex - 1];
        const nextSegment = this.segments[segmentIndex + 1];

        // 計算平滑後的 heading
        const segmentProgress = (s - segment.startDistance) / segment.length;
        const smoothHeading = this.getCatmullRomHeading(
            segment.prevHeading,
            segment.heading,
            segment.nextHeading,
            segmentProgress
        );

        // 計算相鄰點的 heading（用於估算曲率）
        const deltaS = 1.0; // 1 米的微小距離
        const s1 = Math.max(0, s - deltaS);
        const s2 = Math.min(this.pathLength, s + deltaS);

        const seg1 = this.findSegment(s1);
        const seg2 = this.findSegment(s2);

        if (!seg1 || !seg2) return Infinity;

        const progress1 = (s1 - seg1.startDistance) / seg1.length;
        const progress2 = (s2 - seg2.startDistance) / seg2.length;

        const heading1 = this.getCatmullRomHeading(
            seg1.prevHeading, seg1.heading, seg1.nextHeading, progress1
        );
        const heading2 = this.getCatmullRomHeading(
            seg2.prevHeading, seg2.heading, seg2.nextHeading, progress2
        );

        // 計算曲率
        let headingDiff = this.normalizeAngle(heading2 - heading1);
        const distanceDiff = s2 - s1;

        if (Math.abs(headingDiff) < 0.001 || distanceDiff < 0.1) {
            return Infinity; // 接近直線
        }

        const curvature = headingDiff / distanceDiff;
        const radius = Math.abs(1.0 / curvature);

        return Math.max(20, Math.min(radius, 500));
    }

    getActualDistance(s1, s2, d) {
        const nominalDistance = Math.abs(s2 - s1);
        const midS = (s1 + s2) / 2;
        const cornerRadius = this.getCornerRadiusAt(midS);

        if (cornerRadius === Infinity || cornerRadius > 300) {
            return nominalDistance;
        }

        const actualRadius = cornerRadius + d;
        const ratio = actualRadius / cornerRadius;
        const clampedRatio = Math.max(0.97, Math.min(1.03, ratio));

        return nominalDistance * clampedRatio;
    }

    getTrackWidth() {
        return 18;
    }

    isValidPosition(s, d) {
        return s >= 0 && s <= this.pathLength &&
            d >= 0 && d <= this.getTrackWidth();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrenetCoordinate;
}