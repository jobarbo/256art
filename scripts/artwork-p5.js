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

	random_int = (a, b) => Math.floor(this.random_num(a, b + 1));
}

let rand256, c;
rand256 = new Random();

let features = '';

let bleed = 0;
let inc = 0.02;
let cells = [];
let w = Math.floor(16 * 100);
let h = Math.floor(16 * 100);
let p_d = 3;

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

ZZ = (x, m, b, r) =>
	x < 0
		? x
		: x > (b *= r * 4)
		? x - b
		: ((x /= r), fract(x / 4) < 0.5 ? r : -r) *
		  ((x = abs(fract(x / 2) - 0.5)), 1 - (x > m ? x * 2 : x * (x /= m) * x * (2 - x) + m));

function oct1(x, y, s, i) {
	return n2(x, y, s, i);
}

function oct2(x, y, s, i) {
	i *= 2;
	return n2(x, y, s, i) + n2(x, y, s * 2, i + 1) / 2;
}

function oct3(x, y, s, i) {
	i *= 3;
	return n2(x, y, s, i) + n2(x, y, s * 2, i + 1) / 2 + n2(x, y, s * 4, i + 2) / 4;
}

function oct4(x, y, s, i) {
	i *= 4;
	return n2(x, y, s, i) + n2(x, y, s * 2, i + 1) / 2 + n2(x, y, s * 4, i + 2) / 4 + n2(x, y, s * 8, i + 3) / 8;
}

function oct5(x, y, s, i) {
	i *= 5;
	return (
		n2(x, y, s, i) +
		n2(x, y, s * 2, i + 1) / 2 +
		n2(x, y, s * 4, i + 2) / 4 +
		n2(x, y, s * 8, i + 3) / 8 +
		n2(x, y, s * 16, i + 4) / 16
	);
}

