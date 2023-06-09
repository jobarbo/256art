class Random {
	constructor() {
		let offset = 0;
		for (let i = 2; i < 66; i += 8) offset += parseInt(inputData.hash.substr(i, 8), 16);
		offset %= 7;

		const p = (pos) => parseInt(inputData.hash.substr(pos + offset, 8), 16);
		let a = p(2) ^ p(34),
			b = p(10) ^ p(42),
			c = p(18) ^ p(50),
			d = p(26) ^ p(58) ^ p(2 + (8 - offset));

		this.r = () => {
			a |= 0;
			b |= 0;
			c |= 0;
			d |= 0;
			let t = (((a + b) | 0) + d) | 0;
			d = (d + 1) | 0;
			a = b ^ (b >>> 9);
			b = (c + (c << 3)) | 0;
			c = (c << 21) | (c >>> 11);
			c = (c + t) | 0;
			return (t >>> 0) / 4294967296;
		};

		for (let i = 0; i < 256; i++) this.r();
	}
	random_dec = () => this.r();
	random_num = (a, b) => a + (b - a) * this.random_dec();
	random_int = (a, b) => Math.floor(this.random_num(a, b + 1));
}
const mapValue = (v, cl, cm, tl, th, c) =>
	c ? Math.min(Math.max(((v - cl) / (cm - cl)) * (th - tl) + tl, tl), th) : ((v - cl) / (cm - cl)) * (th - tl) + tl;

let rand256, c, seed;

let features = {
	complexity: inputData.complexity,
	theme: inputData.theme,
	colormode: inputData.colormode,
	composition: inputData.composition,
};
console.log(features);
let movers = [];
let scl1;
let scl2;
let ang1;
let ang2;
let rseed;
let nseed;
let xMin;
let xMax;
let yMin;
let yMax;
let startTime;

let C_WIDTH;
let MULTIPLIER;

({sin, cos, imul, PI} = Math);
TAU = PI * 2;
F = (N, f) => [...Array(N)].map((_, i) => f(i));

rand256 = new Random();
seed = rand256.random_int(1, 100000);

S = Uint32Array.of(9, 7, 5, 3);
R = (a = 1) =>
	a *
	((a = S[3]),
	(S[3] = S[2]),
	(S[2] = S[1]),
	(a ^= a << 11),
	(S[0] ^= a ^ (a >>> 8) ^ ((S[1] = S[0]) >>> 19)),
	S[0] / 2 ** 32);
[...(seed + 'ThxPiter')].map((c) => R((S[3] ^= c.charCodeAt() * 23205)));

KNUTH = 0x9e3779b1;
NSEED = R(2 ** 32);

ri = (i, j, k) => (
	(i = imul((((i & 1023) << 20) | ((j & 1023) << 10) | ((i ^ j ^ k) & 1023)) ^ NSEED, KNUTH)),
	(i <<= 3 + (i >>> 29)),
	(i >>> 1) / 2 ** 31 - 0.5
);

na = F(99, (_) => R(TAU));
ns = na.map(sin);
nc = na.map(cos);
nox = F(99, (_) => R(1024));
noy = F(99, (_) => R(1024));

n2 = (
	x,
	y,
	s,
	i,
	c = nc[i] * s,
	n = ns[i] * s,
	xi = floor((([x, y] = [x * c + y * n + nox[i], y * c - x * n + noy[i]]), x)),
	yi = floor(y)
) => (
	(x -= xi),
	(y -= yi),
	(x *= x * (3 - 2 * x)),
	(y *= y * (3 - 2 * y)),
	ri(xi, yi, i) * (1 - x) * (1 - y) +
		ri(xi, yi + 1, i) * (1 - x) * y +
		ri(xi + 1, yi, i) * x * (1 - y) +
		ri(xi + 1, yi + 1, i) * x * y
);

function oct(x, y, s, i, octaves) {
	let result = 0;
	let sm = 1;
	i *= octaves;
	for (let j = 0; j < octaves; j++) {
		result += n2(x, y, s * sm, i + j) / sm;
		sm *= 2;
	}
	return result;
}

