---
layout: default
title: Index
---

## Index

<ol>
  {% assign sorted_songs = site.songs | sort: "title" %}
  {% for song in sorted_songs %}
    <li><a href="{{ song.url | relative_url }}">{{ song.title }}</a></li>
  {% endfor %}
</ol>
