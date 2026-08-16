---
title: "Running the tube backwards"
subtitle: "The acoustic model of a speech recogniser, derived as the inverse of the one that makes the sound."
series: "Speech from first principles"
part: 2
date: 2026-08-11 10:00:00 +0200
description: "Why speech recognition front ends look the way they do — framing, the cepstrum, mel filterbanks, latent alignment, CTC — derived as the problem of recovering a vocal tract from a waveform."
math: true
scripts:
  - /assets/js/lab.js
  - /assets/js/pb52.js
  - /assets/js/lab-asr.js
---

[Part 1]({{ '/writing/how-a-tube-becomes-a-vowel/' | relative_url }}) built a vowel out of a buzz and a tube, and ended at a factorisation:

$$
P_{\text{out}}(\omega) = U_g(\omega)\,V(\omega)\,R(\omega)
$$

Source times filter times radiation. The vowel lives in $$V$$ — the shape of the tube. The pitch, the voice quality, whether the speaker has a cold, all of that lives in $$U_g$$.

A recogniser gets $$P_{\text{out}}$$ and needs the words. So its problem, stated in one line, is: **recover $$V$$ and throw $$U_g$$ away.** That's the entire design brief for a speech front end, and nearly every strange-looking decision in one — the 25 ms window, the logarithm, the triangular filters, the discrete cosine transform nobody uses any more — is a consequence of it.

Everything analysed below is synthesised by the tract model from part 1, which means the true answer is always known. When a front end recovers the filter, you can check it against the tube that actually produced the sound.

## Why you have to chop it up first

The factorisation holds only while the tract is standing still. Speech isn't stationary — that's the point of it — so before anything else, cut the signal into frames short enough that the tongue hasn't moved.

That immediately collides with the uncertainty principle of the Fourier transform. A window of length $$T$$ resolves frequencies no finer than about $$1/T$$:

- **Too short** (5 ms → 200 Hz resolution): individual harmonics, spaced 100–200 Hz apart, blur into each other. What survives is the envelope. The formants are visible; the pitch is gone.
- **Too long** (40 ms → 25 Hz): the harmonic comb is beautifully resolved, and the tongue has moved during the window, so the formants smear.

<figure class="lab" id="lab-frames">
  <p class="lab__title">Figure 1 · The window</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas lab-canvas--short" data-plot="wave" aria-label="A vowel waveform with the analysis window highlighted."></canvas>
    <canvas class="lab-canvas lab-canvas--tall" data-plot="spectrum" aria-label="Spectrum of the windowed segment, with the true formant frequencies marked."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>Resolution is a choice.</b> The vertical lines mark the true formants of the tube that generated the sound. Drag the window down to a few milliseconds and the spectrum becomes a smooth envelope with the peaks sitting where they should — the harmonics have been smeared away, which is exactly what a recogniser wants. Widen it and the comb appears, each tooth a harmonic of f₀; now the picture is dominated by the speaker's pitch. Raise f₀ and watch the teeth spread apart, resolving at a shorter window.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

The standard settings — a 25 ms window, stepped every 10 ms — sit deliberately in the middle. 25 ms is two to three pitch periods for a typical adult voice, long enough that a low-pitched speaker's harmonics don't dominate and short enough that the tract is nearly frozen. The 10 ms hop overlaps the windows so a transient can't fall between two frames.

Those numbers have survived every architectural revolution in the field since the 1970s. They aren't a convention; they're the timescale on which the physics in part 1 is true.

## The cepstrum: undoing the multiplication exactly

Now the central move. We have a product and we want one of its factors. Take logs:

$$
\log|P(\omega)| = \log|U_g(\omega)| + \log|V(\omega)| + \log|R(\omega)|
$$

The product became a **sum**. That's already worth something, but the real trick is what these two terms look like *as functions of $$\omega$$*:

- $$\log|U_g|$$ is the harmonic comb — a rapidly oscillating ripple, wiggling up and down every f₀ hertz.
- $$\log|V|$$ is the formant envelope — slow, smooth, a few broad humps across 5 kHz.

They're separated by *rate of variation along the frequency axis*. And the tool that separates a signal by rate of variation is a Fourier transform. So take the Fourier transform of the log spectrum — a spectrum of a spectrum. Its independent variable has units of time but indexes structure in frequency, so Bogert, Healy and Tukey in 1963 named it **quefrency**, and named the whole thing the **cepstrum**, by spelling "spectrum" backwards. The field kept the joke.

