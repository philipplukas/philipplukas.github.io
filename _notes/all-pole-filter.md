---
title: All-pole filter
gloss: "The transfer function of a lossless tube chain: poles, no zeros. Why LPC works — and where it breaks."
aka: [LPC, linear predictive coding]
series: "Speech from first principles"
math: true
---

A lossless chain of tubes, closed at one end and open at the other, has a transfer function with poles and *no zeros*:

$$V(z) = \frac{G}{1 - \sum_{k=1}^{N} a_k z^{-k}}.$$

So the [vocal tract]({{ '/notes/vocal-tract/' | relative_url }}) *is* an all-pole filter — exactly, not by approximation. **Linear predictive coding** exploits this: fitting an all-pole model to a slice of speech is not generic curve-fitting, it is inverting the physics — given the sound, recover the tube. The fit produces, at each order, the [reflection coefficients]({{ '/notes/reflection-coefficient/' | relative_url }}) of the tube ladder.

The all-pole assumption is also where the model breaks. Nasals and laterals hang a side branch off the tract that cuts notches — *zeros* — into the spectrum, and no all-pole filter can represent a zero, only approximate it with extra poles. The [cepstrum]({{ '/notes/cepstrum/' | relative_url }}) is the other classical route to the same [formant]({{ '/notes/formant/' | relative_url }}) envelope, one that doesn't assume the filter's shape in advance.
