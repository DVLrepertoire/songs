---
layout: default
title: Index
---

## Index

<ul>
  {% for page in site.pages %}
    {% if page.dir == "/songs/" %}
      <li><a href="{{ page.url }}">{{ page.title }}</a></li>
    {% endif %}
  {% endfor %}
</ul>
