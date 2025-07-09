---
layout: default
title: Index
---

## Debug: All Pages

<ul>
  {% for page in site.pages %}
    <li>{{ page.url }} — {{ page.title }}</li>
  {% endfor %}
</ul>

