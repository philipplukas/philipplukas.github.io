/* lab-tract.js — the interactive figures for
 * "How a tube becomes a vowel" (Speech from first principles, part 1).
 *
 * Each figure is a <figure class="lab" id="…"> in the post; this file finds the
 * ones present on the page and wires them up. Nothing runs if the markup isn't
 * there, so the file is safe to load anywhere.
 *
 * The acoustics live in lab.js and are regression-tested by tools/test-lab.js.
 */
(function () {
  'use strict';

  var Lab = window.Lab;
  if (!Lab) return;

  var C = Lab.C, FS = Lab.FS;
  var DX = C / (2 * FS);            // 0.3968 cm per lattice section
  var N = 44;                       // 44 sections = 17.46 cm
  var L_DEFAULT = N * DX;

  /* Measured formants, computed from phonTools::pb52 — Peterson & Barney
   * (1952), 33 adult men, two repetitions of ten vowels. Used as the reference
   * cloud on the vowel chart, and as the targets the tube shapes were fitted
   * to. */
  var PB_MEN = {
    'i': [267, 2294], 'ɪ': [392, 1993], 'ɛ': [526, 1854], 'æ': [664, 1727],
    'ɑ': [718, 1091], 'ɔ': [568, 836], 'ʊ': [437, 1023], 'u': [307, 876],
    'ʌ': [631, 1192]
  };

  /* Four-tube shapes, [length_cm, area_cm2] from glottis to lips, fitted to
   * those measurements by grid search (see the post). F1 and F2 land within a
   * couple of percent for every vowel except /i/, which a four-tube model
   * cannot quite reach. */
  var VOWEL_SHAPES = {
    'i': [[8.00, 2], [5.00, 0.2], [3.46, 3], [1.00, 8]],
    'ɪ': [[8.50, 1], [5.00, 0.3], [2.96, 1], [1.00, 8]],
    'ɛ': [[7.50, 1], [5.00, 0.5], [3.96, 4], [1.00, 8]],
    'æ': [[9.00, 1], [4.00, 1.2], [3.46, 6], [1.00, 8]],
    'ɑ': [[6.00, 1], [1.00, 0.3], [9.46, 8], [1.00, 8]],
    'ɔ': [[5.00, 1], [2.50, 0.2], [8.96, 6], [1.00, 2]],
    'ʊ': [[8.00, 1.5], [3.00, 0.3], [5.46, 8], [1.00, 2]],
    'u': [[8.00, 6], [1.50, 0.8], [6.96, 6], [1.00, 0.5]],
    'ʌ': [[5.00, 2], [1.00, 0.5], [10.46, 6], [1.00, 8]]
  };

  var FREQ_TICKS = [100, 200, 500, 1000, 2000, 5000];
  var fmtFreq = function (f) { return f >= 1000 ? (f / 1000) + 'k' : String(f); };

  // ------------------------------------------------------------------ utils

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
      var v = el('strong', null, e[1]);
      span.appendChild(v);
      host.appendChild(span);
    });
  }

  /* Transfer function of an area function, as [[Hz, dB], …] normalised to a
   * 0 dB peak, plus the formant frequencies picked off it. */
  function response(areas, opts) {
    opts = opts || {};
    var tract = new Lab.Tract(areas, opts);
    var ir = tract.impulseResponse(4096);
    if (opts.radiation) ir = Lab.radiate(ir);

    var nfft = 8192;
    var db = Lab.spectrumDb(ir, nfft);
    var binHz = FS / nfft;

    var peak = -Infinity, i;
    for (i = 1; i * binHz <= 5000; i++) peak = Math.max(peak, db[i]);

    var points = [];
    for (i = 1; i * binHz <= 5000; i++) points.push([i * binHz, db[i] - peak]);

    return {
      points: points,
      formants: Lab.spectralPeaks(db, FS, nfft, { fMax: 4500, minProminence: 3 })
    };
  }

  /* Draw an area function as a tube seen from the side: mirrored around a
   * centreline so it reads as a pipe rather than a bar chart. */
  function drawTube(plot, areas, opts) {
    opts = opts || {};
    var c = plot.ctx, t = plot.t;
    var n = areas.length;
    var left = plot.pad.left, right = plot.w - plot.pad.right;
    var mid = (plot.pad.top + plot.h - plot.pad.bottom) / 2;
    var maxA = opts.maxArea || 10;
    var half = (plot.h - plot.pad.top - plot.pad.bottom) / 2 - 4;

    var radius = function (a) {
      return Math.max(1.5, Math.sqrt(Math.max(a, 0.01) / maxA) * half);
    };
    var xAt = function (i) { return left + (i / (n - 1)) * (right - left); };

    c.save();
    c.beginPath();
    for (var i = 0; i < n; i++) c.lineTo(xAt(i), mid - radius(areas[i]));
    for (i = n - 1; i >= 0; i--) c.lineTo(xAt(i), mid + radius(areas[i]));
    c.closePath();
    c.fillStyle = opts.fill || t.accentWash;
    c.fill();
    c.strokeStyle = opts.stroke || t.accent;
    c.lineWidth = 1.75;
    c.stroke();

    // centreline
    c.beginPath();
    c.setLineDash([2, 4]);
    c.strokeStyle = t.rule;
    c.lineWidth = 1;
    c.moveTo(left, mid);
    c.lineTo(right, mid);
    c.stroke();
    c.setLineDash([]);

    c.fillStyle = t.inkFaint;
    c.font = '11px ' + getComputedStyle(document.body).fontFamily;
    c.textBaseline = 'bottom';
    c.textAlign = 'left';
    c.fillText('glottis', left, plot.h - plot.pad.bottom + 16);
    c.textAlign = 'right';
    c.fillText('lips', right, plot.h - plot.pad.bottom + 16);
    c.restore();
  }

  function spectrumPlotOpts(height) {
    return {
      height: height || 220, xLog: true, xMin: 90, xMax: 5000,
      yMin: -55, yMax: 8, pad: { left: 46, right: 14, top: 14, bottom: 32 }
    };
  }

  function drawSpectrum(plot, points, formants, opts) {
    opts = opts || {};
    var t = plot.t;
    plot.clear();

    // Fill first: it is opaque, so anything drawn before it is buried.
    plot.fillUnder(points, opts.fill || t.accentWash);
    plot.frame(FREQ_TICKS, [-50, -40, -30, -20, -10, 0],
               'frequency (Hz)', 'dB', fmtFreq);

    (formants || []).slice(0, 3).forEach(function (f, i) {
      var color = t['series' + (i + 1)];
      plot.vline(f, color, 'F' + (i + 1), { labelOffset: i * 14 });
    });

    plot.line(points, opts.color || t.accent, 2);
  }

  // ---------------------------------------------------------- 1. the source

  function initSource(root) {
    var state = { f0: 120, oq: 0.56 };
    var wave = root.querySelector('[data-plot="wave"]');
    var spec = root.querySelector('[data-plot="spectrum"]');
    var out = root.querySelector('[data-readout]');
    var api;

    function buffer() {
      var period = Math.round(FS / state.f0);
      var n = period * Math.round(1.2 * FS / period);
      var src = new Float64Array(n);
      for (var i = 0; i < n; i++) {
        src[i] = Lab.glottalPulse((i % period) / period, state.oq);
      }
      var f32 = new Float32Array(n);
      for (i = 0; i < n; i++) f32[i] = src[i] * 0.5;
      return f32;
    }

    function draw() {
      var wp = api.plots.wave, sp = api.plots.spectrum;
      var t = wp.t;
      var period = FS / state.f0;

      // three periods of glottal flow
      wp.xMin = 0; wp.xMax = 3 * 1000 / state.f0;
      wp.yMin = -0.1; wp.yMax = 1.15;
      wp.clear();
      wp.frame([0, 5, 10, 15, 20, 25, 30].filter(function (x) { return x <= wp.xMax; }),
               [0, 0.5, 1], 'time (ms)', 'flow');
      var pts = [];
      for (var i = 0; i <= 600; i++) {
        var ms = i * wp.xMax / 600;
        var phase = (ms / 1000) * state.f0;
        pts.push([ms, Lab.glottalPulse(phase % 1, state.oq)]);
      }
      wp.fillUnder(pts, t.accentWash);
      wp.line(pts, t.accent, 2);
      wp.text(wp.xMax * 0.99, 1.08, 'one period = ' + (1000 / state.f0).toFixed(1) + ' ms',
              t.inkFaint, { align: 'right' });

      // harmonic spectrum
      var nfft = 16384;
      var period_i = Math.round(FS / state.f0);
      var sig = new Float64Array(nfft);
      for (i = 0; i < nfft; i++) sig[i] = Lab.glottalPulse((i % period_i) / period_i, state.oq);
      var db = Lab.spectrumDb(sig, nfft);
      var binHz = FS / nfft;
      var f0a = FS / period_i;

      var harmonics = [], peakDb = -Infinity, k;
      for (k = 1; k * f0a < 5000; k++) {
        var b = Math.round(k * f0a / binHz), m = -Infinity;
        for (var j = b - 2; j <= b + 2; j++) m = Math.max(m, db[j]);
        harmonics.push([k * f0a, m]);
        peakDb = Math.max(peakDb, m);
      }

      sp.clear();
      sp.frame(FREQ_TICKS, [-60, -45, -30, -15, 0], 'frequency (Hz)', 'dB', fmtFreq);
      harmonics.forEach(function (h) {
        var x = sp.px(h[0]);
        var y = sp.py(Math.max(h[1] - peakDb, sp.yMin));
        sp.ctx.save();
        sp.ctx.strokeStyle = t.accent;
        sp.ctx.lineWidth = 1.5;
        sp.ctx.beginPath();
        sp.ctx.moveTo(x, sp.py(sp.yMin));
        sp.ctx.lineTo(x, y);
        sp.ctx.stroke();
        sp.ctx.restore();
      });
      // -12 dB/octave guide
      var guide = [];
      for (var f = f0a; f <= 5000; f *= 1.05) {
        guide.push([f, -12 * Math.log2(f / f0a) + 2]);
      }
      sp.line(guide, t.series2, 1.5, [5, 4]);
      // Anchor the label to the guide line partway along it, where there is
      // room, rather than at the right edge where it fouls the axis label.
      var labelF = 900;
      sp.text(labelF, -12 * Math.log2(labelF / f0a) + 2, '−12 dB/octave',
              t.series2, { align: 'left', dx: 8, dy: -6, weight: '600' });

      readout(out, [
        ['f₀', state.f0.toFixed(0) + ' Hz'],
        ['period', (1000 / state.f0).toFixed(1) + ' ms'],
        ['open quotient', state.oq.toFixed(2)],
        ['harmonics below 5 kHz', String(harmonics.length)]
      ]);
    }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('wave', wave, { height: 200, pad: { left: 44, right: 14, top: 14, bottom: 32 } });
        a.addPlot('spectrum', spec, spectrumPlotOpts(200));

        var replay = function () {
          if (Lab.audio.isPlaying()) Lab.audio.play(buffer(), FS, 'source');
        };
        a.controls.appendChild(Lab.slider({
          label: 'pitch f₀', min: 70, max: 300, step: 1, value: state.f0, unit: ' Hz'
        }, function (v) { state.f0 = v; draw(); replay(); }).el);
        a.controls.appendChild(Lab.slider({
          label: 'open quotient', min: 0.25, max: 0.9, step: 0.01, value: state.oq,
          format: function (v) { return v.toFixed(2); }
        }, function (v) { state.oq = v; draw(); replay(); }).el);
        addPlayButton(a.controls, function () { return buffer(); }, 'source',
                      'Play the buzz');
      }
    });
  }

  // ----------------------------------------------------- 2. a uniform tube

  function initTube(root) {
    var state = { length: 17.5, animate: true, phase: 0 };
    var out = root.querySelector('[data-readout]');
    var api, raf = null, visible = true;

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function areas() {
      var n = Math.max(8, Math.round(state.length / DX));
      return new Float64Array(n).fill(5);
    }

    function formants() {
      return [1, 2, 3].map(function (n) {
        return (2 * n - 1) * C / (4 * state.length);
      });
    }

    /* Pressure standing waves: an antinode at the closed glottis, a node at
     * the open lips, so mode n is cos((2n-1)pi x / 2L). */
    function drawModes(plot) {
      var c = plot.ctx, t = plot.t;
      plot.clear();

      var left = plot.pad.left, right = plot.w - plot.pad.right;
      var mid = (plot.pad.top + plot.h - plot.pad.bottom) / 2;
      var amp = (plot.h - plot.pad.top - plot.pad.bottom) / 2 - 14;

      // the tube walls
      c.save();
      c.strokeStyle = t.ruleStrong;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(left, mid - amp - 6); c.lineTo(right, mid - amp - 6);
      c.moveTo(left, mid + amp + 6); c.lineTo(right, mid + amp + 6);
      c.stroke();
      // closed at the glottis
      c.beginPath();
      c.moveTo(left, mid - amp - 6); c.lineTo(left, mid + amp + 6);
      c.lineWidth = 3;
      c.strokeStyle = t.ink;
      c.stroke();
      c.restore();

      // Labels sit at a fixed point on each mode's *envelope* rather than on
      // the oscillating curve, so they stay put while the waves move and never
      // pile up at an instant when all three cross zero together.
      var LABEL_AT = [0.30, 0.55, 0.80];

      [1, 2, 3].forEach(function (n, i) {
        var color = t['series' + (i + 1)];
        var shape = function (x) { return Math.cos((2 * n - 1) * Math.PI * x / 2); };
        var pts = [];
        for (var s = 0; s <= 240; s++) {
          var x = s / 240;
          pts.push([left + x * (right - left), mid - shape(x) * Math.cos(state.phase) * amp * 0.9]);
        }
        c.save();
        c.strokeStyle = color;
        c.lineWidth = 2;
        c.beginPath();
        pts.forEach(function (p, j) { j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
        c.stroke();

        var lx = LABEL_AT[i];
        var ly = mid - shape(lx) * amp * 0.9;
        c.fillStyle = color;
        c.font = '600 12px ' + getComputedStyle(document.body).fontFamily;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('F' + (i + 1), left + lx * (right - left),
                   ly + (shape(lx) >= 0 ? -14 : 14));
        c.restore();
      });

      c.save();
      c.fillStyle = t.inkFaint;
      c.font = '11px ' + getComputedStyle(document.body).fontFamily;
      c.textBaseline = 'top';
      c.textAlign = 'left';
      c.fillText('glottis — closed, pressure antinode', left, plot.h - plot.pad.bottom + 8);
      c.textAlign = 'right';
      c.fillText('lips — open, pressure node', right, plot.h - plot.pad.bottom + 8);
      c.restore();
    }

    function draw() {
      drawModes(api.plots.modes);
      var r = response(areas());
      drawSpectrum(api.plots.spectrum, r.points, formants());

      var f = formants();
      readout(out, [
        ['length', state.length.toFixed(1) + ' cm'],
        ['F1', f[0].toFixed(0) + ' Hz'],
        ['F2', f[1].toFixed(0) + ' Hz'],
        ['F3', f[2].toFixed(0) + ' Hz'],
        ['spacing', (f[1] - f[0]).toFixed(0) + ' Hz']
      ]);
    }

    function tick() {
      state.phase += 0.06;
      drawModes(api.plots.modes);
      raf = requestAnimationFrame(tick);
    }

    function updateAnimation() {
      var wanted = state.animate && visible && !reduceMotion;
      if (wanted && raf === null) raf = requestAnimationFrame(tick);
      if (!wanted && raf !== null) { cancelAnimationFrame(raf); raf = null; }
    }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('modes', root.querySelector('[data-plot="modes"]'),
                  { height: 230, pad: { left: 18, right: 18, top: 14, bottom: 26 } });
        a.addPlot('spectrum', root.querySelector('[data-plot="spectrum"]'),
                  spectrumPlotOpts(210));

        a.controls.appendChild(Lab.slider({
          label: 'tract length', min: 10, max: 20, step: 0.1, value: state.length,
          format: function (v) { return v.toFixed(1) + ' cm'; }
        }, function (v) {
          state.length = v;
          draw();
          if (Lab.audio.isPlaying()) Lab.audio.play(sound(), FS, 'tube');
        }).el);

        addPlayButton(a.controls, sound, 'tube', 'Play this tube');

        var toggle = Lab.button('Pause the waves', function () {
          state.animate = !state.animate;
          toggle.textContent = state.animate ? 'Pause the waves' : 'Animate the waves';
          updateAnimation();
        }, 'lab-button--ghost');
        a.controls.appendChild(toggle);
      }
    });

    function sound() {
      return Lab.synth(areas(), { f0: 110, duration: 1.2 });
    }

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        updateAnimation();
      }, { threshold: 0.15 }).observe(root);
    }
    updateAnimation();
  }

  // -------------------------------------------------------- 3. two tubes

  function initTwoTube(root) {
    var state = { junction: 8.7, backArea: 1, frontArea: 7, f0: 110 };
    var out = root.querySelector('[data-readout]');
    var api;

    function segments() {
      return [[state.junction, state.backArea],
              [L_DEFAULT - state.junction, state.frontArea]];
    }

    function areas() { return Lab.sections(segments(), N); }

    function draw() {
      var segs = segments();
      var r = response(areas());
      var exact = Lab.resonances(segs, 3);

      var tp = api.plots.tube;
      tp.clear();
      drawTube(tp, areas(), { maxArea: 10 });
      tp.ctx.save();
      var xJ = tp.pad.left + (state.junction / L_DEFAULT) *
               (tp.w - tp.pad.left - tp.pad.right);
      tp.ctx.strokeStyle = tp.t.inkFaint;
      tp.ctx.setLineDash([3, 3]);
      tp.ctx.beginPath();
      tp.ctx.moveTo(xJ, tp.pad.top);
      tp.ctx.lineTo(xJ, tp.h - tp.pad.bottom);
      tp.ctx.stroke();
      tp.ctx.restore();

      drawSpectrum(api.plots.spectrum, r.points, exact);

      readout(out, [
        ['back tube', state.junction.toFixed(1) + ' cm @ ' + state.backArea.toFixed(1) + ' cm²'],
        ['front tube', (L_DEFAULT - state.junction).toFixed(1) + ' cm @ ' + state.frontArea.toFixed(1) + ' cm²'],
        ['A₂/A₁', (state.frontArea / state.backArea).toFixed(2)],
        ['F1', exact[0].toFixed(0) + ' Hz'],
        ['F2', exact[1] ? exact[1].toFixed(0) + ' Hz' : '—'],
        ['F3', exact[2] ? exact[2].toFixed(0) + ' Hz' : '—']
      ]);
    }

    function sound() { return Lab.synth(areas(), { f0: state.f0, duration: 1.2 }); }
    function replay() { if (Lab.audio.isPlaying()) Lab.audio.play(sound(), FS, 'twotube'); }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('tube', root.querySelector('[data-plot="tube"]'),
                  { height: 170, pad: { left: 18, right: 18, top: 12, bottom: 26 } });
        a.addPlot('spectrum', root.querySelector('[data-plot="spectrum"]'),
                  spectrumPlotOpts(210));

        a.controls.appendChild(Lab.slider({
          label: 'junction', min: 2, max: 15.5, step: 0.1, value: state.junction,
          format: function (v) { return v.toFixed(1) + ' cm'; }
        }, function (v) { state.junction = v; draw(); replay(); }).el);

        a.controls.appendChild(Lab.slider({
          label: 'back area A₁', min: 0.2, max: 10, step: 0.1, value: state.backArea,
          format: function (v) { return v.toFixed(1) + ' cm²'; }
        }, function (v) { state.backArea = v; draw(); replay(); }).el);

        a.controls.appendChild(Lab.slider({
          label: 'front area A₂', min: 0.2, max: 10, step: 0.1, value: state.frontArea,
          format: function (v) { return v.toFixed(1) + ' cm²'; }
        }, function (v) { state.frontArea = v; draw(); replay(); }).el);

        addPlayButton(a.controls, sound, 'twotube', 'Play this shape');

        a.controls.appendChild(Lab.button('/ɑ/ preset', function () {
          state.junction = 8.7; state.backArea = 1; state.frontArea = 7;
          syncSliders(a.controls, [state.junction, state.backArea, state.frontArea]);
          draw(); replay();
        }, 'lab-button--ghost'));
      }
    });
  }

  function syncSliders(controls, values) {
    var inputs = controls.querySelectorAll('input[type="range"]');
    values.forEach(function (v, i) {
      if (inputs[i]) {
        inputs[i].value = v;
        inputs[i].dispatchEvent(new Event('input', { bubbles: false }));
      }
    });
  }

  // -------------------------------------------------------- 4. the nomogram

  function initNomogram(root) {
    var state = { position: 4, constrictionArea: 0.5, curves: null };
    var out = root.querySelector('[data-readout]');
    var api;

    var CONSTRICTION_LEN = 3.0;
    var BASE_AREA = 5.0;
    var POSITIONS = [];
    for (var p = 2; p <= 15.5; p += 0.25) POSITIONS.push(p);

    function segmentsAt(pos) {
      var half = CONSTRICTION_LEN / 2;
      var lo = Math.max(0.2, pos - half);
      var hi = Math.min(L_DEFAULT - 0.2, pos + half);
      return [[lo, BASE_AREA],
              [hi - lo, state.constrictionArea],
              [L_DEFAULT - hi, BASE_AREA]];
    }

    function computeCurves() {
      state.curves = POSITIONS.map(function (pos) {
        return { x: pos, f: Lab.resonances(segmentsAt(pos), 3) };
      });
    }

    function draw() {
      if (!state.curves) computeCurves();
      var t = api.plots.nomogram.t;
      var np = api.plots.nomogram;

      np.clear();
      np.frame([2, 4, 6, 8, 10, 12, 14],
               [0, 1000, 2000, 3000, 4000],
               'constriction centre, cm from glottis', 'Hz',
               null, fmtFreq);

      [0, 1, 2].forEach(function (idx) {
        var color = t['series' + (idx + 1)];
        var pts = state.curves
          .filter(function (c) { return c.f[idx] !== undefined; })
          .map(function (c) { return [c.x, c.f[idx]]; });
        if (!pts.length) return;
        np.line(pts, color, 2);
        // direct label at the right-hand end — the curves are also the legend
        var last = pts[pts.length - 1];
        np.text(last[0], last[1], ' F' + (idx + 1), color,
                { weight: '600', baseline: 'middle' });
      });

      np.vline(state.position, t.ink, null, { dash: [4, 3], width: 1.5 });

      var here = Lab.resonances(segmentsAt(state.position), 3);
      here.forEach(function (f, i) {
        np.dot(state.position, f, t['series' + (i + 1)], 4.5);
      });

      var tp = api.plots.tube;
      tp.clear();
      drawTube(tp, Lab.sections(segmentsAt(state.position), N), { maxArea: 8 });

      readout(out, [
        ['constriction at', state.position.toFixed(1) + ' cm'],
        ['area', state.constrictionArea.toFixed(2) + ' cm²'],
        ['F1', here[0] ? here[0].toFixed(0) + ' Hz' : '—'],
        ['F2', here[1] ? here[1].toFixed(0) + ' Hz' : '—'],
        ['F3', here[2] ? here[2].toFixed(0) + ' Hz' : '—'],
        ['nearest vowel', nearestVowel(here)]
      ]);
    }

    function sound() {
      return Lab.synth(Lab.sections(segmentsAt(state.position), N),
                       { f0: 110, duration: 1.2 });
    }
    function replay() { if (Lab.audio.isPlaying()) Lab.audio.play(sound(), FS, 'nomo'); }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        a.addPlot('nomogram', root.querySelector('[data-plot="nomogram"]'),
                  { height: 260, xMin: 2, xMax: 15.5, yMin: 0, yMax: 4200,
                    pad: { left: 50, right: 34, top: 14, bottom: 34 } });
        a.addPlot('tube', root.querySelector('[data-plot="tube"]'),
                  { height: 130, pad: { left: 18, right: 18, top: 10, bottom: 24 } });

        a.controls.appendChild(Lab.slider({
          label: 'constriction position', min: 2, max: 15.5, step: 0.25,
          value: state.position,
          format: function (v) { return v.toFixed(2) + ' cm'; }
        }, function (v) { state.position = v; draw(); replay(); }).el);

        a.controls.appendChild(Lab.slider({
          label: 'constriction area', min: 0.1, max: 3, step: 0.05,
          value: state.constrictionArea,
          format: function (v) { return v.toFixed(2) + ' cm²'; }
        }, function (v) {
          state.constrictionArea = v;
          state.curves = null;
          draw();
          replay();
        }).el);

        addPlayButton(a.controls, sound, 'nomo', 'Play this constriction');
      }
    });
  }

  function nearestVowel(f) {
    if (!f || f.length < 2) return '—';
    var best = null, bestD = Infinity;
    Object.keys(PB_MEN).forEach(function (v) {
      var ref = PB_MEN[v];
      // distance in log-frequency, which is roughly how the ear compares them
      var d = Math.pow(Math.log(f[0] / ref[0]), 2) + Math.pow(Math.log(f[1] / ref[1]), 2);
      if (d < bestD) { bestD = d; best = v; }
    });
    return '/' + best + '/' + (bestD > 0.08 ? ' (loosely)' : '');
  }

  // ------------------------------------------------- 5. the shapeable tract

  function initTract(root) {
    var HANDLES = 12;
    var state = {
      points: null,
      f0: 110,
      radiation: true,
      dragging: -1
    };

    var out = root.querySelector('[data-readout]');
    var api;

    function setFromShape(segs) {
      var full = Lab.sections(segs, HANDLES * 4);
      var pts = [];
      for (var i = 0; i < HANDLES; i++) {
        pts.push(full[Math.min(full.length - 1, Math.round(i * (full.length - 1) / (HANDLES - 1)))]);
      }
      state.points = pts;
    }
    setFromShape(VOWEL_SHAPES['ɑ']);

    function areas() { return Lab.interpolateAreas(state.points, N); }

    /* Area is plotted on a log axis — a tract's areas span two orders of
     * magnitude and the narrow end is where the interesting things happen.
     * The plot's y range is therefore in log units, so plot.py() and the
     * gridlines agree without a second mapping. */
    var AREA_MIN = 0.05, AREA_MAX = 12;

    function areaToY(plot, a) {
      return plot.py(Math.log(Math.max(AREA_MIN, Math.min(AREA_MAX, a))));
    }

    function yToArea(plot, y) {
      var span = plot.h - plot.pad.top - plot.pad.bottom;
      var f = Math.max(0, Math.min(1, (plot.h - plot.pad.bottom - y) / span));
      return Math.exp(plot.yMin + f * (plot.yMax - plot.yMin));
    }

    function handleX(plot, i) {
      return plot.pad.left + (i / (HANDLES - 1)) *
             (plot.w - plot.pad.left - plot.pad.right);
    }

    function drawShape(plot) {
      var c = plot.ctx, t = plot.t;
      plot.clear();
      plot.frame([], [0.1, 0.5, 2, 10].map(Math.log), null, 'area (cm²)', null,
                 function (v) { return String(+Math.exp(v).toFixed(1)); });

      // the area profile
      var pts = [];
      for (var i = 0; i < HANDLES; i++) pts.push([handleX(plot, i), areaToY(plot, state.points[i])]);

      c.save();
      c.beginPath();
      c.moveTo(pts[0][0], plot.h - plot.pad.bottom);
      pts.forEach(function (p) { c.lineTo(p[0], p[1]); });
      c.lineTo(pts[pts.length - 1][0], plot.h - plot.pad.bottom);
      c.closePath();
      c.fillStyle = t.accentWash;
      c.fill();

      c.beginPath();
      pts.forEach(function (p, j) { j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); });
      c.strokeStyle = t.accent;
      c.lineWidth = 2;
      c.stroke();

      pts.forEach(function (p, j) {
        c.beginPath();
        c.arc(p[0], p[1], state.dragging === j ? 7 : 5, 0, 2 * Math.PI);
        c.fillStyle = t.accent;
        c.fill();
        c.strokeStyle = t.surface;
        c.lineWidth = 2;
        c.stroke();
      });

      c.fillStyle = t.inkFaint;
      c.font = '11px ' + getComputedStyle(document.body).fontFamily;
      c.textBaseline = 'top';
      c.textAlign = 'left';
      c.fillText('glottis', plot.pad.left, plot.h - plot.pad.bottom + 8);
      c.textAlign = 'right';
      c.fillText('lips  ·  drag the dots', plot.w - plot.pad.right,
                 plot.h - plot.pad.bottom + 8);
      c.restore();
    }

    function drawVowelChart(plot, f) {
      var t = plot.t;
      plot.clear();
      // F2 on x (reversed) and F1 on y (reversed) is the standard vowel chart
      plot.frame([2500, 2000, 1500, 1000, 500], [200, 400, 600, 800, 1000],
                 'F2 (Hz)', 'F1 (Hz)');

      Object.keys(PB_MEN).forEach(function (v) {
        var ref = PB_MEN[v];
        plot.dot(ref[1], ref[0], t.ruleStrong, 3.5);
        plot.text(ref[1], ref[0], v, t.inkFaint,
                  { dx: 7, dy: 4, size: 12, weight: '600' });
      });

      if (f && f.length >= 2) {
        plot.dot(f[1], f[0], t.accent, 7);
        plot.ctx.save();
        plot.ctx.strokeStyle = t.surface;
        plot.ctx.lineWidth = 2;
        plot.ctx.beginPath();
        plot.ctx.arc(plot.px(f[1]), plot.py(f[0]), 7, 0, 2 * Math.PI);
        plot.ctx.stroke();
        plot.ctx.restore();
      }
    }

    function draw() {
      var a = areas();
      var r = response(a, { radiation: false });
      drawShape(api.plots.shape);
      drawSpectrum(api.plots.spectrum, r.points, r.formants);
      drawVowelChart(api.plots.chart, r.formants);

      readout(out, [
        ['F1', r.formants[0] ? r.formants[0].toFixed(0) + ' Hz' : '—'],
        ['F2', r.formants[1] ? r.formants[1].toFixed(0) + ' Hz' : '—'],
        ['F3', r.formants[2] ? r.formants[2].toFixed(0) + ' Hz' : '—'],
        ['nearest vowel', nearestVowel(r.formants)]
      ]);
    }

    function sound() {
      return Lab.synth(areas(), {
        f0: state.f0, duration: 1.2, radiation: state.radiation
      });
    }
    function replay() { if (Lab.audio.isPlaying()) Lab.audio.play(sound(), FS, 'tract'); }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        var shapeCanvas = root.querySelector('[data-plot="shape"]');
        a.addPlot('shape', shapeCanvas,
                  { height: 210, yMin: Math.log(AREA_MIN), yMax: Math.log(AREA_MAX),
                    pad: { left: 44, right: 16, top: 14, bottom: 28 } });
        a.addPlot('spectrum', root.querySelector('[data-plot="spectrum"]'),
                  spectrumPlotOpts(210));
        a.addPlot('chart', root.querySelector('[data-plot="chart"]'),
                  { height: 230, xMin: 2900, xMax: 500, yMin: 1100, yMax: 150,
                    pad: { left: 50, right: 20, top: 16, bottom: 34 } });

        // vowel presets
        var presets = el('div', 'lab-segmented');
        Object.keys(VOWEL_SHAPES).forEach(function (v) {
          var b = el('button', 'lab-segmented__item', v);
          b.type = 'button';
          b.setAttribute('aria-label', 'vowel ' + v);
          b.addEventListener('click', function () {
            setFromShape(VOWEL_SHAPES[v]);
            draw();
            replay();
          });
          presets.appendChild(b);
        });
        var presetWrap = el('div', 'lab-control');
        var head = el('span', 'lab-control__head');
        head.appendChild(el('span', 'lab-control__label', 'vowel presets'));
        presetWrap.appendChild(head);
        presetWrap.appendChild(presets);
        a.controls.appendChild(presetWrap);

        a.controls.appendChild(Lab.slider({
          label: 'pitch f₀', min: 70, max: 300, step: 1, value: state.f0, unit: ' Hz'
        }, function (v) { state.f0 = v; replay(); }).el);

        addPlayButton(a.controls, sound, 'tract', 'Play this tract');

        // dragging
        var plot = a.plots.shape;
        var pointerArea = function (evt) {
          var rect = shapeCanvas.getBoundingClientRect();
          return { x: evt.clientX - rect.left, y: evt.clientY - rect.top };
        };

        shapeCanvas.addEventListener('pointerdown', function (evt) {
          var p = pointerArea(evt);
          var best = -1, bestD = Infinity;
          for (var i = 0; i < HANDLES; i++) {
            var d = Math.abs(handleX(plot, i) - p.x);
            if (d < bestD) { bestD = d; best = i; }
          }
          if (bestD > 40) return;
          state.dragging = best;
          shapeCanvas.setPointerCapture(evt.pointerId);
          state.points[best] = yToArea(plot, p.y);
          draw();
          evt.preventDefault();
        });

        shapeCanvas.addEventListener('pointermove', function (evt) {
          if (state.dragging < 0) return;
          state.points[state.dragging] = yToArea(plot, pointerArea(evt).y);
          draw();
          evt.preventDefault();
        });

        var release = function (evt) {
          if (state.dragging < 0) return;
          state.dragging = -1;
          draw();
          replay();
          if (evt && evt.pointerId !== undefined) {
            try { shapeCanvas.releasePointerCapture(evt.pointerId); } catch (e) {}
          }
        };
        shapeCanvas.addEventListener('pointerup', release);
        shapeCanvas.addEventListener('pointercancel', release);

        shapeCanvas.classList.add('lab-canvas--draggable');
        shapeCanvas.setAttribute('tabindex', '0');
        shapeCanvas.setAttribute('role', 'application');
        shapeCanvas.setAttribute('aria-label',
          'Vocal tract area function. Drag the twelve handles to change the ' +
          'cross-sectional area along the tract, or use the vowel preset buttons.');
      }
    });
  }

  // ------------------------------------------- 6. source x filter x radiation

  function initChain(root) {
    var state = { vowel: 'ɑ', f0: 110, radiation: true, loss: 0.97 };
    var out = root.querySelector('[data-readout]');
    var api;

    function areas() { return Lab.sections(VOWEL_SHAPES[state.vowel], N); }

    function curves() {
      var nfft = 8192, binHz = FS / nfft, i;

      // source
      var period = Math.round(FS / state.f0);
      var src = new Float64Array(nfft);
      for (i = 0; i < nfft; i++) src[i] = Lab.glottalPulse((i % period) / period, 0.56);
      var srcDb = Lab.spectrumDb(src, nfft);

      // filter
      var tract = new Lab.Tract(areas(), { rGlottis: state.loss });
      var ir = tract.impulseResponse(4096);
      var filtDb = Lab.spectrumDb(ir, nfft);

      // output — impulseResponse left energy ringing in the lattice
      tract.reset();
      var wave = tract.process(src.subarray(0, 4096));
      if (state.radiation) wave = Lab.radiate(wave);
      var outDb = Lab.spectrumDb(wave, nfft);

      var pick = function (db, shift) {
        var pts = [], peak = -Infinity;
        for (i = 1; i * binHz <= 5000; i++) peak = Math.max(peak, db[i]);
        for (i = 1; i * binHz <= 5000; i++) pts.push([i * binHz, db[i] - peak + shift]);
        return pts;
      };

      return {
        source: pick(srcDb, 0),
        filter: pick(filtDb, 0),
        output: pick(outDb, 0),
        formants: Lab.spectralPeaks(filtDb, FS, nfft, { fMax: 4500, minProminence: 3 })
      };
    }

    function draw() {
      var c = curves();
      var t = api.plots.source.t;

      var panels = [
        ['source', c.source, 'the buzz', t.series1],
        ['filter', c.filter, 'the tube', t.series2],
        ['output', c.output, 'what comes out', t.series3]
      ];

      panels.forEach(function (p) {
        var plot = api.plots[p[0]];
        plot.clear();
        plot.frame(FREQ_TICKS, [-40, -20, 0], null, 'dB', fmtFreq);
        if (p[0] !== 'source') {
          c.formants.slice(0, 3).forEach(function (f) {
            plot.vline(f, t.rule, null, { width: 1 });
          });
        }
        plot.line(p[1], p[3], 2);
        plot.text(5000, 4, p[2], t.inkFaint, { align: 'right', baseline: 'top' });
      });

      readout(out, [
        ['vowel', '/' + state.vowel + '/'],
        ['F1', c.formants[0] ? c.formants[0].toFixed(0) + ' Hz' : '—'],
        ['F2', c.formants[1] ? c.formants[1].toFixed(0) + ' Hz' : '—'],
        ['bandwidth B1', bandwidth(state.loss).toFixed(0) + ' Hz'],
        ['lip radiation', state.radiation ? 'on (+6 dB/oct)' : 'off']
      ]);
    }

    function bandwidth(rg) {
      // B = -2 f1 ln(rg * |r_lips|) / pi, with r_lips = -0.85
      var f1 = Lab.resonances(VOWEL_SHAPES[state.vowel], 1)[0] || 500;
      return -2 * f1 * Math.log(rg * 0.85) / Math.PI;
    }

    function sound() {
      return Lab.synth(areas(), {
        f0: state.f0, duration: 1.2,
        radiation: state.radiation, rGlottis: state.loss
      });
    }
    function replay() { if (Lab.audio.isPlaying()) Lab.audio.play(sound(), FS, 'chain'); }

    api = Lab.figure(root, {
      draw: draw,
      setup: function (a) {
        ['source', 'filter', 'output'].forEach(function (name) {
          a.addPlot(name, root.querySelector('[data-plot="' + name + '"]'),
                    { height: 150, xLog: true, xMin: 90, xMax: 5000,
                      yMin: -48, yMax: 8,
                      pad: { left: 44, right: 14, top: 12, bottom: 28 } });
        });

        var vowels = Lab.segmented(
          Object.keys(VOWEL_SHAPES).map(function (v) { return { label: v, value: v }; }),
          state.vowel,
          function (v) { state.vowel = v; draw(); replay(); });
        var wrap = el('div', 'lab-control');
        var head = el('span', 'lab-control__head');
        head.appendChild(el('span', 'lab-control__label', 'vowel'));
        wrap.appendChild(head);
        wrap.appendChild(vowels.el);
        a.controls.appendChild(wrap);

        a.controls.appendChild(Lab.slider({
          label: 'wall losses', min: 0.7, max: 0.999, step: 0.001, value: state.loss,
          format: function (v) { return 'B1 ≈ ' + bandwidth(v).toFixed(0) + ' Hz'; }
        }, function (v) { state.loss = v; draw(); replay(); }).el);

        var radBtn = Lab.button('Lip radiation: on', function () {
          state.radiation = !state.radiation;
          radBtn.textContent = 'Lip radiation: ' + (state.radiation ? 'on' : 'off');
          draw();
          replay();
        }, 'lab-button--ghost');
        a.controls.appendChild(radBtn);

        addPlayButton(a.controls, sound, 'chain', 'Play the result');
      }
    });
  }

  // ------------------------------------------------------------ play button

  /* One shared play/stop button implementation. Only one figure can be audible
   * at a time, so every button re-reads the global audio state on click. */
  function addPlayButton(host, render, key, label) {
    if (!Lab.audio.supported()) return null;

    var btn = Lab.button(label || 'Play', function () {
      if (Lab.audio.playing() === key) {
        Lab.audio.stop();
      } else {
        Lab.audio.play(render(), FS, key);
      }
      refreshAll();
    });
    btn.dataset.audioKey = key;
    btn.dataset.audioLabel = label || 'Play';
    host.appendChild(btn);
    PLAY_BUTTONS.push(btn);
    return btn;
  }

  var PLAY_BUTTONS = [];

  function refreshAll() {
    PLAY_BUTTONS.forEach(function (b) {
      var on = Lab.audio.playing() === b.dataset.audioKey;
      b.textContent = on ? 'Stop' : b.dataset.audioLabel;
      b.classList.toggle('lab-button--ghost', on);
    });
  }

  // ------------------------------------------------------------------- boot

  var FIGURES = {
    'lab-source': initSource,
    'lab-tube': initTube,
    'lab-twotube': initTwoTube,
    'lab-nomogram': initNomogram,
    'lab-tract': initTract,
    'lab-chain': initChain
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

    // stop audio when the reader leaves the page
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { Lab.audio.stop(); refreshAll(); }
    });
  });
})();
