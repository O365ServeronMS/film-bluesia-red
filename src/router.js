/**
 * Minimal History API-based SPA router
 * Routes: / , /phim/:slug , /danh-sach/:type , /the-loai/:slug , /quoc-gia/:slug , /tim-kiem
 */

let routes = [];
let currentCleanup = null;

/**
 * Register routes. Each route has a pattern and handler.
 * Pattern uses :param syntax for dynamic segments.
 * @param {Array<{path: string, handler: function}>} routeDefs
 */
export function initRouter(routeDefs) {
  routes = routeDefs.map(({ path, handler }) => {
    // Convert path pattern to regex
    const paramNames = [];
    const regexStr = path
      .replace(/:([^/]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\//g, '\\/');
    return {
      regex: new RegExp(`^${regexStr}\\/?$`),
      paramNames,
      handler,
    };
  });

  window.addEventListener('popstate', () => handleRoute());
  
  // Intercept local links globally
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      const href = link.getAttribute('href');
      // If the link is an internal link (e.g. starts with / or #/)
      if (href && (href.startsWith('/') || href.startsWith('#/'))) {
        e.preventDefault();
        navigate(href);
      }
    }
  });

  handleRoute();
}

/**
 * Navigate to a route programmatically
 * @param {string} path - e.g. '/phim/toy-story-5' or '#/phim/toy-story-5'
 */
export function navigate(path) {
  // Normalize legacy hash paths
  if (path.startsWith('#/')) {
    path = path.slice(1);
  } else if (path === '#') {
    path = '/';
  }
  
  history.pushState(null, '', path);
  handleRoute();
}

/**
 * Get the current route info
 */
export function getCurrentRoute() {
  const path = window.location.pathname || '/';
  const queryStr = window.location.search;
  const query = Object.fromEntries(new URLSearchParams(queryStr || ''));
  return { path, query };
}

function handleRoute() {
  // Cleanup previous page
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  const { path, query } = getCurrentRoute();
  
  // Dispatch event so persistent UI components (like Header) can update
  window.dispatchEvent(new CustomEvent('route-changed', { detail: path }));

  for (const route of routes) {
    // Exact match for root or static paths
    if (route.path === path || route.path === path.replace(/\/$/, '')) {
      window.scrollTo(0, 0);
      const cleanup = route.handler({ params: {}, query });
      if (typeof cleanup === 'function') currentCleanup = cleanup;
      return;
    }

    // Prefix match for dynamic paths like /phim/:slug
    if (route.path.includes(':')) {
      const prefix = route.path.split('/:')[0] + '/'; // e.g. "/phim/"
      if (path.startsWith(prefix)) {
        const slug = path.slice(prefix.length).replace(/\/$/, ''); // extract "hoang-tu-quy"
        if (slug) {
          const params = {};
          params[route.paramNames[0]] = decodeURIComponent(slug);
          
          window.scrollTo(0, 0);
          const cleanup = route.handler({ params, query });
          if (typeof cleanup === 'function') currentCleanup = cleanup;
          return;
        }
      }
    }
  }

  // 404 fallback — instead of redirecting silently, show error to help debug
  console.error("Router 404: No route matched path", path);
  document.body.innerHTML = `
    <div style="padding: 50px; text-align: center; color: white;">
      <h2>Lỗi Không Tìm Thấy Trang (404)</h2>
      <p>Đường dẫn hiện tại: <strong>${path}</strong></p>
      <p>Không khớp với bất kỳ Route nào.</p>
      <a href="/" style="color: #e50914; text-decoration: underline; margin-top: 20px; display: inline-block;">Quay về trang chủ</a>
    </div>
  `;
}