$$
c[n] = \mathcal{F}^{-1}\left\{ \log|P(\omega)| \right\}
$$

And the separation is clean:

- The comb ripples at a rate of one cycle per f₀ hertz, so it lands at quefrency $$1/f_0$$ — a **sharp spike** at 8.3 ms for a 120 Hz voice.
- The envelope varies slowly, so it lands at **low quefrency**, in the first millisecond or two.

Cut the cepstrum in half — "liftering", because the field committed to the spelling gag — and you have separated the tube from the buzz.

<figure class="lab" id="lab-cepstrum">
  <p class="lab__title">Figure 2 · The cepstrum</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas lab-canvas--tall" data-plot="spectrum" aria-label="Log spectrum of a vowel in grey with the liftered envelope overlaid in orange."></canvas>
    <canvas class="lab-canvas" data-plot="cepstrum" aria-label="The cepstrum, showing a large peak at the pitch period and the low-quefrency region kept by the lifter shaded."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>Source and filter, separated.</b> Below, the cepstrum: the shaded region is the vocal tract, and the spike marked "pitch" is the glottis, sitting at exactly one pitch period. Above, the orange curve is what you get by keeping only the shaded part and transforming back. Move the lifter right and the envelope starts tracking individual harmonics — you have begun keeping the source. Move it left and the formants merge into a single hump. Change f₀ and the spike moves; the envelope doesn't.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

Two things are worth pausing on.

**Pitch detection falls out for free.** The quefrency of that spike *is* the pitch period. Measured on the synthesised vowels, it recovers 100, 120 and 200 Hz exactly. Cepstral pitch tracking is still a competitive method sixty years later.

**Formant frequencies do not fall out for free.** You can see the envelope; reading reliable numbers off it is a different and much nastier problem. For /u/, where F1 and F2 are close together on a steep spectral rolloff, naive peak-picking on that orange curve is wrong more often than right. This is why, despite formants being the physically meaningful quantity, essentially no production speech recogniser has ever extracted them. The envelope is kept as an envelope — a few dozen numbers describing a shape — and the classifier is left to work out what the shape means.

That decision, made for engineering reasons in the 1970s, is the reason speech recognition features look like a smoothed spectrum rather than a description of a vocal tract.

## The mel filterbank: the same trick, done cheaper

The cepstrum separates source from filter by transforming twice. There's a blunter route to the same place: just smooth the spectrum. Average energy over bands wide enough to swallow several harmonics and the comb disappears, leaving the envelope.

That raises the question of how wide the bands should be, and here the answer comes from the ear rather than the tube. Human frequency resolution is roughly logarithmic above about 500 Hz: we distinguish 500 from 600 Hz easily and 5000 from 5100 Hz not at all. The **mel scale** is one fit to that behaviour,

$$
m(f) = 2595 \log_{10}\!\left(1 + \frac{f}{700}\right)
$$

and the standard front end lays out triangular filters at equal spacing on it. Near-linear low down, stretching out above 1 kHz.

<figure class="lab" id="lab-mel">
  <p class="lab__title">Figure 3 · The mel filterbank</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas lab-canvas--tall" data-plot="bank" aria-label="Power spectrum of a vowel with triangular mel filters overlaid, narrow at low frequencies and wide at high ones."></canvas>
    <canvas class="lab-canvas lab-canvas--short" data-plot="energies" aria-label="Bar chart of energy in each mel filter."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>Warp, then smooth.</b> The triangles are narrow where the ear is sharp and wide where it isn't. With 26 filters the high-frequency ones are several times wider than the low ones, so the harmonic comb is averaged away up top while F1 and F2 stay distinguishable down low. The bars are what the acoustic model actually sees: 26 numbers, down from 1024. Push the filter count up and the comb starts leaking back in — you're keeping the source again, exactly as with the lifter.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

Then take the log of each band energy, which does three jobs at once: it matches the roughly logarithmic perception of loudness, it turns the remaining multiplicative terms into additive ones, and it compresses a dynamic range of many orders of magnitude into something a classifier can handle.

### The DCT, and why it left

Classically there was one more step. Take the discrete cosine transform of the log-mel energies and keep the first 13 coefficients: **MFCCs**, the most-cited feature in the history of speech.

The DCT is there for a reason that has nothing to do with speech. Adjacent mel bands are highly correlated — a formant lights up several neighbours at once. The acoustic models of the day were Gaussian mixtures with **diagonal** covariance matrices, chosen because full covariances were computationally hopeless. A diagonal Gaussian assumes the features are uncorrelated, so feeding it correlated ones badly misfits. The DCT approximately decorrelates them and the assumption becomes tolerable.

