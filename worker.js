const API_BASE = 'https://ophim1.com';
const CACHE_KEY = 'home_data_v4';
const CACHE_TTL_MS = 30 * 60 * 1000;
const FETCH_BATCH_SIZE = 3;
const HERO_COUNT = 5;
const MAX_CANDIDATES_TO_SCORE = 120;

export default {
  async fetch(request, env, ctx) {
    console.log('Worker intercepted:', request.url);
    const url = new URL(request.url);

    if (url.pathname === '/api/home-data') {
      return await handleHomeData(env, ctx);
    }

    let response = await env.ASSETS.fetch(request);

    if (response.status === 404 && request.headers.get('accept')?.includes('text/html')) {
      const indexReq = new Request(url.origin + '/', request);
      response = await env.ASSETS.fetch(indexReq);
    }

    return response;
  }
};

async function handleHomeData(env, ctx) {
  const KV = env.MOVIES_KV;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, s-maxage=1800, max-age=1800',
  };

  try {
    const cachedStr = KV ? await KV.get(CACHE_KEY) : null;
    const cachedData = cachedStr ? JSON.parse(cachedStr) : null;

    if (cachedData) {
      if (Date.now() - cachedData.timestamp > CACHE_TTL_MS) {
        const refresh = fetchFreshData().then(data => data && KV?.put(CACHE_KEY, JSON.stringify(data)));
        if (ctx?.waitUntil) ctx.waitUntil(refresh);
      }
      return new Response(JSON.stringify(cachedData), { headers: corsHeaders });
    }

    const freshData = await fetchFreshData();
    if (!freshData) {
      return new Response(JSON.stringify({ error: 'Failed to fetch data from OPhim' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (KV) await KV.put(CACHE_KEY, JSON.stringify(freshData));
    return new Response(JSON.stringify(freshData), { headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function fetchFreshData() {
  try {
    const urls = [
      `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=1`,
      `${API_BASE}/v1/api/danh-sach/phim-le?page=1`,
      `${API_BASE}/v1/api/danh-sach/phim-bo?page=1`,
      `${API_BASE}/v1/api/danh-sach/hoat-hinh?page=1`,
      `${API_BASE}/v1/api/quoc-gia/au-my?page=1`,
      `${API_BASE}/v1/api/quoc-gia/au-my?page=2`,
      `${API_BASE}/v1/api/quoc-gia/au-my?page=3`,
      `${API_BASE}/v1/api/danh-sach/phim-chieu-rap?page=1`,
      `${API_BASE}/v1/api/danh-sach/phim-chieu-rap?page=2`,
      `${API_BASE}/v1/api/danh-sach/phim-chieu-rap?page=3`,
    ];

    const [
      newRes,
      leRes,
      boRes,
      hhRes,
      auMyPage1,
      auMyPage2,
      auMyPage3,
      cinemaPage1,
      cinemaPage2,
      cinemaPage3,
    ] = await fetchJsonInBatches(urls);

    const auMyItems = [auMyPage1, auMyPage2, auMyPage3].flatMap(getItems);
    const cinemaItems = [cinemaPage1, cinemaPage2, cinemaPage3].flatMap(getItems);
    const heroMovies = rankHeroMovies(auMyItems, cinemaItems);

    return {
      timestamp: Date.now(),
      heroMovies,
      newMovies: {
        items: newRes.items || [],
        pagination: newRes.pagination || {},
        pathImage: newRes.pathImage || 'https://img.ophim.live/uploads/movies/',
      },
      phimLe: { items: getItems(leRes) },
      phimBo: { items: getItems(boRes) },
      hoatHinh: { items: getItems(hhRes) },
    };
  } catch (err) {
    console.error('Error fetching fresh data:', err);
    return null;
  }
}

async function fetchJsonInBatches(urls) {
  const results = [];
  for (let i = 0; i < urls.length; i += FETCH_BATCH_SIZE) {
    const batch = urls.slice(i, i + FETCH_BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(url => fetch(url).then(res => res.json())));
    results.push(...batchResults);
  }
  return results;
}

function getItems(payload) {
  return payload?.data?.items || payload?.items || [];
}

function rankHeroMovies(auMyItems, cinemaItems) {
  const auMySlugs = new Set(auMyItems.map(item => item.slug).filter(Boolean));
  const cinemaSlugs = new Set(cinemaItems.map(item => item.slug).filter(Boolean));
  const candidates = new Map();

  for (const item of [...auMyItems, ...cinemaItems]) {
    if (!item?.slug) continue;
    const existing = candidates.get(item.slug) || {};
    candidates.set(item.slug, {
      ...existing,
      ...item,
      _isAuMySource: existing._isAuMySource || auMySlugs.has(item.slug),
      _isCinemaSource: existing._isCinemaSource || cinemaSlugs.has(item.slug),
    });
  }

  return Array.from(candidates.values())
    .filter(isHeroCandidate)
    .slice(0, MAX_CANDIDATES_TO_SCORE)
    .map(movie => ({
      ...movie,
      hotScore: calculateHotScore(movie),
    }))
    .sort((a, b) => {
      if (b.hotScore !== a.hotScore) return b.hotScore - a.hotScore;
      const imdbDiff = getImdbScore(b) - getImdbScore(a);
      if (imdbDiff !== 0) return imdbDiff;
      return getYear(b) - getYear(a);
    })
    .slice(0, HERO_COUNT);
}

function isHeroCandidate(movie) {
  return (
    movie.type === 'single' &&
    (movie._isAuMySource || movie._isCinemaSource) &&
    !isTrailer(movie) &&
    getImdbScore(movie) > 0 &&
    Boolean(movie.poster_url && movie.thumb_url)
  );
}

function calculateHotScore(movie) {
  const sourceMatchScore = getSourceMatchScore(movie);
  const imdbScore = getImdbScore(movie) * 10;
  const recencyScore = getRecencyScore(movie);
  const velocityScore = getUpdateVelocityScore(movie);
  const visualScore = movie.poster_url && movie.thumb_url ? 100 : 0;

  return Math.round(
    sourceMatchScore * 0.30 +
    imdbScore * 0.25 +
    recencyScore * 0.22 +
    velocityScore * 0.15 +
    visualScore * 0.08
  );
}

function getSourceMatchScore(movie) {
  if (movie._isAuMySource && movie._isCinemaSource) return 100;
  if (movie._isCinemaSource) return 86;
  if (movie._isAuMySource) return 78;
  return 0;
}

function getImdbScore(movie) {
  const rawScore =
    movie.imdb?.vote_average ??
    movie.imdb?.rating ??
    movie.imdb?.score ??
    movie.imdb;

  const score = Number(rawScore);
  return Number.isFinite(score) && score > 0 ? score : 0;
}

function getRecencyScore(movie) {
  const year = getYear(movie);
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  if (!year || age < 0) return 0;
  if (age === 0) return 100;
  if (age === 1) return 85;
  if (age === 2) return 65;
  if (age <= 5) return 35;
  return 15;
}

function getUpdateVelocityScore(movie) {
  const modifiedTime = movie.modified?.time || movie.modified;
  const modifiedMs = Date.parse(modifiedTime);
  if (!Number.isFinite(modifiedMs)) return 0;

  const ageDays = (Date.now() - modifiedMs) / 86400000;
  if (ageDays <= 1) return 100;
  if (ageDays <= 3) return 80;
  if (ageDays <= 7) return 60;
  if (ageDays <= 14) return 35;
  return 10;
}

function getYear(movie) {
  const year = Number(movie.year);
  return Number.isFinite(year) ? year : 0;
}

function isTrailer(movie) {
  const status = String(movie.status || '').toLowerCase();
  const episode = String(movie.episode_current || '').toLowerCase();
  return status.includes('trailer') || episode.includes('trailer');
}
