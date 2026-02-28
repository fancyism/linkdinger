---
title: "Optimizing Next.js Images for Core Web Vitals"
date: 2026-01-05
category: NextJS
excerpt: LCP and CLS are heavily impacted by how you serve images. Using the Next.js Image component effectively is key.
tags:
  - NextJS
  - Performance
  - Web
coverImage: https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop
publish: true
---

# Next.js Image Optimization

Stop serving raw `<img>` tags if you care about your Lighthouse score. Use `<Image preload />` for LCP candidates, and `sizes` to let the browser fetch what it needs.
