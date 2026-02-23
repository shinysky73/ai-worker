---
name: vercel-react-best-practices
description: React performance optimization guidelines from Vercel Engineering. Use when writing, reviewing, or refactoring React components to ensure optimal performance patterns. Triggers on tasks involving React components, data fetching, bundle optimization, re-render issues, or performance improvements. Note: Next.js-specific rules (RSC, Server Actions, next/dynamic) are marked [NEXT.JS ONLY] and do not apply to this Vite-based project.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Best Practices

Performance optimization guide for React applications, maintained by Vercel. Contains 57 rules across 8 categories, prioritized by impact.

**Project context**: This project uses React 19 + Vite (not Next.js). Rules marked `[NEXT.JS ONLY]` are for reference only.

## When to Apply

Reference these guidelines when:
- Writing new React components
- Implementing data fetching (TanStack Query)
- Reviewing code for performance issues
- Refactoring existing React components
- Optimizing bundle size or load times

## Rule Categories by Priority

| Priority | Category | Impact | Prefix | Applies? |
|----------|----------|--------|--------|----------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` | ✅ |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` | ✅ (Vite) |
| 3 | Server-Side Performance | HIGH | `server-` | ⚠️ Partial |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` | ✅ |
| 5 | Re-render Optimization | MEDIUM | `rerender-` | ✅ |
| 6 | Rendering Performance | MEDIUM | `rendering-` | ✅ |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` | ✅ |
| 8 | Advanced Patterns | LOW | `advanced-` | ✅ |

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL) ✅
- async-defer-await, async-parallel, async-dependencies, async-suspense-boundaries
- *[NEXT.JS ONLY]*: async-api-routes

### 2. Bundle Size Optimization (CRITICAL) ✅
- bundle-barrel-imports, bundle-dynamic-imports, bundle-conditional, bundle-preload
- *[NEXT.JS ONLY]*: bundle-defer-third-party (next/dynamic)

### 3. Server-Side Performance (HIGH) ⚠️
- *[NEXT.JS ONLY]*: server-auth-actions, server-cache-react, server-cache-lru, server-dedup-props, server-serialization, server-parallel-fetching, server-after-nonblocking

### 4. Client-Side Data Fetching (MEDIUM-HIGH) ✅
- client-swr-dedup (→ TanStack Query in this project), client-event-listeners, client-passive-event-listeners, client-localstorage-schema

### 5. Re-render Optimization (MEDIUM) ✅
- rerender-defer-reads, rerender-memo, rerender-memo-with-default-value, rerender-dependencies, rerender-derived-state, rerender-derived-state-no-effect, rerender-functional-setstate, rerender-lazy-state-init, rerender-simple-expression-in-memo, rerender-move-effect-to-event, rerender-transitions, rerender-use-ref-transient-values

### 6. Rendering Performance (MEDIUM) ✅
- rendering-animate-svg-wrapper, rendering-content-visibility, rendering-hoist-jsx, rendering-svg-precision, rendering-hydration-no-flicker, rendering-hydration-suppress-warning, rendering-conditional-render, rendering-usetransition-loading
- *[NEXT.JS ONLY]*: rendering-activity

### 7. JavaScript Performance (LOW-MEDIUM) ✅
- js-batch-dom-css, js-index-maps, js-cache-property-access, js-cache-function-results, js-cache-storage, js-combine-iterations, js-length-check-first, js-early-exit, js-hoist-regexp, js-min-max-loop, js-set-map-lookups, js-tosorted-immutable

### 8. Advanced Patterns (LOW) ✅
- advanced-event-handler-refs, advanced-init-once, advanced-use-latest

## Full Compiled Document

For all rules with before/after code examples: `AGENTS.md`
