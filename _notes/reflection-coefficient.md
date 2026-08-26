---
title: Reflection coefficient
gloss: "The single number governing a step in tube area. Chain them into a vocal tract; fit them to a signal and they are PARCOR coefficients."
aka: [PARCOR, k]
series: "Speech from first principles"
math: true
---

At a junction between two tube sections of area $$A_k$$ and $$A_{k+1}$$, continuity of pressure and volume velocity forces a single number to govern how much of a wave passes and how much reflects:

$$r_k = \frac{A_k - A_{k+1}}{A_k + A_{k+1}}.$$

A blocked tube gives $$r = +1$$ (reflect in phase — a rigid wall); an opening into infinite space gives $$r = -1$$ (inverted — an open end). The two boundary conditions of the single tube are just the endpoints of this one formula. Chaining junctions is the Kelly–Lochbaum model of the [vocal tract]({{ '/notes/vocal-tract/' | relative_url }}).

The remarkable part: the Levinson–Durbin recursion that fits an [all-pole filter]({{ '/notes/all-pole-filter/' | relative_url }}) to a signal produces exactly these coefficients at each stage. In speech coding they're called PARCOR coefficients — a direct description of the shape of your throat, recovered from nothing but the sound.
