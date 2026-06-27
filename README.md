<div align="center">

# 🎬 redflare

**[`phim.bluesia.net`](https://phim.bluesia.net)** — web xem phim tiếng Việt, nhanh & gọn.

🪶 Vanilla JS SPA · ⚡ Vite · ☁️ Cloudflare (static, zero-Worker) · 🎞️ hls.js

</div>

---

## ✨ Tính năng

- 🏠 **Trang chủ** — Hero "Phim Hot Trong Tuần" + các hàng phim cuộn ngang
- 🔥 **Trending** — top phim theo TMDB (tuần → hero, ngày → hàng trending)
- 🎥 **Chi tiết phim** — thông tin, tập phim, gợi ý "Bạn cũng có thể thích"
- ▶️ **Trình phát HLS** — stream mượt qua `hls.js`
- 🔎 **Tìm kiếm** + duyệt theo **thể loại / quốc gia / danh sách**
- 📱 **Responsive** — desktop landscape, mobile portrait

## 🛠️ Lệnh

| Lệnh | Việc |
|---|---|
| 🧪 `npm run dev` | Vite dev server (hit `/api/*` đã deploy) |
| 📦 `npm run build` | Build production → `dist/` |
| 🐳 `npm start` | `wrangler dev` — serve bản build local |

## 🚀 Deploy

```bash
git push origin main   # Cloudflare tự build & deploy
```

## 🧩 Kiến trúc

```
src/
├── main.js            # 🚪 entry — mount UI, wire router, render từng route
├── router.js          # 🧭 SPA router (History API)
├── api/ophim.js       # 📡 catalog client → img.bluesia.net/api/*
├── modules/<Name>/    # 🎨 UI components (DOM thuần, không virtual DOM)
└── styles/            # 💅 CSS (variables · global · components, BEM-ish)
```

🗂️ **Dữ liệu** (home / list / genre / country / detail) đến từ **`catalog-api`** trên VPS
(`img.bluesia.net/api/*`) — proxy OPhim, ký HMAC ảnh, cache Valkey. Frontend **không**
chạm OPhim hay Cloudflare Worker.

> 📖 Chi tiết module: [`MODULES.md`](MODULES.md)

<div align="center">

🇻🇳 UI tiếng Việt · 🚫 No framework · 🚫 No TypeScript · 🚫 No tests

</div>
