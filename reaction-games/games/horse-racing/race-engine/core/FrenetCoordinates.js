// ====================================
// Frenet Coordinate System (V5 - 修正視覺跳變)
// 關鍵修正：線段邊界平滑插值
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
                index: i - 1 // **新增：線段索引**
            });

            accumulatedDistance += length;
        }

        return segments;
    }

    // ====================================
    // **關鍵修正：平滑的座標轉換**
    // ====================================
    frenetToWorld(s, d) {
        s = Math.max(0, Math.min(s, this.pathLength));

        const segment = this.findSegment(s);
        if (!segment) {
            const last = this.path[this.path.length - 1];
            return { x: last.x, y: last.y, heading: 0 };
        }

        // 計算在線段內的進度
        const segmentProgress = (s - segment.startDistance) / segment.length;

        // **修正 1：線性插值中心點**
        const centerX = segment.startPoint.x +
            (segment.endPoint.x - segment.startPoint.x) * segmentProgress;
        const centerY = segment.startPoint.y +
            (segment.endPoint.y - segment.startPoint.y) * segmentProgress;

        // **修正 2：平滑 heading（在線段邊界處插值）**
        let smoothHeading = segment.heading;

        // 如果接近線段邊界，與鄰近線段的 heading 插值
        const segmentIndex = segment.index;

        if (segmentProgress < 0.15 && segmentIndex > 0) {
            // 接近起點，與前一個線段插值
            const prevSegment = this.segments[segmentIndex - 1];
            const t = segmentProgress / 0.15; // 0-1
            smoothHeading = this.interpolateAngle(prevSegment.heading, segment.heading, t);
        } else if (segmentProgress > 0.85 && segmentIndex < this.segments.length - 1) {
            // 接近終點，與下一個線段插值
            const nextSegment = this.segments[segmentIndex + 1];
            const t = (segmentProgress - 0.85) / 0.15; // 0-1
            smoothHeading = this.interpolateAngle(segment.heading, nextSegment.heading, t);
        }

        // **修正 3：使用平滑 heading 計算法向量**
        const smoothNormal = {
            x: -Math.sin(smoothHeading),
            y: Math.cos(smoothHeading)
        };

        // 加上橫向偏移
        const worldX = centerX + smoothNormal.x * d;
        const worldY = centerY + smoothNormal.y * d;

        return {
            x: worldX,
            y: worldY,
            heading: smoothHeading
        };
    }

    // ====================================
    // **新增：角度插值方法**
    // ====================================
    interpolateAngle(angle1, angle2, t) {
        // 處理角度環繞（-π 到 π）
        let diff = angle2 - angle1;

        // 選擇最短路徑
        if (diff > Math.PI) {
            diff -= 2 * Math.PI;
        } else if (diff < -Math.PI) {
            diff += 2 * Math.PI;
        }

        let result = angle1 + diff * t;

        // 正規化到 -π 到 π
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

        const deltaAngle = Math.abs(angle3 - angle1);

        if (deltaAngle < 0.1) {
            return Infinity;
        }

        const avgSegmentLength = (prevSegment.length + segment.length + nextSegment.length) / 3;
        let radius = avgSegmentLength / deltaAngle;

        const segmentProgress = (s - segment.startDistance) / segment.length;

        if (segmentProgress < 0.2) {
            const t = segmentProgress / 0.2;
            radius = radius + (radius * 2) * (1 - t);
        } else if (segmentProgress > 0.8) {
            const t = (segmentProgress - 0.8) / 0.2;
            radius = radius + (radius * 2) * t;
        }

        return Math.max(20, radius);
    }

    getActualDistance(s1, s2, d) {
        const nominalDistance = Math.abs(s2 - s1);

        const samples = 5;
        let totalRatio = 0;

        for (let i = 0; i < samples; i++) {
            const t = i / (samples - 1);
            const sampleS = s1 + (s2 - s1) * t;
            const cornerRadius = this.getCornerRadiusAt(sampleS);

            if (cornerRadius === Infinity) {
                totalRatio += 1.0;
            } else {
                const actualRadius = cornerRadius + d;
                const ratio = actualRadius / cornerRadius;
                totalRatio += ratio;
            }
        }

        const avgRatio = totalRatio / samples;
        const clampedRatio = Math.min(avgRatio, 1.5);

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