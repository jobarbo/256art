class Random {
	constructor() {
		let t = 0;
		for (let i = 2; i < 66; i += 8) t += parseInt(inputData.hash.substr(i, 8), 16);
		t %= 7;
		const i = (i) => parseInt(inputData.hash.substr(i + t, 8), 16);
		let s = i(2) ^ i(34),
			e = i(10) ^ i(42),
			h = i(18) ^ i(50),
			n = i(26) ^ i(58) ^ i(8 - t + 2);
		this.r = () => {
			(s |= 0), (e |= 0), (h |= 0), (n |= 0);
			let t = (((s + e) | 0) + n) | 0;
			return (
				(n = (n + 1) | 0),
				(s = e ^ (e >>> 9)),
				(e = (h + (h << 3)) | 0),
				(h = (h << 21) | (h >>> 11)),
				(h = (h + t) | 0),
				(t >>> 0) / 4294967296
			);
		};
		for (let t = 0; t < 256; t++) this.r();
	}
	random_dec = () => this.r();
	random_num = (t, i) => t + (i - t) * this.random_dec();
	random_int = (t, i) => Math.floor(this.random_num(t, i + 1));
}
const mapValue = (t, i, s, e, h, n) =>
	n ? Math.min(Math.max(((t - i) / (s - i)) * (h - e) + e, e), h) : ((t - i) / (s - i)) * (h - e) + e;
let rand256, c;
rand256 = new Random();
let scl1,
	scl2,
	ang1,
	ang2,
	rseed,
	nseed,
	xMin,
	xMax,
	yMin,
	yMax,
	startTime,
	features = '',
	movers = [],
	isBordered = !1,
	w = Math.floor(1600),
	h = Math.floor(2200),
	p_d = 3;
function oct(t, i, s, e, h) {
	let n = 0,
		a = 1;
	e *= h;
	for (let r = 0; r < h; r++) (n += n2(t, i, s * a, e + r) / a), (a *= 2);
	return n;
}
function keyPressed() {
	if ('s' === key && (keyIsDown(91) || keyIsDown(93))) return saveArtwork(), !1;
}
function saveArtwork() {
	var t = new Date(),
		i = `${t.getDate()}_${t.getMonth() + 1}_${t.getFullYear()}_${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}`;
	save(i + '.png');
}
function setup() {
	var t = window.navigator.userAgent,
		i = !!t.match(/iPad/i) || !!t.match(/iPhone/i),
		s = !!t.match(/WebKit/i),
		e = i && s && !t.match(/CriOS/i);
	e || (i && !e) || (!i && !t.match(/iPad/i) && t.match(/Mobile/i)) ? pixelDensity(1) : pixelDensity(p_d),
		(c = createCanvas(w, h)),
		colorMode(HSB, 360, 100, 100, 100),
		background(10, 0, 10, 100),
		rectMode(CENTER),
		(rseed = randomSeed(rand256.random_int(1, 1e4))),
		(nseed = noiseSeed(rand256.random_int(1, 1e4))),
		(startTime = millis()),
		INIT(rseed);
}
function draw() {
	frameCount;
	for (let t = 0; t < movers.length; t++) for (let i = 0; i < 1; i++) movers[t].show(), movers[t].move();
	millis() - startTime > 1e4 && (noLoop(), (window.rendered = c.canvas));
}
function INIT(t) {
	(movers = []),
		(scl1 = random(0.001, 0.001)),
		(scl2 = random(0.001, 0.001)),
		(ang1 = int(random([1, 5, 10, 20, 40, 80, 160, 320, 640, 1280]))),
		(ang2 = int(random([1, 5, 10, 20, 40, 80, 160, 320, 640, 1280]))),
		(xMin = -0.05),
		(xMax = 1.05),
		(yMin = -0.05),
		(yMax = 1.05);
	let i = random(360);
	for (let s = 0; s < 1e5; s++) {
		let s = random(xMin, xMax) * width,
			e = random(yMin, yMax) * height,
			h = i + random(-1, 1);
		(h = h > 360 ? h - 360 : h < 0 ? h + 360 : h),
			movers.push(new Mover(s, e, h, scl1, scl2, ang1, ang2, xMin, xMax, yMin, yMax, isBordered, t));
	}
	let s = color(90, 1, 93, 100);
	background(s);
}
({sin: sin, cos: cos, imul: imul, PI: PI} = Math),
	(TAU = 2 * PI),
	(F = (t, i) => [...Array(t)].map((t, s) => i(s))),
	(seed = rand256.random_int(1, 1e5)),
	(S = Uint32Array.of(9, 7, 5, 3)),
	(R = (t = 1) =>
		t *
		((t = S[3]),
		(S[3] = S[2]),
		(S[2] = S[1]),
		(t ^= t << 11),
		(S[0] ^= t ^ (t >>> 8) ^ ((S[1] = S[0]) >>> 19)),
		S[0] / 2 ** 32)),
	[...(seed + 'ThxPiter')].map((t) => R((S[3] ^= 23205 * t.charCodeAt()))),
	(KNUTH = 2654435761),
	(NSEED = R(2 ** 32)),
	(ri = (t, i, s) => (
		(t = imul((((1023 & t) << 20) | ((1023 & i) << 10) | (1023 & (t ^ i ^ s))) ^ NSEED, KNUTH)),
		((t <<= 3 + (t >>> 29)) >>> 1) / 2 ** 31 - 0.5
	)),
	(na = F(99, (t) => R(TAU))),
	(ns = na.map(sin)),
	(nc = na.map(cos)),
	(nox = F(99, (t) => R(1024))),
	(noy = F(99, (t) => R(1024))),
	(n2 = (
		t,
		i,
		s,
		e,
		h = nc[e] * s,
		n = ns[e] * s,
		a = floor((([t, i] = [t * h + i * n + nox[e], i * h - t * n + noy[e]]), t)),
		r = floor(i)
	) => (
		(t -= a),
		(i -= r),
		(t *= t * (3 - 2 * t)),
		(i *= i * (3 - 2 * i)),
		ri(a, r, e) * (1 - t) * (1 - i) +
			ri(a, r + 1, e) * (1 - t) * i +
			ri(a + 1, r, e) * t * (1 - i) +
			ri(a + 1, r + 1, e) * t * i
	));
