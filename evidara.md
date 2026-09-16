---
layout: page
title: Evidara
description: "A legal search platform built around one decision: canonical truth is separated from the serving projection, so search is a rebuildable view rather than the system of record."
permalink: /evidara/
nav: projects
---

<p class="lede">Legal sources disagree, and they do not disagree equally. A cantonal court and a blog post are not two opinions. Evidara is a search platform for material where that difference has to survive all the way to the answer.</p>

<figure>
  <img src="{{ '/assets/img/projects/evidara-search.png' | relative_url }}" alt="The Evidara search interface: a result list of legal documents, each showing its issuing authority, jurisdiction and date, with a faceted filter panel on the left.">
  <figcaption><b>Search over ranked authority.</b> Every result carries where it came from — issuing authority, jurisdiction, date — because in legal material the provenance is part of the answer, not metadata attached to it.</figcaption>
</figure>

## The decision the system is built around

Canonical truth is separated from the serving projection. The search index is a **rebuildable view**, never the system of record. Anything in it can be thrown away and reconstructed from the canonical store.

That sounds like an implementation detail and is not one. It means a parsing bug is recoverable rather than permanent, a re-scoring pass is a rebuild rather than a migration, and there is always exactly one place to ask what the system actually believes. Most of the rest follows from it.

Sources are modelled by provenance rather than treated as interchangeable: authority, jurisdiction, and trust tier are first-class, so ranking can use them instead of pretending a uniform corpus. Parsing produces a **citation graph** rather than full-text blobs, so a reference between two documents is an edge you can traverse rather than a string you have to match. And nothing reaches the public index without an operator approving it.

<figure>
  <img src="{{ '/assets/img/projects/evidara-detail.png' | relative_url }}" alt="A document detail panel showing the full text of a legal decision alongside tabs for details, references and related documents.">
  <figcaption><b>The citation graph, surfaced.</b> References and related documents are traversals of the graph built at parse time, not a full-text similarity guess made at query time.</figcaption>
</figure>

## The operator half

A legal corpus is not a static download. Sources move, publishers change formats, and a bad ingestion run must be visible before it becomes a bad index. So roughly half the system is the control plane: acquisition runs with a preflight, a visible lifecycle, and a human-in-the-loop review and rescore loop for extraction corrections.

<figure>
  <img src="{{ '/assets/img/projects/evidara-run-detail.png' | relative_url }}" alt="The admin control plane showing an acquisition run in progress, with stage-by-stage status, counts and timings.">
  <figcaption><b>Ingestion as an observable process.</b> A run shows its stages, counts and failures while it happens, so a bad batch is caught before publication rather than discovered in search results afterwards.</figcaption>
</figure>

## What it is made of

Thirteen services. The runtime started on Google Cloud — Cloud Run and Pub/Sub in about 1,700 lines of Terraform, deployed from CI with monitoring and billing guardrails — and then moved onto self-hosted Kubernetes with NATS JetStream and MinIO, trading usage billing for a fixed monthly cost.

The part I would point at is the governance. Fifty-nine architecture decision records say why the boundaries are where they are, and two dozen automated checkers enforce them on every commit — that ADR numbering is unique, that compose profiles stay consistent, that the platform contract is actually used where it is claimed, that every test is reachable. Those checkers are themselves covered by 314 tests. The point is that a design decision which is only written down is a decision that erodes; one with a checker attached is a decision that holds.

Python (FastAPI, SQLAlchemy), TypeScript (Next.js, NestJS), PostgreSQL, OpenSearch, Delta Lake, NATS, Kubernetes. Thirteen acquisition providers are registered across CH, AT, DE, FR, IT and the EU; nine are live, one is awaiting its acceptance evidence, and two are scaffolds that no run can dispatch. Self-directed, March 2026 onward.

<figure class="figure-grid">
  <figure class="figure--phone">
    <img src="{{ '/assets/img/projects/evidara-mobile.png' | relative_url }}" alt="The search result list rendered on a phone, with results stacked and filters collapsed behind a sheet.">
    <figcaption>The same search on a phone.</figcaption>
  </figure>
  <figure>
    <img src="{{ '/assets/img/projects/evidara-dashboard.png' | relative_url }}" alt="The admin dashboard showing source counts, recent runs and system status.">
    <figcaption>Sources, runs and system state in one place.</figcaption>
  </figure>
</figure>
