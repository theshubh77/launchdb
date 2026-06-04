# Coding Agent Instructions - LaunchDB

Welcome, AI Coding Agent! This document acts as your reference guide for understanding the LaunchDB codebase, conventions, and implementation guidelines.

---

## 1. Directory Structure

```
launchdb/
├── app/
│   ├── globals.css      # Core Vanilla CSS design system and components styling
│   ├── layout.tsx       # Root layout, Google Fonts config, and global SEO meta
│   └── page.tsx         # Main page (Renders search, filters, cards grid, FAQ, and structured JSON-LD schema)
├── components/
│   └── DirectoryCard.tsx# Reusable card component displaying favicons and platform badges
├── public/
│   └── launchdb-fallback.json # Snapshot copy of the directory JSON source of truth
├── next.config.ts       # Next.js configurations set up for static exports
└── package.json         # Package configuration and script definitions
```

---

## 2. Core Architectural & Code Conventions

### Client-Side State & Dynamic Fetching
- The application uses client-side rendering for its core interface (`use client` is declared at the top of page.tsx and DirectoryCard.tsx).
- All directory items are loaded via standard `fetch` at runtime.
- **Source URL**: `https://raw.githubusercontent.com/theshubh77/awesome-saas-directories/master/launchdb.json`
- **Fallback URL**: `/launchdb-fallback.json` (Keep this updated in sync with the source repository).

### Styling Guidelines (Vanilla CSS)
- **Do NOT install Tailwind CSS** or write Tailwind class names unless explicitly requested. All styling must reside inside [globals.css](app/globals.css).
- Design system colors, border-radii, transitions, and layout widths are defined as root CSS custom properties. Use these variables (`var(--variable-name)`) to ensure color consistency.
- Keep hover transitions clean and swift using standard CSS parameters. Avoid massive animations or dynamic page shifts that degrade core web vitals.

### Icons System
- LaunchDB utilizes the **Phosphor Icon Set** for all layout indicators and CTA buttons.
- Import icons from `@phosphor-icons/react` dynamically.
- Prefer explicit size parameters on icon objects (e.g. `<Globe size={16} />`) to maintain consistent line alignment.

### Platform Categorization Logic
If adding or modifying directory metadata, ensure platform classifiers inside [page.tsx](app/page.tsx) and [DirectoryCard.tsx](components/DirectoryCard.tsx) stay aligned:
- **Reddit**: Starts with `r/` or link contains `reddit.com`
- **X (Twitter)**: Starts with `x/` or link contains `x.com`/`twitter.com`
- **Facebook**: Starts with `fb/` or link contains `facebook.com`
- **GitHub**: Starts with `gh/` or link contains `github.com`
- **Web Directory**: Standard default websites

---

## 3. SEO, AIO, AEO, and GEO Guidance
- When modifying the codebase, preserve semantic HTML structures:
  - `<header>` for navigation and branding.
  - `<main>` for primary workspace interfaces.
  - `<section>` for panels and directory lists.
  - `<article>` for individual directory cards.
- **Metadata**: Static metadata values must be declared in [layout.tsx](app/layout.tsx).
- **AIO/GEO**: Ensure the JSON-LD schema generated dynamically in `page.tsx` continues to list directory details correctly inside the head script.
- **AEO**: Maintain the HTML FAQ layout at the bottom of the page, ensuring questions use proper `h3` tags with descriptive responses to let search scrapers index them for answers.
