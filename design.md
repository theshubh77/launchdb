# Design System & Architecture - LaunchDB

LaunchDB is styled using modern, structured Vanilla CSS inside [globals.css](app/globals.css) and leverages a high-end, responsive system that runs efficiently on both desktop and mobile screens.

---

## 1. Design Tokens & Color Palette
The website is designed with a premium, slate-charcoal dark interface by default, avoiding heavy neon gradients to look clean and professional rather than like generic AI template slop.

| Token | Variable | Value | Description |
| :--- | :--- | :--- | :--- |
| Primary BG | `--bg-primary` | `#080a0d` | Base background for the page body |
| Secondary BG | `--bg-secondary` | `#10141b` | Background for cards, filter panels, FAQ items, and footer |
| Tertiary BG | `--bg-tertiary` | `#171d26` | Background for inputs and interactive hover states |
| Border Color | `--border-color` | `#1e2633` | Standard border line color |
| Border Hover | `--border-hover` | `#2d3b4f` | Active border line color on hover |
| Text Primary | `--text-primary` | `#f3f4f6` | Main white titles and values |
| Text Secondary| `--text-secondary`| `#9ca3af` | Gray descriptions and secondary labels |
| Accent Color | `--accent-primary`| `#2563eb` | Brand blue color for links and active states |

### Platform Badges
Platform tags on cards are customized using Phosphor icons and harmonized translucent borders and backgrounds:
- **Reddit**: Orange (`#ff4500`)
- **X (Twitter)**: Clean light grey (`#e5e7eb`)
- **Facebook**: Facebook blue (`#1877f2`)
- **GitHub**: Off-white/slate (`#c9d1d9`)
- **Web Directory**: Emerald green (`#10b981`)

---

## 2. Typography
We use Outfit for prominent headlines and Inter for clean, legible body copy, imported dynamically via Next.js Google Fonts optimization.

- **Hero Title**: Font-family `Outfit`, size `3.5rem` (56px) on desktop, font-weight `700`, with a subtle white-to-grey text fill gradient.
- **Card Titles & Section Headings**: Font-family `Outfit`, font-weight `600`/`700` respectively.
- **Descriptions & Body Text**: Font-family `Inter`, font-weight `400` (normal), line-height `1.5` for excellent readability.

---

## 3. UI Component Structure
The application is structured into the following semantic blocks:
1. **Hero Header**: Displays the `LaunchDB` name, the source-of-truth tag, and a subtitle describing the database purpose.
2. **Control & Filter Panel**: Integrates search and category chips with item counts.
3. **Directory Grid**: Multi-column responsive cards grid displaying [DirectoryCard](components/DirectoryCard.tsx) elements.
4. **FAQ Section**: Simple card questions & answers providing critical context for visitors and scrapers.
5. **Footer**: Clean footer showing license, credits, and link to the source repository.

---

## 4. Performance & Optimizations

### Static Export
Next.js is configured for static exports (`output: 'export'`), allowing the entire site to be built as a set of flat HTML, CSS, and JS files. This guarantees page load times of under 100ms when served from the Vercel CDN edge.

### Real-time Fetch & Resilient Fallbacks
Data is fetched on load from the master branch raw JSON:
`https://raw.githubusercontent.com/theshubh77/awesome-saas-directories/master/launchdb.json`
If the GitHub CDN is blocked or rate-limited, the system falls back to a locally-served copy at [launchdb-fallback.json](public/launchdb-fallback.json) seamlessly.

### Lazyloading & Observer-based Render Pagination
To prevent initial render slowdowns for 120+ DOM elements, the cards grid displays the first 24 cards. An `IntersectionObserver` element at the footer triggers the rendering of 24 additional cards as the user scrolls, making the layout fast and smooth.

---

## 5. SEO, AIO, AEO, and GEO Optimizations

- **Search Engine Optimization (SEO)**: Traditional tags (title, descriptions, open-graph metadata) are placed in [layout.tsx](app/layout.tsx). High-performance static exports maximize Google Core Web Vitals score.
- **Artificial Intelligence Optimization (AIO)**: Semantic HTML tags (`<header>`, `<main>`, `<section>`, `<article>`) and descriptive `aria-` labels ensure AI crawlers (like GPTBot, OAI-SearchBot) can read and index the listings perfectly.
- **Answer Engine Optimization (AEO)**: A dedicated QA FAQ section answers direct search queries ("What is LaunchDB?", "Why submit SaaS to directories?") that answer engines pull directly for snippets.
- **Generative Engine Optimization (GEO)**: A JSON-LD schema (type `ItemList`) is dynamically generated and injected into the `<head>`, mapping out every single directory, its name, description, and link in structured code that LLMs can extract easily.
