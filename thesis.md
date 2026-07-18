---
layout: page
title: "Speech Recognition for Children with Congenital Disorders"
subtitle: "Adapting Whisper to non-normative child speech from a single speaker"
description: "MSc thesis at ETH Zürich — can a speech foundation model be adapted to a child with a congenital speech disorder from very little data?"
permalink: /thesis/
nav: thesis
hero: true
---

<p class="kicker">MSc Thesis · ETH Zürich · 2024</p>

<h1 class="page-title">Speech Recognition for Children with Congenital Disorders Using Adaptive Methods</h1>

<p class="lede">Speech recognition has become good enough to be invisible for most people. For children with congenital speech disorders — the users who would benefit most — it largely does not work at all. This thesis asks how far a modern speech foundation model can be pushed toward one such speaker when the available data is a few hours from a single child.</p>

<dl class="facts">
  <dt>Degree</dt>
  <dd>MSc Computer Science — Machine Intelligence, ETH Zürich (graded top mark)</dd>
  <dt>Lab</dt>
  <dd>Supervised within ETH Zürich; with Roman Böhringer, Pehuén Patricio Moure and Dr. Yingqiang Gao</dd>
  <dt>Domain</dt>
  <dd>Automatic speech recognition · non-normative child speech · German / Swiss German</dd>
  <dt>Methods</dt>
  <dd>Whisper fine-tuning, layer insertion, LoRA / PEFT, synthetic speech, Wav2Vec2 comparison</dd>
  <dt>Read</dt>
  <dd><a href="https://www.research-collection.ethz.ch/server/api/core/bitstreams/e8ebef12-7c5f-4d2a-b469-30a29ed608b6/content">Full thesis (PDF, ETH Research Collection)</a></dd>
</dl>

## The problem

For most people a voice assistant is a convenience. For people with speech impairments it can be a primary means of communication — and the long-term effects of unaddressed speech disability during schooling reach into mental health, social well-being and academic performance.

Modern ASR does not serve these users. Whisper and its peers reach very low error rates on typical adult speech, but they inherit the distribution of their training data, and non-normative speech is barely present in it. The population studied here compounds the difficulty: children with congenital disorders such as Apert syndrome, speaking German with Swiss German as their first language — a low-resource language variety *and* an atypical speech pattern at the same time.

The binding constraint is data. The recordings come from a single child. That means very few hours, and almost no speaker variation for the model to generalise across, which makes overfitting the default outcome rather than an edge case.

**The research question:** can Whisper be fine-tuned or adapted to meaningfully improve recognition for one child with a speech impairment — and are foundation models the right tool for this problem at all?

## Approach

The work is a systematic sweep over adaptation strategies, from crude to parameter-efficient, each evaluated by word error rate against held-out data:

- **Baseline and capability checks** — establish what pre-trained Whisper does on this speaker before touching anything.
- **Partial training** — freezing layers and applying dropout to constrain how much the model can memorise.
- **Embedding adaptation** — adjusting the input representation rather than the body of the network.
- **Layer insertion** — adding fresh transformer layers at chosen depths in the encoder and decoder, training only those.
- **Low-rank adaptation (LoRA)** — parameter-efficient fine-tuning at several ranks.
- **Cross-validation and bias correction** — validation splits and word-frequency weighting to check the numbers were real.
- **Synthetic speech** — text-to-speech augmentation to manufacture the variation the dataset lacks.
- **Architecture comparison** — the same treatment applied to Wav2Vec2, plus a fusion of the two models.

A substantial and less visible part of the thesis was building the dataset itself: recording sessions, an annotation process, and curation into a form usable downstream.

## Results

The first finding is the one the constraint predicts. Fine-tuning on a single speaker collapses into memorisation almost immediately — the unconstrained run drives training error toward zero while genuine held-out performance settles roughly six times higher. Every subsequent experiment is really an answer to *how do you adapt without simply memorising*.

<figure>
  <img src="{{ '/assets/img/thesis/01-overfitting.png' | relative_url }}" alt="Line chart of word error rate against training steps. An unconstrained run drops to roughly 2 WER while the run evaluated on a validation set plateaus near 12.">
  <figcaption><b>Fig 1 — Overfitting is the default.</b> Initial fine-tuning runs. The unconstrained run reaches a WER around 2 by memorising the training set; measured against a validation split, the same recipe plateaus near 12. This gap defines the rest of the work.</figcaption>
