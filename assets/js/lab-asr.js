/* lab-asr.js — interactive figures for
 * "Running the tube backwards" (Speech from first principles, part 2).
 *
 * Every waveform these figures analyse is synthesised on the spot by the
 * vocal-tract model from part 1, so there are no audio assets and the "true"
 * answer — the actual transfer function that produced the sound — is always
 * available to check the recovered one against. That is the whole reason the
 * figures can show you when a front end is lying.
 */
(function () {
  'use strict';

  var Lab = window.Lab;
  if (!Lab) return;

  var FS = Lab.FS;
  var N = 44;

  var VOWEL_SHAPES = {
    'i': [[8.00, 2], [5.00, 0.2], [3.46, 3], [1.00, 8]],
    'ɛ': [[7.50, 1], [5.00, 0.5], [3.96, 4], [1.00, 8]],
    'æ': [[9.00, 1], [4.00, 1.2], [3.46, 6], [1.00, 8]],
    'ɑ': [[6.00, 1], [1.00, 0.3], [9.46, 8], [1.00, 8]],
    'u': [[8.00, 6], [1.50, 0.8], [6.96, 6], [1.00, 0.5]]
  };

  var FREQ_TICKS = [100, 200, 500, 1000, 2000, 5000];
  var fmtFreq = function (f) { return f >= 1000 ? (f / 1000) + 'k' : String(f); };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function readout(host, entries) {
    host.innerHTML = '';
    entries.forEach(function (e) {
      var span = el('span');
      span.appendChild(el('b', null, e[0]));
      span.appendChild(el('strong', null, e[1]));
      host.appendChild(span);
    });
  }

  function labelled(label, node) {
    var wrap = el('div', 'lab-control');
    var head = el('span', 'lab-control__head');
    head.appendChild(el('span', 'lab-control__label', label));
    wrap.appendChild(head);
    wrap.appendChild(node);
    return wrap;
  }

  /* A vowel from part 1's tract model, with the tract's own transfer function
   * returned alongside so figures can plot the truth next to the estimate. */
  function vowelSignal(vowel, f0, seconds) {
    var areas = Lab.sections(VOWEL_SHAPES[vowel], N);
    return {
      samples: Lab.synth(areas, { f0: f0, duration: seconds || 0.5 }),
      areas: areas,
      truth: Lab.resonances(VOWEL_SHAPES[vowel], 4)
    };
  }

  /* True log-magnitude response of the tract, for overlaying on estimates. */
  function trueEnvelope(areas, nfft) {
    var ir = new Lab.Tract(areas).impulseResponse(2048);
    ir = Lab.radiate(ir);
    var db = Lab.spectrumDb(ir, nfft);
    return db;
  }

  // -------------------------------------------------------------- 1. frames

  /* Windowing: the trade-off between seeing harmonics and seeing formants. */
  function initFrames(root) {
    var state = { windowMs: 25, f0: 120, vowel: 'ɑ' };
    var out = root.querySelector('[data-readout]');
    var api, signal;

    function regenerate() { signal = vowelSignal(state.vowel, state.f0, 0.4); }
    regenerate();

    var NFFT = 8192;

    function draw() {
      var t = api.plots.wave.t;
      var win = Math.max(8, Math.round(state.windowMs * FS / 1000));
      var start = Math.floor(signal.samples.length / 2) - Math.floor(win / 2);

      // ---- waveform with the analysis window marked
      var wp = api.plots.wave;
      var showMs = 80;
      var showN = Math.round(showMs * FS / 1000);
      var from = Math.floor(signal.samples.length / 2) - Math.floor(showN / 2);
      wp.xMin = 0; wp.xMax = showMs; wp.yMin = -1.05; wp.yMax = 1.05;
      wp.clear();

      // highlight band for the window
      var c = wp.ctx;
      var wStartMs = (start - from) * 1000 / FS;
      var wEndMs = wStartMs + state.windowMs;
      c.save();
      c.fillStyle = t.accentWash;
      c.fillRect(wp.px(Math.max(0, wStartMs)), wp.pad.top,
                 wp.px(Math.min(showMs, wEndMs)) - wp.px(Math.max(0, wStartMs)),
                 wp.h - wp.pad.top - wp.pad.bottom);
      c.restore();

      wp.frame([0, 20, 40, 60, 80], [-1, 0, 1], 'time (ms)', null);
      var pts = [];
      for (var i = 0; i < showN; i += 2) {
        pts.push([i * 1000 / FS, signal.samples[from + i] || 0]);
      }
      wp.line(pts, t.inkFaint, 1);
      wp.vline(wStartMs, t.accent, null, { dash: [4, 3] });
      wp.vline(wEndMs, t.accent, null, { dash: [4, 3] });
      wp.text(showMs * 0.5, 0.92, state.windowMs.toFixed(0) + ' ms window',
              t.accentStrong, { align: 'center', weight: '600' });

      // ---- spectrum of the windowed segment
      var hann = Lab.hann(win);
      var frame = new Float64Array(win);
      for (i = 0; i < win; i++) frame[i] = (signal.samples[start + i] || 0) * hann[i];
      var db = Lab.spectrumDb(frame, NFFT);
      var binHz = FS / NFFT;

      var peak = -Infinity;
      for (i = 1; i * binHz <= 5000; i++) peak = Math.max(peak, db[i]);
      var spts = [];
      for (i = 1; i * binHz <= 5000; i++) spts.push([i * binHz, db[i] - peak]);

      var sp = api.plots.spectrum;
      sp.clear();
      sp.fillUnder(spts, t.accentWash);
      sp.frame(FREQ_TICKS, [-60, -45, -30, -15, 0], 'frequency (Hz)', 'dB', fmtFreq);
      signal.truth.slice(0, 3).forEach(function (f, k) {
        sp.vline(f, t['series' + (k + 1)], 'F' + (k + 1), { labelOffset: k * 14 });
      });
      sp.line(spts, t.accent, 1.75);

      var resolution = FS / win;                 // 1/T, the DFT bin spacing
      var resolved = state.f0 > 2 * resolution;
      readout(out, [
        ['window', state.windowMs.toFixed(0) + ' ms'],
        ['frequency resolution 1/T', resolution.toFixed(0) + ' Hz'],
        ['harmonic spacing f₀', state.f0.toFixed(0) + ' Hz'],
        ['harmonics resolved', resolved ? 'yes' : 'no — smeared into the envelope']
      ]);
    }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('wave', root.querySelector('[data-plot="wave"]'),
                  { height: 170, pad: { left: 40, right: 14, top: 12, bottom: 30 } });
        a.addPlot('spectrum', root.querySelector('[data-plot="spectrum"]'),
                  { height: 230, xLog: true, xMin: 90, xMax: 5000, yMin: -68, yMax: 8,
                    pad: { left: 46, right: 14, top: 14, bottom: 32 } });

        a.controls.appendChild(Lab.slider({
          label: 'window length', min: 2, max: 60, step: 1, value: state.windowMs,
          format: function (v) { return v.toFixed(0) + ' ms'; }
        }, function (v) { state.windowMs = v; draw(); }).el);

        a.controls.appendChild(Lab.slider({
          label: 'pitch f₀', min: 80, max: 300, step: 1, value: state.f0, unit: ' Hz'
        }, function (v) { state.f0 = v; regenerate(); draw(); }).el);

        var vowels = Lab.segmented(
          Object.keys(VOWEL_SHAPES).map(function (v) { return { label: v, value: v }; }),
          state.vowel,
          function (v) { state.vowel = v; regenerate(); draw(); });
        a.controls.appendChild(labelled('vowel', vowels.el));
      }
    });
  }

  // ------------------------------------------------------------ 2. cepstrum

  /* Real cepstrum. log|X| is real and even for a real signal, so its DFT is
   * real and even too — one more forward FFT gives the cepstrum directly, no
   * separate inverse transform needed. */
  function cepstrumOf(frame, nfft) {
    var re = new Float64Array(nfft), im = new Float64Array(nfft), i;
    for (i = 0; i < Math.min(frame.length, nfft); i++) re[i] = frame[i];
    Lab.fft(re, im);

    var logmag = new Float64Array(nfft);
    for (i = 0; i < nfft; i++) {
      logmag[i] = Math.log(Math.sqrt(re[i] * re[i] + im[i] * im[i]) + 1e-10);
    }

    var cr = Float64Array.from(logmag), ci = new Float64Array(nfft);
    Lab.fft(cr, ci);
    for (i = 0; i < nfft; i++) cr[i] /= nfft;
    return { logmag: logmag, ceps: cr };
  }

  /* Keep the first `keep` cepstral coefficients (and their mirror) and
   * transform back: the low-quefrency part of the cepstrum is the spectral
   * envelope, which is the vocal tract. */
  function lifter(ceps, keep, nfft) {
    var re = new Float64Array(nfft), im = new Float64Array(nfft), i;
    re[0] = ceps[0];
    for (i = 1; i <= keep && i < nfft / 2; i++) {
      re[i] = ceps[i];
      re[nfft - i] = ceps[nfft - i];
    }
    Lab.fft(re, im);
    return re;             // real, even -> the smoothed log magnitude
  }

  function initCepstrum(root) {
    var state = { quefrencyMs: 2.0, f0: 120, vowel: 'ɑ' };
    var out = root.querySelector('[data-readout]');
    var api, signal;
    var NFFT = 4096;

    function regenerate() { signal = vowelSignal(state.vowel, state.f0, 0.4); }
    regenerate();

    function analyse() {
      var win = Math.round(0.030 * FS);
      var start = Math.floor(signal.samples.length / 2);
      var hann = Lab.hann(win);
      var frame = new Float64Array(win);
      for (var i = 0; i < win; i++) frame[i] = (signal.samples[start + i] || 0) * hann[i];

      var cep = cepstrumOf(frame, NFFT);
      var keep = Math.max(1, Math.round(state.quefrencyMs * FS / 1000));
      var env = lifter(cep.ceps, keep, NFFT);
      return { cep: cep, env: env, keep: keep };
    }

    function draw() {
      var t = api.plots.spectrum.t;
      var a = analyse();
      var binHz = FS / NFFT;
      var i;

      // ---- log spectrum and the liftered envelope, both in dB
      var toDb = function (ln) { return ln * 20 / Math.LN10; };
      var raw = [], env = [], peak = -Infinity;
      for (i = 1; i * binHz <= 5000; i++) peak = Math.max(peak, toDb(a.cep.logmag[i]));
      for (i = 1; i * binHz <= 5000; i++) {
        raw.push([i * binHz, toDb(a.cep.logmag[i]) - peak]);
        env.push([i * binHz, toDb(a.env[i]) - peak]);
      }

      var sp = api.plots.spectrum;
      sp.clear();
      sp.frame(FREQ_TICKS, [-60, -45, -30, -15, 0], 'frequency (Hz)', 'dB', fmtFreq);
      signal.truth.slice(0, 3).forEach(function (f, k) {
        sp.vline(f, t.rule, null, { width: 1 });
      });
      sp.line(raw, t.inkFaint, 1);
      sp.line(env, t.series2, 2.5);

      // Direct labels rather than a legend box: two series, and a corner
      // legend collides with the frequency axis at this width.
      var valueAt = function (series, hz) {
        var idx = Math.max(0, Math.min(series.length - 1, Math.round(hz / binHz) - 1));
        return series[idx][1];
      };
      sp.text(1500, valueAt(env, 1500), 'envelope', t.series2,
              { weight: '600', align: 'center', dy: -10 });
      sp.text(3400, valueAt(raw, 3400), 'spectrum', t.inkFaint,
              { weight: '600', align: 'center', dy: -12 });

      // ---- the cepstrum
      var cp = api.plots.cepstrum;
      var maxMs = 12;
      var cpts = [], cmax = 0;
      var nMax = Math.round(maxMs * FS / 1000);
      for (i = 1; i < nMax; i++) cmax = Math.max(cmax, Math.abs(a.cep.ceps[i]));
      for (i = 1; i < nMax; i++) cpts.push([i * 1000 / FS, a.cep.ceps[i] / cmax]);

      cp.xMin = 0; cp.xMax = maxMs; cp.yMin = -1.1; cp.yMax = 1.15;
      cp.clear();
      cp.frame([0, 2, 4, 6, 8, 10, 12], [-1, 0, 1], 'quefrency (ms)', null);
      cp.line(cpts, t.accent, 1.5);

      // the pitch peak: the largest cepstral value above 2.5 ms (400 Hz)
      var pitchIdx = 0, pitchVal = -Infinity;
      var lo = Math.round(0.0025 * FS), hi = Math.round(0.012 * FS);
      for (i = lo; i < hi; i++) {
        if (a.cep.ceps[i] > pitchVal) { pitchVal = a.cep.ceps[i]; pitchIdx = i; }
      }
      var pitchMs = pitchIdx * 1000 / FS;
      cp.vline(pitchMs, t.series3, 'pitch', { labelOffset: 0 });
      cp.vline(state.quefrencyMs, t.series2, 'lifter', { labelOffset: 14 });

      // shade the region kept by the lifter
      var c = cp.ctx;
      c.save();
      c.fillStyle = t.accentWash;
      c.globalAlpha = 0.55;
      c.fillRect(cp.px(0), cp.pad.top, cp.px(state.quefrencyMs) - cp.px(0),
                 cp.h - cp.pad.top - cp.pad.bottom);
      c.restore();

      /* Deliberately no "estimated F1/F2" here. Pitch falls out of the
       * cepstrum exactly, but pulling formant *numbers* off the envelope is a
       * separate and much less reliable problem — for /u/, where F1 and F2 sit
       * close together on a steep rolloff, naive peak-picking on this curve
       * gets it wrong more often than right. Showing a number that is quietly
       * garbage would be worse than showing none. */
      readout(out, [
        ['lifter cutoff', state.quefrencyMs.toFixed(2) + ' ms (' + a.keep + ' coefficients)'],
        ['envelope detail', '~' + (1000 / state.quefrencyMs).toFixed(0) + ' Hz'],
        ['pitch peak at', pitchMs.toFixed(2) + ' ms'],
        ['implied f₀', (1000 / pitchMs).toFixed(0) + ' Hz (true ' + state.f0 + ')'],
        ['true F1/F2', signal.truth[0].toFixed(0) + ' / ' + signal.truth[1].toFixed(0) + ' Hz']
      ]);
    }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('spectrum', root.querySelector('[data-plot="spectrum"]'),
                  { height: 230, xLog: true, xMin: 90, xMax: 5000, yMin: -70, yMax: 10,
                    pad: { left: 46, right: 14, top: 14, bottom: 32 } });
        a.addPlot('cepstrum', root.querySelector('[data-plot="cepstrum"]'),
                  { height: 190, pad: { left: 46, right: 14, top: 14, bottom: 32 } });

        a.controls.appendChild(Lab.slider({
          label: 'lifter cutoff', min: 0.2, max: 8, step: 0.05, value: state.quefrencyMs,
          format: function (v) { return v.toFixed(2) + ' ms'; }
        }, function (v) { state.quefrencyMs = v; draw(); }).el);

        a.controls.appendChild(Lab.slider({
          label: 'pitch f₀', min: 80, max: 300, step: 1, value: state.f0, unit: ' Hz'
        }, function (v) { state.f0 = v; regenerate(); draw(); }).el);

        var vowels = Lab.segmented(
          Object.keys(VOWEL_SHAPES).map(function (v) { return { label: v, value: v }; }),
          state.vowel,
          function (v) { state.vowel = v; regenerate(); draw(); });
        a.controls.appendChild(labelled('vowel', vowels.el));
      }
    });
  }

  // ------------------------------------------------------------------ 3. mel

  function hzToMel(f) { return 2595 * Math.log10(1 + f / 700); }
  function melToHz(m) { return 700 * (Math.pow(10, m / 2595) - 1); }

  /* Standard triangular filterbank, equally spaced on the mel scale. */
  function melBank(nFilters, fMin, fMax, nfft) {
    var mLo = hzToMel(fMin), mHi = hzToMel(fMax);
    var points = [];
    for (var i = 0; i < nFilters + 2; i++) {
      points.push(melToHz(mLo + (mHi - mLo) * i / (nFilters + 1)));
    }
    return points;                       // filter k spans points[k]..points[k+2]
  }

  function initMel(root) {
    var state = { nFilters: 26, vowel: 'ɑ', f0: 120 };
    var out = root.querySelector('[data-readout]');
    var api, signal;
    var NFFT = 2048;

    function regenerate() { signal = vowelSignal(state.vowel, state.f0, 0.3); }
    regenerate();

    function spectrum() {
      var win = Math.round(0.025 * FS);
      var start = Math.floor(signal.samples.length / 2);
      var hann = Lab.hann(win);
      var frame = new Float64Array(win);
      for (var i = 0; i < win; i++) frame[i] = (signal.samples[start + i] || 0) * hann[i];
      var re = new Float64Array(NFFT), im = new Float64Array(NFFT);
      for (i = 0; i < win; i++) re[i] = frame[i];
      Lab.fft(re, im);
      var power = new Float64Array(NFFT / 2);
      for (i = 0; i < NFFT / 2; i++) power[i] = re[i] * re[i] + im[i] * im[i];
      return power;
    }

    function draw() {
      var t = api.plots.bank.t;
      var power = spectrum();
      var binHz = FS / NFFT;
      var edges = melBank(state.nFilters, 50, 8000, NFFT);
      var i, k;

      // ---- spectrum with the triangles on top
      var bp = api.plots.bank;
      var peak = -Infinity, pts = [];
      for (i = 1; i * binHz <= 8000; i++) {
        peak = Math.max(peak, 10 * Math.log10(power[i] + 1e-12));
      }
      for (i = 1; i * binHz <= 8000; i++) {
        pts.push([i * binHz, 10 * Math.log10(power[i] + 1e-12) - peak]);
      }
      bp.clear();
      bp.frame([100, 200, 500, 1000, 2000, 5000], [-60, -40, -20, 0],
               'frequency (Hz)', 'dB', fmtFreq);
      bp.line(pts, t.inkFaint, 1);

      var c = bp.ctx;
      c.save();
      for (k = 0; k < state.nFilters; k++) {
        c.beginPath();
        c.moveTo(bp.px(Math.max(edges[k], bp.xMin)), bp.py(bp.yMin));
        c.lineTo(bp.px(edges[k + 1]), bp.py(bp.yMax * 0.75));
        c.lineTo(bp.px(Math.min(edges[k + 2], bp.xMax)), bp.py(bp.yMin));
        c.strokeStyle = k % 2 ? t.accent : t.series2;
        c.globalAlpha = 0.75;
        c.lineWidth = 1;
        c.stroke();
      }
      c.restore();

      // ---- the mel energies
      var energies = [];
      for (k = 0; k < state.nFilters; k++) {
        var sum = 0;
        var b0 = Math.floor(edges[k] / binHz), b2 = Math.ceil(edges[k + 2] / binHz);
        for (i = Math.max(1, b0); i <= Math.min(b2, NFFT / 2 - 1); i++) {
          var f = i * binHz, w = 0;
          if (f >= edges[k] && f <= edges[k + 1]) {
            w = (f - edges[k]) / (edges[k + 1] - edges[k]);
          } else if (f > edges[k + 1] && f <= edges[k + 2]) {
            w = (edges[k + 2] - f) / (edges[k + 2] - edges[k + 1]);
          }
          sum += w * power[i];
        }
        energies.push(10 * Math.log10(sum + 1e-12));
      }
      var eMax = Math.max.apply(null, energies);

      var ep = api.plots.energies;
      ep.xMin = -0.5; ep.xMax = state.nFilters - 0.5;
      ep.yMin = -60; ep.yMax = 4;
      ep.clear();
      ep.frame([], [-60, -40, -20, 0], 'mel filter', 'dB', null);
      var cc = ep.ctx;
      cc.save();
      cc.fillStyle = t.accent;
      var barW = Math.max(2, (ep.w - ep.pad.left - ep.pad.right) / state.nFilters - 2);
      energies.forEach(function (e, idx) {
        var y = ep.py(Math.max(e - eMax, ep.yMin));
        cc.fillRect(ep.px(idx) - barW / 2, y, barW, ep.py(ep.yMin) - y);
      });
      cc.restore();

      // filter widths at two places, the point of the whole exercise
      var widthAt = function (hz) {
        for (var j = 0; j < state.nFilters; j++) {
          if (edges[j + 1] >= hz) return edges[j + 2] - edges[j];
        }
        return 0;
      };

      readout(out, [
        ['filters', String(state.nFilters)],
        ['width near 500 Hz', widthAt(500).toFixed(0) + ' Hz'],
        ['width near 4000 Hz', widthAt(4000).toFixed(0) + ' Hz'],
        ['ratio', (widthAt(4000) / widthAt(500)).toFixed(1) + '×'],
        ['numbers per frame', state.nFilters + ' instead of ' + (NFFT / 2)]
      ]);
    }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('bank', root.querySelector('[data-plot="bank"]'),
                  { height: 230, xLog: true, xMin: 90, xMax: 8000, yMin: -68, yMax: 8,
                    pad: { left: 46, right: 14, top: 14, bottom: 32 } });
        a.addPlot('energies', root.querySelector('[data-plot="energies"]'),
                  { height: 170, pad: { left: 46, right: 14, top: 14, bottom: 32 } });

        a.controls.appendChild(Lab.slider({
          label: 'number of filters', min: 8, max: 60, step: 1, value: state.nFilters
        }, function (v) { state.nFilters = v; draw(); }).el);

        var vowels = Lab.segmented(
          Object.keys(VOWEL_SHAPES).map(function (v) { return { label: v, value: v }; }),
          state.vowel,
          function (v) { state.vowel = v; regenerate(); draw(); });
        a.controls.appendChild(labelled('vowel', vowels.el));
      }
    });
  }

  // -------------------------------------------------------------- 4. viterbi

  /* A deterministic pseudo-random generator, so the trellis looks the same on
   * every redraw and every reader sees the figure the text describes. */
  function lcg(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  function initViterbi(root) {
    var STATES = ['k', 'æ', 't'];
    var T = 16;
    var state = { selfLoop: 0.6 };
    var out = root.querySelector('[data-readout]');
    var api;

    /* Emission log-probabilities: each state is genuinely most likely during
     * its own stretch, but with enough noise that the alignment is a real
     * decision rather than a lookup. */
    var EMIT = (function () {
      var rnd = lcg(20260811);
      var truth = [0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2];
      var m = [];
      for (var s = 0; s < STATES.length; s++) {
        m.push([]);
        for (var f = 0; f < T; f++) {
          var base = truth[f] === s ? 0.55 : 0.16;
          m[s].push(Math.max(0.01, base + (rnd() - 0.5) * 0.42));
        }
      }
      // normalise each frame to a distribution
      for (var f2 = 0; f2 < T; f2++) {
        var sum = 0;
        for (s = 0; s < STATES.length; s++) sum += m[s][f2];
        for (s = 0; s < STATES.length; s++) m[s][f2] /= sum;
      }
      return m;
    })();

    /* Left-to-right HMM: stay, or advance by one. Must start in state 0 and
     * finish in the last state. */
    function viterbi(selfLoop) {
      var S = STATES.length;
      var logStay = Math.log(selfLoop), logNext = Math.log(1 - selfLoop);
      var delta = [], psi = [], s, f;

      delta.push([]);
      for (s = 0; s < S; s++) {
        delta[0].push(s === 0 ? Math.log(EMIT[0][0]) : -Infinity);
      }
      for (f = 1; f < T; f++) {
        delta.push([]); psi.push([]);
        for (s = 0; s < S; s++) {
          var stay = delta[f - 1][s] + logStay;
          var adv = s > 0 ? delta[f - 1][s - 1] + logNext : -Infinity;
          var best = stay >= adv ? stay : adv;
          delta[f].push(best + Math.log(EMIT[s][f]));
          psi[f - 1].push(stay >= adv ? s : s - 1);
        }
      }
      var path = new Array(T);
      path[T - 1] = S - 1;
      for (f = T - 2; f >= 0; f--) path[f] = psi[f][path[f + 1]];
      return { path: path, score: delta[T - 1][S - 1] };
    }

    function draw() {
      var t = api.plots.trellis.t;
      var p = api.plots.trellis;
      var res = viterbi(state.selfLoop);
      var S = STATES.length;

      p.clear();
      var left = p.pad.left, right = p.w - p.pad.right;
      var top = p.pad.top, bottom = p.h - p.pad.bottom;
      var cw = (right - left) / T;
      var ch = (bottom - top) / S;
      var c = p.ctx;
      var font = getComputedStyle(document.body).fontFamily;

      // emission heat map — one hue, light to dark, which is what a magnitude
      // wants; never a rainbow
      for (var s = 0; s < S; s++) {
        for (var f = 0; f < T; f++) {
          var v = EMIT[s][f];
          c.save();
          c.globalAlpha = 0.12 + 0.8 * v;
          c.fillStyle = t.accent;
          c.fillRect(left + f * cw + 1, top + s * ch + 1, cw - 2, ch - 2);
          c.restore();
        }
        c.save();
        c.fillStyle = t.ink;
        c.font = '600 13px ' + font;
        c.textAlign = 'right';
        c.textBaseline = 'middle';
        c.fillText('/' + STATES[s] + '/', left - 10, top + (s + 0.5) * ch);
        c.restore();
      }

      // the decoded path
      c.save();
      c.strokeStyle = t.series2;
      c.lineWidth = 3;
      c.lineJoin = 'round';
      c.beginPath();
      res.path.forEach(function (s2, f2) {
        var x = left + (f2 + 0.5) * cw, y = top + (s2 + 0.5) * ch;
        f2 ? c.lineTo(x, y) : c.moveTo(x, y);
      });
      c.stroke();
      res.path.forEach(function (s2, f2) {
        c.beginPath();
        c.arc(left + (f2 + 0.5) * cw, top + (s2 + 0.5) * ch, 4.5, 0, 2 * Math.PI);
        c.fillStyle = t.series2;
        c.fill();
        c.strokeStyle = t.bg;
        c.lineWidth = 1.5;
        c.stroke();
      });
      c.restore();

      c.save();
      c.fillStyle = t.inkFaint;
      c.font = '11px ' + font;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      for (f = 0; f < T; f += 3) {
        c.fillText(String(f * 10) + ' ms', left + (f + 0.5) * cw, bottom + 8);
      }
      c.restore();

      var counts = [0, 0, 0];
      res.path.forEach(function (s3) { counts[s3]++; });
      readout(out, [
        ['self-loop probability', state.selfLoop.toFixed(2)],
        ['segmentation', counts.map(function (n, i) {
          return '/' + STATES[i] + '/ ' + (n * 10) + ' ms';
        }).join('  ')],
        ['log likelihood', res.score.toFixed(2)]
      ]);
    }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('trellis', root.querySelector('[data-plot="trellis"]'),
                  { height: 220, pad: { left: 56, right: 16, top: 16, bottom: 30 } });
        a.controls.appendChild(Lab.slider({
          label: 'self-loop probability', min: 0.05, max: 0.95, step: 0.01,
          value: state.selfLoop,
          format: function (v) { return v.toFixed(2); }
        }, function (v) { state.selfLoop = v; draw(); }).el);
      }
    });
  }

  // ------------------------------------------------------------------ 5. CTC

  function initCtc(root) {
    var TARGET = 'cat';
    var state = { frames: 8, blankBias: 0 };
    var out = root.querySelector('[data-readout]');
    var api;

    /* Number of frame-level alignments that collapse to TARGET, by the CTC
     * forward recursion with every allowed transition counted as 1. */
    function countAlignments(T, target) {
      var ext = ['-'];
      for (var i = 0; i < target.length; i++) { ext.push(target[i]); ext.push('-'); }
      var S = ext.length;
      var a = new Array(S).fill(0);
      a[0] = 1; a[1] = 1;
      for (var t = 1; t < T; t++) {
        var b = new Array(S).fill(0);
        for (var s = 0; s < S; s++) {
          var v = a[s];
          if (s > 0) v += a[s - 1];
          // skip over a blank, but only between two *different* labels
          if (s > 1 && ext[s] !== '-' && ext[s] !== ext[s - 2]) v += a[s - 2];
          b[s] = v;
        }
        a = b;
      }
      return a[S - 1] + a[S - 2];
    }

    /* A plausible per-frame distribution over {blank, c, a, t}: each letter
     * peaks in its own third, blanks fill the gaps, and the bias slider
     * scales the blank column. */
    function posteriors() {
      var labels = ['-'].concat(TARGET.split(''));
      var T = state.frames;
      var rnd = lcg(4242);
      var m = [];
      for (var t = 0; t < T; t++) {
        var col = [];
        var which = Math.min(TARGET.length - 1, Math.floor(t * TARGET.length / T));
        var atEdge = (t * TARGET.length / T) % 1 < 0.34;
        for (var l = 0; l < labels.length; l++) {
          var p;
          if (l === 0) p = (atEdge ? 0.45 : 0.2) * Math.exp(state.blankBias);
          else p = (l - 1 === which ? 0.7 : 0.08) + rnd() * 0.05;
          col.push(p);
        }
        var sum = col.reduce(function (x, y) { return x + y; }, 0);
        m.push(col.map(function (v) { return v / sum; }));
      }
      return { labels: labels, m: m };
    }

    function collapse(seq) {
      var out2 = '', prev = null;
      seq.forEach(function (ch) {
        if (ch !== prev && ch !== '-') out2 += ch;
        prev = ch;
      });
      return out2;
    }

    function draw() {
      var t = api.plots.grid.t;
      var p = api.plots.grid;
      var post = posteriors();
      var labels = post.labels, m = post.m;
      var T = state.frames, L = labels.length;

      p.clear();
      var left = p.pad.left, right = p.w - p.pad.right;
      var top = p.pad.top, bottom = p.h - p.pad.bottom;
      var cw = (right - left) / T, ch = (bottom - top) / L;
      var c = p.ctx;
      var font = getComputedStyle(document.body).fontFamily;

      var greedy = [];
      for (var f = 0; f < T; f++) {
        var best = 0;
        for (var l = 1; l < L; l++) if (m[f][l] > m[f][best]) best = l;
        greedy.push(labels[best]);
      }

      for (l = 0; l < L; l++) {
        for (f = 0; f < T; f++) {
          c.save();
          c.globalAlpha = 0.1 + 0.85 * m[f][l];
          c.fillStyle = l === 0 ? t.inkFaint : t.accent;
          c.fillRect(left + f * cw + 1, top + l * ch + 1, cw - 2, ch - 2);
          c.restore();

          if (labels[greedy[f]] !== undefined && greedy[f] === labels[l]) {
            c.save();
            c.strokeStyle = t.series2;
            c.lineWidth = 2.5;
            c.strokeRect(left + f * cw + 1.5, top + l * ch + 1.5, cw - 3, ch - 3);
            c.restore();
          }
        }
        c.save();
        c.fillStyle = t.ink;
        c.font = '600 13px ' + font;
        c.textAlign = 'right';
        c.textBaseline = 'middle';
        c.fillText(labels[l] === '-' ? 'blank' : labels[l], left - 10, top + (l + 0.5) * ch);
        c.restore();
      }

      c.save();
      c.fillStyle = t.inkFaint;
      c.font = '11px ' + font;
      c.textAlign = 'center';
      c.textBaseline = 'top';
      for (f = 0; f < T; f++) {
        c.fillText(String(f + 1), left + (f + 0.5) * cw, bottom + 8);
      }
      c.restore();

      var raw = greedy.join('');
      readout(out, [
        ['frames', String(T)],
        ['greedy path', raw],
        ['after collapsing', collapse(greedy) || '(empty)'],
        ['target', TARGET],
        ['alignments that give "' + TARGET + '"',
          countAlignments(T, TARGET).toLocaleString('en-US')]
      ]);
    }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('grid', root.querySelector('[data-plot="grid"]'),
                  { height: 220, pad: { left: 60, right: 16, top: 16, bottom: 30 } });

        a.controls.appendChild(Lab.slider({
          label: 'frames', min: 4, max: 24, step: 1, value: state.frames
        }, function (v) { state.frames = v; draw(); }).el);

        a.controls.appendChild(Lab.slider({
          label: 'blank bias', min: -1.5, max: 2.5, step: 0.05, value: state.blankBias,
          format: function (v) { return v.toFixed(2); }
        }, function (v) { state.blankBias = v; draw(); }).el);
      }
    });
  }

  // ----------------------------------------------------------------- 6. VTLN

  function initVtln(root) {
    var state = { alpha: 1.0 };
    var out = root.querySelector('[data-readout]');
    var api;

    var PB = window.PB52;
    if (!PB) return;

    /* Mean squared distance, in log-frequency, from each warped child token to
     * the men's mean for the same vowel. Log frequency because the whole
     * effect is multiplicative. */
    function misfit(alpha) {
      var total = 0, n = 0;
      PB.children.forEach(function (row) {
        var ref = PB.meanMen[row[2]];
        if (!ref) return;
        total += Math.pow(Math.log(row[0] / alpha / ref[0]), 2) +
                 Math.pow(Math.log(row[1] / alpha / ref[1]), 2);
        n += 2;
      });
      return Math.sqrt(total / n);
    }

    var bestAlpha = (function () {
      var best = 1, bestV = Infinity;
      for (var a = 1.0; a <= 1.8; a += 0.005) {
        var v = misfit(a);
        if (v < bestV) { bestV = v; best = a; }
      }
      return best;
    })();

    function draw() {
      var t = api.plots.chart.t;
      var cp = api.plots.chart;

      cp.clear();
      cp.frame([3000, 2000, 1500, 1000, 700], [200, 400, 600, 800, 1000, 1200],
               'F2 (Hz)', 'F1 (Hz)');

      var c = cp.ctx;
      c.save();
      c.globalAlpha = 0.5;
      PB.men.forEach(function (row) {
        c.fillStyle = t.inkFaint;
        c.beginPath();
        c.arc(cp.px(row[1]), cp.py(row[0]), 2, 0, 2 * Math.PI);
        c.fill();
      });
      PB.children.forEach(function (row) {
        c.fillStyle = t.series2;
        c.beginPath();
        c.arc(cp.px(row[1] / state.alpha), cp.py(row[0] / state.alpha), 2, 0, 2 * Math.PI);
        c.fill();
      });
      c.restore();

      // Legend in the empty low-F2/high-F1 corner: no vowel lives at a high
      // first formant and a low second one, so nothing is covered up.
      cp.text(3300, 1130, '33 men', t.inkFaint,
              { align: 'left', weight: '600', size: 12 });
      cp.text(3300, 1230, '15 children, warped by α', t.series2,
              { align: 'left', weight: '600', size: 12 });

      // the misfit curve
      var mp = api.plots.misfit;
      var pts = [];
      for (var a = 1.0; a <= 1.8; a += 0.01) pts.push([a, misfit(a)]);
      mp.xMin = 1.0; mp.xMax = 1.8;
      mp.yMin = 0; mp.yMax = 0.6;
      mp.clear();
      mp.frame([1.0, 1.2, 1.4, 1.6, 1.8], [0, 0.2, 0.4, 0.6],
               'warping factor α', 'misfit',
               function (v) { return v.toFixed(1); },
               function (v) { return v.toFixed(1); });
      mp.line(pts, t.accent, 2);
      mp.vline(bestAlpha, t.series3, 'best α = ' + bestAlpha.toFixed(2), { labelOffset: 0 });
      mp.dot(state.alpha, misfit(state.alpha), t.series2, 5);

      readout(out, [
        ['α', state.alpha.toFixed(2)],
        ['misfit', misfit(state.alpha).toFixed(3)],
        ['best α', bestAlpha.toFixed(2)],
        ['implied child tract', (17.5 / bestAlpha).toFixed(1) + ' cm vs 17.5 cm']
      ]);
    }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('chart', root.querySelector('[data-plot="chart"]'),
                  { height: 280, xMin: 3400, xMax: 650, yMin: 1300, yMax: 150,
                    pad: { left: 50, right: 18, top: 16, bottom: 34 } });
        a.addPlot('misfit', root.querySelector('[data-plot="misfit"]'),
                  { height: 170, pad: { left: 50, right: 18, top: 16, bottom: 34 } });

        a.controls.appendChild(Lab.slider({
          label: 'warping factor α', min: 1.0, max: 1.8, step: 0.01, value: state.alpha,
          format: function (v) { return v.toFixed(2); }
        }, function (v) { state.alpha = v; draw(); }).el);

        a.controls.appendChild(Lab.button('Snap to best α', function () {
          state.alpha = Math.round(bestAlpha * 100) / 100;
          var input = a.controls.querySelector('input[type="range"]');
          input.value = state.alpha;
          input.dispatchEvent(new Event('input'));
        }, 'lab-button--ghost'));
      }
    });
  }

  // ------------------------------------------------------------------- boot

  var FIGURES = {
    'lab-frames': initFrames,
    'lab-cepstrum': initCepstrum,
    'lab-mel': initMel,
    'lab-viterbi': initViterbi,
    'lab-ctc': initCtc,
    'lab-vtln': initVtln
  };

  Lab.ready(function () {
    Object.keys(FIGURES).forEach(function (id) {
      var root = document.getElementById(id);
      if (!root) return;
      try {
        FIGURES[id](root);
      } catch (err) {
        if (window.console) console.error('figure ' + id + ' failed', err);
      }
    });
  });
})();
