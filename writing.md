---
layout: page
title: Writing
description: "Notes on the systems around machine learning — LLM harnesses, and the acoustics underneath speech recognition."
permalink: /writing/
nav: writing
hero: true
---

<h1 class="page-title">Writing</h1>

<p class="lede">Two series, both bottom-up: the scaffolding around a language model, and the physics underneath a speech recogniser. In each case I'm less interested in the happy path than in the layer below it — what the abstraction is standing on.</p>

<p><b>Harness engineering</b> is about what surrounds a model in production: agent loops, tool schemas, and the failure modes that only appear once something is running.</p>

<p><b>Speech from first principles</b> derives the acoustic model of the human voice from the wave equation, then runs it backwards to show where every piece of a speech recognition front end came from. Both posts have diagrams you can drag and sounds you can play, and the numbers in them come out of code that ships with a test.</p>

<ul class="post-list">
{%- for post in site.posts %}
  <li>
    <h2 class="post-list__title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
    <p class="post-list__meta">
      <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%-d %B %Y" }}</time>
      {%- if post.series %} · {{ post.series }}{% if post.part %} · Part {{ post.part }}{% endif %}{% endif %}
      · {{ post.content | number_of_words | divided_by: 200 | plus: 1 }} min read
    </p>
    <p class="post-list__excerpt">{{ post.subtitle | default: post.excerpt | strip_html | truncate: 180 }}</p>
  </li>
{%- else %}
  <li><p class="post-list__empty">First post going up shortly.</p></li>
{%- endfor %}
</ul>

<p style="margin-top:2rem"><a href="{{ '/feed.xml' | relative_url }}">Subscribe via RSS</a></p>