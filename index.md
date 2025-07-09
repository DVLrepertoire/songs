---
layout: default
title: Index
---

## Index

<ul>
  {% assign sorted_songs = site.songs | sort: "title" %}
  {% for song in sorted_songs %}
    <li><a href="{{ song.url }}">{{ song.title }}</a></li>
  {% endfor %}
</ul>
