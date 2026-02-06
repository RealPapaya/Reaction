// ====================================
// Frenet Coordinate System (V13 - 真實切線版)
// 最簡單直接的解決方案：
// 直接計算 (s, d) 實際位置的切線方向
// 不依賴中心線的 heading
// ====================================

class FrenetCoordinate {
    constructor(trackPath) {
        this.originalPath = trackPath;
        this.path = this.resamplePath(trackPath, 0.5);
        this.pathLength = this.calculatePathLength();
        this.segments = this.buildSegments();
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
    // **終極解決方案：計算真實位置的切線**
    // ====================================
    frenetToWorld(s, d) {
        s = Math.max(0, Math.min(s, this.pathLength));

        const segment = this.findSegment(s);
        if (!segment) {
            const last = this.path[this.path.length - 1];
            return { x: last.x, y: last.y, heading: 0 };
        }

        const segmentProgress = segment.length > 0
            ? (s - segment.startDistance) / segment.length
            : 0;
        const smoothHeading = this.getSmoothHeading(segment, segmentProgress);

        // 計算中心線位置
        const centerX = segment.startPoint.x +
            (segment.endPoint.x - segment.startPoint.x) * segmentProgress;
        const centerY = segment.startPoint.y +
            (segment.endPoint.y - segment.startPoint.y) * segmentProgress;

        // 計算法線方向
        const centerNormal = {
            x: -Math.sin(segment.heading),
            y: Math.cos(segment.heading)
        };

        // 計算實際世界位置
        const worldX = centerX + centerNormal.x * d;
        const worldY = centerY + centerNormal.y * d;

        // ====================================
        // **關鍵：計算實際位置的切線方向**
        // 使用數值微分：看前後一小段距離的方向
        // ====================================

        const delta = 0.5; // 前後 0.5 米

        // 前一點
        const s1 = Math.max(0, s - delta);
        const seg1 = this.findSegment(s1);
        const prog1 = (s1 - seg1.startDistance) / seg1.length;
        const c1x = seg1.startPoint.x + (seg1.endPoint.x - seg1.startPoint.x) * prog1;
        const c1y = seg1.startPoint.y + (seg1.endPoint.y - seg1.startPoint.y) * prog1;
        const n1x = -Math.sin(seg1.heading);
        const n1y = Math.cos(seg1.heading);
        const p1x = c1x + n1x * d;
        const p1y = c1y + n1y * d;

        // 後一點
        const s2 = Math.min(this.pathLength, s + delta);
        const seg2 = this.findSegment(s2);
        const prog2 = (s2 - seg2.startDistance) / seg2.length;
        const c2x = seg2.startPoint.x + (seg2.endPoint.x - seg2.startPoint.x) * prog2;
        const c2y = seg2.startPoint.y + (seg2.endPoint.y - seg2.startPoint.y) * prog2;
        const n2x = -Math.sin(seg2.heading);
        const n2y = Math.cos(seg2.heading);
        const p2x = c2x + n2x * d;
        const p2y = c2y + n2y * d;

        // 計算實際切線方向
        const dx = p2x - p1x;
        const dy = p2y - p1y;
        const actualHeading = Math.atan2(dy, dx);

        return {
            x: worldX,
            y: worldY,
            heading: actualHeading
        };
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

    getCornerRadiusAt(s) {
        const segment = this.findSegment(s);
        if (!segment) return Infinity;

        const segmentIndex = segment.index;
        if (segmentIndex === 0 || segmentIndex === this.segments.length - 1) {
            return Infinity;
        }

        const prevSegment = this.segments[segmentIndex - 1];
        const nextSegment = this.segments[segmentIndex + 1];

        const angle1 = prevSegment.heading;
        const angle2 = segment.heading;
        const angle3 = nextSegment.heading;

        let delta1 = this.normalizeAngle(angle2 - angle1);
        let delta2 = this.normalizeAngle(angle3 - angle2);

        const avgDelta = Math.abs((delta1 + delta2) / 2);

        if (avgDelta < 0.01) {
            return Infinity;
        }

        const avgSegmentLength = (prevSegment.length + segment.length + nextSegment.length) / 3;
        let radius = avgSegmentLength / avgDelta;

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
