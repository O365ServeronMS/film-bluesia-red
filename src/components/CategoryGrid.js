/**
 * CategoryGrid — paginated grid of movie cards
 * Used for danh-sach, the-loai, and quoc-gia listing pages.
 */

import { renderMovieCard } from './MovieCard.js';
import { navigate } from '../router.js';

// ---------------------------------------------------------------------------
// Skeleton grid
// ---------------------------------------------------------------------------

function createSkeletonGrid(count = 10) {
  const grid = document.createElement('div');
  grid.className = 'category-grid__grid';

  for (let i = 0; i < count; i++) {
    const card = document.createElement('div');
    card.className = 'movie-card movie-card--skeleton';

    const poster = document.createElement('div');
    poster.className = 'movie-card__poster skeleton-shimmer';
    card.appendChild(poster);

    const titleBar = document.createElement('div');
    titleBar.className = 'movie-card__title skeleton-shimmer';
    card.appendChild(titleBar);

    grid.appendChild(card);
  }

  return grid;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export async function renderCategoryGrid(container, { type, fetchFn, title }) {
  const wrapper = document.createElement('section');
  wrapper.className = 'category-grid';

  // ---- Header (Breadcrumb + Title) ----
  const header = document.createElement('div');
  header.className = 'category-grid__header';

  // ---- Breadcrumb ----
  const breadcrumb = document.createElement('nav');
  breadcrumb.className = 'category-grid__breadcrumb';
  breadcrumb.setAttribute('aria-label', 'Breadcrumb');

  const homeLink = document.createElement('a');
  homeLink.className = 'category-grid__breadcrumb-link';
  homeLink.href = '/';
  homeLink.textContent = 'Trang chủ';
  homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('/');
  });
  breadcrumb.appendChild(homeLink);

  const sep = document.createElement('span');
  sep.className = 'category-grid__breadcrumb-sep';
  sep.textContent = '›';
  breadcrumb.appendChild(sep);

  const current = document.createElement('span');
  current.className = 'category-grid__breadcrumb-current';
  current.textContent = title;
  breadcrumb.appendChild(current);

  header.appendChild(breadcrumb);

  // ---- Title ----
  const heading = document.createElement('h1');
  heading.className = 'category-grid__title';
  heading.textContent = title;
  header.appendChild(heading);

  wrapper.appendChild(header);

  // ---- Cards grid ----
  const grid = document.createElement('div');
  grid.className = 'category-grid__grid';

  // ---- Load More button ----
  const loadMoreBtn = document.createElement('button');
  loadMoreBtn.className = 'category-grid__load-more';
  loadMoreBtn.textContent = 'Tải thêm';
  loadMoreBtn.style.display = 'none';

  // ---- Error message ----
  const errorEl = document.createElement('div');
  errorEl.className = 'category-grid__error';
  errorEl.style.display = 'none';

  // ---- Skeleton placeholder ----
  const skeleton = createSkeletonGrid(10);
  wrapper.appendChild(skeleton);

  wrapper.appendChild(grid);
  wrapper.appendChild(loadMoreBtn);
  wrapper.appendChild(errorEl);
  container.appendChild(wrapper);

  // ---- Pagination state ----
  let currentPage = 0;
  let totalPages = 1;
  let isLoading = false;

  // ---- Fetch & render a page ----
  async function loadPage() {
    if (isLoading) return;
    isLoading = true;
    currentPage++;

    // Show inline skeleton for subsequent pages
    let inlineSkeleton = null;
    if (currentPage > 1) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Đang tải...';
    }

    try {
      const { items, pagination } = await fetchFn(currentPage);

      // Remove initial skeleton on first successful load
      if (skeleton.parentNode) skeleton.remove();

      // Determine total pages from pagination
      totalPages = pagination.totalPages || pagination.totalPage || 1;

      if (!items || items.length === 0) {
        if (currentPage === 1) {
          errorEl.textContent = 'Không có phim nào trong danh mục này.';
          errorEl.style.display = '';
        }
      } else {
        items.forEach((movie) => {
          renderMovieCard(grid, movie);
        });
      }

      // Show / hide Load More
      if (currentPage < totalPages) {
        loadMoreBtn.style.display = '';
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Tải thêm';
      } else {
        loadMoreBtn.style.display = 'none';
      }
    } catch (err) {
      // Remove skeleton on error too
      if (skeleton.parentNode) skeleton.remove();

      errorEl.textContent = 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.';
      errorEl.style.display = '';

      loadMoreBtn.disabled = false;
      loadMoreBtn.textContent = 'Tải thêm';
      // Roll back page so user can retry
      currentPage--;
    } finally {
      isLoading = false;
    }
  }

  // ---- Load More handler ----
  loadMoreBtn.addEventListener('click', loadPage);

  // ---- Initial load ----
  await loadPage();
}
