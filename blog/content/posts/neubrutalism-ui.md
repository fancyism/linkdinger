---
title: "Why Neubrutalism is Taking Over the Web"
date: "2024-03-08"
category: "Design"
excerpt: "Exploring the anti-design movement characterized by high-contrast colors, harsh shadows, and unapologetic typography."
tags: 
  - Design
  - UI
  - Web
coverImage: "https://images.unsplash.com/photo-1558655146-d09347e92766?w=1200&h=630&fit=crop"
publish: true
---

# The Anti-Design Revolution

For years, web design has been dominated by soft shadows, rounded corners, and minimal, airy interfaces. Corporate Memphis and Flat Design 2.0 became the unquestioned standards. Enter **Neubrutalism** (or Neo-brutalism).

## What Makes it Brutal?

Neubrutalism rejects the premise that software should look soft and approachable. It draws inspiration from 1950s brutalist architecture, prioritizing raw materials and structural elements. In the digital realm, this translates to:

- **Harsh, Solid Shadows**: Often pure black (or pure white in dark mode) offset at a strict 45-degree angle.
- **Thick Borders**: Unapologetic outlines separating components.
- **Clashing Colors**: High-saturation hues that demand attention.
- **Bold Typography**: Massive, heavy fonts that act as both content and graphical elements.

## Form Over (Invisible) Function

By making UI elements brutally obvious, Neubrutalism ironically improves usability in certain contexts. A button with a thick black border and a solid drop shadow leaves absolutely no ambiguity about whether it can be clicked.

## Implementing Neubrutalism

Here's a simple Tailwind implementation:

```tsx
<button className="bg-orange-500 text-black font-bold px-6 py-3 
  border-2 border-black shadow-[4px_4px_0_#000] 
  hover:translate-x-[-2px] hover:translate-y-[-2px] 
  hover:shadow-[6px_6px_0_#000] transition-all">
  Click Me
</button>
```

The key elements:
- Solid, high-saturation background color
- Thick black border (2px minimum)
- Offset shadow using `box-shadow`
- Hover interaction that "lifts" the element

## Combining with Glassmorphism

In Linkdinger, we merged Neubrutalism with Glassmorphism for a unique aesthetic:

- Glass cards for depth and hierarchy
- Neubrutalist tags and buttons for high-contrast accents
- The result: depth without losing clarity

This combination works because glass provides the atmosphere while brutalist elements provide the punch.