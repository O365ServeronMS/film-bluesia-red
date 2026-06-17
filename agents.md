# AI Agent Guidelines for Film Bluesia Red

Welcome, fellow AI agent! If you are reading this, you are about to modify the `film-bluesia-red` codebase. Before you write a single line of code, **read this entire document**. It contains critical context and architectural rules to ensure you don't accidentally revert hard-won improvements or break the premium design system.

## 1. Core Architecture
- **Tech Stack**: Vanilla JavaScript (ESModules), plain CSS, and Vite as the bundler. **No React, Vue, or Tailwind.** Keep dependencies minimal.
- **Routing**: The app uses a custom **HTML5 History API Router** (located in `src/router.js`).
  - **CRITICAL**: Do **NOT** use Hash Routing (`#/path`). All paths must be clean (e.g., `/phim/slug`).
  - Link clicks are intercepted globally in `router.js` to prevent page reloads.
  - Server-side routing for Cloudflare Pages is handled automatically by Cloudflare's Vite framework detection (`not_found_handling: "single-page-application"`). **Do NOT** manually create a `public/_redirects` file for routing, as it will conflict and cause an infinite loop during deployment.

## 2. Design Philosophy & Rules (The "Netflix Standard")
The design is strictly governed by `docs/DESIGN.md`. The goal is an immersive, premium, cinematic experience.
- **Colors**: True black (`#000000`) or deep grey (`#111111`) backgrounds only. Vibrant red (`#e50914`) for primary accents.
- **Movie Cards (`MovieCard.js`)**: Follow the "Infinite Digital Shelf" concept. Cards must only show the poster image. **Do not** add plain text underneath the cards (e.g., "HD", "Tập Full"). Meta information should only appear as absolutely positioned overlays (e.g., on hover).
- **Cinematic Layout (`Hero.js` & `MovieDetail.js`)**: The top of the home page and individual movie detail pages must feature a full-bleed, edge-to-edge backdrop image that fades smoothly into the black background via a CSS gradient. Information (Title, Year, Buttons) floats on the left side over the gradient. Do not revert to a split-column (poster next to text) layout for the top section.
- **Icons**: Use crisp, modern SVG icons for buttons (e.g., Play, Info) instead of text-based symbols (like `▶` or `i`).

## 3. Logo Management
There are two separate logos used for specific visual reasons. Do not merge them:
- **`public/logo-dark.png`**: A logo with a pure black (`#000000`) background. This is used in `src/components/Header.js` so it melts seamlessly into the dark navigation bar.
- **`public/logo.png`**: A logo with a white/light background. This is used exclusively as the favicon in `index.html` to guarantee visibility on light-themed browser tabs.

## 4. API Handling (`src/api/ophim.js`)
- The app fetches data from the OPhim API (`https://ophim1.com/`).
- **Data Structure Quirks**: The API payload structure can be inconsistent between different endpoints (e.g., `data.item` vs `data.movie` vs `data.data.item`). The parsers in `ophim.js` (like `getMovieDetail`) handle these fallbacks. If an API call fails to render data, check the JSON structure first before modifying components.

## 5. CSS Architecture (`src/styles/components.css`)
- Use BEM-like naming conventions (e.g., `hero`, `hero__title`, `hero__btn--primary`).
- Ensure all hover states scale smoothly (`transform: scale()`, `transition: ...`).
- Keep border radiuses minimal (`4px` or `8px`) for a sharper, more mature aesthetic.

By adhering strictly to these guidelines, you will preserve the structural integrity and premium feel of the application. Good luck!

## 6. Recent Optimizations & UI Policies (Do Not Revert)
Over multiple iterations, the following premium features and UX fixes have been solidified. **Do not remove or simplify them**:
- **Carousel Navigation**: The movie carousels feature `<` and `>` arrow buttons for easy desktop navigation. These must be preserved.
- **Premium Search Overlay**: The search uses a full-screen `backdrop-filter: blur()` glassmorphism effect. It features a giant input, SVG icons, staggered `fade-up` animations for results, and a "Pill" design for recent searches (with individual and "clear all" delete buttons). It also automatically closes on route change. **Do not revert to a simple dropdown or basic list.**
- **Global Navigation (Sticky Back Button)**: The "Back" (`Quay lại`) button is integrated directly into the global `Header` (in `Header.js`), making it a sticky, universally accessible button that smartly hides on the home page. **Do not re-add a floating back button into `MovieDetail.js`**.
- **Mobile Landscape Header**: The global Header uses a `@media (max-height: 500px) and (orientation: landscape)` query to aggressively shrink its height to `48px`. This ensures the navigation bar doesn't waste precious vertical space when phones are rotated. **Do not remove this media query.**
- **Infinite Scroll Pagination**: Category grids (Phim Lẻ, Phim Bộ, etc.) use `IntersectionObserver` for seamless infinite scrolling. **Do not revert to traditional numbered pagination or manual "Load More" buttons.** Note that the OPhim API does not return `totalPages` for lists, so we manually calculate it via `Math.ceil(pagination.totalItems / pagination.totalItemsPerPage)`.
- **Movie Card Mobile CSS**: Mobile media queries limiting the width of `.movie-card` (e.g., `width: calc(...)`) are specifically scoped to `.carousel__track .movie-card`. **Do not apply these widths globally**, as it will break and shrink the posters in the Category Grid.
