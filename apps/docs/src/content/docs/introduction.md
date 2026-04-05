---
title: Introduction
description: Why Pallette exists and how it relates to Storybook and json-render.
---

## Purpose

**Pallette** is a small toolkit for building a **live component catalog** from the same **json-render** definitions you already use to describe UI: Zod schemas for props, optional `example` payloads, and your renderer registry.

Traditional **Storybook** workflows mean writing and maintaining stories, addons, and often a parallel taxonomy of examples. Pallette aims to **eliminate that duplicate surface area**: if your components are registered with json-render and described with Zod, you get a **browsable catalog**—sidebar of component names, prop inspector, preview canvas, and JSON/schema views—**without** authoring separate Storybook stories for every state.

## What you get

- **One source of truth**: component metadata and examples live next to your json-render catalog definitions, not in a second story format.
- **Automatic UI**: the catalog introspects props (including nested structures where supported) and syncs preview content with the schema.
- **Framework wrappers**: React and Svelte hosts mount the same underlying catalog shell; Vue support is planned via `@pallette/plugin-vue`.

## When Pallette fits

Pallette is aimed at teams who:

- Already use **json-render** (or are willing to adopt its catalog shape) for structured UI.
- Want a **developer-facing catalog** for components and props, similar in spirit to Storybook’s component gallery, but **generated** rather than hand-written per story.

If you need heavy interaction testing, visual regression suites, or a large Storybook ecosystem, you may still use those tools alongside Pallette—the goal is to **reduce** the need for Storybook **as the primary catalog** for json-render-based design systems.

## Next steps

- **[Getting started](/getting-started/)** — minimal integration steps and code samples.
- **[Packages](/packages/)** — what each workspace package provides.
- **[Live demos](/demos/)** — run the React and Svelte demo apps locally.
