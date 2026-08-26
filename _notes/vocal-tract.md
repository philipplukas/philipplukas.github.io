---
title: Vocal tract
gloss: "The ~17 cm acoustic tube from glottis to lips whose shape sets the formants. Modelled as a chain of cylinders."
aka: [tract]
series: "Speech from first principles"
---

The roughly 17 cm of pharynx and mouth between the glottis and the lips, acting as an acoustic filter whose shape sets the [formants]({{ '/notes/formant/' | relative_url }}). Change the shape — mostly by moving the tongue — and you sweep out the vowel space; two parameters, *where* you constrict and *how hard*, get you most of it.

The physics comes from chopping the tube into short cylinders and asking what happens at each step change in area. Every junction is governed by one [reflection coefficient]({{ '/notes/reflection-coefficient/' | relative_url }}), and chaining them gives the Kelly–Lochbaum lattice — nine lines of code that resonate at the right frequencies to within 0.1 Hz.

Because a child's tract is ~13 cm rather than ~17, every formant scales up together, which is the acoustic reason a recogniser trained on adults struggles on children. See the [source–filter model]({{ '/notes/source-filter-model/' | relative_url }}) for where the tract sits in the chain, and the [all-pole filter]({{ '/notes/all-pole-filter/' | relative_url }}) for what its transfer function turns out to be.