function oct6(x, y, s, i) {
	i *= 6;
	return (
		n2(x, y, s, i) +
		n2(x, y, s * 2, i + 1) / 2 +
		n2(x, y, s * 4, i + 2) / 4 +
		n2(x, y, s * 8, i + 3) / 8 +
		n2(x, y, s * 16, i + 4) / 16 +
		n2(x, y, s * 32, i + 5) / 32
	);
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
let colorArr = {
	1: [
		[0, 0, 10],
		[30, 10, 100],
		[0, 0, 10],
		[30, 10, 100],
		[0, 0, 10],
		[30, 10, 100],
		[0, 0, 10],
		[30, 10, 100],
		[0, 0, 10],
		[30, 10, 100],
		[0, 0, 10],
	],
	2: [
		[0, 0, 10],
		[30, 10, 100],
		[0, 0, 10],
		[30, 10, 100],
		[0, 70, 100],
		[30, 10, 100],
		[0, 0, 10],
		[30, 10, 100],
		[0, 0, 10],
		[30, 10, 100],
	],
	3: [
		[0, 0, 10],
		[30, 10, 100],
		[30, 10, 100],
		[0, 0, 10],
		[50, 100, 100],
		[0, 0, 10],
		[30, 10, 100],
		[30, 10, 100],
		[0, 0, 10],
		[30, 10, 100],
	],
	4: [
		[0, 0, 10],
		[50, 70, 100],
		[0, 0, 10],
		[50, 70, 100],
		[200, 90, 50],
		[200, 90, 100],
		[200, 90, 50],
		[50, 70, 100],
		[0, 0, 10],
		[50, 70, 100],
		[0, 0, 10],
		[50, 70, 100],
	],
	5: [
		[2, 90, 95],
		[12, 82, 97],
		[23, 61, 96],
		[35, 32, 96],
		[170, 42, 59],
		[186, 100, 54],
		[196, 100, 49],
		[214, 100, 26],
	],
	6: [
		[11, 88, 95],
		[42, 82, 95],
		[169, 20, 78],
		[339, 56, 96],
		[28, 14, 95],
		[138, 73, 50],
		[305, 15, 88],
		[28, 14, 95],
		[42, 82, 95],
		[11, 88, 95],
		[339, 56, 96],
		[28, 14, 95],
		[169, 20, 78],
		[28, 14, 95],
	],
	7: [
		[25, 45, 96],
		[5, 94, 97],
		[27, 87, 98],
		[359, 97, 37],
		[25, 45, 96],
		[359, 97, 37],
		[27, 87, 98],
		[5, 94, 97],
		[25, 45, 96],
		[359, 97, 37],
	],
	8: [
		[30, 10, 98],
		[0, 0, 0],
		[338, 100, 97],
		[183, 100, 95],
		[145, 100, 96],
		[58, 77, 96],
		[244, 89, 92],
		[0, 0, 0],
		[30, 10, 98],
		[0, 0, 0],
		[244, 89, 92],
		[58, 77, 96],
		[145, 100, 96],
		[183, 100, 95],
		[338, 100, 97],
		[0, 0, 0],
		[30, 10, 98],
	],
};
function setup() {
	var ua = window.navigator.userAgent;
	var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
	var webkit = !!ua.match(/WebKit/i);
	var iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

	if (iOSSafari || (iOS && !iOSSafari) || (!iOS && !ua.match(/iPad/i) && ua.match(/Mobile/i))) {
		pixelDensity(2);
	} else {
		pixelDensity(3);
	}
	c = createCanvas(w, h);
	noLoop();
	colorMode(HSB, 360, 100, 100, 100);
	background(10, 0, 10, 100);
	rectMode(CENTER);
	randomSeed(rand256.random_int(1, 10000));
	noiseSeed(rand256.random_int(1, 10000));
	noLoop();

	let palette = colorArr[inputData['colArr']];

	let cellSize = inputData['cellSizeArr'];

	let cellCountX = floor(width / cellSize);
	let cellCountY = floor(height / cellSize);

	let cellWidth = width / cellCountX;
	let cellHeight = height / cellCountY;

	let margin = -1;

	let grid = drawNoise(cellCountX, cellCountY, cellWidth, cellHeight, margin, inc, palette);

	let interval = setInterval(() => {
		let result = grid.next();
		if (result.done) {
			window.rendered = c.canvas;
			clearInterval(interval);
		}
	}, 0);
}
function* drawNoise(cellCountX, cellCountY, cellWidth, cellHeight, margin, inc, palette) {
	let count = 0;
	let draw_every = 3;
	let yoff = 0;

	let amp1 = random([1, 2, 3, 4, 5, 10]);
	let amp2 = random([1000, 1500, 2000]);

	let scale1 = random([0.0025, 0.005, 0.007, 0.01]);
	let scale2 = random([0.001, 0.0005, 0.0001, 0.00005, 0.00001]);
	let xoff = 110;
	for (let gridY = 0; gridY < cellCountY; gridY++) {
		for (let gridX = 0; gridX < cellCountX; gridX++) {
			let posX = cellWidth * gridX;
			let posY = cellHeight * gridY;
			let cell = new Cell(
				posX,
				posY,
				cellWidth,
				cellHeight,
				amp1,
				amp2,
				scale1,
				scale2,
				margin,
				xoff,
				yoff,
				inc,
				palette
			);
			cells.push(cell);
			cell.display(inc);

			xoff += inc;
			if (count >= draw_every) {
				count = 0;
				yield;
			}
		}
		count++;
		yoff += inc;
	}
}

class Cell {
	constructor(x, y, w, h, amp1, amp2, scale1, scale2, margin, xoff, yoff, inc, palette) {
		this.x = x + w / 2;
		this.y = y + h / 2;
		this.margin = margin;
		this.w = w - this.margin;
		this.h = h - this.margin;

		this.xoff = xoff;
		this.yoff = yoff;

		this.biomes = palette;
		this.index = 0;
		this.hue = 0;
		this.sat = 0;
		this.bright = 0;

		this.scale1 = scale1;
		this.scale2 = scale2;
		this.amp1 = amp1;
		this.amp2 = amp2;

		this.oct = inputData['octArr'];

		this.createNoise();
	}
	display() {
		this.createNoise();

		noStroke();
		fill(this.hue, this.sat, this.bright, 100);
		rect(this.x, this.y, this.w, this.h);
	}

	createNoise() {
		let nx = this.x,
			ny = this.y,
			a = this.amp1,
			a2 = this.amp2,
			sc = this.scale1,
			sc2 = this.scale2,
			dx,
			dy;

		let oct = oct1;
		let octIndex = 1;
		switch (this.oct) {
			case 1:
				oct = oct1;
				octIndex = 1;
				break;
			case 2:
				oct = oct2;
				octIndex = 2;
				break;
			case 3:
				oct = oct3;
				octIndex = 3;
				break;
			case 4:
				oct = oct4;
				octIndex = 4;
				break;
			case 5:
				oct = oct5;
				octIndex = 5;
				break;
			case 6:
				oct = oct6;
				octIndex = 6;
				break;
		}
		let rndIndex = rand256.random_int(0, octIndex);
		dx = oct(nx, ny, sc, rndIndex);
		dy = oct(ny, nx, sc2, rndIndex);
		nx += dx * a;
		ny += dy * a2;

		dx = oct(nx, ny, sc, rndIndex);
		dy = oct(ny, nx, sc2, rndIndex);
		nx += dx * a2;
		ny += dy * a2;

		dx = oct(nx, ny, sc, rndIndex);
		dy = oct(ny, nx, sc2, rndIndex);
		nx += dx * a;
		ny += dy * a2;

		let un = oct(nx, ny, sc, rndIndex);
		let vn = oct(nx, ny, sc2, rndIndex);

		let u = un;
		let v = vn;
		this.index = int(map(u + v, -1, 1, 0, this.biomes.length - 1, true));

		this.hue = this.biomes[this.index][0];
		this.sat = this.biomes[this.index][1];
		this.bright = this.biomes[this.index][2];
	}
}

new p5();
