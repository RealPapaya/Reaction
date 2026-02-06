// ====================================
// Frenet Coordinate System (V7 - 徹底修正半徑跳動)
// 關鍵修正：
// 1. 移除錯誤的半徑平滑邏輯
// 2. 使用移動平均計算半徑
// 3. 在 PhysicsEngine 中平滑，不在這裡
// ====================================

class FrenetCoordinate {
    constructor(trackPath) {
        this.path = trackPath;
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
    // 座標轉換（保持平滑插值）
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

        // 平滑 heading（在線段邊界處插值）
        let smoothHeading = segment.heading;

        const segmentIndex = segment.index;

        if (segmentProgress < 0.15 && segmentIndex > 0) {
            const prevSegment = this.segments[segmentIndex - 1];
            const t = segmentProgress / 0.15;
            smoothHeading = this.interpolateAngle(prevSegment.heading, segment.heading, t);
        } else if (segmentProgress > 0.85 && segmentIndex < this.segments.length - 1) {
            const nextSegment = this.segments[segmentIndex + 1];
            const t = (segmentProgress - 0.85) / 0.15;
            smoothHeading = this.interpolateAngle(segment.heading, nextSegment.heading, t);
        }

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

    interpolateAngle(angle1, angle2, t) {
        let diff = angle2 - angle1;

        if (diff > Math.PI) {
            diff -= 2 * Math.PI;
        } else if (diff < -Math.PI) {
            diff += 2 * Math.PI;
        }

        let result = angle1 + diff * t;

        while (result > Math.PI) result -= 2 * Math.PI;
        while (result < -Math.PI) result += 2 * Math.PI;

        return result;
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
    // **關鍵修正：移除錯誤的平滑邏輯，使用移動平均**
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

        // **方法 1：計算當前線段的曲率**
        const angle1 = prevSegment.heading;
        const angle2 = segment.heading;
        const angle3 = nextSegment.heading;

        // 正規化角度差
        let delta1 = this.normalizeAngle(angle2 - angle1);
        let delta2 = this.normalizeAngle(angle3 - angle2);

        const avgDelta = Math.abs((delta1 + delta2) / 2);

        if (avgDelta < 0.05) { // 接近直線
            return Infinity;
        }

        const avgSegmentLength = (prevSegment.length + segment.length + nextSegment.length) / 3;
        let radius = avgSegmentLength / avgDelta;

        // **方法 2：與前後線段的曲率做移動平均**
        // 這樣可以避免線段邊界的突變
        const radiuses = [radius];

        // 前一個線段的曲率
        if (segmentIndex > 1) {
            const prevPrevSeg = this.segments[segmentIndex - 2];
            const prevDelta1 = this.normalizeAngle(prevSegment.heading - prevPrevSeg.heading);
            const prevDelta2 = this.normalizeAngle(segment.heading - prevSegment.heading);
            const prevAvgDelta = Math.abs((prevDelta1 + prevDelta2) / 2);

            if (prevAvgDelta > 0.05) {
                const prevRadius = avgSegmentLength / prevAvgDelta;
                radiuses.push(prevRadius);
            }
        }

        // 後一個線段的曲率
        if (segmentIndex < this.segments.length - 2) {
            const nextNextSeg = this.segments[segmentIndex + 2];
            const nextDelta1 = this.normalizeAngle(nextSegment.heading - segment.heading);
            const nextDelta2 = this.normalizeAngle(nextNextSeg.heading - nextSegment.heading);
            const nextAvgDelta = Math.abs((nextDelta1 + nextDelta2) / 2);

            if (nextAvgDelta > 0.05) {
                const nextRadius = avgSegmentLength / nextAvgDelta;
                radiuses.push(nextRadius);
            }
        }

        // **移動平均**
        const avgRadius = radiuses.reduce((a, b) => a + b, 0) / radiuses.length;

        return Math.max(20, Math.min(avgRadius, 500)); // 限制在 20-500m
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    // ====================================
    // **簡化 getActualDistance**
    // ====================================
    getActualDistance(s1, s2, d) {
        const nominalDistance = Math.abs(s2 - s1);

        // **簡化策略：只在明顯彎道時考慮差異**
        const midS = (s1 + s2) / 2;
        const cornerRadius = this.getCornerRadiusAt(midS);

        if (cornerRadius === Infinity || cornerRadius > 300) {
            // 直線或大彎道
            return nominalDistance;
        }

        // 彎道：外側稍微多跑
        const actualRadius = cornerRadius + d;
        const ratio = actualRadius / cornerRadius;

        // **限制影響在 ±3% 以內**
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