---
title: Formant
gloss: "A resonance of the vocal tract — a peak in the spectral envelope that carries vowel identity, independent of pitch."
aka: [resonance, "F1 / F2 / F3"]
series: "Speech from first principles"
math: true
---

A formant is a resonance of the [vocal tract]({{ '/notes/vocal-tract/' | relative_url }}): a frequency at which the tube of throat and mouth sustains standing pressure waves, and so a peak in the spectral envelope of the sound leaving the lips. For a uniform tube closed at the glottis and open at the lips they sit at

$$F_n = \frac{(2n-1)\,c}{4L},$$

which for a 17.5 cm adult tract gives roughly 500, 1500, 2500 Hz.

What makes formants the load-bearing object in speech is that they belong to the filter, not the [source]({{ '/notes/glottal-source/' | relative_url }}): move your tongue and they move; change your pitch and they stay put. The first two, F1 and F2, separate most vowels on their own — which is why a recogniser's first job is to discard the pitch comb and keep the formant envelope.
