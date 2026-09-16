---
layout: page
title: DomainForge
description: "Schema-free domain-model induction: agents propose, a minimum-description-length energy decides what survives."
permalink: /domainforge/
nav: projects
---

<p class="lede">Give a system a corpus from a company it knows nothing about, and no schema. Ask it to work out what the company is — the people, the projects, the jargon, the arguments — and then use that understanding to search.</p>

<div class="notice notice--wip" markdown="1">
**Status: the design is settled, the evaluation is not.**

The walkthrough describes how the system works and why it is built this way. It deliberately carries no benchmark numbers: the earlier ones were measured on corpora I built for this project, and the harness that produced them turned out to bypass the method it was supposed to measure. A proper evaluation against public multi-hop benchmarks is in progress.
</div>

<figure class="figure--dark">
  <img src="{{ '/assets/img/projects/domainforge-architecture.svg' | relative_url }}" alt="Architecture diagram: documents enter an ingestion tier, agents propose changes to a shared knowledge state, an energy function and Metropolis-Hastings rule accept or reject each proposal, and a topological reasoning tier serves retrieval.">
  <figcaption><b>The shape of the system.</b> Documents on the left, retrieval on the right, and in the middle a shared knowledge state that only the sampler may modify. Agents are search operators over that state, not authorities on it.</figcaption>
</figure>

The premise is one separation: **agents explore, agents do not own the knowledge.** Every agent is a proposal kernel. It suggests a change to the shared state and has no power to commit one. A minimum-description-length energy decides what survives, under a Metropolis-Hastings acceptance rule, so a concept is kept exactly when it shortens enough of the description to pay for its own cost. An agent's confidence is not evidence, and returning nothing is a valid answer.

The consequence is that the ontology is not a schema fixed in advance. It is part of the annealed state, so it can be wrong early and get better, and two departments are never forced to agree: *Mercury* can be an inference runtime in engineering and a launch programme in sales without either one having to win.

Thirteen reversible graph operators back the sampler. Each one knows its own inverse, and the test suite asserts exact round-tripping for all thirteen — that property is what makes the sampler a sampler rather than a search with extra steps.

## What is actually established

The retrieval numbers come from corpora I built for the project. CityLens uses real public documents (City of Zürich open data, Paris council resolutions), but the queries and relevance judgments are mine. CorporateBench is synthetic. The cohomology worlds are synthetic *by construction*, built to contain the failure mode the method addresses, so a large gain there is close to tautological.

So the measurements show that the machinery runs end to end and behaves the way the theory predicts under conditions I controlled. They are not a claim of superiority over GraphRAG or anything else, because nobody outside the project can reproduce them yet. Running the real MuSiQue release against the same baselines is the next piece of work; the baselines are already implemented, so it is a data-loading job rather than a rewrite.

What is checkable today is the machinery: the thirteen operator inverses, and sheaf coboundary composition verified numerically to 1e-10. Those are properties you can run.

<figure>
  <img src="{{ '/assets/img/projects/domainforge-sheaf.svg' | relative_url }}" alt="Two connected vertices, each carrying its own local coordinate frame, with a map transporting a vector from one frame into the other. When the frames agree the transported vector lands on the target; when they disagree a residual remains.">
  <figcaption><b>Why a sheaf and not a graph.</b> Each node carries its own local coordinate frame, and an edge carries the map between frames. When two sources genuinely agree the transport closes; when they disagree a residual survives every available rotation, and that residual is what gets thresholded into a barrier rather than averaged away.</figcaption>
</figure>

## The walkthrough

The walkthrough is the system explained end to end: nine steps from document ingestion to an audited answer, with the figures live, the equations rendered, and the code behind each step available inline. It runs entirely in the browser, with no server and no API keys.

<p><a href="{{ '/domainforge/walkthrough/' | relative_url }}"><b>Interactive walkthrough →</b></a></p>

Python, DuckDB/Parquet, MIT licensed. Self-directed, September 2026 onward.