</figure>

Layer insertion turned out to be the most informative axis. Placing new transformer layers at different encoder and decoder depths spreads final WER across more than an order of magnitude — the best configuration reaches roughly 6 WER, while a poorly placed decoder layer never recovers past ~100. Where you intervene in the network matters far more than how much you train.

<figure>
  <img src="{{ '/assets/img/thesis/02-layer-insertion.png' | relative_url }}" alt="Log-scale line chart with thirteen training runs comparing insertion of transformer layers at different encoder and decoder depths.">
  <figcaption><b>Fig 2 — Placement dominates.</b> Thirteen configurations inserting transformer layers at varying encoder and decoder depths (log-scale WER). Encoder layer 9 combined with decoder layer 15 performs best; inserting at decoder layer 0 fails outright.</figcaption>
</figure>

Low-rank adaptation reached comparable quality at a fraction of the trainable parameters, with ranks 16 and 32 both converging near 10 WER.

<figure>
  <img src="{{ '/assets/img/thesis/03-lora-ranks.png' | relative_url }}" alt="Line chart comparing LoRA ranks 16 and 32 against a faulty run, showing ranks 16 and 32 converging near 10 WER.">
  <figcaption><b>Fig 3 — Parameter-efficient adaptation holds up.</b> LoRA at ranks 16 and 32 converges to roughly 10 WER on this speaker, close to far more invasive fine-tuning.</figcaption>
</figure>

Adapted models also transferred across recording sessions: trained on the original data and tested on a later session of read speech, full fine-tuning held around 15 WER, confirming the gains were not an artefact of one afternoon in a recording room.

<figure>
  <img src="{{ '/assets/img/thesis/04-holdout-read-speech.png' | relative_url }}" alt="Line chart showing several adaptation methods evaluated on data from a later recording session, converging between 15 and 23 WER.">
  <figcaption><b>Fig 4 — Generalisation across sessions.</b> Models trained on the original data, evaluated on a later recording session of read speech. Full fine-tuning settles near 15 WER, with LoRA and layer-insertion variants close behind.</figcaption>
</figure>

## The honest result

<div class="note">
  <p class="note__label">Where it breaks</p>
  <p>Every gain above is on <em>read</em> speech. Once conversational non-normative speech enters training and evaluation, error rates rise into the 40–75 WER range regardless of adaptation method — LoRA, layer insertion and full fine-tuning alike. The thesis does not resolve this, and says so.</p>
</div>

<figure>
  <img src="{{ '/assets/img/thesis/05-conversational.png' | relative_url }}" alt="Line chart of experiments including conversational speech, with most runs between 43 and 75 WER, far above the read-speech results.">
  <figcaption><b>Fig 5 — Conversational speech defeats every method tried.</b> Adaptation strategies evaluated once conversational data is included. The lowest band is the model tested on the original read-speech data; everything measured on conversational speech sits between roughly 43 and 75 WER.</figcaption>
</figure>

This is the actual contribution. Whisper does well on read non-normative speech and fails on conversational non-normative speech, and no amount of parameter-efficient cleverness closed that gap on this data. The implication runs against the prevailing assumption: as foundation models advance, classical and specialised approaches may still have a role in exactly the scenarios where the foundation-model story is weakest.

Two secondary findings sit alongside it. Synthetic speech from off-the-shelf TTS did not meaningfully help Whisper, though it appeared more useful to Wav2Vec2 — suggesting that *how well an architecture absorbs synthetic data* is itself worth evaluating. And the bias-correction experiments showed how sensitive the headline numbers are to how you weight words, which is a reminder that on datasets this small the evaluation deserves as much scrutiny as the model.

## What I would do next

The thesis closes on three directions: active learning, to spend a speaker's very limited recording time on the utterances that would teach the model most; robust Bayesian methods, to handle the uncertainty that comes with single-speaker data honestly; and above all, data accessibility — the field's real bottleneck for inclusive speech recognition is not architecture, it is that datasets of non-normative speech barely exist.

---

**[Read the full thesis (PDF)](https://www.research-collection.ethz.ch/server/api/core/bitstreams/e8ebef12-7c5f-4d2a-b469-30a29ed608b6/content)** · ETH Research Collection