function keyPressed() {
	if (key === 's' && (keyIsDown(91) || keyIsDown(93))) {
		saveArtwork();
		return false;
	}
}

function saveArtwork() {
	var d = new Date();
	var datestring = `${d.getDate()}_${
		d.getMonth() + 1
	}_${d.getFullYear()}_${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
	var fileName = datestring + '.png';

	save(fileName);
}

function setup() {
	var ua = window.navigator.userAgent;
	var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
	var webkit = !!ua.match(/WebKit/i);
	var iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

	if (iOSSafari) {
		pixelDensity(1.0);
	} else {
		pixelDensity(3.0);
	}

	C_WIDTH = min(windowWidth, windowHeight);
	MULTIPLIER = C_WIDTH / 1600;
	c = createCanvas(C_WIDTH, C_WIDTH * 1.3);
	rectMode(CENTER);
	rseed = randomSeed(rand256.random_int(1, 10000));
	nseed = noiseSeed(rand256.random_int(1, 10000));
	colorMode(HSB, 360, 100, 100, 100);
	background(10, 0, 10, 100);
	startTime = millis();
	INIT(rseed);
}

function draw() {
	for (let i = 0; i < movers.length; i++) {
		for (let j = 0; j < 1; j++) {
			movers[i].show();
			movers[i].move();
		}
	}

	let elapsedTime = millis() - startTime;

	if (elapsedTime > 35000) {
		noLoop();
		window.rendered = c.canvas;
		document.complete = true;
	}
}

function INIT(seed) {
	scl1 = random(0.003, 0.003);
	scl2 = random(0.003, 0.003);
	ang1 = int(random([1, 5, 10, 20, 40, 80, 160, 320, 640, 1280]));
	ang2 = int(random([1, 5, 10, 20, 40, 80, 160, 320, 640, 1280]));

	xMin = -0.05;
	xMax = 1.05;
	yMin = -0.05;
	yMax = 1.05;

	let hue = random(360);
	for (let i = 0; i < 100000; i++) {
		let x = random(xMin, xMax) * width;
		let y = random(yMin, yMax) * height;
		let initHue = hue + random(-1, 1);
		initHue = initHue > 360 ? initHue - 360 : initHue < 0 ? initHue + 360 : initHue;
		movers.push(
			new Mover(
				x,
				y,
				initHue,
				scl1 / MULTIPLIER,
				scl2 / MULTIPLIER,
				ang1 * MULTIPLIER,
				ang2 * MULTIPLIER,
				xMin,
				xMax,
				yMin,
				yMax,
				seed
			)
		);
	}
	// if features.theme == 'bright': bgCol = color(90, 1, 93, 100); else bgCol = color(90, 1, 10, 100);
	// written in shorthand
	bgCol = color(90, 1, features.theme == 'bright' ? 93 : 10, 100);

	background(bgCol);
}

class Mover {
	constructor(x, y, hue, scl1, scl2, ang1, ang2, xMin, xMax, yMin, yMax, seed) {
		this.x = x;
		this.y = y;
		this.initHue = hue;
		this.initSat = random([0, 10, 20, 20, 30, 40, 60, 80, 100]);
		this.initBri =
			features.theme === 'bright'
				? random([0, 10, 10, 20, 20, 40, 60, 70, 90])
				: random([40, 60, 60, 70, 70, 80, 80, 90, 100]);
		this.initAlpha = 100;
		this.initS = 0.75 * MULTIPLIER;
		this.hue = this.initHue;
		this.sat = features.colormode === 'monochrome' ? 0 : this.initSat;
		this.bri = this.initBri;
		this.a = this.initAlpha;
		this.hueStep =
			features.colormode === 'monochrome' || features.colormode === 'fixed'
				? 10
				: features.colormode === 'dynamic'
				? 40
				: 100;
		this.s = this.initS;
		this.scl1 = scl1;
		this.scl2 = scl2;
		this.ang1 = ang1;
		this.ang2 = ang2;
		this.seed = seed;
		this.xRandDivider = 1;
		this.yRandDivider = 1;
		this.xRandSkipper = 0;
		this.yRandSkipper = 0;
		this.xMin = xMin;
		this.xMax = xMax;
		this.yMin = yMin;
		this.yMax = yMax;
		this.oct = Number(features.complexity);
		this.centerX = width / 2;
		this.centerY = height / 2;
		this.borderX =
			features.composition === 'compressed'
				? width / 4
				: features.composition === 'constrained'
				? width / 3
				: features.composition === 'semiconstrained'
				? width / 2.5
				: width / 2;
		this.borderY =
			features.composition === 'compressed'
				? height / 3
				: features.composition === 'constrained'
				? height / 2.5
				: features.composition === 'semiconstrained'
				? height / 2.25
				: height / 2;
	}

	show() {
		fill(this.hue, this.sat, this.bri, this.a);
		noStroke();
		rect(this.x, this.y, this.s);
	}

	move() {
		let p = superCurve(this.x, this.y, this.scl1, this.scl2, this.ang1, this.ang2, this.seed, this.oct);

		/* 		this.xRandDivider = random([0.1, 30, 50, 100]);
		this.yRandDivider = random([0.1, 30, 50, 100]); */
		this.xRandDivider = 0.1;
		this.yRandDivider = 0.1;
		/* this.xRandDivider = random(0.01, 12);
		this.yRandDivider = random(0.01, 12); */
		this.xRandSkipper = random(-1.1 * MULTIPLIER, 1.1 * MULTIPLIER);
		this.yRandSkipper = random(-1.1 * MULTIPLIER, 1.1 * MULTIPLIER);

		this.x += (p.x * MULTIPLIER) / this.xRandDivider + this.xRandSkipper;
		this.y += (p.y * MULTIPLIER) / this.yRandDivider + this.yRandSkipper;

		this.x =
			this.x <= this.centerX - this.borderX
				? this.centerX + this.borderX + random(-3 * MULTIPLIER, 0)
				: this.x >= this.centerX + this.borderX
				? this.centerX - this.borderX + random(0, 3 * MULTIPLIER)
				: this.x;
		this.y =
			this.y <= this.centerY - this.borderY
				? this.centerY + this.borderY + random(-3 * MULTIPLIER, 0)
				: this.y >= this.centerY + this.borderY
				? this.centerY - this.borderY + random(0, 3 * MULTIPLIER)
				: this.y;

		//let pxy = p.x - p.y;

		//this.a = mapValue(p.x, -4, 4, this.initAlpha - 5, this.initAlpha + 5, true);
		//this.s = mapValue(p.x, -24, 24, this.initS + 10, this.initS - 10, true);
		this.hue += mapValue(p.x, -20, 20, -this.hueStep, this.hueStep, true);
		this.hue = this.hue > 360 ? this.hue - 360 : this.hue < 0 ? this.hue + 360 : this.hue;
		//this.sat = mapValue(p.x, -2, 2, 0, 20, true);
		//this.bri = mapValue(p.x, -2, 2, 0, 40, true);
	}
}

function superCurve(x, y, scl1, scl2, ang1, ang2, seed, octave) {
	let nx = x,
		ny = y,
		a1 = ang1,
		a2 = ang2,
		scale1 = scl1,
		scale2 = scl2,
		dx,
		dy;

	dx = oct(nx, ny, scale1, 0, octave);
	dy = oct(nx, ny, scale2, 2, octave);
	nx += dx * a1;
	ny += dy * a2;

	dx = oct(nx, ny, scale1, 1, octave);
	dy = oct(nx, ny, scale2, 3, octave);
	nx += dx * a1;
	ny += dy * a2;

	dx = oct(nx, ny, scale1, 1, octave);
	dy = oct(nx, ny, scale2, 2, octave);
	nx += dx * a1;
	ny += dy * a2;

	let un = oct(nx, ny, scale1, 0, octave);
	let vn = oct(nx, ny, scale2, 1, octave);

	let u = mapValue(un, -0.0015, 0.15, -5, 5, true);
	let v = mapValue(vn, -0.15, 0.0015, -5, 5, true);

	let p = createVector(u, v);
	return p;
}

new p5();
