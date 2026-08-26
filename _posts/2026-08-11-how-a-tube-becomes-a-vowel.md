---
title: "How a tube becomes a vowel"
subtitle: "Deriving the acoustic model of the human voice from the wave equation — with every step you can hear and take apart."
series: "Speech from first principles"
part: 1
date: 2026-08-11 09:00:00 +0200
description: "A step-by-step derivation of the source-filter model of speech: from conservation of mass in a tube to a vocal tract you can reshape with your mouse and listen to."
math: true
scripts:
  - /assets/js/lab.js
  - /assets/js/lab-tract.js
---

Say "ah", then say "ee", and pay attention to what you changed. Not your vocal folds — the pitch stayed put, and so did the effort. You moved your tongue. Two completely different sounds, driven by the same buzz, separated by nothing but the shape of the space above it.

That observation is the whole model. This post derives it properly: starting from conservation of mass in a pipe, ending at a vocal tract you can reshape by dragging, and hear. Everything below runs in the page, and every number quoted comes out of code that is [in the repository](https://github.com/philipplukas/philipplukas.github.io/blob/main/assets/js/lab.js) with [a test](https://github.com/philipplukas/philipplukas.github.io/blob/main/tools/test-lab.js) that checks it against an independent implementation.

I came to this from the other end. My [MSc thesis]({{ '/thesis/' | relative_url }}) was on adapting speech recognition to children with congenital speech disorders, and the more time I spent trying to make a recogniser work on a voice it had never heard, the more I wanted to understand what it was actually looking at.

## The buzz is not the vowel

Start at the bottom. Air from the lungs meets the vocal folds; they're pulled together, pressure builds, they blow apart, air rushes through, pressure drops, they snap shut. Repeat, a hundred-odd times a second.

What comes out of the glottis is a stream of puffs — a *volume velocity* waveform. Drag the sliders below and listen to it directly. This is not a vowel. It's a buzz, and it sounds like one.

<figure class="lab" id="lab-source">
  <p class="lab__title">Figure 1 · The source</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage lab-stage--split">
    <canvas class="lab-canvas" data-plot="wave" aria-label="Glottal flow waveform over three pitch periods: a slow rise, a faster fall, then a flat closed phase."></canvas>
    <canvas class="lab-canvas" data-plot="spectrum" aria-label="Harmonic spectrum of the glottal source, with harmonics spaced by the pitch and an envelope falling at about 12 decibels per octave."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>The glottal source.</b> Left, flow through the glottis over three periods — a gradual opening, a faster closing, and a closed phase where flow is zero. Right, its spectrum: a comb of harmonics at multiples of f₀, under an envelope falling at about 12 dB per octave. Pitch moves the comb's spacing. The open quotient changes the tilt and the strength of the higher harmonics — but neither turns the buzz into a vowel.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

Two properties matter for everything that follows.

**The spectrum is a comb.** A periodic signal has energy only at multiples of its fundamental. At f₀ = 120 Hz there is energy at 120, 240, 360 Hz and so on, and nothing in between. The comb's *spacing* is the pitch.

**The envelope is smooth and boring.** The harmonics decay at roughly −12 dB/octave, set by the shape of the pulse — mostly by how abruptly the folds slam shut, since a sharper corner in the waveform means more high-frequency energy. Measured on the waveform in that figure, the fitted slope is −12.1 dB/octave.

What the source does *not* have is any structure that distinguishes "ah" from "ee". It carries pitch and voice quality. The vowel is somewhere else.

## Why the problem factorises

The vowel is in the tube: the roughly 17 cm of pharynx and mouth between the glottis and the lips. That tube is an acoustic filter, and the useful claim is that the whole system splits cleanly in two:

$$
P_{\text{out}}(\omega) \;=\; \underbrace{U_g(\omega)}_{\text{source}} \cdot \underbrace{V(\omega)}_{\text{tract}} \cdot \underbrace{R(\omega)}_{\text{radiation}}
$$

Multiplication in the frequency domain: the tract doesn't change *which* frequencies are present, only *how much* of each survives. The source picks the comb; the filter shapes its envelope.

It's an approximation, and it's doing a lot of work. It holds when three things are true.

*The system is linear.* Sound pressures in speech are small compared to atmospheric pressure — a loud vowel is a perturbation on the order of a fraction of a percent — so the equations of motion linearise and superposition applies.

*It is time-invariant over the window we care about.* The tongue moves on a scale of tens of milliseconds. A pitch period is about 8 ms. Over two or three periods the tract is effectively frozen, which is exactly why every speech system in existence chops audio into ~25 ms frames. That number is not a convention; it's the timescale on which this factorisation is true.

*Source and filter don't interact.* This one is the weakest. The glottis is a real, moving boundary of the tube, not an ideal source, and pressure in the pharynx does push back on the folds. The model treats the source as ideal anyway. It's wrong in ways that matter for synthesis naturalness and barely at all for identifying vowels.

Granting those, the job is now specific: **find $$V(\omega)$$ for a tube of a given shape.**

## Sound in a pipe

Take a tube of cross-sectional area $$A$$, and assume the sound field is a plane wave — pressure uniform across any cross-section, varying only along the tube's axis $$x$$. That holds while the wavelength is much larger than the tube's diameter. The vocal tract is about 2 cm across, and at 4 kHz the wavelength is $$c/f \approx 8.75$$ cm. Comfortable below 4 kHz, deteriorating above it — which is one honest reason speech systems have historically thrown away everything above about 8 kHz.

Two conservation laws, written for a slice of air of thickness $$dx$$:

**Momentum.** A pressure difference across the slice accelerates the mass inside it. With $$u$$ the volume velocity (cm³/s) and $$\rho$$ the air density,

$$
-\frac{\partial p}{\partial x} = \frac{\rho}{A}\,\frac{\partial u}{\partial t}
$$

**Mass.** Air piling up in the slice compresses it, and compression raises pressure, with $$\rho c^2$$ the bulk modulus:

$$
-\frac{\partial u}{\partial x} = \frac{A}{\rho c^{2}}\,\frac{\partial p}{\partial t}
$$

Differentiate the first by $$x$$, the second by $$t$$, and eliminate $$u$$:

$$
\frac{\partial^{2} p}{\partial x^{2}} = \frac{1}{c^{2}}\,\frac{\partial^{2} p}{\partial t^{2}}
$$

The wave equation, whose general solution d'Alembert gave us: any pressure field in a uniform tube is a forward-travelling wave plus a backward-travelling one,

$$
p(x,t) = p^{+}\!\left(t - \frac{x}{c}\right) + p^{-}\!\left(t + \frac{x}{c}\right)
$$

with the volume velocity following as $$u = \frac{A}{\rho c}\left(p^{+} - p^{-}\right)$$. The quantity $$Z_0 = \rho c / A$$ is the tube's characteristic impedance, and note where the area sits: **a narrow tube has a high impedance.** That single fact is what makes area changes reflect sound, and everything from here is bookkeeping on those two travelling waves.

## One tube, three formants

The simplest possible vocal tract: one uniform pipe, closed at the glottis, open at the lips. Boundary conditions:

- At the glottis the tube is effectively closed. Velocity can't pass a rigid wall, so $$u = 0$$ — which for a pressure wave means it reflects *in phase*, and pressure has an antinode.
- At the lips the tube opens into a much larger space, so pressure equalises: $$p = 0$$, a pressure node, and the wave reflects *inverted*.

A tube with an antinode at one end and a node at the other fits a quarter wavelength, then three quarters, then five. So resonances sit at

$$
F_n = \frac{(2n-1)\,c}{4L}, \qquad n = 1, 2, 3, \dots
$$

Put in the numbers. Air at body temperature carries sound at about $$c = 35{,}000$$ cm/s, and an adult male vocal tract is about 17.5 cm:

$$
F_1 = \frac{35{,}000}{4 \times 17.5} = 500 \text{ Hz}, \quad F_2 = 1500 \text{ Hz}, \quad F_3 = 2500 \text{ Hz}
$$

500, 1500, 2500. That is the most useful number set in speech acoustics, and it falls out of one length and one boundary condition. These peaks are the **formants**.

<figure class="lab" id="lab-tube">
  <p class="lab__title">Figure 2 · A uniform tube</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas lab-canvas--tall" data-plot="modes" aria-label="A tube closed at the left and open at the right, with three standing pressure waves oscillating inside it — a quarter wave, three quarters, and five quarters."></canvas>
    <canvas class="lab-canvas" data-plot="spectrum" aria-label="Transfer function of the uniform tube, showing evenly spaced resonant peaks."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>The quarter-wave resonator.</b> Top, the first three standing pressure waves: all have an antinode at the closed glottis and a node at the open lips, so they fit one, three and five quarter-wavelengths. Bottom, the resulting transfer function. Shorten the tube and every formant rises together — the neutral vowel of a 12 cm child tract sits near 730/2190/3650 Hz, not 500/1500/2500. That uniform scaling is the reason a speech recogniser trained on adults struggles with children, and it comes back in part 2.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

Sweep the length slider and watch all three formants move together, in lockstep, as $$1/L$$. A uniform tube can only make one sound — a schwa, the neutral "uh". To get vowels we need the tube to stop being uniform.

## Two tubes, and the first real vowel

Give the tube a step: a back cavity of length $$l_1$$ and area $$A_1$$, a front cavity $$l_2, A_2$$. This is already enough to make /ɑ/.

To find the resonances, work with impedances. Looking from the junction toward the open lips, a tube of length $$l$$ terminated in $$p = 0$$ presents $$Z = jZ_{02}\tan(kl_2)$$. Looking the other way, toward the closed glottis, a tube terminated in $$u = 0$$ presents $$Z = -jZ_{01}\cot(kl_1)$$. A resonance is a frequency at which the tract sustains motion with nothing driving it, which happens when those two impedances cancel:

$$
-jZ_{01}\cot(k l_1) + jZ_{02}\tan(k l_2) = 0
$$

Substituting $$Z_0 = \rho c/A$$ and rearranging, the $$\rho c$$ cancels and the condition becomes strikingly simple:

$$
\tan(k l_1)\,\tan(k l_2) = \frac{A_2}{A_1}, \qquad k = \frac{2\pi f}{c}
$$

The geometry enters *only* through the ratio of the areas. Check the limits, because they carry the intuition:

- **$$A_2/A_1 \to \infty$$** (a narrow pharynx opening into a wide mouth). The condition is met when either tangent blows up, i.e. when either tube is a quarter wavelength. The two cavities decouple and resonate independently.
- **$$A_2/A_1 \to 0$$** (wide pharynx, narrow mouth). Now either tangent must vanish — each tube resonates at a half wavelength instead.

Take the first case with the step in the middle, $$l_1 = l_2 = 8.73$$ cm. Both quarter-wave resonances land at 1000 Hz, degenerate. Finite coupling splits that pair — and with $$A_1 = 1$$, $$A_2 = 7$$ cm² the split lands at **772 and 1233 Hz**. Measured /ɑ/ as in "hod", averaged over 33 men, is **718 and 1091 Hz**. A two-parameter model of a step in a pipe lands within a few percent of a real vowel.

<figure class="lab" id="lab-twotube">
  <p class="lab__title">Figure 3 · Two tubes</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas lab-canvas--short" data-plot="tube" aria-label="A two-section tube shown in profile, with a step where the back cavity meets the front cavity."></canvas>
    <canvas class="lab-canvas" data-plot="spectrum" aria-label="Transfer function of the two-tube model with the first three formants marked."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>One step is enough.</b> Move the junction and change the two areas. When the back tube is narrow and the front tube wide — a constricted pharynx and an open mouth, which is what your tongue does for /ɑ/ — F1 and F2 pull together near 1000 Hz. Invert it, wide behind and narrow in front, and F1 collapses toward 250 Hz while F2 climbs: the beginning of /i/.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

## The nomogram

Rather than poke at two areas independently, do what Gunnar Fant did in the 1960s: fix a constriction of a given size and slide it along the tract, from the larynx to the lips, plotting where the formants go. The result is a *nomogram*, and it is the closest thing this field has to a map of the vowel space.

<figure class="lab" id="lab-nomogram">
  <p class="lab__title">Figure 4 · Fant's nomogram</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas lab-canvas--tall" data-plot="nomogram" aria-label="Three curves showing how the first three formant frequencies change as a constriction moves from the glottis to the lips."></canvas>
    <canvas class="lab-canvas lab-canvas--short" data-plot="tube" aria-label="The tube profile for the currently selected constriction position."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>Where the tongue goes, the formants follow.</b> A 3 cm constriction slides from glottis to lips; the curves track F1, F2 and F3. The pharyngeal region on the left gives high F1 and low F2 — the open vowels. The palatal region on the right gives the lowest F1 and a high F2 — /i/. Tightening the constriction stretches the whole picture vertically: constriction <em>degree</em> controls how extreme the vowel is, constriction <em>place</em> controls which vowel it is.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

Two articulatory parameters — where you put your tongue and how hard you squeeze — sweep out the vowel space. This is the acoustic reason vowel charts have the shape they do.

## N tubes: the reflection lattice

Two tubes get you a long way, but a real tract is a smooth flare. So chop it into many short cylinders and work out what happens at each joint.

At a junction between section $$k$$ (area $$A_k$$) and section $$k+1$$, two things must hold: pressure is continuous, and volume velocity is continuous. Write the forward and backward waves on each side and impose both:

$$
p_k^{+} + p_k^{-} = p_{k+1}^{+} + p_{k+1}^{-}
$$

$$
A_k\left(p_k^{+} - p_k^{-}\right) = A_{k+1}\left(p_{k+1}^{+} - p_{k+1}^{-}\right)
$$

Two equations, two unknowns — the wave transmitted forward and the wave sent back. Solving gives a single number that governs the joint, the **reflection coefficient**:

$$
r_k = \frac{A_k - A_{k+1}}{A_k + A_{k+1}}
$$

and with $$w = r_k\left(p_k^{+} - p_{k+1}^{-}\right)$$, the update is pleasingly symmetric:

$$
p_{k+1}^{+} \leftarrow p_k^{+} + w, \qquad p_k^{-} \leftarrow p_{k+1}^{-} + w
$$

Sanity-check the extremes. If section $$k+1$$ has zero area the tube is blocked, $$r_k = +1$$, and the wave comes back in phase — correct for a rigid wall. If it opens into something infinitely wide, $$r_k = -1$$ and the pressure wave inverts — correct for an open end. The two boundary conditions we assumed for the single tube are just the endpoints of this one formula.

Chain those junctions and you have the **Kelly–Lochbaum model**, which in 1962 produced the first singing computer. In code it is unreasonably small:

```python
def step(R, L, k, source, r_glottis=0.97, r_lips=-0.85):
    """One lattice step. R and L are the forward and backward pressure waves."""
    out = R[-1]                                  # the wave reaching the lips

    w = k * (R[:-1] - L[1:])                     # one number per junction
    newR = np.empty_like(R); newL = np.empty_like(L)
    newR[1:] = R[:-1] + w
    newL[:-1] = L[1:] + w

    newR[0] = L[0] * r_glottis + source          # glottis: nearly closed
    newL[-1] = R[-1] * r_lips                    # lips: nearly open

    return newR, newL, out
```

Nine lines, and it is a physical simulation of a vocal tract. The reflection coefficients come straight from the areas:

```python
k = (areas[:-1] - areas[1:]) / (areas[:-1] + areas[1:])
```

One detail decides the geometry. Running the lattice twice per audio sample means a wave advances two sections per sample, so each section is $$c/(2f_s) = 0.397$$ cm at 44.1 kHz, and 44 sections make a 17.46 cm tract. Set every area equal and the lattice resonates at 501.1, 1503.4 and 2505.7 Hz — matching $$(2n-1)c/4L$$ to within 0.1 Hz, which is the check that the derivation above and the code here are the same object.

<figure class="lab" id="lab-tract">
  <p class="lab__title">Figure 5 · A vocal tract you can reshape</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas lab-canvas--draggable" data-plot="shape" aria-label="Cross-sectional area of the vocal tract from glottis to lips, with twelve draggable handles."></canvas>
  </div>
  <div class="lab-stage lab-stage--split">
    <canvas class="lab-canvas" data-plot="spectrum" aria-label="Transfer function of the current tract shape with formants marked."></canvas>
    <canvas class="lab-canvas" data-plot="chart" aria-label="Vowel chart plotting F1 against F2, with measured reference vowels and the current shape marked."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>Forty-four tubes.</b> Drag the handles to change the cross-sectional area along the tract, or hit a preset. Left, the transfer function; right, where the shape lands on an F1–F2 vowel chart against measured reference vowels (grey, Peterson &amp; Barney 1952, adult men). Squeeze the front and the marker walks toward /i/; squeeze the pharynx and it walks toward /ɑ/. The preset shapes were fitted to those measurements by grid search over four-tube geometries — F1 and F2 land within a couple of percent for every vowel except /i/, which needs a finer shape than four cylinders can express.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

## What's still missing: losses, and the lips

A lossless tube has infinitely sharp resonances, and real formants are visibly rounded. Energy leaves in three ways: the walls are soft and move, air is viscous and conducts heat, and — dominating at high frequency — sound escapes the mouth, which is the entire point.

Lumping all of it into the two reflections makes the arithmetic transparent. Over one period of F1 a wave makes two round trips, so the amplitude is multiplied by $$(r_g r_l)^2$$, and matching that to the envelope $$e^{-\pi B t}$$ of a resonance of bandwidth $$B$$:

$$
B = -\frac{2 F_1 \ln(r_g\,|r_l|)}{\pi}
$$

With $$r_g = 0.97$$ and $$r_l = -0.85$$ this predicts a first-formant bandwidth of 62 Hz; measuring the −3 dB points on the simulated spectrum gives 65 Hz. Real first formants are 50–90 Hz wide. Turning the loss slider below to a lossless tract makes the vowel sound metallic and artificial, which is a nice demonstration that damping is not an imperfection to be minimised — it's part of the sound.

Then the lips. The tract's output is a flow, but what reaches a microphone is pressure, and radiation from a small opening makes pressure proportional to the *rate of change* of flow. Differentiation is +6 dB/octave. Against the source's −12, the net spectral tilt of a vowel is about −6 dB/octave, which is exactly what the measurement gives: −12.1 at the glottis, −6.4 after radiation.

<figure class="lab" id="lab-chain">
  <p class="lab__title">Figure 6 · Source × filter × radiation</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas lab-canvas--short" data-plot="source" aria-label="Spectrum of the glottal source: a harmonic comb falling with frequency."></canvas>
    <canvas class="lab-canvas lab-canvas--short" data-plot="filter" aria-label="Transfer function of the vocal tract, showing formant peaks."></canvas>
    <canvas class="lab-canvas lab-canvas--short" data-plot="output" aria-label="Spectrum of the radiated vowel: the harmonic comb shaped by the formant peaks."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>The whole chain.</b> On a dB scale multiplication becomes addition, so the bottom panel is the top two stacked. The comb comes from the source and carries the pitch; the peaks come from the tube and carry the vowel; you can change one without touching the other. Increasing the wall losses widens the formants; switching off lip radiation tilts the output down by 6 dB/octave and makes it sound muffled and internal.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

## Where this lands: it was an all-pole filter the whole time

A lossless chain of $$N$$ tubes, closed at one end and open at the other, has a transfer function with poles and *no zeros*. Written as a digital filter, that is

$$
V(z) = \frac{G}{1 - \sum_{k=1}^{N} a_k z^{-k}}
$$

— an all-pole model of order $$N$$. And the mapping runs both ways: the Levinson–Durbin recursion that fits such a filter to a signal produces, at every stage, exactly the reflection coefficients $$r_k$$ of the tube ladder. They're called PARCOR coefficients in the speech coding literature, and they are the same numbers as the ones derived above.

This is why **linear predictive coding** works, and why it dominated speech technology for forty years. When LPC fits an all-pole filter to a slice of your speech, it is not doing generic curve fitting. It is inverting the physical model in this post: given the sound, recover the tube. The coefficients your phone ships when it compresses your voice are a description of the shape of your throat.

That, finally, is the connection to recognition. A recogniser has to answer "which vowel is this?" from a waveform, and this model says the answer lives in the filter, not the source — in the formant peaks, not the harmonic comb. So its first job is to throw the source away and keep the envelope. Every front end in speech, from the cepstrum in 1963 to the convolutional stack at the bottom of a modern encoder, is a variation on that one move.

## What the model doesn't do

Being clear about the edges, because a model you trust past its limits is worse than no model:

- **Nasals and laterals have zeros.** Open the velum and the nasal cavity hangs off the side of the tract as a branch, trapping energy at its own resonances and cutting notches in the output. Notches are zeros, and an all-pole model cannot represent them — it approximates them with extra poles.
- **Fricatives have the wrong source.** /s/ and /f/ aren't driven by the glottis at all but by turbulence at a constriction, which is noisy, not periodic, and located partway up the tube instead of at the bottom. The filter reasoning survives; the source model doesn't.
- **The source does interact with the tract.** Real glottal flow is skewed by the pharynx pushing back on it, and ripple from the first formant is visible in careful measurements of the flow itself.
- **Plane waves fail above ~4 kHz**, where the tract stops being acoustically narrow and higher modes appear.
- **The piriform sinuses and other side branches** put fixed notches around 4–5 kHz into everybody's spectrum, which is part of why speaker identity survives so much distortion.

None of that damages the core result. Two conservation laws and a boundary condition give you formants; a chain of reflection coefficients gives you every vowel; and the resulting filter is all-pole, which is the fact the next fifty years of speech technology was built on.

## Next

[Part 2]({{ '/writing/running-the-tube-backwards/' | relative_url }}) runs the model in reverse. Given a waveform and no idea what shape produced it, how do you recover the filter and discard the source? That question turns out to generate the entire front end of a speech recogniser — framing, windowing, the cepstrum, mel filterbanks, and why modern systems quietly dropped half of it — and it ends where my thesis started, with a child whose vocal tract is 13 cm long talking to a model that has only ever heard 17 cm ones.