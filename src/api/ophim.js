/**
 * OPhim API Client
 * Base: https://ophim1.com
 * Image CDN: https://img.ophim.live/uploads/movies/
 */

const API_BASE = 'https://ophim1.com';
const IMG_CDN = 'https://img.ophim.live/uploads/movies/';

// Simple in-memory cache with TTL (5 minutes)
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

async function fetchJson(url) {
  const cached = getCached(url);
  if (cached) return cached;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  setCache(url, data);
  return data;
}

/**
 * Get newly updated movies
 * @param {number} page
 * @returns {Promise<{items: Array, pagination: Object}>}
 */
export async function getNewMovies(page = 1) {
  const data = await fetchJson(`${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`);
  return {
    items: data.items || [],
    pagination: data.pagination || {},
    pathImage: data.pathImage || IMG_CDN,
  };
}

/**
 * Get movies by type (phim-le, phim-bo, hoat-hinh, tv-shows)
 * @param {string} type
 * @param {number} page
 * @returns {Promise<{items: Array, pagination: Object, titlePage: string}>}
 */
export async function getMoviesByType(type, page = 1) {
  const data = await fetchJson(`${API_BASE}/v1/api/danh-sach/${type}?page=${page}`);
  const d = data.data || data;
  return {
    items: (d.items || []).map(normalizeListItem),
    pagination: d.params?.pagination || {},
    titlePage: d.titlePage || type,
    breadCrumb: d.breadCrumb || [],
    seoOnPage: d.seoOnPage || {},
  };
}

/**
 * Get full movie detail by slug
 * @param {string} slug
 * @returns {Promise<Object>}
 */
export async function getMovieDetail(slug) {
  const data = await fetchJson(`${API_BASE}/phim/${slug}`);
  const item = data.data?.item || data.item || data.movie || {};
  return {
    ...item,
    episodes: item.episodes || data.episodes || data.data?.episodes || [],
    cdnImage: data.data?.APP_DOMAIN_CDN_IMAGE || data.APP_DOMAIN_CDN_IMAGE || 'https://img.ophim.live',
  };
}

/**
 * Search movies by keyword
 * @param {string} keyword
 * @param {number} page
 * @returns {Promise<{items: Array, pagination: Object}>}
 */
export async function searchMovies(keyword, page = 1) {
  const data = await fetchJson(
    `${API_BASE}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`
  );
  const d = data.data || data;
  return {
    items: (d.items || []).map(normalizeListItem),
    pagination: d.params?.pagination || {},
  };
}

/**
 * Get all genres
 * @returns {Promise<Array<{_id: string, name: string, slug: string}>>}
 */
export async function getGenres() {
  const data = await fetchJson(`${API_BASE}/v1/api/the-loai`);
  return data.data?.items || data.items || [];
}

/**
 * Get all countries
 * @returns {Promise<Array<{_id: string, name: string, slug: string}>>}
 */
export async function getCountries() {
  const data = await fetchJson(`${API_BASE}/v1/api/quoc-gia`);
  return data.data?.items || data.items || [];
}

/**
 * Get movies by genre slug
 */
export async function getMoviesByGenre(genreSlug, page = 1) {
  const data = await fetchJson(`${API_BASE}/v1/api/the-loai/${genreSlug}?page=${page}`);
  const d = data.data || data;
  return {
    items: (d.items || []).map(normalizeListItem),
    pagination: d.params?.pagination || {},
    titlePage: d.titlePage || genreSlug,
    seoOnPage: d.seoOnPage || {},
  };
}

/**
 * Get movies by country slug
 */
export async function getMoviesByCountry(countrySlug, page = 1) {
  const data = await fetchJson(`${API_BASE}/v1/api/quoc-gia/${countrySlug}?page=${page}`);
  const d = data.data || data;
  return {
    items: (d.items || []).map(normalizeListItem),
    pagination: d.params?.pagination || {},
    titlePage: d.titlePage || countrySlug,
    seoOnPage: d.seoOnPage || {},
  };
}

// --- Image URL helpers ---

export function posterUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return IMG_CDN + path;
}

export function thumbUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return IMG_CDN + path;
}

// --- Normalize list item ---
// The v1/api endpoints return slightly different shapes; normalize them

export function normalizeListItem(item) {
  return {
    _id: item._id,
    name: item.name,
    slug: item.slug,
    origin_name: item.origin_name,
    thumb_url: item.thumb_url || item.poster_url || '',
    poster_url: item.poster_url || item.thumb_url || '',
    year: item.year,
    type: item.type,
    status: item.status,
    quality: item.quality,
    lang: item.lang,
    episode_current: item.episode_current,
    time: item.time,
    category: item.category || [],
    country: item.country || [],
    tmdb: item.tmdb || {},
    imdb: item.imdb || {},
    modified: item.modified || {},
  };
}

export { API_BASE, IMG_CDN };
