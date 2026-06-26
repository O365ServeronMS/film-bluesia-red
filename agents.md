# AI Agent Guidelines for Redflare

Welcome, fellow AI agent! You are about to modify the `redflare` codebase. Before you write a single line of code, **read this entire document**. 

This document merges core AI behavioral principles with the critical context and architectural rules of this specific project. Our goal is to avoid overcomplication, prevent common mistakes, and ensure hard-won premium UI improvements are not accidentally reverted.

---

## PART 1: CORE BEHAVIORAL PRINCIPLES
*These guidelines bias toward caution over speed to reduce common AI coding mistakes.*

### 1. Think Before Coding
**Don't assume. Don't hide confusion. Surface tradeoffs.**
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
**Minimum code that solves the problem. Nothing speculative.**
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
Ask yourself: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

### 3. Surgical Changes
**Touch only what you must. Clean up only your own mess.**
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.
**The test:** Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
**Define success criteria. Loop until verified.**
- Transform tasks into verifiable goals (e.g., "Fix bug" → "Write test reproducing it, then make it pass").
- For multi-step tasks, state a brief plan.
- Strong success criteria let you loop independently. Weak criteria require constant clarification.

---

## PART 2: PROJECT-SPECIFIC ARCHITECTURE & RULES

### 1. Core Architecture
- **Tech Stack**: Vanilla JavaScript (ESModules), plain CSS, and Vite as the bundler. **No React, Vue, or Tailwind.** Keep dependencies minimal.
- **Routing**: The app uses a custom **HTML5 History API Router** (located in `src/router.js`).
  - **CRITICAL**: Do **NOT** use Hash Routing (`#/path`). All paths must be clean (e.g., `/phim/slug`).
  - Link clicks are intercepted globally in `router.js` to prevent page reloads.
  - Server-side routing for Cloudflare Pages is handled automatically by Cloudflare's Vite framework detection (`not_found_handling: "single-page-application"`). **Do NOT** manually create a `public/_redirects` file for routing, as it will conflict and cause an infinite loop during deployment.

### 2. Local Workflows
- `npm install`
- `npm run dev` (Runs Vite frontend on port 3000. `worker.js` API routes are NOT active).
- `npm run build` then `npm start` (Runs full local app: Wrangler serves `dist/`, executes `worker.js`, and binds `MOVIES_KV`).
- `npm run preview` (Inspect static Vite build only).
- No test/lint scripts currently. Minimum: run `npm run build` and manually verify.

### 3. Design Philosophy (The "Netflix Standard")
The design is strictly governed by `docs/DESIGN.md` to create an immersive, premium, cinematic experience.
- **Colors**: True black (`#000000`) or deep grey (`#111111`) backgrounds only. Vibrant red (`#e50914`) for primary accents.
- **Movie Cards (`MovieCard.js`)**: Follow the "Infinite Digital Shelf" concept. Cards must **only** show the poster image. **Do not** add plain text underneath (e.g., "HD", "Tập Full"). Meta info must be absolutely positioned overlays (e.g., on hover).
- **Cinematic Layout (`Hero.js` & `MovieDetail.js`)**: The top of the home/detail pages must feature a full-bleed backdrop image that fades smoothly into the black background via CSS gradient. Info floats on the left over the gradient. No split-column layouts for the top section.
- **Icons**: Use crisp, modern SVG icons for buttons. No text-based symbols (`▶`, `i`).

### 4. Logo Management
Two separate logos for specific visual reasons; do not merge:
- **`public/logo-dark.png`**: Pure black (`#000000`) background. Used in `src/components/Header.js` to melt seamlessly into the dark navbar.
- **`public/logo.png`**: White/light background. Used exclusively as the favicon in `index.html` for visibility on light browser tabs.

### 5. API Handling (`src/api/ophim.js`)
- App fetches data from OPhim API (`https://ophim1.com/`).
- **Data Structure Quirks**: Payload structures vary (e.g., `data.item` vs `data.movie` vs `data.data.item`). `ophim.js` parsers handle fallbacks. If an API call fails to render, check the JSON structure before modifying components.

### 6. CSS Architecture (`src/styles/components.css`)
- Use BEM-like naming (`hero`, `hero__title`, `hero__btn--primary`).
- Hover states must scale smoothly (`transform: scale()`, `transition: ...`).
- Minimal border radiuses (`4px` or `8px`) for a sharper aesthetic.

### 7. Recent Optimizations & UI Policies (Do Not Revert)
Over multiple iterations, the following premium features and UX fixes have been solidified. **Do not remove or simplify them**:
- **Carousel Navigation**: Desktop `<` and `>` arrow buttons must be preserved.
- **Premium Search Overlay**: Full-screen `backdrop-filter: blur()`, giant input, SVG icons, staggered `fade-up` animations, "Pill" design for recent searches (with individual/clear buttons). Closes automatically on route change. **No simple dropdowns.**
- **Global Navigation (Sticky Back Button)**: The "Back" button is integrated directly into the global `Header.js`, smartly hiding on the home page. **Do not re-add floating back buttons into `MovieDetail.js`.**
- **Mobile Landscape Header**: Uses `@media (max-height: 500px) and (orientation: landscape)` to aggressively shrink height to `48px`. **Do not remove this media query.**
- **Static Numbered Pagination**: Category grids MUST use explicit URL query parameters (`?page=N`) and static numbered pagination. **Do NOT use Infinite Scroll**. The UI should be minimalist with transparent backgrounds and a red active state.
- **Movie Card Mobile CSS**: Mobile width restrictions (`width: calc(...)`) are specifically scoped to `.carousel__track .movie-card`. **Do not apply these globally** (it breaks Category Grid posters).
- **Premium Metadata Hierarchy (`MovieDetail.js`)**: The plot description stands alone. Secondary metadata (Actors, Directors) must be visually subordinated: smaller font (`14px`), dim gray (`#777777`), tight grouping (`gap: 8px`). Do not add large `<h3>` headers for the plot.
