---
layout: default
title: Index
---
<div id="chord-toggle-container">
  <label class="switch">
    <input type="checkbox" id="global-chord-toggle">
    <span class="slider"></span>
  </label>
  <span>Instrument mode</span>
</div>
## Index

<ol>
  {% assign sorted_songs = site.songs | sort: "title" %}
  {% for song in sorted_songs %}
  {% unless song.hidden %}
    <li><a href="{{ song.url | relative_url }}">{{ song.title }}</a></li>
  {% endunless %}
  {% endfor %}
</ol>
