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
	// Random number [a, b)
	// Random decimal [0, 1)
	random_dec = () => this.r();
	random_num = (a, b) => a + (b - a) * this.random_dec();
	random_int = (a, b) => Math.floor(this.random_num(a, b + 1));
}
const mapValue = (v, cl, cm, tl, th, c) =>
	c ? Math.min(Math.max(((v - cl) / (cm - cl)) * (th - tl) + tl, tl), th) : ((v - cl) / (cm - cl)) * (th - tl) + tl;

let rand256, c;
rand256 = new Random();

let features = '';
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
let isBordered = false;
let w = Math.floor(16 * 100);
let h = Math.floor(22 * 100);
let p_d = 3;
let startTime;

({sin, cos, imul, PI} = Math);
TAU = PI * 2;
F = (N, f) => [...Array(N)].map((_, i) => f(i));

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
console.log(NSEED);
console.log(seed);
console.log(inputData);

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
	let octaveScale = 1;

	for (let o = 1; o <= octaves; o++) {
		result += n2(x, y, s * octaveScale, i * octaveScale) / octaveScale;
		octaveScale *= 2;
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

	if (iOSSafari || (iOS && !iOSSafari) || (!iOS && !ua.match(/iPad/i) && ua.match(/Mobile/i))) {
		pixelDensity(1);
	} else {
		pixelDensity(p_d);
	}
	c = createCanvas(w, h);

	colorMode(HSB, 360, 100, 100, 100);
	background(10, 0, 10, 100);
	rectMode(CENTER);
	rseed = randomSeed(rand256.random_int(1, 10000));
	nseed = noiseSeed(rand256.random_int(1, 10000));
	startTime = millis();
	INIT(rseed);
	window.rendered = c.canvas;
}

function draw() {
	// get current frame count
	let fps = frameCount;
	for (let i = 0; i < movers.length; i++) {
		for (let j = 0; j < 1; j++) {
			movers[i].show();
			movers[i].move();
		}
	}
	// Calculate the elapsed time
	// after 15 seconds, stop the sketch
	let elapsedTime = millis() - startTime;

	if (elapsedTime > 15000) {
		console.log('15 seconds have passed!');
		noLoop();
		console.log('finished');
		window.rendered = c.canvas;
	}
}

function INIT(seed) {
	movers = [];
	scl1 = random(0.001, 0.001);
	scl2 = random(0.001, 0.001);
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
		movers.push(new Mover(x, y, initHue, scl1, scl2, ang1, ang2, xMin, xMax, yMin, yMax, isBordered, seed));
	}
	let bgCol = color(90, 1, 93, 100);
	background(bgCol);
}

class Mover {
	constructor(x, y, hue, scl1, scl2, ang1, ang2, xMin, xMax, yMin, yMax, isBordered, seed) {
		this.x = x;
		this.y = y;
		this.initHue = hue;
		this.initSat = random([0, 20, 40, 60, 80, 100]);
		this.initBri = random([0, 10, 10, 20, 20, 40, 60, 70, 90]);
		this.initAlpha = 100;
		this.initS = 0.75;
		this.hue = this.initHue;
		this.sat = this.initSat;
		this.bri = this.initBri;
		this.a = this.initAlpha;
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
		this.isBordered = isBordered;
		this.oct = 2;
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
		this.xRandSkipper = random(-1.1, 1.1);
		this.yRandSkipper = random(-1.1, 1.1);

		this.x += p.x / this.xRandDivider + this.xRandSkipper;
		this.y += p.y / this.yRandDivider + this.yRandSkipper;

		this.x =
			this.x <= width / 2 - width / 3
				? width / 2 + width / 3
				: this.x >= width / 2 + width / 3
				? width / 2 - width / 3
				: this.x;
		this.y =
			this.y <= height / 2 - height / 2.5
				? height / 2 + height / 2.5
				: this.y >= height / 2 + height / 2.5
				? height / 2 - height / 2.5
				: this.y;

		//let pxy = p.x - p.y;

		//this.a = mapValue(p.x, -4, 4, this.initAlpha - 5, this.initAlpha + 5, true);
		//this.s = mapValue(p.x, -24, 24, this.initS + 10, this.initS - 10, true);
		this.hue += mapValue(p.x, -20, 20, -0.1, 0.1, true);
		this.hue = this.hue > 360 ? this.hue - 360 : this.hue < 0 ? this.hue + 360 : this.hue;
		//this.sat = mapValue(p.x, -2, 2, 0, 20, true);
		//this.bri = mapValue(p.x, -2, 2, 0, 40, true);

		if (this.isBordered) {
			if (this.x < (this.xMin - 0.015) * width) {
				this.x = (this.xMax + 0.015) * width;
			}
			if (this.x > (this.xMax + 0.015) * width) {
				this.x = (this.xMin - 0.015) * width;
			}
			if (this.y < (this.yMin - 0.015) * height) {
				this.y = (this.yMax + 0.015) * height;
			}
			if (this.y > (this.yMax + 0.015) * height) {
				this.y = (this.yMin - 0.015) * height;
			}
		}
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
