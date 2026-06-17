/**
 * Player — embedded video player section
 * Supports iframe embed (primary) and native/HLS.js <video> fallback for m3u8 URLs.
 */
import Hls from 'hls.js';

export function renderPlayer(container, { embedUrl, m3u8Url, serverName, episodeName, backdropUrl }) {
  const section = document.createElement('section');
  section.className = 'player';

  // ---- Header (Back button + Info) ----
  const header = document.createElement('div');
  header.className = 'player__header';

  const backBtn = document.createElement('button');
  backBtn.className = 'player__back';
  backBtn.textContent = '← Quay lại';
  
  // Cleanup HLS instance on close
  let hlsInstance = null;
  backBtn.addEventListener('click', () => {
    if (hlsInstance) {
      hlsInstance.destroy();
    }
    section.remove();
  });
  header.appendChild(backBtn);

  const infoText = document.createElement('h3');
  infoText.className = 'player__title';
  infoText.innerHTML = `Đang phát: <span>${episodeName} (${serverName})</span>`;
  header.appendChild(infoText);

  section.appendChild(header);

  // ---- Player container (16:9 aspect ratio, max height) ----
  const playerContainer = document.createElement('div');
  playerContainer.className = 'player__container';

  // Splash screen to prevent auto-play
  const splash = document.createElement('div');
  splash.className = 'player__splash';
  splash.style.backgroundImage = `url(${backdropUrl || ''})`;
  
  const playIcon = document.createElement('button');
  playIcon.className = 'player__play-btn';
  playIcon.setAttribute('aria-label', 'Phát video');
  playIcon.innerHTML = `<svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor"><circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.6)" stroke="#fff" stroke-width="1.5"/><path d="M10 8l6 4-6 4z" fill="#fff"/></svg>`;
  
  splash.appendChild(playIcon);
  playerContainer.appendChild(splash);

  const startPlayback = () => {
    playerContainer.innerHTML = ''; // Clear splash
    
    if (embedUrl) {
      const iframe = document.createElement('iframe');
      iframe.className = 'player__iframe';
      iframe.src = embedUrl;
      iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('scrolling', 'no');
      iframe.style.position = 'absolute';
      iframe.style.top = '0';
      iframe.style.left = '0';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      playerContainer.appendChild(iframe);
    } else if (m3u8Url) {
      const video = document.createElement('video');
      video.className = 'player__video';
      video.controls = true;
      video.autoplay = true;
      video.style.position = 'absolute';
      video.style.top = '0';
      video.style.left = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      
      playerContainer.appendChild(video);

      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          capLevelToPlayerSize: true,
          maxBufferLength: 30
        });
        hlsInstance.loadSource(m3u8Url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
          video.play().catch(e => console.warn('Autoplay prevented:', e));
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = m3u8Url;
        video.addEventListener('loadedmetadata', function () {
          video.play().catch(e => console.warn('Autoplay prevented:', e));
        });
      }
    } else {
      const fallback = document.createElement('p');
      fallback.className = 'player__fallback';
      fallback.textContent = 'Không có nguồn phát khả dụng.';
      fallback.style.position = 'absolute';
      fallback.style.top = '50%';
      fallback.style.left = '50%';
      fallback.style.transform = 'translate(-50%, -50%)';
      fallback.style.color = '#fff';
      playerContainer.appendChild(fallback);
    }
  };

  splash.addEventListener('click', startPlayback);

  section.appendChild(playerContainer);

  container.appendChild(section);
}