So MFCCs are not a better description of speech than log-mel. They're log-mel bent into a shape that suits a specific classifier from 1980.

Which is exactly why they're gone. A neural network has no diagonal-covariance assumption, models correlated inputs happily, and would rather have the extra information the truncation threw away. Modern systems feed **log-mel filterbank energies** — typically 80 of them — straight in. The DCT was dropped when the reason for it was dropped, and it took the field about a decade to notice.

## The other half of the problem: nobody labelled the frames

Now there's a second, independent difficulty, and it has nothing to do with acoustics.

The front end produces 100 feature vectors a second. The transcript says "cat". Nobody has said which frames are the /k/. Training a frame classifier needs frame labels, and the labels don't exist — the alignment between audio and text is **latent**.

The classical answer is a hidden Markov model. Each phone is a small left-to-right chain of states; each state can loop on itself (making the phone longer) or advance. Given per-frame emission probabilities, the **Viterbi algorithm** finds the single most likely path through the trellis, and that path *is* an alignment.

<figure class="lab" id="lab-viterbi">
  <p class="lab__title">Figure 4 · Alignment as a path</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas" data-plot="trellis" aria-label="A grid of three phone states by sixteen frames, shaded by emission probability, with the best path drawn through it."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>The trellis.</b> Shading is how well each phone explains each frame; the line is the best path, which must start at /k/, end at /t/, and never go backwards. The self-loop probability is a duration prior: raise it and the model prefers long steady phones, lower it and it rushes forward. Nothing here required anyone to label a single frame — only to know the word.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

Training then alternates: align with the current model, retrain on the alignment, realign. That loop — the forward–backward algorithm doing it properly, in expectation over all paths rather than just the best one — is how essentially every recogniser was built for thirty years.

## CTC: summing over every alignment

The HMM approach needs a pronunciation dictionary, phone states, and a lot of scaffolding. **Connectionist temporal classification** throws all of it out and keeps the one idea that mattered: if the alignment is unknown, sum over all of them.

CTC adds a **blank** symbol meaning "no output here", and defines a collapsing rule: merge repeats, then delete blanks. So for four frames, `caat`, `-cat`, `ccat` and `ca-t` all collapse to "cat". Training maximises the total probability of every frame sequence that collapses to the transcript — computed in one dynamic-programming pass, the same shape of recursion as the forward algorithm above.

<figure class="lab" id="lab-ctc">
  <p class="lab__title">Figure 5 · Every path to the same word</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas" data-plot="grid" aria-label="A grid of output symbols including blank against frames, shaded by probability, with the greedy per-frame choice outlined."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>The blank does the work.</b> Outlined cells are the greedy per-frame argmax; the readout shows that path and what it collapses to. Raise the blank bias and the model starts emitting nothing most of the time — which is exactly what real CTC models do, firing in sharp spikes at a few frames and staying blank between them. The last row counts how many distinct frame sequences collapse to "cat": 462 for eight frames, 27,132 for sixteen. Training sums over all of them.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

The blank is what makes the collapsing rule invertible enough to be useful. Without it, "cat" and "caat" would be indistinguishable, and a word with a genuine double letter could never be emitted.

## What replaced the front end, and what didn't

Modern encoders — wav2vec 2.0, Whisper and the rest — appear to have swept this away. Whisper still eats log-mel; wav2vec 2.0 goes further and runs a convolutional stack straight over the raw waveform, learning its own filters from data.

But look at what those learned filters converge to. Train a network on raw audio and its first layer reliably ends up with a bank of bandpass filters, more densely packed at low frequencies than high. It rediscovers a filterbank, roughly mel-shaped, because that is what the data is shaped like. What the learned version gets is the freedom to be *wrong* where mel is wrong — to put resolution where the task needs it rather than where a 1937 psychoacoustics experiment said the ear has it.

The pieces that survived every rewrite are the ones that came from the physics rather than the engineering:

| Choice | Where it comes from | Still there? |
|---|---|---|
| ~25 ms frames | the tract is stationary that long | yes, everywhere |
| Log-magnitude | products become sums; perception is logarithmic | yes |
| Mel-like warping | auditory resolution | yes, learned or fixed |
| Discarding phase | the filter's magnitude carries the vowel | mostly |
| DCT / MFCC | diagonal-covariance Gaussians | gone |
| Explicit formants | — | never adopted |
| Latent alignment | nobody labels frames | yes — CTC, transducers, attention |

