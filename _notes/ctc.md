---
title: CTC
gloss: "Connectionist Temporal Classification — training a recogniser to align frames to labels by summing over every possible alignment."
aka: [Connectionist Temporal Classification]
series: "Speech from first principles"
---

The other half of recognition: nobody labels which audio frame belongs to which letter. CTC sidesteps the alignment problem by summing the probability of a target sequence over *every* frame-to-label alignment consistent with it, using a **blank** symbol to absorb repeats and gaps. The sum is computed efficiently by a forward–backward dynamic program, and the whole thing is differentiable, so it trains end to end from audio to text.

It is the alignment-free counterpart to the front end that falls out of the [source–filter model]({{ '/notes/source-filter-model/' | relative_url }}): the [mel filterbank]({{ '/notes/mel-filterbank/' | relative_url }}) and [cepstrum]({{ '/notes/cepstrum/' | relative_url }}) decide *what each frame looks like*, CTC decides *how frames map to symbols* without ever being told the correspondence. Together they are most of a modern recogniser's spine.
