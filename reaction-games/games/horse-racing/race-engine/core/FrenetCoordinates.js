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
        this.isClosedPath = this.checkClosedPath();
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

        const centerNormal = {
            x: -Math.sin(segment.heading),
            y: Math.cos(segment.heading)
        };

        // 計算實際世界位置
        const worldX = centerX + centerNormal.x * d;
        const worldY = centerY + centerNormal.y * d;

        return {
            x: worldX,
            y: worldY,
            heading: smoothHeading
        };
    }

    resamplePath(path, spacing) {
        if (!path || path.length < 2 || spacing <= 0) return path || [];

        const resampled = [path[0]];
        const eps = 1e-6;

        for (let i = 1; i < path.length; i++) {
            const p1 = path[i - 1];
            const p2 = path[i];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const segLen = Math.sqrt(dx * dx + dy * dy);

            if (segLen < eps) {
                continue;
            }

            const steps = Math.max(1, Math.ceil(segLen / spacing));
            for (let s = 1; s <= steps; s++) {
                const t = s / steps;
                const x = p1.x + dx * t;
                const y = p1.y + dy * t;
                const last = resampled[resampled.length - 1];
                const ddx = x - last.x;
                const ddy = y - last.y;
                if ((ddx * ddx + ddy * ddy) > eps * eps) {
                    resampled.push({ x, y });
                }
            }
        }

        return resampled;
    }

    checkClosedPath() {
        if (!this.path || this.path.length < 2) return false;
        const first = this.path[0];
        const last = this.path[this.path.length - 1];
        const dx = first.x - last.x;
        const dy = first.y - last.y;
        return (dx * dx + dy * dy) < 1e-6;
    }

    getSmoothHeading(segment, segmentProgress) {
        if (!segment) return 0;

        const segmentIndex = segment.index;
        const lastIndex = this.segments.length - 1;

        const hasPrev = segmentIndex > 0 || this.isClosedPath;
        const hasNext = segmentIndex < lastIndex || this.isClosedPath;

        if (!hasPrev && !hasNext) return segment.heading;

        const prevIndex = segmentIndex > 0 ? segmentIndex - 1 : lastIndex;
        const nextIndex = segmentIndex < lastIndex ? segmentIndex + 1 : 0;

        const prevSegment = hasPrev ? this.segments[prevIndex] : null;
        const nextSegment = hasNext ? this.segments[nextIndex] : null;

        // Blend heading across segment boundaries to avoid visual jitter.
        const blendWidth = 0.5;
        const distToStart = segmentProgress;
        const distToEnd = 1.0 - segmentProgress;

        let prevWeight = (hasPrev && distToStart < blendWidth)
            ? (blendWidth - distToStart) / blendWidth
            : 0;

        let nextWeight = (hasNext && distToEnd < blendWidth)
            ? (blendWidth - distToEnd) / blendWidth
            : 0;

        let currentWeight = Math.max(0, 1 - prevWeight - nextWeight);
        const totalWeight = prevWeight + currentWeight + nextWeight;

        if (totalWeight > 0) {
            prevWeight /= totalWeight;
            currentWeight /= totalWeight;
            nextWeight /= totalWeight;
        }

        const h0 = prevSegment ? prevSegment.heading : segment.heading;
        const h1 = segment.heading;
        const h2 = nextSegment ? nextSegment.heading : segment.heading;

        const diff1 = this.normalizeAngle(h1 - h0);
        const diff2 = this.normalizeAngle(h2 - h1);

        const normalizedH0 = h0;
        const normalizedH1 = h0 + diff1;
        const normalizedH2 = normalizedH1 + diff2;

        const smoothHeading = normalizedH0 * prevWeight +
            normalizedH1 * currentWeight +
            normalizedH2 * nextWeight;

        return this.normalizeAngle(smoothHeading);
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
