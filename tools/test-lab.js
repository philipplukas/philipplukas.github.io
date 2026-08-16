/* Regression test for the acoustics in assets/js/lab.js.
 *
 *     node tools/test-lab.js
 *
 * The figures in the "Speech from first principles" posts quote specific
 * numbers — 500/1500/2500 Hz for a uniform tract, a 60 Hz first-formant
 * bandwidth, -12 dB/octave at the glottis — and those numbers are only
 * honest if the code actually produces them. Reference values come from an
 * independent NumPy implementation: a time-domain Kelly-Lochbaum lattice and
 * a frequency-domain impedance recursion, which agree with each other to
 * better than 0.5%.
 *
 * lab.js is a browser script, so window/document are stubbed and it is
 * eval'd rather than required.
 */
const fs = require('fs');
const path = require('path');

global.window = {};
global.document = { readyState: 'complete', addEventListener() {} };
eval(fs.readFileSync(
  path.join(__dirname, '..', 'assets', 'js', 'lab.js'), 'utf8'));
const Lab = window.Lab;

let failures = 0;
function check(label, got, want, tol) {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) failures++;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'}  ${label}: got ${got.toFixed(1)}, want ${want.toFixed(1)} (±${tol})`);
}

const C = Lab.C, FS = Lab.FS;
const DX = C / (2 * FS);
const L_TOTAL = 44 * DX;

console.log('\n1. Analytic resonances of a uniform 17.46 cm tube');
const uni = Lab.resonances([[L_TOTAL, 5.0]], 4);
[501.1, 1503.4, 2505.7, 3508.0].forEach((want, i) =>
  check(`F${i + 1}`, uni[i], want, 2));

console.log('\n2. Two-tube geometries vs the Python lattice');
[[8.73, 1.0, 7.0, [774, 1230, 2779]],
 [8.73, 7.0, 1.0, [228, 1776, 2233]],
 [4.00, 1.0, 8.0, [624, 1788, 2332]],
 [6.00, 8.0, 1.0, [225, 1518, 2764]]].forEach(([l1, a1, a2, want]) => {
  const r = Lab.resonances([[l1, a1], [L_TOTAL - l1, a2]], 3);
  want.forEach((w, i) => check(`l1=${l1} A1=${a1} A2=${a2}  F${i + 1}`, r[i], w, 12));
});

console.log('\n3. Time-domain Kelly-Lochbaum lattice, uniform tube');
const areas = new Array(44).fill(5.0);
const tract = new Lab.Tract(areas, { rGlottis: 0.97, rLips: -0.85 });
const ir = tract.impulseResponse(8192);
const db = Lab.spectrumDb(ir, 16384);
const peaks = Lab.spectralPeaks(db, FS, 16384, { minProminence: 3, fMax: 4000 });
console.log('   peaks:', peaks.slice(0, 4).map(f => f.toFixed(1)).join(', '));
[501.1, 1503.4, 2505.7, 3508.0].forEach((want, i) =>
  check(`lattice F${i + 1}`, peaks[i], want, 12));

console.log('\n4. F1 bandwidth from the reflection losses');
let iPeak = 0;
const binHz = FS / 16384;
for (let i = 1; i < db.length; i++) {
  if (i * binHz > 250 && i * binHz < 750 && db[i] > db[iPeak]) iPeak = i;
}
let lo = iPeak, hi = iPeak;
while (lo > 0 && db[lo] > db[iPeak] - 3) lo--;
while (hi < db.length - 1 && db[hi] > db[iPeak] - 3) hi++;
const bw = (hi - lo) * binHz;
const predicted = -2 * 501.1 * Math.log(0.97 * 0.85) / Math.PI;
console.log(`   measured B1 = ${bw.toFixed(0)} Hz, predicted ${predicted.toFixed(0)} Hz`);
check('B1', bw, predicted, 12);

console.log('\n5. Fitted vowel shapes reproduce measured formants');
const VOWELS = {
  'i': [[8.00, 2], [5.00, 0.2], [3.46, 3], [1.00, 8]],
  'ɑ': [[6.00, 1], [1.00, 0.3], [9.46, 8], [1.00, 8]],
  'u': [[8.00, 6], [1.50, 0.8], [6.96, 6], [1.00, 0.5]],
  'æ': [[9.00, 1], [4.00, 1.2], [3.46, 6], [1.00, 8]],
};
const PYTHON = { 'i': [262, 2108], 'ɑ': [720, 1092], 'u': [308, 872], 'æ': [661, 1723] };
for (const [v, segs] of Object.entries(VOWELS)) {
  const r = Lab.resonances(segs, 3);
  PYTHON[v].forEach((w, i) => check(`/${v}/ F${i + 1}`, r[i], w, 15));
}

console.log('\n6. Spectral tilt of the source, and of the source after lip radiation');
{
  const N = 16384, f0 = 100;              // integer period, so harmonics land on bins
  const binHz = FS / N;
  const tilt = (signal) => {
    const db = Lab.spectrumDb(signal, N);
    const pts = [];
    for (let k = 1; k * f0 < 6000; k++) {
      const b = Math.round(k * f0 / binHz);
      let peak = -999;
      for (let j = b - 2; j <= b + 2; j++) peak = Math.max(peak, db[j]);
      if (k * f0 > 300) pts.push([Math.log2(k * f0), peak]);
    }
    const n = pts.length;
    const sx = pts.reduce((a, p) => a + p[0], 0);
    const sy = pts.reduce((a, p) => a + p[1], 0);
    const sxx = pts.reduce((a, p) => a + p[0] * p[0], 0);
    const sxy = pts.reduce((a, p) => a + p[0] * p[1], 0);
    return (n * sxy - sx * sy) / (n * sxx - sx * sx);
  };
  const g = Lab.glottalWave(N, f0, 0.56);
  check('glottal source, dB/octave', tilt(g), -12, 1.5);
  check('after lip radiation, dB/octave', tilt(Lab.radiate(g)), -6, 1.5);
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECKS FAILED'}\n`);
process.exit(failures ? 1 : 0);
