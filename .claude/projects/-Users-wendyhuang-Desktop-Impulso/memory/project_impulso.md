---
name: project-impulso
description: Impulso marketing tool — current state, tech decisions, pending work
metadata:
  type: project
---

Impulso is a Twitter content pipeline tool built with Next.js 16 + TypeScript + Tailwind + shadcn/ui.

Current state (2026-06-05):
- Full pipeline works: generate → curate → design brief → schedule
- Image generation blocked pending Infer API support for image models
- Multi-user auth (email/password) working
- Local Prisma Postgres (named "impulso", port 51218)
- UI redesign planned — Wendy wants to use Claude to design new UI/UX

**Why:** Wendy needs a single place to manage content creation across multiple Twitter accounts instead of copy-pasting between ChatGPT, Claude, and scheduling tools.

**How to apply:** Keep the core pipeline intact, focus on UX improvements when asked.
