---
title: Source–filter model
gloss: "Speech = a source spectrum × a vocal-tract filter × lip radiation. The factorisation the whole field rests on."
series: "Speech from first principles"
math: true
---

The claim that a speech sound factorises into three independent stages:

$$P_{\text{out}}(\omega) = U_g(\omega)\,V(\omega)\,R(\omega),$$

a [glottal source]({{ '/notes/glottal-source/' | relative_url }}) spectrum, a [vocal-tract]({{ '/notes/vocal-tract/' | relative_url }}) filter, and a lip-radiation term. Multiplication in frequency means the tract changes only *how much* of each frequency survives, not *which* are present: the source picks the harmonic comb and its pitch; the filter shapes the envelope and its [formants]({{ '/notes/formant/' | relative_url }}).

It holds when the system is linear (speech pressures are a fraction of a percent of atmospheric), time-invariant over ~25 ms (the tongue is slow — which is why every front end chops audio into ~25 ms frames), and source and filter don't interact (the weakest of the three). Granting those, "which vowel?" collapses to "what filter?" — and a recogniser's whole front end is the machinery for [recovering that filter]({{ '/notes/cepstrum/' | relative_url }}) and throwing the source away.
