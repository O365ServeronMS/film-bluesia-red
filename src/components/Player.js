/**
 * Player — embedded video player section
 * Supports iframe embed (primary) and basic <video> fallback for m3u8 URLs.
 */

export function renderPlayer(container, { embedUrl, m3u8Url, serverName, episodeName }) {
  const section = document.createElement('section');
  section.className = 'player';

  // ---- Back / close button ----
  const backBtn = document.createElement('button');
  backBtn.className = 'player__back';
  backBtn.textContent = '← Quay lại';
  backBtn.addEventListener('click', () => {
    section.remove();
  });
  section.appendChild(backBtn);

  // ---- Player container (16:9 aspect ratio) ----
  const playerContainer = document.createElement('div');
  playerContainer.className = 'player__container';

  if (embedUrl) {
    const iframe = document.createElement('iframe');
    iframe.className = 'player__iframe';
    iframe.src = embedUrl;
    iframe.setAttribute('allow', 'autoplay; fullscreen; encrypted-media');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    playerContainer.appendChild(iframe);
  } else if (m3u8Url) {
    const video = document.createElement('video');
    video.className = 'player__video';
    video.src = m3u8Url;
    video.controls = true;
    video.autoplay = true;
    playerContainer.appendChild(video);
  } else {
    const fallback = document.createElement('p');
    fallback.className = 'player__fallback';
    fallback.textContent = 'Không có nguồn phát khả dụng.';
    playerContainer.appendChild(fallback);
  }

  section.appendChild(playerContainer);

  // ---- Server / episode info ----
  const infoText = document.createElement('p');
  infoText.className = 'player__info';
  infoText.textContent = `Server: ${serverName} — ${episodeName}`;
  section.appendChild(infoText);

  container.appendChild(section);
}
