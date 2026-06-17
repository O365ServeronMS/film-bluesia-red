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

  // ---- Sentinel for Infinite Scroll ----
  const sentinel = document.createElement('div');
  sentinel.className = 'category-grid__sentinel';
  sentinel.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinner"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>`;
  sentinel.style.display = 'none';

  // ---- End Message ----
  const endMessage = document.createElement('div');
  endMessage.className = 'category-grid__end-message';
  endMessage.textContent = 'Bạn đã khám phá hết danh mục này.';
  endMessage.style.display = 'none';

  // ---- Error message ----
  const errorEl = document.createElement('div');
  errorEl.className = 'category-grid__error';
  errorEl.style.display = 'none';

  // ---- Skeleton placeholder ----
  const skeleton = createSkeletonGrid(10);
  wrapper.appendChild(skeleton);

  wrapper.appendChild(grid);
  wrapper.appendChild(sentinel);
  wrapper.appendChild(endMessage);
  wrapper.appendChild(errorEl);
  container.appendChild(wrapper);

  // ---- Pagination state ----
  let currentPage = 0;
  let totalPages = 1;
  let isLoading = false;

  // ---- Intersection Observer ----
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLoading && currentPage < totalPages) {
      loadPage();
    }
  }, { rootMargin: '300px' });

  // ---- Fetch & render a page ----
  async function loadPage() {
    if (isLoading) return;
    isLoading = true;
    currentPage++;

    if (currentPage > 1) {
      sentinel.style.display = 'flex';
    }

    try {
      const { items, pagination } = await fetchFn(currentPage);

      // Remove initial skeleton on first successful load
      if (skeleton.parentNode) skeleton.remove();

      // Determine total pages from pagination accurately
      if (pagination.totalItems && pagination.totalItemsPerPage) {
        totalPages = Math.ceil(pagination.totalItems / pagination.totalItemsPerPage);
      } else {
        totalPages = pagination.totalPages || pagination.totalPage || 1;
      }

      if (!items || items.length === 0) {
        if (currentPage === 1) {
          errorEl.textContent = 'Không có phim nào trong danh mục này.';
          errorEl.style.display = '';
        }
      } else {
        items.forEach((movie, index) => {
          renderMovieCard(grid, movie);
          const card = grid.lastElementChild;
          if (card) {
            card.classList.add('fade-up');
            card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;
          }
        });
      }

      sentinel.style.display = 'none';

      // Check if end reached
      if (currentPage >= totalPages && items && items.length > 0) {
        endMessage.style.display = 'block';
        observer.unobserve(sentinel);
      }
    } catch (err) {
      if (skeleton.parentNode) skeleton.remove();

      errorEl.textContent = 'Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại.';
      errorEl.style.display = '';
      sentinel.style.display = 'none';
      currentPage--;
    } finally {
      isLoading = false;
    }
  }

  observer.observe(sentinel);

  // ---- Initial load ----
  await loadPage();
}
