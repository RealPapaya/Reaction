// ====================================
// Frenet Coordinate System (Spline + Arc-Length)
// Rendering-focused mapping for smooth inner-lane motion
// ====================================

class FrenetCoordinate {
    constructor(trackPath, options = {}) {
        this.originalPath = Array.isArray(trackPath) ? trackPath : [];
        this.isClosedPath = this.checkClosedPath(this.originalPath);
        this.trackWidth = typeof options.trackWidth === 'number' ? options.trackWidth : 18;

        // Sampling controls
        this.sampleSpacing = 0.5; // meters
        this.curvatureSampleDelta = 1.0; // meters

        this.buildSplineSamples(this.sampleSpacing);
        this.pathLength = this.sampleS.length > 0 ? this.sampleS[this.sampleS.length - 1] : 0;

        // Keep compatibility for debug/test tooling
        this.path = this.samples;
        this.segments = this.buildSegmentsFromSamples();
    }

    // =========================
    // Spline sampling
    // =========================
    buildSplineSamples(spacing) {
        const src = this.prepareControlPoints(this.originalPath, this.isClosedPath);
        const n = src.length;

        this.samples = [];
        this.sampleTangents = [];
        this.sampleNormals = [];
        this.sampleS = [];

        if (n < 2) {
            if (n === 1) {
                this.samples.push({ x: src[0].x, y: src[0].y });
                this.sampleTangents.push({ x: 1, y: 0 });
                this.sampleNormals.push({ x: 0, y: 1 });
                this.sampleS.push(0);
            }
            return;
        }

        const segments = this.isClosedPath ? n : n - 1;
        let prev = null;
        let accum = 0;

        for (let i = 0; i < segments; i++) {
            const p0 = this.getControlPoint(src, i - 1, this.isClosedPath);
            const p1 = this.getControlPoint(src, i, this.isClosedPath);
            const p2 = this.getControlPoint(src, i + 1, this.isClosedPath);
            const p3 = this.getControlPoint(src, i + 2, this.isClosedPath);

            const chordLen = this.distance(p1, p2);
            const steps = Math.max(1, Math.ceil(chordLen / spacing));
            const startStep = (i === 0) ? 0 : 1; // avoid duplicate at segment joins

            for (let s = startStep; s <= steps; s++) {
                const t = s / steps;
                const pos = this.catmullRom(p0, p1, p2, p3, t);
                const tan = this.normalize(this.catmullRomDerivative(p0, p1, p2, p3, t));
                const normal = { x: -tan.y, y: tan.x };

                if (prev) {
                    accum += this.distance(prev, pos);
                }

                this.samples.push(pos);
                this.sampleTangents.push(tan);
                this.sampleNormals.push(normal);
                this.sampleS.push(accum);
                prev = pos;
            }
        }
    }

    prepareControlPoints(points, closed) {
        if (!points || points.length === 0) return [];
        const copy = points.map(p => ({ x: p.x, y: p.y }));
        if (!closed) return copy;

        // If closed and last duplicates first, drop last
        const first = copy[0];
        const last = copy[copy.length - 1];
        const dx = first.x - last.x;
        const dy = first.y - last.y;
        if ((dx * dx + dy * dy) < 1e-6 && copy.length > 2) {
            copy.pop();
        }
        return copy;
    }

    getControlPoint(points, index, closed) {
        const n = points.length;
        if (closed) {
            const i = ((index % n) + n) % n;
            return points[i];
        }
        const clamped = Math.max(0, Math.min(index, n - 1));
        return points[clamped];
    }

    catmullRom(p0, p1, p2, p3, t) {
        const t2 = t * t;
        const t3 = t2 * t;
        return {
            x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
            y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        };
    }

    catmullRomDerivative(p0, p1, p2, p3, t) {
        const t2 = t * t;
        return {
            x: 0.5 * ((-p0.x + p2.x) + 2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t + 3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2),
            y: 0.5 * ((-p0.y + p2.y) + 2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t + 3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2)
        };
    }

    // =========================
    // Core conversions
    // =========================
    frenetToWorld(s, d) {
        if (!this.samples || this.samples.length === 0) {
            return { x: 0, y: 0, heading: 0 };
        }

        s = Math.max(0, Math.min(s, this.pathLength));

        const sample = this.interpolateSampleAtS(s);
        const worldX = sample.x + sample.normal.x * d;
        const worldY = sample.y + sample.normal.y * d;
        const heading = Math.atan2(sample.tangent.y, sample.tangent.x);

        return { x: worldX, y: worldY, heading };
    }

    worldToFrenet(x, y) {
        if (!this.samples || this.samples.length < 2) {
            return { s: 0, d: 0 };
        }

        let minDist = Infinity;
        let bestS = 0;
        let bestD = 0;

        for (let i = 0; i < this.samples.length - 1; i++) {
            const p1 = this.samples[i];
            const p2 = this.samples[i + 1];
            const proj = this.projectPointToSegment(x, y, p1, p2);
            if (proj.distance < minDist) {
                minDist = proj.distance;
                bestS = this.sampleS[i] + proj.t * proj.length;
                bestD = proj.d;
            }
        }

        return { s: bestS, d: bestD };
    }

