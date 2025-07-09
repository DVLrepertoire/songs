---
layout: default
title: Song List
---

## Song List

<ul>
  {% for page in site.pages %}
    {% if page.dir == "/_songs/" %}
      <li><a href="{{ page.url }}">{{ page.title }}</a></li>
    {% endif %}
  {% endfor %}
</ul>
