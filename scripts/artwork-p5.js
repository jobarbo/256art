// Recommended class for randomness; remove unneeded functionality
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
		// 256 warmup cycles
		for (let i = 0; i < 256; i++) this.r();
	}
	// Random decimal [0, 1)
	random_dec = () => this.r();
	// Random number [a, b)
	random_num = (a, b) => a + (b - a) * this.random_dec();
	// Random integer [a, b] (a < b required)
	random_int = (a, b) => Math.floor(this.random_num(a, b + 1));
	// Random boolean (p = true probability)
	random_bool = (p) => this.random_dec() < p;
	// Choose random item from array
	random_choice = (list) => list[this.random_int(0, list.length - 1)];
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

// Definitions ===========================================================
({sin, cos, imul, PI} = Math);
TAU = PI * 2;
F = (N, f) => [...Array(N)].map((_, i) => f(i)); // for loop / map / list function

// A seeded PRNG =========================================================
//seed = 'das9d7as9d7as'; // random seed]
//seed = Math.random() * 2 ** 32;

seed = rand256.random_int(1, 100000);

S = Uint32Array.of(9, 7, 5, 3); // PRNG state
R = (a = 1) =>
	a *
	((a = S[3]),
	(S[3] = S[2]),
	(S[2] = S[1]),
	(a ^= a << 11),
	(S[0] ^= a ^ (a >>> 8) ^ ((S[1] = S[0]) >>> 19)),
	S[0] / 2 ** 32); // random function
[...(seed + 'ThxPiter')].map((c) => R((S[3] ^= c.charCodeAt() * 23205))); // seeding the random function

// general noise definitions =============================================
KNUTH = 0x9e3779b1; // prime number close to PHI * 2 ** 32
NSEED = R(2 ** 32); // noise seed, random 32 bit integer
// 3d noise grid function
ri = (i, j, k) => (
	(i = imul((((i & 1023) << 20) | ((j & 1023) << 10) | ((i ^ j ^ k) & 1023)) ^ NSEED, KNUTH)),
	(i <<= 3 + (i >>> 29)),
	(i >>> 1) / 2 ** 31 - 0.5
);

// 3D value noise function ===============================================
no = F(99, (_) => R(1024)); // random noise offsets

n3 = (
	x,
	y,
	z,
	s,
	i, // (x,y,z) = coordinate, s = scale, i = noise offset index
	xi = floor((x = x * s + no[(i *= 3)])), // (xi,yi,zi) = integer coordinates
	yi = floor((y = y * s + no[i + 1])),
	zi = floor((z = z * s + no[i + 2]))
) => (
	(x -= xi),
	(y -= yi),
	(z -= zi), // (x,y,z) are now fractional parts of coordinates
	(x *= x * (3 - 2 * x)), // smoothstep polynomial (comment out if true linear interpolation is desired)
	(y *= y * (3 - 2 * y)), // this is like an easing function for the fractional part
	(z *= z * (3 - 2 * z)),
	// calculate the interpolated value
	ri(xi, yi, zi) * (1 - x) * (1 - y) * (1 - z) +
		ri(xi, yi, zi + 1) * (1 - x) * (1 - y) * z +
		ri(xi, yi + 1, zi) * (1 - x) * y * (1 - z) +
		ri(xi, yi + 1, zi + 1) * (1 - x) * y * z +
		ri(xi + 1, yi, zi) * x * (1 - y) * (1 - z) +
		ri(xi + 1, yi, zi + 1) * x * (1 - y) * z +
		ri(xi + 1, yi + 1, zi) * x * y * (1 - z) +
		ri(xi + 1, yi + 1, zi + 1) * x * y * z
);

// 2D value noise function ===============================================
na = F(99, (_) => R(TAU)); // random noise angles
ns = na.map(sin);
nc = na.map(cos); // sin and cos of those angles
nox = F(99, (_) => R(1024)); // random noise x offset
noy = F(99, (_) => R(1024)); // random noise y offset