    interpolateSampleAtS(s) {
        const idx = this.sToSampleIndex(s);
        const s0 = this.sampleS[idx];
        const s1 = this.sampleS[idx + 1];
        const denom = (s1 - s0) || 1;
        const t = Math.max(0, Math.min(1, (s - s0) / denom));

        const p0 = this.samples[idx];
        const p1 = this.samples[idx + 1];
        const tan0 = this.sampleTangents[idx];
        const tan1 = this.sampleTangents[idx + 1];

        const x = p0.x + (p1.x - p0.x) * t;
        const y = p0.y + (p1.y - p0.y) * t;

        const tan = this.normalize({
            x: tan0.x + (tan1.x - tan0.x) * t,
            y: tan0.y + (tan1.y - tan0.y) * t
        });

        const normal = { x: -tan.y, y: tan.x };

        return { x, y, tangent: tan, normal };
    }

    sToSampleIndex(s) {
        if (!this.sampleS || this.sampleS.length < 2) return 0;
        if (s <= 0) return 0;
        if (s >= this.pathLength) return this.sampleS.length - 2;

        let left = 0;
        let right = this.sampleS.length - 2;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const s0 = this.sampleS[mid];
            const s1 = this.sampleS[mid + 1];
            if (s < s0) {
                right = mid - 1;
            } else if (s > s1) {
                left = mid + 1;
            } else {
                return mid;
            }
        }
        return Math.max(0, Math.min(left, this.sampleS.length - 2));
    }

    // =========================
    // Corner radius (curvature)
    // =========================
    getCornerRadiusAt(s) {
        if (!this.samples || this.samples.length < 3) return Infinity;

        const delta = Math.max(this.curvatureSampleDelta, this.sampleSpacing * 2);
        const s1 = Math.max(0, s - delta);
        const s2 = Math.min(this.pathLength, s + delta);
        const s0 = Math.max(0, Math.min(s, this.pathLength));

        const p1 = this.interpolateSampleAtS(s1);
        const p2 = this.interpolateSampleAtS(s0);
        const p3 = this.interpolateSampleAtS(s2);

        const a = this.distance(p1, p2);
        const b = this.distance(p2, p3);
        const c = this.distance(p1, p3);
        if (a < 1e-6 || b < 1e-6 || c < 1e-6) return Infinity;

        const cross = Math.abs((p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x));
        if (cross < 1e-6) return Infinity;

        const radius = (a * b * c) / (2 * cross);
        if (!isFinite(radius)) return Infinity;

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

    // =========================
    // Compatibility / helpers
    // =========================
    buildSegmentsFromSamples() {
        const segments = [];
        if (!this.samples || this.samples.length < 2) return segments;

        for (let i = 0; i < this.samples.length - 1; i++) {
            const p1 = this.samples[i];
            const p2 = this.samples[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            const heading = Math.atan2(dy, dx);
            const invLen = length > 0 ? 1 / length : 0;
            const dir = { x: dx * invLen, y: dy * invLen };

            segments.push({
                startPoint: p1,
                endPoint: p2,
                startDistance: this.sampleS[i],
                endDistance: this.sampleS[i + 1],
                length,
                heading,
                dir,
                normal: { x: -dir.y, y: dir.x },
                index: i
            });
        }

        return segments;
    }

    findSegment(s) {
        if (!this.segments || this.segments.length === 0) return null;
        const idx = this.sToSampleIndex(s);
        return this.segments[Math.max(0, Math.min(idx, this.segments.length - 1))];
    }

    projectPointToSegment(px, py, p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const lengthSq = dx * dx + dy * dy;
        const length = Math.sqrt(lengthSq);

        if (lengthSq === 0) {
            const dist = Math.sqrt((px - p1.x) ** 2 + (py - p1.y) ** 2);
            return { t: 0, d: dist, distance: dist, length: 0 };
        }

        let t = ((px - p1.x) * dx + (py - p1.y) * dy) / lengthSq;
        t = Math.max(0, Math.min(1, t));

        const projX = p1.x + t * dx;
        const projY = p1.y + t * dy;

        const distance = Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
        const cross = (px - p1.x) * dy - (py - p1.y) * dx;
        const d = cross > 0 ? distance : -distance;

        return { t, d, distance, length };
    }

    checkClosedPath(points) {
        if (!points || points.length < 2) return false;
        const first = points[0];
        const last = points[points.length - 1];
        const dx = first.x - last.x;
        const dy = first.y - last.y;
        return (dx * dx + dy * dy) < 1e-6;
    }

    normalize(v) {
        const len = Math.sqrt(v.x * v.x + v.y * v.y);
        if (len < 1e-8) return { x: 1, y: 0 };
        return { x: v.x / len, y: v.y / len };
    }

    distance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    getTrackWidth() {
        return this.trackWidth;
    }

    isValidPosition(s, d) {
        return s >= 0 && s <= this.pathLength &&
            d >= 0 && d <= this.getTrackWidth();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FrenetCoordinate;
}
