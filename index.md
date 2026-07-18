---
layout: page
title: Philipp Guldimann
description: AI Harness Engineer — LLM evaluation, agent reliability, and the data pipelines underneath.
hero: true
---

<h1 class="hero-name">Philipp Guldimann</h1>
<p class="hero-role">AI Harness Engineer · Zürich, Switzerland</p>

<p class="lede">I build the scaffolding that makes AI systems survive production — evaluation, agent reliability, and the data pipelines underneath.</p>

At a Zürich AI startup I built LLM evaluation infrastructure — 23 evaluators across 10+ models — that cut QA cycles from two days to four hours. I'm now building multi-jurisdiction legal AI pipelines processing roughly one million documents across three countries. My roots are in trustworthy AI research: I was a core contributor to [COMPL-AI](https://arxiv.org/abs/2410.07959), an open benchmark for LLM compliance with the EU AI Act. I hold an MSc in Machine Intelligence from ETH Zürich, and I care about pragmatic, scalable systems that ship and prove their value with metrics.

<ul class="tags">
  <li>LLM evaluation</li>
  <li>Agent reliability</li>
  <li>Data pipelines</li>
  <li>Evals &amp; MLOps</li>
  <li>Platform engineering</li>
  <li>Trustworthy AI</li>
  <li>Python / TypeScript</li>
  <li>AWS / Azure</li>
</ul>

## Writing

I write about AI harness engineering — agent loops, tool schemas, context management, evals — and where they break in practice.

<ul class="post-list">
{%- for post in site.posts limit: 3 %}
  <li>
    <h3 class="post-list__title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
    <p class="post-list__meta">
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%-d %B %Y" }}</time>
      · {{ post.content | number_of_words | divided_by: 200 | plus: 1 }} min read
    </p>
    <p class="post-list__excerpt">{{ post.subtitle | default: post.excerpt | strip_html | truncate: 160 }}</p>
  </li>
{%- else %}
  <li><p class="post-list__empty">First post going up shortly — <a href="{{ '/writing/' | relative_url }}">what the series covers</a>.</p></li>
{%- endfor %}
</ul>

## Experience

<div class="entry" markdown="1">
<h3 class="entry__title">Data Engineer — Omnilex</h3>
<p class="entry__meta">Feb 2026 – Present · Zürich, Switzerland</p>

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

Core contributor to COMPL-AI, evaluating 10+ models across 20 benchmarks spanning capabilities, cybersecurity, privacy, and bias/fairness. Worked on benchmark design, evaluation pipelines, and model integration via Hugging Face Transformers.

[Read the paper (arXiv:2410.07959)](https://arxiv.org/abs/2410.07959) · [Code on GitHub](https://github.com/compl-ai)
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
| **LLM / AI** | LLM evaluation, RAG, embeddings, Hugging Face Transformers, LangChain / LangGraph, MCP, PyTorch |
| **Data & orchestration** | Airflow, Dagster, vector databases (FAISS, Weaviate, Pinecone), PostgreSQL |
| **Backend & cloud** | FastAPI, Node.js, Docker, Kubernetes, AWS, Azure, CI/CD |

## Earlier projects

<div class="entry" markdown="1">
<h3 class="entry__title">Computational Intelligence Lab — Text Classification</h3>
<p class="entry__meta">ETH Zürich · 2023</p>

[Report (PDF)](./assets/pdf/CIL_2023.pdf)
</div>