n2 = (
	x,
	y,
	s,
	i,
	c = nc[i] * s,
	n = ns[i] * s,
	xi = floor((([x, y] = [x * c + y * n + nox[i], y * c - x * n + noy[i]]), x)),
	yi = floor(y) // (x,y) = coordinate, s = scale, i = noise offset index
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

// the point of all the previous code is that now you have a very
// fast value noise function called nz(x,y,s,i). It has four parameters:
// x -- the x coordinate
// y -- the y coordinate
// s -- the scale (simply multiplies x and y by s)
// i -- the noise index, you get 99 different random noises! (but you
//      can increase this number by changing the 99s in the code above)
//      each of the 99 noises also has a random rotation which increases
//      the "randomness" if you add many together
//
// ohh also important to mention that it returns smooth noise values
// between -.5 and .5

function oct1(x, y, s, i) {
	// this function adds together 1 noise, in "octaves". This means
	// it adds the first noise normally
	return n2(x, y, s, i);
	// the result of this is that you get a better quality "cloudy" kind
	// of noise, often called fBm ("fractal Brownian motion"). It is also
	// often confused with Perlin noise but it's not.
}

function oct2(x, y, s, i) {
	// this function adds together 2 noises, in "octaves". This means
	// it adds the first noise normally, and the second noise has double the scale but half the amplitude
	i *= 2; // multiply the noise index by 2 because we use two noises
	return n2(x, y, s, i) + n2(x, y, s * 2, i + 1) / 2;
	// the result of this is that you get a better quality "cloudy" kind
	// of noise, often called fBm ("fractal Brownian motion"). It is also
	// often confused with Perlin noise but it's not.
}

function oct3(x, y, s, i) {
	// this function adds together 3 noises, in "octaves". This means
	// it adds the first noise normally, the second noise has double the scale but half the amplitude, and the third noise has four times the scale and a quarter of the amplitude (if you want to add more it would be 8, 16, 32, etc)
	i *= 3; // multiply the noise index by 3 because we use three noises
	return n2(x, y, s, i) + n2(x, y, s * 2, i + 1) / 2 + n2(x, y, s * 4, i + 2) / 4;
	// the result of this is that you get a better quality "cloudy" kind
	// of noise, often called fBm ("fractal Brownian motion"). It is also
	// often confused with Perlin noise but it's not.
}

function oct4(x, y, s, i) {
	// this function adds together 3 noises, in "octaves". This means
	// it adds the first noise normally, the second noise has double the scale but half the amplitude, and the third noise has four times the scale and a quarter of the amplitude (if you want to add more it would be 8, 16, 32, etc)
	i *= 4; // multiply the noise index by 3 because we use three noises
	return n2(x, y, s, i) + n2(x, y, s * 2, i + 1) / 2 + n2(x, y, s * 4, i + 2) / 4 + n2(x, y, s * 8, i + 3) / 8;
	// the result of this is that you get a better quality "cloudy" kind
	// of noise, often called fBm ("fractal Brownian motion"). It is also
	// often confused with Perlin noise but it's not.
}

function oct5(x, y, s, i) {
	// this function adds together 3 noises, in "octaves". This means
	// it adds the first noise normally, the second noise has double the scale but half the amplitude, and the third noise has four times the scale and a quarter of the amplitude (if you want to add more it would be 8, 16, 32, etc)
	i *= 5; // multiply the noise index by 3 because we use three noises
	return (
		n2(x, y, s, i) +
		n2(x, y, s * 2, i + 1) / 2 +
		n2(x, y, s * 4, i + 2) / 4 +
		n2(x, y, s * 8, i + 3) / 8 +
		n2(x, y, s * 16, i + 4) / 16
	);
	// the result of this is that you get a better quality "cloudy" kind
	// of noise, often called fBm ("fractal Brownian motion"). It is also
	// often confused with Perlin noise but it's not.
}

function oct6(x, y, s, i) {
	// this function adds together 3 noises, in "octaves". This means
	// it adds the first noise normally, the second noise has double the scale but half the amplitude, and the third noise has four times the scale and a quarter of the amplitude (if you want to add more it would be 8, 16, 32, etc)
	i *= 6; // multiply the noise index by 3 because we use three noises
	return (
		n2(x, y, s, i) +
		n2(x, y, s * 2, i + 1) / 2 +
		n2(x, y, s * 4, i + 2) / 4 +
		n2(x, y, s * 8, i + 3) / 8 +
		n2(x, y, s * 16, i + 4) / 16 +
		n2(x, y, s * 32, i + 5) / 32
	);
	// the result of this is that you get a better quality "cloudy" kind
	// of noise, often called fBm ("fractal Brownian motion"). It is also
	// often confused with Perlin noise but it's not.
}
// if cmd + s is pressed, save the canvas'
function keyPressed() {
	if (key == 's' && (keyIsDown(91) || keyIsDown(93))) {
		saveArtwork();
		// prevent the browser from saving the page
		return false;
	}
}

// make a function to save the canvas as a png file with the git branch name and a timestamp
function saveArtwork() {
	var dayoftheweek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
	var monthoftheyear = [
		'january',
		'february',
		'march',
		'april',
		'may',
		'june',
		'july',
		'august',
		'september',
		'october',
		'november',
		'december',
	];
	var d = new Date();
	var datestring =
		d.getDate() +
		'_' +
		`${d.getMonth() + 1}` +
		'_' +
		d.getFullYear() +
		'_' +
		`${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`;
	var fileName = datestring + '.png';

	save(fileName);
	console.log('saved ' + fileName);
}

const mapValue = (v, cl, cm, tl, th, c) =>
	c ? Math.min(Math.max(((v - cl) / (cm - cl)) * (th - tl) + tl, tl), th) : ((v - cl) / (cm - cl)) * (th - tl) + tl;

let clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
let smoothstep = (a, b, x) => (((x -= a), (x /= b - a)) < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x));
let mix = (a, b, p) => a + p * (b - a);

