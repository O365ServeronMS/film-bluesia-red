/**
 * Film Bluesia — Main Entry Point
 * Orchestrates routing, page rendering, and global event handling.
 */

import './styles/global.css';
import './styles/components.css';

import { initRouter, navigate } from './router.js';
import {
  getNewMovies,
  getMoviesByType,
  getMoviesByGenre,
  getMoviesByCountry,
  searchMovies,
} from './api/ophim.js';

import { renderHeader } from './components/Header.js';
import { renderHero } from './components/Hero.js';
import { renderCarousel } from './components/Carousel.js';
import { renderFooter } from './components/Footer.js';
import { renderMovieDetail } from './components/MovieDetail.js';
import { renderCategoryGrid } from './components/CategoryGrid.js';
import { renderSearchOverlay } from './components/SearchOverlay.js';
import { createSkeletonCards, createSkeletonHero } from './components/Skeleton.js';

// ─── App Root ──────────────────────────────────────────
const app = document.getElementById('app');

// ─── Persistent UI (Header, Search, Footer are managed per-page) ───
let headerCleanup = null;
let searchCleanup = null;

function mountGlobalUI() {
  // Header
  if (!document.querySelector('.header')) {
    const headerEl = document.createElement('div');
    headerEl.id = 'header-root';
    app.prepend(headerEl);
    headerCleanup = renderHeader(headerEl);
  }

  // Search overlay
  if (!document.querySelector('.search-overlay')) {
    const searchEl = document.createElement('div');
    searchEl.id = 'search-root';
    app.appendChild(searchEl);
    searchCleanup = renderSearchOverlay(searchEl);
  }
}

// ─── Page Container ─────────────────────────────────────
function getPageContainer() {
  let page = document.getElementById('page-content');
  if (page) {
    page.innerHTML = '';
  } else {
    page = document.createElement('main');
    page.id = 'page-content';
    // Insert after header, before search overlay
    const searchRoot = document.getElementById('search-root');
    if (searchRoot) {
      app.insertBefore(page, searchRoot);
    } else {
      app.appendChild(page);
    }
  }
  return page;
}

// ─── Home Page ──────────────────────────────────────────
async function renderHomePage() {
  const page = getPageContainer();

  // Show loading skeleton
  const skeleton = document.createElement('div');
  skeleton.appendChild(createSkeletonHero());
  const skeletonRow = document.createElement('div');
  skeletonRow.className = 'carousel';
  skeletonRow.style.padding = '0 4%';
  skeletonRow.appendChild(createSkeletonCards(6));
  skeleton.appendChild(skeletonRow);
  page.appendChild(skeleton);

  try {
    // Fetch data in parallel
    const [newMovies, phimLe, phimBo, hoatHinh] = await Promise.all([
      getNewMovies(1),
      getMoviesByType('phim-le', 1),
      getMoviesByType('phim-bo', 1),
      getMoviesByType('hoat-hinh', 1),
    ]);

    // Clear skeleton
    page.innerHTML = '';

    // Hero — use first items from new movies
    const heroCleanup = renderHero(page, newMovies.items.slice(0, 5));

    // Carousels
    renderCarousel(page, {
      title: 'Phim Mới Cập Nhật',
      items: newMovies.items,
      seeAllLink: '#/danh-sach/phim-moi-cap-nhat',
      showRank: true,
    });

    renderCarousel(page, {
      title: 'Phim Lẻ',
      items: phimLe.items,
      seeAllLink: '#/danh-sach/phim-le',
    });

    renderCarousel(page, {
      title: 'Phim Bộ',
      items: phimBo.items,
      seeAllLink: '#/danh-sach/phim-bo',
    });

    renderCarousel(page, {
      title: 'Hoạt Hình',
      items: hoatHinh.items,
      seeAllLink: '#/danh-sach/hoat-hinh',
    });

    // Footer
    renderFooter(page);

    return () => {
      if (heroCleanup) heroCleanup();
    };
  } catch (err) {
    page.innerHTML = '';
    const errEl = document.createElement('div');
    errEl.className = 'container';
    errEl.style.paddingTop = '120px';
    errEl.style.textAlign = 'center';
    errEl.innerHTML = `
      <h2 style="margin-bottom:16px">Không thể tải dữ liệu</h2>
      <p style="color:#888;margin-bottom:24px">${err.message}</p>
      <button class="hero__btn hero__btn--primary" onclick="location.reload()">Thử lại</button>
    `;
    page.appendChild(errEl);
  }
}

// ─── Movie Detail Page ──────────────────────────────────
function renderDetailPage({ params }) {
  const page = getPageContainer();
  renderMovieDetail(page, params.slug);
  renderFooter(page);
}

// ─── Category / List Page ───────────────────────────────
function renderListPage({ params }) {
  const page = getPageContainer();
  const type = params.type;

  const typeNames = {
    'phim-le': 'Phim Lẻ',
    'phim-bo': 'Phim Bộ',
    'hoat-hinh': 'Hoạt Hình',
    'tv-shows': 'TV Shows',
    'phim-moi-cap-nhat': 'Phim Mới Cập Nhật',
  };

  if (type === 'phim-moi-cap-nhat') {
    renderCategoryGrid(page, {
      type: 'danh-sach',
      fetchFn: (p) => getNewMovies(p),
      title: typeNames[type] || type,
    });
  } else {
    renderCategoryGrid(page, {
      type: 'danh-sach',
      fetchFn: (p) => getMoviesByType(type, p),
      title: typeNames[type] || type,
    });
  }

  renderFooter(page);
}

// ─── Genre Page ─────────────────────────────────────────
function renderGenrePage({ params }) {
  const page = getPageContainer();
  renderCategoryGrid(page, {
    type: 'the-loai',
    fetchFn: (p) => getMoviesByGenre(params.slug, p),
    title: params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  });
  renderFooter(page);
}

// ─── Country Page ───────────────────────────────────────
function renderCountryPage({ params }) {
  const page = getPageContainer();
  renderCategoryGrid(page, {
    type: 'quoc-gia',
    fetchFn: (p) => getMoviesByCountry(params.slug, p),
    title: params.slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  });
  renderFooter(page);
}

// ─── Search Page (fallback for direct URL) ──────────────
function renderSearchPage({ query }) {
  // Trigger the search overlay open
  document.dispatchEvent(new CustomEvent('open-search', { detail: query.q || '' }));
}

// ─── Initialize ─────────────────────────────────────────
mountGlobalUI();

initRouter([
  { path: '/', handler: renderHomePage },
  { path: '/phim/:slug', handler: renderDetailPage },
  { path: '/danh-sach/:type', handler: renderListPage },
  { path: '/the-loai/:slug', handler: renderGenrePage },
  { path: '/quoc-gia/:slug', handler: renderCountryPage },
  { path: '/tim-kiem', handler: renderSearchPage },
]);
