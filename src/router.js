/**
 * Minimal hash-based SPA router
 * Routes: #/ , #/phim/:slug , #/danh-sach/:type , #/the-loai/:slug , #/quoc-gia/:slug , #/tim-kiem
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
      regex: new RegExp(`^${regexStr}$`),
      paramNames,
      handler,
    };
  });

  window.addEventListener('hashchange', () => handleRoute());
  handleRoute();
}

/**
 * Navigate to a hash route programmatically
 * @param {string} hash - e.g. '#/phim/toy-story-5'
 */
export function navigate(hash) {
  window.location.hash = hash;
}

/**
 * Get the current route info
 */
export function getCurrentRoute() {
  const hash = window.location.hash.slice(1) || '/';
  const [path, queryStr] = hash.split('?');
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

  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });

      // Scroll to top on navigation
      window.scrollTo(0, 0);

      // Call handler, store cleanup function if returned
      const cleanup = route.handler({ params, query });
      if (typeof cleanup === 'function') {
        currentCleanup = cleanup;
      }
      return;
    }
  }

  // 404 fallback — redirect to home
  navigate('#/');
}