## Where this becomes a person

Part 1 derived that formants scale as $$c/4L$$. An adult male tract is about 17.5 cm; a child's is far shorter. So every formant a child produces sits higher than an adult's, by the ratio of the lengths — not shifted, *scaled*.

That is measurable. Taking Peterson and Barney's 1952 recordings and comparing 15 children against 33 men, averaged over ten vowels, the children's formants are higher by a factor of **1.34 for F1, 1.35 for F2 and 1.38 for F3** — a consistent multiplicative shift, exactly as a length change predicts, and implying a child vocal tract of about 13 cm.

The consequence for a recogniser is brutal. Children's /i/ has an F2 between 2730 and 3610 Hz. Men's /i/ has an F2 between 2000 and 2700 Hz. The ranges barely touch. A model that has only ever heard adults has learned a decision boundary in the wrong place, and a child's perfectly well-formed vowel lands outside every region the model knows.

The classical fix follows straight from the physics: if the difference is a scaling, undo the scaling. **Vocal tract length normalisation** warps the frequency axis of a speaker's features by a factor $$\alpha$$ chosen to make them look like the training population.

<figure class="lab" id="lab-vtln">
  <p class="lab__title">Figure 6 · One number that fixes a lot</p>
  <div class="lab-readout" data-readout></div>
  <div class="lab-stage">
    <canvas class="lab-canvas lab-canvas--tall" data-plot="chart" aria-label="Scatter of F1 against F2 for 660 vowel tokens from men and 300 from children, with the children's values divided by a warping factor."></canvas>
    <canvas class="lab-canvas lab-canvas--short" data-plot="misfit" aria-label="Curve of misfit between the warped children's vowels and the men's means, against the warping factor, with a clear minimum."></canvas>
  </div>
  <div class="lab-controls"></div>
  <figcaption><b>Real measurements, one free parameter.</b> Grey is 660 vowel tokens from 33 men; orange is 300 tokens from 15 children, with every formant divided by α. At α = 1 the two clouds are visibly offset. Slide α up and the orange cloud walks onto the grey one; the misfit curve below bottoms out at <b>α = 1.33</b>, which corresponds to a vocal tract of 17.5 / 1.33 ≈ 13.2 cm. Nobody told the optimisation about anatomy. It recovered a child's throat length from vowel formants and one scalar.</figcaption>
  <noscript><p>This figure is interactive and needs JavaScript.</p></noscript>
</figure>

I find that figure genuinely satisfying: a single number, fitted to nothing but formant measurements, lands on the physical length of a child's vocal tract, because part 1 says it must.

It is also where the honest part starts. My [MSc thesis]({{ '/thesis/' | relative_url }}) was about a child with a congenital speech disorder, and VTLN does not fix that. A shorter tract is a *uniform* transformation, and uniform transformations are the easy case — that's the whole reason one scalar works. A cleft palate or an Apert-syndrome craniofacial structure changes the tract's shape, not just its scale: it couples the nasal cavity in permanently, moves constrictions to places the vowel space doesn't have, and introduces zeros that an all-pole model cannot represent even in principle. There is no α for that.

Which is the uncomfortable conclusion of both posts. The model in part 1 is good enough that fifty years of speech technology was built on it, and good enough that one scalar recovers a child's anatomy from a scatter plot. It is also a model of a smooth, unbranched, undamaged tube, and the people most in need of speech technology that works are frequently the people whose tracts are not that. When a foundation model fails on non-normative speech, the training distribution gets the blame, and it deserves a lot of it. But some of the failure is older than the data: it's built into the shape of the representation, and it has been there since we decided a voice was a buzz in a pipe.

## Where to go from here

If you want to go deeper, the two books are Fant's *Acoustic Theory of Speech Production* (1960), which is where the tube models come from, and Rabiner & Schafer's *Digital Processing of Speech Signals* for the DSP. Stevens' *Acoustic Phonetics* is the modern reference and much harder going.

The code behind every figure in both posts is [`lab.js`](https://github.com/philipplukas/philipplukas.github.io/blob/main/assets/js/lab.js), with [a test](https://github.com/philipplukas/philipplukas.github.io/blob/main/tools/test-lab.js) that checks the acoustics against an independent NumPy implementation. If you want to poke at it, the most instructive thing to do is set every reflection coefficient to zero and watch the vowels disappear.
