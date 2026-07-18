---
layout: page
title: Writing
description: "Notes on AI harness engineering — the scaffolding around language models, and where it breaks."
permalink: /writing/
nav: writing
hero: true
---

<h1 class="page-title">Writing</h1>

<p class="lede">Notes on harness engineering: the scaffolding around a language model — agent loops, tool schemas, context management, sandboxing, evals, telemetry — and the failure modes that only show up once something is actually running.</p>

<p>Most writing about agents stops at the happy path. I'm more interested in the layers underneath it, approached the way you'd approach any other system: bottom-up, one layer at a time, with attention to what breaks. Code for the series lives in a single repository that grows with each post rather than a graveyard of one-off demos.</p>

<ul class="post-list">
{%- for post in site.posts %}
  <li>
    <h2 class="post-list__title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
    <p class="post-list__meta">
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%-d %B %Y" }}</time>
      {%- if post.series %} · {{ post.series }}{% if post.part %} · Part {{ post.part }}{% endif %}{% endif -%}
      · {{ post.content | number_of_words | divided_by: 200 | plus: 1 }} min read
    </p>
    <p class="post-list__excerpt">{{ post.subtitle | default: post.excerpt | strip_html | truncate: 180 }}</p>
  </li>
{%- else %}
  <li><p class="post-list__empty">First post going up shortly.</p></li>
{%- endfor %}
</ul>

<p style="margin-top:2rem"><a href="{{ '/feed.xml' | relative_url }}">Subscribe via RSS</a></p>
