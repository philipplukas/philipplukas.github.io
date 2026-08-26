---
title: Mel filterbank
gloss: "A bank of triangular filters on a perceptual frequency scale — the cheap, reliable way to get the spectral envelope for recognition."
aka: [MFCC front end, log-mel]
series: "Speech from first principles"
---

A set of overlapping triangular weighting filters spaced on the **mel** scale — roughly linear below 1 kHz, logarithmic above — that sum spectral energy into a few dozen bands. It is a cheaper, blurrier route to the same [formant]({{ '/notes/formant/' | relative_url }}) envelope the [cepstrum]({{ '/notes/cepstrum/' | relative_url }}) recovers: averaging within each band smooths away the [glottal source]({{ '/notes/glottal-source/' | relative_url }})'s fine harmonic comb, and the perceptual spacing puts resolution where vowels actually differ.

Take the log of the band energies and a discrete cosine transform — a cepstrum on the warped spectrum — and you have **MFCCs**, the front end that defined speech recognition for decades. Modern encoders often drop the DCT and feed log-mel energies straight into a convolutional stack, but the filterbank itself has proved stubbornly hard to beat.
