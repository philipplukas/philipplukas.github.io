/* lab.js — shared plumbing for the interactive figures in the
 * "Speech from first principles" series.
 *
 * Deliberately dependency-free and framework-free: plotting is 2D canvas,
 * audio is WebAudio, and the DSP is a few hundred lines below. Everything
 * reads its colours from the stylesheet's custom properties, so the figures
 * follow light/dark mode without a second palette.
 *
 * The acoustics here are the same equations derived in the posts, and were
 * checked against an independent frequency-domain implementation: a uniform
 * 17.46 cm tube resonates at 501/1503/2506 Hz, matching (2n-1)c/4L to 0.1 Hz.
 */
window.Lab = (function () {
  'use strict';

  var C_SOUND = 35000;      // speed of sound in cm/s at body temperature
  var FS = 44100;

  // ------------------------------------------------------------------ theme

  var THEME_KEYS = ['--ink', '--ink-muted', '--ink-faint', '--rule',
                    '--rule-strong', '--accent', '--accent-strong',
                    '--accent-wash', '--brand-purple', '--surface', '--bg',
                    '--series-1', '--series-2', '--series-3'];

  function theme() {
    var cs = getComputedStyle(document.documentElement);
    var out = {};
    THEME_KEYS.forEach(function (k) {
      out[k.replace('--', '').replace(/-(\w)/g, function (_, c) {
        return c.toUpperCase();       // --ink-faint -> inkFaint, --series-1 -> series1
      })] = cs.getPropertyValue(k).trim();
    });
    return out;
  }

  var themeListeners = [];

  function onThemeChange(fn) {
    themeListeners.push(fn);
  }

  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var notify = function () {
      themeListeners.forEach(function (fn) { fn(); });
    };
    if (mq.addEventListener) mq.addEventListener('change', notify);
    else if (mq.addListener) mq.addListener(notify);
  }

  // ------------------------------------------------------------------ plot

  /* A small canvas wrapper: device-pixel-ratio aware, redraws on resize and
   * on a theme flip, and maps data coordinates to pixels. */
  function Plot(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = opts || {};
    this.pad = Object.assign(
      { left: 52, right: 12, top: 12, bottom: 30 }, this.opts.pad || {});
    this.xMin = this.opts.xMin || 0;
    this.xMax = this.opts.xMax || 1;
    this.yMin = this.opts.yMin || 0;
    this.yMax = this.opts.yMax || 1;
    this.xLog = !!this.opts.xLog;
    this.resize();
  }

  Plot.prototype.resize = function () {
    var dpr = window.devicePixelRatio || 1;
    var rect = this.canvas.getBoundingClientRect();
    var cssW = rect.width || this.canvas.clientWidth || 600;
    var cssH = this.opts.height || 220;
    this.canvas.style.height = cssH + 'px';
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.w = cssW;
    this.h = cssH;
    this.t = theme();
  };

  Plot.prototype.px = function (x) {
    var lo = this.xLog ? Math.log(this.xMin) : this.xMin;
    var hi = this.xLog ? Math.log(this.xMax) : this.xMax;
    var v = this.xLog ? Math.log(Math.max(x, 1e-9)) : x;
    var frac = (v - lo) / (hi - lo);
    return this.pad.left + frac * (this.w - this.pad.left - this.pad.right);
  };

  Plot.prototype.py = function (y) {
    var frac = (y - this.yMin) / (this.yMax - this.yMin);
    return this.h - this.pad.bottom - frac * (this.h - this.pad.top - this.pad.bottom);
  };

  Plot.prototype.clear = function () {
    this.t = theme();
    this.ctx.clearRect(0, 0, this.w, this.h);
  };

  Plot.prototype.frame = function (xTicks, yTicks, xLabel, yLabel, fmtX, fmtY) {
    var c = this.ctx, t = this.t;
    c.save();
    c.strokeStyle = t.rule;
    c.fillStyle = t.inkFaint;
    c.lineWidth = 1;
    c.font = '11px ' + getComputedStyle(document.body).fontFamily;

    (yTicks || []).forEach(function (y) {
      var py = Math.round(this.py(y)) + 0.5;
      c.beginPath();
      c.moveTo(this.pad.left, py);
      c.lineTo(this.w - this.pad.right, py);
      c.stroke();
      c.textAlign = 'right';
      c.textBaseline = 'middle';
      c.fillText(fmtY ? fmtY(y) : String(y), this.pad.left - 8, py);
    }, this);

    (xTicks || []).forEach(function (x) {
      var pxv = Math.round(this.px(x)) + 0.5;
      c.beginPath();
      c.moveTo(pxv, this.pad.top);
      c.lineTo(pxv, this.h - this.pad.bottom);
      c.strokeStyle = t.rule;
      c.stroke();
      c.textAlign = 'center';
      c.textBaseline = 'top';
      c.fillText(fmtX ? fmtX(x) : String(x), pxv, this.h - this.pad.bottom + 6);
    }, this);

    if (xLabel) {
      c.textAlign = 'end';
      c.textBaseline = 'bottom';
      c.fillText(xLabel, this.w - this.pad.right, this.h - 2);
    }
    if (yLabel) {
      c.save();
      c.translate(11, this.pad.top);
      c.rotate(-Math.PI / 2);
      c.textAlign = 'end';
      c.textBaseline = 'top';
      c.fillText(yLabel, 0, 0);
      c.restore();
    }
    c.restore();
  };

  /* points: array of [x, y] in data coordinates */
  Plot.prototype.line = function (points, color, width, dash) {
    var c = this.ctx;
    c.save();
    c.beginPath();
    c.strokeStyle = color;
    c.lineWidth = width || 1.75;
    c.lineJoin = 'round';
    if (dash) c.setLineDash(dash);
    for (var i = 0; i < points.length; i++) {
      var x = this.px(points[i][0]), y = this.py(points[i][1]);
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();
    c.restore();
  };

  Plot.prototype.fillUnder = function (points, color) {
    var c = this.ctx;
    c.save();
    c.beginPath();
    c.fillStyle = color;
    c.moveTo(this.px(points[0][0]), this.py(this.yMin));
    for (var i = 0; i < points.length; i++) {
      c.lineTo(this.px(points[i][0]), this.py(points[i][1]));
    }
    c.lineTo(this.px(points[points.length - 1][0]), this.py(this.yMin));
    c.closePath();
    c.fill();
    c.restore();
  };

  Plot.prototype.vline = function (x, color, label, opts) {
    opts = opts || {};
    var c = this.ctx;
    var pxv = Math.round(this.px(x)) + 0.5;
    c.save();
    c.strokeStyle = color;
    c.lineWidth = opts.width || 1.25;
    if (opts.dash !== false) c.setLineDash(opts.dash || [3, 3]);
    c.beginPath();
    c.moveTo(pxv, this.pad.top);
    c.lineTo(pxv, this.h - this.pad.bottom);
    c.stroke();
    if (label) {
      c.setLineDash([]);
      c.fillStyle = color;
      c.font = '600 11px ' + getComputedStyle(document.body).fontFamily;
      c.textAlign = opts.align || 'center';
      c.textBaseline = 'top';
      c.fillText(label, pxv, this.pad.top + (opts.labelOffset || 0));
    }
    c.restore();
  };

  Plot.prototype.dot = function (x, y, color, r) {
    var c = this.ctx;
    c.save();
    c.fillStyle = color;
    c.beginPath();
    c.arc(this.px(x), this.py(y), r || 4, 0, 2 * Math.PI);
    c.fill();
    c.restore();
  };

  Plot.prototype.text = function (x, y, str, color, opts) {
    opts = opts || {};
    var c = this.ctx;
    c.save();
    c.fillStyle = color;
    c.font = (opts.weight || '') + ' ' + (opts.size || 11) + 'px ' +
             getComputedStyle(document.body).fontFamily;
    c.textAlign = opts.align || 'left';
    c.textBaseline = opts.baseline || 'alphabetic';
    c.fillText(str, this.px(x) + (opts.dx || 0), this.py(y) + (opts.dy || 0));
    c.restore();
  };

  // --------------------------------------------------------------- controls

  /* Builds a labelled range input. spec: {label, min, max, step, value, unit,
   * format(v) -> string}. Returns {el, input, set(v), value()}. */
  function slider(spec, onInput) {
    var wrap = document.createElement('label');
    wrap.className = 'lab-control';

    var name = document.createElement('span');
    name.className = 'lab-control__label';
    name.textContent = spec.label;

    var out = document.createElement('span');
    out.className = 'lab-control__value';

    var input = document.createElement('input');
    input.type = 'range';
    input.min = spec.min;
    input.max = spec.max;
    input.step = spec.step || 1;
    input.value = spec.value;
    if (spec.label) input.setAttribute('aria-label', spec.label);

    function fmt(v) {
      return spec.format ? spec.format(v) : (v + (spec.unit || ''));
    }

    function sync() {
      out.textContent = fmt(parseFloat(input.value));
    }

    input.addEventListener('input', function () {
      sync();
      onInput(parseFloat(input.value));
    });
    sync();

    var head = document.createElement('span');
    head.className = 'lab-control__head';
    head.appendChild(name);
    head.appendChild(out);
    wrap.appendChild(head);
    wrap.appendChild(input);

    return {
      el: wrap,
      input: input,
      value: function () { return parseFloat(input.value); },
      set: function (v) { input.value = v; sync(); }
    };
  }

  function button(label, onClick, className) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'lab-button' + (className ? ' ' + className : '');
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function segmented(options, initial, onChange) {
    var wrap = document.createElement('div');
    wrap.className = 'lab-segmented';
    wrap.setAttribute('role', 'group');
    var buttons = [];
    options.forEach(function (opt) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lab-segmented__item';
      b.textContent = opt.label;
      b.setAttribute('aria-pressed', String(opt.value === initial));
      b.addEventListener('click', function () {
        buttons.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other === b));
        });
        onChange(opt.value);
      });
      buttons.push(b);
      wrap.appendChild(b);
    });
    return { el: wrap, buttons: buttons };
  }

  // ------------------------------------------------------------------ audio

  /* One shared AudioContext, created on the first user gesture (browsers
   * refuse to start one otherwise). Signals are rendered offline into a
   * looping buffer rather than streamed through an AudioWorklet: the tract
   * only changes when a slider moves, and re-rendering 1.5 s of audio takes
   * about a millisecond. */
  var audio = (function () {
    var ctx = null, source = null, gain = null, current = null;

    function context() {
      if (!ctx) {
        var Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return null;
        ctx = new Ctor();
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function stop() {
      if (source) {
        try {
          gain.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
          var dying = source;
          setTimeout(function () { try { dying.stop(); } catch (e) {} }, 80);
        } catch (e) {}
        source = null;
      }
      current = null;
    }

    /* samples: Float32Array at `rate`, looped seamlessly. */
    function play(samples, rate, key) {
      var c = context();
      if (!c) return false;
      stop();
      var buf = c.createBuffer(1, samples.length, rate || FS);
      buf.copyToChannel ? buf.copyToChannel(samples, 0)
                        : buf.getChannelData(0).set(samples);
      gain = c.createGain();
      gain.gain.value = 0;
      gain.gain.setTargetAtTime(0.35, c.currentTime, 0.015);
      source = c.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      source.connect(gain);
      gain.connect(c.destination);
      source.start();
      current = key || true;
      return true;
    }

    return {
      play: play,
      stop: stop,
      playing: function () { return current; },
      isPlaying: function () { return source !== null; },
      supported: function () {
        return !!(window.AudioContext || window.webkitAudioContext);
      }
    };
  })();

  // -------------------------------------------------------------------- DSP

  /* In-place iterative radix-2 FFT. re/im are Float64Array of length 2^m. */
  function fft(re, im) {
    var n = re.length, i, j, k;
    for (i = 1, j = 0; i < n; i++) {
      var bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        var tr = re[i]; re[i] = re[j]; re[j] = tr;
        var ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
    }
    for (var len = 2; len <= n; len <<= 1) {
      var ang = -2 * Math.PI / len;
      var wr = Math.cos(ang), wi = Math.sin(ang);
      for (i = 0; i < n; i += len) {
        var cr = 1, ci = 0;
        for (k = 0; k < len / 2; k++) {
          var ur = re[i + k], ui = im[i + k];
          var vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
          var vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
          re[i + k] = ur + vr; im[i + k] = ui + vi;
          re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
          var ncr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr;
          cr = ncr;
        }
      }
    }
  }

  /* Magnitude spectrum in dB, returned for bins 0..n/2. */
  function spectrumDb(signal, nfft) {
    nfft = nfft || 4096;
    var re = new Float64Array(nfft), im = new Float64Array(nfft);
    var n = Math.min(signal.length, nfft);
    for (var i = 0; i < n; i++) re[i] = signal[i];
    fft(re, im);
    var out = new Float64Array(nfft / 2);
    for (var b = 0; b < nfft / 2; b++) {
      out[b] = 20 * Math.log10(Math.sqrt(re[b] * re[b] + im[b] * im[b]) + 1e-12);
    }
    return out;
  }

  function hann(n) {
    var w = new Float64Array(n);
    for (var i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1));
    return w;
  }

  /* Rosenberg glottal pulse: volume-velocity flow through the glottis over one
   * period. Opening is a raised cosine, closing a quarter cosine; the abrupt
   * closure is what puts energy at high frequencies. `oq` is the fraction of
   * the period the glottis is open. Spectral rolloff is about -12 dB/octave. */
  function glottalPulse(t, oq) {
    var open = Math.max(0.05, Math.min(0.95, oq));
    var t1 = open * 0.72, t2 = open * 0.28;
    if (t < t1) return 0.5 * (1 - Math.cos(Math.PI * t / t1));
    if (t < t1 + t2) return Math.cos(Math.PI * (t - t1) / (2 * t2));
    return 0;
  }

  /* n samples of a glottal flow waveform at f0. */
  function glottalWave(n, f0, oq, fs) {
    fs = fs || FS;
    var out = new Float64Array(n);
    var period = fs / f0;
    for (var i = 0; i < n; i++) {
      out[i] = glottalPulse((i % period) / period, oq);
    }
    return out;
  }

  // ---------------------------------------------------- Kelly-Lochbaum tract

  /* A chain of cylindrical sections, each one lattice step long. Pressure-wave
   * convention:
   *
   *     r_k = (A_k - A_{k+1}) / (A_k + A_{k+1})
   *
   * so r = +1 at a closed end (pressure reflects in phase) and r = -1 at an
   * open one (pressure inverts). At each junction, with w = r (R - L):
   *
   *     R'_{k+1} = R_k     + w
   *     L'_k     = L_{k+1} + w
   *
   * Two lattice steps run per audio sample, so a wave advances two sections
   * per sample and the tube length is N * c / (2 * fs) = N * 0.3968 cm. */
  function Tract(areas, opts) {
    opts = opts || {};
    this.n = areas.length;
    this.areas = Float64Array.from(areas);
    this.k = new Float64Array(this.n - 1);
    this.R = new Float64Array(this.n);
    this.L = new Float64Array(this.n);
    this.nR = new Float64Array(this.n);
    this.nL = new Float64Array(this.n);
    // r_glottis 0.97 with r_lips -0.85 gives F1 bandwidth ~60 Hz, which is
    // what real formants have; see the losses section of part one.
    this.rGlottis = opts.rGlottis === undefined ? 0.97 : opts.rGlottis;
    this.rLips = opts.rLips === undefined ? -0.85 : opts.rLips;
    this.setAreas(areas);
  }

  Tract.prototype.setAreas = function (areas) {
    for (var i = 0; i < this.n; i++) this.areas[i] = Math.max(1e-4, areas[i]);
    for (var j = 0; j < this.n - 1; j++) {
      var a = this.areas[j], b = this.areas[j + 1];
      this.k[j] = (a - b) / (a + b);
    }
  };

  Tract.prototype.reset = function () {
    this.R.fill(0);
    this.L.fill(0);
  };

  /* One lattice step. Returns the wave arriving at the lips. */
  Tract.prototype.step = function (input) {
    var n = this.n, R = this.R, L = this.L, nR = this.nR, nL = this.nL, k = this.k;
    var out = R[n - 1];

    for (var i = 0; i < n - 1; i++) {
      var w = k[i] * (R[i] - L[i + 1]);
      nR[i + 1] = R[i] + w;
      nL[i] = L[i + 1] + w;
    }
    nR[0] = L[0] * this.rGlottis + input;
    nL[n - 1] = R[n - 1] * this.rLips;

    this.R = nR; this.nR = R;
    this.L = nL; this.nL = L;
    return out;
  };

  /* Run a source signal through the tract. Two lattice steps per sample. */
  Tract.prototype.process = function (source) {
    var out = new Float64Array(source.length);
    for (var i = 0; i < source.length; i++) {
      out[i] = 0.5 * (this.step(source[i]) + this.step(0));
    }
    return out;
  };

  Tract.prototype.impulseResponse = function (n) {
    this.reset();
    var src = new Float64Array(n);
    src[0] = 1;
    return this.process(src);
  };

  /* Lip radiation: the radiated pressure goes as the time derivative of the
   * volume velocity leaving the mouth, i.e. +6 dB/octave. */
  function radiate(signal) {
    var out = new Float64Array(signal.length);
    var prev = 0;
    for (var i = 0; i < signal.length; i++) {
      out[i] = signal[i] - 0.98 * prev;
      prev = signal[i];
    }
    return out;
  }

  /* Analytic resonances of a piecewise-uniform tube, closed at the glottis and
   * open at the lips. Recurses the lossless transmission-line impedance from
   * the lips backwards, carrying the reactance as numerator/denominator so the
   * tangent poles never overflow; resonances are the zeros of the denominator.
   * segments: [[length_cm, area_cm2], ...] from glottis to lips. */
  function resonances(segments, count, fmax) {
    count = count || 4;
    fmax = fmax || 5000;
    var df = 1.0, out = [];
    var prevD = null, prevF = 0;

    for (var f = 20; f <= fmax; f += df) {
      var N = 0, D = 1;
      var k = 2 * Math.PI * f / C_SOUND;
      for (var s = segments.length - 1; s >= 0; s--) {
        var z0 = 1 / segments[s][1];
        var ph = k * segments[s][0];
        var cs = Math.cos(ph), sn = Math.sin(ph);
        var nN = z0 * (N * cs + z0 * D * sn);
        var nD = z0 * D * cs - N * sn;
        var scale = Math.max(Math.abs(nN), Math.abs(nD)) || 1;
        N = nN / scale; D = nD / scale;
      }
      if (prevD !== null && prevD * D < 0) {
        var t = prevD / (prevD - D);
        out.push(prevF + t * df);
        if (out.length >= count) break;
      }
      prevD = D; prevF = f;
    }
    return out;
  }

  /* Discretise [[length_cm, area_cm2], ...] onto n equal sections spanning the
   * segments' own total length. At n = 44 with a 17.46 cm tract this lands
   * exactly on the lattice spacing c/(2 fs). */
  function sections(segments, n) {
    n = n || 44;
    var out = new Float64Array(n);
    var edges = [], total = 0, i;
    for (i = 0; i < segments.length; i++) {
      total += segments[i][0];
      edges.push(total);
    }
    for (i = 0; i < n; i++) {
      var x = (i + 0.5) * total / n;
      var s = 0;
      while (s < edges.length - 1 && x > edges[s]) s++;
      out[i] = segments[s][1];
    }
    return out;
  }

  /* Resample a short array of control-point areas up to n sections with
   * linear interpolation — what the draggable area function uses. */
  function interpolateAreas(points, n) {
    var out = new Float64Array(n);
    for (var i = 0; i < n; i++) {
      var t = i * (points.length - 1) / (n - 1);
      var j = Math.min(points.length - 2, Math.floor(t));
      var f = t - j;
      out[i] = points[j] * (1 - f) + points[j + 1] * f;
    }
    return out;
  }

  /* Render a looping vowel: a periodic glottal source through the tract,
   * optionally through lip radiation. The source period is a whole number of
   * samples and the returned segment a whole number of periods, so the buffer
   * loops without a click; the first few periods are discarded so the tract
   * has settled before the loop point. */
  function synth(areas, opts) {
    opts = opts || {};
    var f0 = opts.f0 || 120;
    var period = Math.max(2, Math.round(FS / f0));
    var periods = Math.max(1, Math.round((opts.duration || 1.2) * FS / period));
    var warmup = period * 10;
    var total = warmup + period * periods;

    var src = new Float64Array(total);
    for (var i = 0; i < total; i++) {
      src[i] = glottalPulse((i % period) / period, opts.oq || 0.56);
    }

    var tract = new Tract(areas, opts);
    var wave = tract.process(src);
    if (opts.radiation !== false) wave = radiate(wave);

    var peak = 0;
    for (i = warmup; i < total; i++) peak = Math.max(peak, Math.abs(wave[i]));
    var gain = peak > 0 ? 0.9 / peak : 0;

    var out = new Float32Array(total - warmup);
    for (i = 0; i < out.length; i++) out[i] = wave[warmup + i] * gain;
    return out;
  }

  /* Peaks of a dB spectrum, with a prominence test so ripple isn't mistaken
   * for a formant. Returns frequencies in Hz. */
  function spectralPeaks(db, fs, nfft, opts) {
    opts = opts || {};
    var minProm = opts.minProminence || 3;
    var fMin = opts.fMin || 90, fMax = opts.fMax || 5000;
    var binHz = fs / nfft;
    var peaks = [];

    for (var i = 1; i < db.length - 1; i++) {
      var f = i * binHz;
      if (f < fMin) continue;
      if (f > fMax) break;
      if (!(db[i] > db[i - 1] && db[i] >= db[i + 1])) continue;

      var lo = db[i], hi = db[i], j;
      for (j = i - 1; j >= 0 && db[j] <= db[j + 1]; j--) lo = Math.min(lo, db[j]);
      for (j = i + 1; j < db.length && db[j] <= db[j - 1]; j++) hi = Math.min(hi, db[j]);
      if (db[i] - Math.max(lo, hi) < minProm) continue;

      // parabolic interpolation for sub-bin accuracy
      var a = db[i - 1], b = db[i], c = db[i + 1];
      var off = 0.5 * (a - c) / (a - 2 * b + c);
      peaks.push((i + off) * binHz);
    }
    return peaks;
  }

  // ------------------------------------------------------------- scaffolding

  /* Wires a figure: finds the canvas + control host inside `root`, calls
   * draw() now, on resize, and on theme change. */
  function figure(root, opts) {
    var plots = {};
    var api = {
      root: root,
      plots: plots,
      controls: root.querySelector('.lab-controls'),
      addPlot: function (name, canvas, plotOpts) {
        plots[name] = new Plot(canvas, plotOpts);
        return plots[name];
      },
      redraw: function () {
        Object.keys(plots).forEach(function (k) { plots[k].resize(); });
        if (opts.draw) opts.draw(api);
      }
    };

    if (opts.setup) opts.setup(api);

    // Widgets are written as `api = Lab.figure(root, {...})`, so that variable
    // is still unbound while this function runs and a draw() closing over it
    // would throw. Defer the first paint by a tick so the assignment lands.
    setTimeout(function () { api.redraw(); }, 0);

    var pending = null;
    window.addEventListener('resize', function () {
      clearTimeout(pending);
      pending = setTimeout(function () { api.redraw(); }, 120);
    });
    onThemeChange(function () { api.redraw(); });

    return api;
  }

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  return {
    C: C_SOUND,
    FS: FS,
    theme: theme,
    onThemeChange: onThemeChange,
    Plot: Plot,
    slider: slider,
    button: button,
    segmented: segmented,
    audio: audio,
    fft: fft,
    spectrumDb: spectrumDb,
    hann: hann,
    glottalPulse: glottalPulse,
    glottalWave: glottalWave,
    Tract: Tract,
    radiate: radiate,
    sections: sections,
    interpolateAreas: interpolateAreas,
    synth: synth,
    resonances: resonances,
    spectralPeaks: spectralPeaks,
    figure: figure,
    ready: ready
  };
})();