class Mover {
	constructor(t, i, s, e, h, n, a, r, o, d, c, l, m) {
		(this.x = t),
			(this.y = i),
			(this.initHue = s),
			(this.initSat = random([0, 20, 40, 60, 80, 100])),
			(this.initBri = random([0, 10, 10, 20, 20, 40, 60, 70, 90])),
			(this.initAlpha = 100),
			(this.initS = 0.75),
			(this.hue = this.initHue),
			(this.sat = this.initSat),
			(this.bri = this.initBri),
			(this.a = this.initAlpha),
			(this.s = this.initS),
			(this.scl1 = e),
			(this.scl2 = h),
			(this.ang1 = n),
			(this.ang2 = a),
			(this.seed = m),
			(this.xRandDivider = 1),
			(this.yRandDivider = 1),
			(this.xRandSkipper = 0),
			(this.yRandSkipper = 0),
			(this.xMin = r),
			(this.xMax = o),
			(this.yMin = d),
			(this.yMax = c),
			(this.isBordered = l),
			(this.oct = 2);
	}
	show() {
		fill(this.hue, this.sat, this.bri, this.a), noStroke(), rect(this.x, this.y, this.s);
	}
	move() {
		let t = superCurve(this.x, this.y, this.scl1, this.scl2, this.ang1, this.ang2, this.seed, this.oct);
		(this.xRandDivider = 0.1),
			(this.yRandDivider = 0.1),
			(this.xRandSkipper = random(-1.1, 1.1)),
			(this.yRandSkipper = random(-1.1, 1.1)),
			(this.x += t.x / this.xRandDivider + this.xRandSkipper),
			(this.y += t.y / this.yRandDivider + this.yRandSkipper),
			(this.x =
				this.x <= width / 2 - width / 3
					? width / 2 + width / 3
					: this.x >= width / 2 + width / 3
					? width / 2 - width / 3
					: this.x),
			(this.y =
				this.y <= height / 2 - height / 2.5
					? height / 2 + height / 2.5
					: this.y >= height / 2 + height / 2.5
					? height / 2 - height / 2.5
					: this.y),
			(this.hue += mapValue(t.x, -20, 20, -0.1, 0.1, !0)),
			(this.hue = this.hue > 360 ? this.hue - 360 : this.hue < 0 ? this.hue + 360 : this.hue),
			this.isBordered &&
				(this.x < (this.xMin - 0.015) * width && (this.x = (this.xMax + 0.015) * width),
				this.x > (this.xMax + 0.015) * width && (this.x = (this.xMin - 0.015) * width),
				this.y < (this.yMin - 0.015) * height && (this.y = (this.yMax + 0.015) * height),
				this.y > (this.yMax + 0.015) * height && (this.y = (this.yMin - 0.015) * height));
	}
}
function superCurve(t, i, s, e, h, n, a, r) {
	let o,
		d,
		c = t,
		l = i,
		m = h,
		x = n,
		u = s,
		y = e;
	(o = oct(c, l, u, 0, r)),
		(d = oct(c, l, y, 2, r)),
		(c += o * m),
		(l += d * x),
		(o = oct(c, l, u, 1, r)),
		(d = oct(c, l, y, 3, r)),
		(c += o * m),
		(l += d * x),
		(o = oct(c, l, u, 1, r)),
		(d = oct(c, l, y, 2, r)),
		(c += o * m),
		(l += d * x);
	let M = oct(c, l, u, 0, r),
		p = oct(c, l, y, 1, r),
		g = mapValue(M, -0.0015, 0.15, -5, 5, !0),
		w = mapValue(p, -0.15, 0.0015, -5, 5, !0);
	return createVector(g, w);
}
new p5();
