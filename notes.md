---
layout: page
title: Notes
description: "A growing, interlinked glossary for the Speech from first principles series — one concept per page, each linking to the posts and notes that use it."
permalink: /notes/
nav: notes
hero: true
---

<h1 class="page-title">Notes</h1>

<p class="lede">The <a href="{{ '/writing/' | relative_url }}">Speech from first principles</a> posts are long and linear. This is the other way in: one concept per page, each standing on its own and linking to every post and note that leans on it. </p>

<p>Every page ends with a <em>Referenced by</em> list, built automatically from what actually links to it.</p>

<ul class="note-index">
{%- assign sorted = site.notes | sort: "title" -%}
{%- for n in sorted %}
  <li class="note-index__item">
    <a class="note-index__title" href="{{ n.url | relative_url }}">{{ n.title }}</a>
    {%- if n.aka %}<span class="note-index__aka">{{ n.aka | join: " · " }}</span>{% endif %}
    <p class="note-index__gloss">{{ n.gloss | default: n.excerpt | strip_html | truncate: 150 }}</p>
  </li>
{%- endfor %}
</ul>