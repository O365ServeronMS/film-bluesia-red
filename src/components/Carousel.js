/**
 * Carousel — horizontal scrollable row of movie cards
 */
import { renderMovieCard } from './MovieCard.js';

/**
 * Render a movie carousel section.
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {string} options.title - Section heading
 * @param {Array} options.items - Movie items to display
 * @param {string} [options.seeAllLink] - Hash link for the "Xem tất cả" action
 * @param {boolean} [options.showRank] - Whether to show ranking numbers on cards
 */
export function renderCarousel(container, { title, items, seeAllLink, showRank }) {
  const section = document.createElement('section');
  section.className = 'carousel';

  // ── Header row ──
  const headerRow = document.createElement('div');
  headerRow.className = 'carousel__header';

  const heading = document.createElement('h2');
  heading.className = 'carousel__title';
  heading.textContent = title;
  headerRow.appendChild(heading);

  if (seeAllLink) {
    const seeAll = document.createElement('a');
    seeAll.className = 'carousel__see-all';
    seeAll.href = seeAllLink;
    seeAll.textContent = 'Xem tất cả ›';
    headerRow.appendChild(seeAll);
  }

  section.appendChild(headerRow);

  // ── Track wrapper (with arrows) ──
  const wrapper = document.createElement('div');
  wrapper.className = 'carousel__wrapper';

  // Left arrow
  const leftArrow = document.createElement('button');
  leftArrow.className = 'carousel__arrow carousel__arrow--left';
  leftArrow.setAttribute('aria-label', 'Cuộn trái');
  leftArrow.textContent = '‹';
  wrapper.appendChild(leftArrow);

  // Track
  const track = document.createElement('div');
  track.className = 'carousel__track';

  items.forEach((movie, index) => {
    const rank = showRank ? index : null;
    renderMovieCard(track, movie, rank);
  });

  wrapper.appendChild(track);

  // Right arrow
  const rightArrow = document.createElement('button');
  rightArrow.className = 'carousel__arrow carousel__arrow--right';
  rightArrow.setAttribute('aria-label', 'Cuộn phải');
  rightArrow.textContent = '›';
  wrapper.appendChild(rightArrow);

  // ── Arrow scroll behaviour ──
  function scrollAmount() {
    return track.clientWidth * 0.8;
  }

  leftArrow.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });

  rightArrow.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });

  // ── Arrow visibility based on scroll position ──
  function updateArrowVisibility() {
    const { scrollLeft, scrollWidth, clientWidth } = track;
    leftArrow.classList.toggle('carousel__arrow--hidden', scrollLeft <= 0);
    rightArrow.classList.toggle(
      'carousel__arrow--hidden',
      scrollLeft + clientWidth >= scrollWidth - 1
    );
  }

  track.addEventListener('scroll', updateArrowVisibility, { passive: true });

  // Initial check (defer so layout is ready)
  requestAnimationFrame(updateArrowVisibility);

  section.appendChild(wrapper);
  container.appendChild(section);
}
