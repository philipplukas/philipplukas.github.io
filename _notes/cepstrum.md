---
title: Cepstrum
gloss: "The inverse transform of the log spectrum — separating the slow formant envelope from the fast pitch comb by a second Fourier step."
series: "Speech from first principles"
math: true
---

The trick for undoing the [source–filter model]({{ '/notes/source-filter-model/' | relative_url }})'s multiplication. Taking logs turns the product into a sum, $$\log P = \log U_g + \log V$$: the [source]({{ '/notes/glottal-source/' | relative_url }})'s harmonic comb becomes a *fast* ripple across frequency (its spacing is the pitch), while the [vocal-tract]({{ '/notes/vocal-tract/' | relative_url }}) envelope carrying the [formants]({{ '/notes/formant/' | relative_url }}) is *slow*.

A second Fourier transform of the log spectrum then sorts the two by their rate of wiggle: the envelope lands in the low **quefrency** region, the pitch as a sharp peak further out. Keep the low coefficients and you have the formant envelope with the source discarded — exactly the quantity a recogniser wants.

The [mel filterbank]({{ '/notes/mel-filterbank/' | relative_url }}) computes a cheaper, blurrier version of the same envelope; MFCCs are literally the cepstrum of a mel-warped spectrum. Where the [all-pole filter]({{ '/notes/all-pole-filter/' | relative_url }}) assumes the filter's shape, the cepstrum makes no such assumption — it just separates fast from slow.
