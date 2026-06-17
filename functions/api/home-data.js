export async function onRequest({ request, env, waitUntil }) {
  const KV = env.MOVIES_KV;
  const CACHE_KEY = "home_data";
  const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  // Handle CORS for local dev if needed
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    "Cache-Control": "public, s-maxage=1800, max-age=1800",
  };

  try {
    // 1. Check KV Cache
    let cachedStr = null;
    if (KV) {
      cachedStr = await KV.get(CACHE_KEY);
    }
    
    let cachedData = null;
    if (cachedStr) {
      cachedData = JSON.parse(cachedStr);
    }

    // 2. Fetch function from OPhim
    const fetchFreshData = async () => {
      try {
        const [newRes, leRes, boRes, hhRes] = await Promise.all([
          fetch('https://ophim1.com/danh-sach/phim-moi-cap-nhat?page=1').then(r => r.json()),
          fetch('https://ophim1.com/v1/api/danh-sach/phim-le?page=1').then(r => r.json()),
          fetch('https://ophim1.com/v1/api/danh-sach/phim-bo?page=1').then(r => r.json()),
          fetch('https://ophim1.com/v1/api/danh-sach/hoat-hinh?page=1').then(r => r.json()),
        ]);

        const freshData = {
          timestamp: Date.now(),
          newMovies: {
            items: newRes.items || [],
            pagination: newRes.pagination || {},
            pathImage: newRes.pathImage || 'https://img.ophim.live/uploads/movies/',
          },
          phimLe: { items: (leRes.data?.items || leRes.items || []) },
          phimBo: { items: (boRes.data?.items || boRes.items || []) },
          hoatHinh: { items: (hhRes.data?.items || hhRes.items || []) },
        };

        // Write to KV
        if (KV) {
          await KV.put(CACHE_KEY, JSON.stringify(freshData));
        }
        return freshData;
      } catch (err) {
        console.error("Error fetching fresh data:", err);
        return null;
      }
    };

    // 3. SWR Logic
    if (cachedData) {
      // If cache is stale, revalidate in background
      if (Date.now() - cachedData.timestamp > CACHE_TTL_MS) {
        if (waitUntil) {
          waitUntil(fetchFreshData());
        } else {
          // Fallback if waitUntil is not available
          fetchFreshData();
        }
      }
      
      // Return cached immediately
      return new Response(JSON.stringify(cachedData), { headers: corsHeaders });
    } else {
      // First time ever: must await fetch
      const freshData = await fetchFreshData();
      if (!freshData) {
        return new Response(JSON.stringify({ error: "Failed to fetch data from OPhim" }), { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify(freshData), { headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