function setup() {
	var ua = window.navigator.userAgent;
	var iOS = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i);
	var webkit = !!ua.match(/WebKit/i);
	var iOSSafari = iOS && webkit && !ua.match(/CriOS/i);

	// if Safari mobile or any smartphone browser, use pixelDensity(0.5) to make the canvas bigger, else use pixelDensity(3.0)
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

	let palette = inputData['colArr'];
	console.log(inputData);
	console.log(inputData['colArr']);
	console.log(palette);

	let cellSize = inputData['cellSizeArr'];

	// Calculate the number of cells that can fit in the screen according to cellSize
	let cellCountX = floor(width / cellSize);
	let cellCountY = floor(height / cellSize);

	// Adjust cellWidth and cellHeight to fit the cells perfectly within the canvas
	let cellWidth = width / cellCountX;
	let cellHeight = height / cellCountY;

	let margin = -1;

	// create a grid of cells that fill the sreen and is relative to the width and height of the screen
	//noiseDetail(5, 0.55);

	let grid = drawNoise(cellCountX, cellCountY, cellWidth, cellHeight, margin, inc, palette);

	let interval = setInterval(() => {
		let result = grid.next();
		if (result.done) {
			// stop the interval
			window.rendered = c.canvas;
			clearInterval(interval);
		}
	}, 0);

	// make a bleed around the canvas that match the cellWidth and cellHeight
	let bleed = cellWidth * 0;
	noFill();
	stroke(0, 0, 10, 100);
	strokeWeight(bleed);
	rect(width / 2, height / 2, width - bleed, height - bleed);
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

function draw() {
	/* 	inc = 0.002;

	for (let i = 0; i < cells.length; i++) {
		cells[i].display(inc);
	} */

	noLoop();
}
class Cell {
	constructor(x, y, w, h, amp1, amp2, scale1, scale2, margin, xoff, yoff, inc, palette) {
		// Module ready to be built
		this.x = x + w / 2;
		this.y = y + h / 2;
		//this.margin = w * random([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
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
	display(inc) {
		// Module ready to be built

		this.createNoise();

		noStroke();
		fill(this.hue, this.sat, this.bright, 100);
		rect(this.x, this.y, this.w, this.h);

		//this.xoff += inc;
		//this.yoff += inc;
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
		switch (this.oct) {
			case 1:
				oct = oct1;
				break;
			case 2:
				oct = oct2;
				break;
			case 3:
				oct = oct3;
				break;
			case 4:
				oct = oct4;
				break;
			case 5:
				oct = oct5;
				break;
			case 6:
				oct = oct6;
				break;
		}

		dx = oct(nx, ny, sc, 3);
		dy = oct(ny, nx, sc2, 1);
		nx += dx * a;
		ny += dy * a2;

		dx = oct(nx, ny, sc, 2);
		dy = oct(ny, nx, sc2, 0);
		nx += dx * a2;
		ny += dy * a2;

		dx = oct(nx, ny, sc, 1);
		dy = oct(ny, nx, sc2, 2);
		nx += dx * a;
		ny += dy * a2;

		let un = oct(nx, ny, sc, 1);
		let vn = oct(nx, ny, sc2, 3);

		let u = map(un, -0.5, 0.5, -0.5, 0.5);
		let v = map(vn, -0.5, 0.5, -0.5, 0.5);
		this.index = int(map(u + v, -1, 1, 0, this.biomes.length - 1, true));

		this.hue = this.biomes[this.index][0];
		this.sat = this.biomes[this.index][1];
		this.bright = this.biomes[this.index][2];
	}
}

new p5();
