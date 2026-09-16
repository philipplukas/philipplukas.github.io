---
layout: page
title: Philipp Guldimann
description: Machine learning engineer in Zürich — LLM evaluation, trustworthy AI, data pipelines.
hero: true
---

<div class="hero">
  <img class="hero__portrait" src="{{ '/assets/img/headshot_circle.jpeg' | relative_url }}" alt="Philipp Guldimann" width="120" height="120" loading="eager">
  <div class="hero__text">
    <h1 class="hero-name">Philipp Guldimann</h1>
    <p class="hero-role">Machine Learning Engineer · Zürich, Switzerland</p>
    <p class="hero__status"><span class="hero__status-dot" aria-hidden="true"></span> Open to AI engineering roles — Zürich or remote</p>
  </div>
</div>

<p class="lede">I build the evaluation and data infrastructure that makes AI systems survive production.</p>

I am joint first author of [COMPL-AI](https://arxiv.org/abs/2410.07959), the first technical interpretation of the EU AI Act and an open benchmarking suite built on it. At LatticeFlow AI I built LLM evaluation infrastructure — 23 evaluators across 10+ models — that cut QA cycles from two days to four hours. At Omnilex I built multi-jurisdiction legal AI pipelines processing roughly one million documents across three countries. I hold an MSc in Machine Intelligence from ETH Zürich.

<ul class="tags">
  <li>LLM evaluation</li>
  <li>Data pipelines</li>
  <li>Trustworthy AI</li>
  <li>Python / TypeScript</li>
  <li>AWS / Azure</li>
</ul>

## Writing

I write about the layer around a model in production, and where it breaks.

<ul class="post-list">
{%- for post in site.posts limit: 3 %}
  <li>
    <h3 class="post-list__title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
    <p class="post-list__meta">
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%-d %B %Y" }}</time>
      {%- if post.series %} · {{ post.series }}{% if post.part %} · Part {{ post.part }}{% endif %}{% endif %}
      · {{ post.content | number_of_words | divided_by: 200 | plus: 1 }} min read
    </p>
    <p class="post-list__excerpt">{{ post.subtitle | default: post.excerpt | strip_html | truncate: 180 }}</p>
  </li>
{%- else %}
  <li><p class="post-list__empty">First post going up shortly — <a href="{{ '/writing/' | relative_url }}">what the series covers</a>.</p></li>
{%- endfor %}
</ul>

## Experience

<div class="entry" markdown="1">
<h3 class="entry__title">Data Engineer — Omnilex</h3>
<p class="entry__meta">Feb 2026 – May 2026 · Zürich, Switzerland</p>

- Built ingestion and transformation pipelines for legal content across 3 jurisdictions (Switzerland, Germany, Austria), processing ~1M documents from APIs, scraping outputs, and bulk sources.
- Developed TypeScript-based data workflows for normalization, citation-aware chunking, embeddings, classification, and entity extraction.
- Contributed to RAG-ready indexing and Azure-based search infrastructure for precise, traceable legal AI responses.
- Introduced data contracts and validation checks that caught 50K+ duplicate entries before they reached production.
</div>

<div class="entry" markdown="1">
<h3 class="entry__title">Machine Learning Engineer — LatticeFlow AI</h3>
<p class="entry__meta">Jan 2025 – Nov 2025 · Zürich, Switzerland</p>

- Built v0 evaluation infrastructure for a new AI product from scratch: 23 evaluators, integrations with multiple data and chat-model providers, assessing 10+ LLMs.
- Automated evaluation workflows for QA and regression testing, reducing review cycles from ~2 days of manual inspection to ~4 hours.
- Extended evaluators with targeted dataset generation to increase coverage across model behaviours and failure modes.
</div>

## Research

<div class="entry" markdown="1">
<h3 class="entry__title">COMPL-AI — Benchmarking LLM Compliance with the EU AI Act</h3>
<p class="entry__meta">Research Intern · Secure Reliable Intelligence Lab, ETH Zürich · Oct 2023 – Mar 2024</p>

Joint first author (equal contribution) and lead author on COMPL-AI — the first technical interpretation of the EU AI Act, mapping its six ethical principles onto 27 concrete benchmarks and evaluating 12 prominent LLMs against them. Worked on benchmark design, evaluation pipelines, and model integration via Hugging Face Transformers. The framework is positioned as a reference point for the EU's GPAI Code of Practice.

[Read the paper (arXiv:2410.07959)](https://arxiv.org/abs/2410.07959) · [Code on GitHub](https://github.com/compl-ai)
</div>

## Projects

<div class="entry" markdown="1">
<h3 class="entry__title"><a href="{{ '/domainforge/' | relative_url }}">DomainForge — Relational domain-model induction</a></h3>
<p class="entry__meta">Self-directed · Sept 2026 – present</p>

Give a system a corpus from a company it knows nothing about, and no schema. Agents propose changes to a shared knowledge state; a minimum-description-length energy and a Metropolis-Hastings rule decide what survives, so the ontology is annealed rather than fixed in advance. Thirteen reversible operators, each with its inverse asserted by round-trip tests.

[Project page]({{ '/domainforge/' | relative_url }}) · [Interactive walkthrough]({{ '/domainforge/walkthrough/' | relative_url }})
</div>

<div class="entry" markdown="1">
<h3 class="entry__title"><a href="{{ '/evidara/' | relative_url }}">Evidara — Legal document intelligence platform</a></h3>
<p class="entry__meta">Self-directed · Mar 2026 – present</p>

Search over legal sources that differ in authority, jurisdiction and trust, built around one decision: canonical truth is separated from the serving projection, so the index is a rebuildable view rather than the system of record. Thirteen services, moved from Google Cloud onto self-hosted Kubernetes, with 59 architecture decision records and two dozen automated checkers holding the boundaries in place.

[Project page]({{ '/evidara/' | relative_url }})
</div>

## Education

<div class="entry" markdown="1">
<h3 class="entry__title">MSc Computer Science — Machine Intelligence, ETH Zürich</h3>
<p class="entry__meta">Sept 2022 – Dec 2024</p>

Thesis (top grade): *Speech Recognition for Children with Congenital Disorders Using Adaptive Methods* — adapting Whisper to non-normative child speech from a single speaker.

[Read the case study →]({{ '/thesis/' | relative_url }})
</div>

<div class="entry" markdown="1">
<h3 class="entry__title">BSc Computer Science, ETH Zürich</h3>
<p class="entry__meta">Sept 2018 – Aug 2022</p>

Thesis (top grade): *Detecting Disinformation on Twitter Targeting Non-Profit Organisations*, in collaboration with the ICRC. [Thesis (PDF)](./assets/pdf/Bachelorthesis.pdf)
</div>

## Technical skills

| | |
|---|---|
| **Languages** | Python, TypeScript / JavaScript, SQL |
| **LLM / AI** | LLM evaluation, RAG, embeddings, Hugging Face Transformers, MCP, PyTorch, LoRA / PEFT |
| **Data & orchestration** | Dagster, PostgreSQL, pgvector, OpenSearch, Azure AI Search, Delta Lake, NATS |
| **Backend & cloud** | FastAPI, NestJS, Next.js, Node.js, Docker, Kubernetes, Terraform, Argo CD, AWS, Azure, CI/CD |

## Earlier projects

<div class="entry" markdown="1">
<h3 class="entry__title">Computational Intelligence Lab — Text Classification</h3>
<p class="entry__meta">ETH Zürich · 2023</p>

[Report (PDF)](./assets/pdf/CIL_2023.pdf)
</div>

## Contact

<p>Email is the fastest way to reach me.</p>

<p class="cta">
  <a class="cta__primary" href="mailto:{{ site.author.email }}">{{ site.author.email }}</a>
  <a class="cta__secondary" href="https://linkedin.com/in/{{ site.social.linkedin }}">LinkedIn</a>
  <a class="cta__secondary" href="https://github.com/{{ site.social.github }}">GitHub</a>
</p>
