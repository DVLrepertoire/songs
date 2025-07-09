---
layout: default
title: Song List
---

## Song List

<ul>
  {% for page in site.pages %}
    {% if page.dir == "/songs/" %}
      <li><a href="{{ page.url }}">{{ page.title }}</a></li>
    {% endif %}
  {% endfor %}
</ul>
