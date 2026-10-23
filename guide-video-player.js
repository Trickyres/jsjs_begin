/* Shared, dependency-free player. Native controls remain available if enhancement cannot start. */
window.createGuideVideoPlayer = function createGuideVideoPlayer(dialog) {
  const video = dialog?.querySelector('video');
  const head = dialog?.querySelector('.activity-video-dialog-head');
  if (!video || !head) return null;
  const jumpArrow = '<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8M21 3v5h-5"/>';
  const jumpNumber = '<text x="12" y="12" text-anchor="middle" dominant-baseline="central" fill="currentColor" stroke="none" font-family="Arial, sans-serif" font-size="8" font-weight="500">10</text>';
  const icons = {
    play: '<path d="m9 5 12 7-12 7Z" fill="currentColor" stroke="none"/>',
    pause: '<path d="M8 5v14M16 5v14" stroke-width="4"/>',
    forward: jumpArrow + jumpNumber,
    rewind: `<g transform="translate(24 0) scale(-1 1)">${jumpArrow}</g>${jumpNumber}`,
    sound: '<path d="m11 5-6 4H2v6h3l6 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="m11 5-6 4H2v6h3l6 4ZM16 9l6 6M22 9l-6 6"/>',
    full: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
    exit: '<path d="M3 8h5V3M21 8h-5V3M8 21v-5H3M16 21v-5h5"/>',
    back: '<path d="m15 5-7 7 7 7"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
  const shell = document.createElement('div');
  shell.className = 'guide-video-player';
  shell.tabIndex = -1;
  shell.setAttribute('aria-label', '视频播放器');
  video.before(shell);
  shell.append(video, head);
  const controls = document.createElement('div');
  controls.className = 'guide-video-controls';
  controls.setAttribute('aria-label', '视频播放控制');
  controls.innerHTML = `
    <div class="guide-video-time"><span data-player-time>00:00</span><span>/</span><span data-player-duration>--:--</span></div>
    <div class="guide-video-track"><div class="guide-video-track-line"><span data-player-buffer></span><span data-player-progress-fill></span></div><input data-player-seek type="range" min="0" max="1000" step="1" value="0" aria-label="视频播放进度" disabled></div>
    <div class="guide-video-row">
      <button type="button" class="guide-video-button guide-video-jump" data-player-rewind aria-label="后退10秒">${icon('rewind')}</button>
      <button type="button" class="guide-video-button guide-video-play" data-player-play aria-label="播放">${icon('play')}</button>
      <button type="button" class="guide-video-button guide-video-jump" data-player-forward aria-label="快进10秒">${icon('forward')}</button>
      <span class="guide-video-spacer"></span>
      <button type="button" class="guide-video-button guide-video-speed" data-player-speed aria-label="选择播放倍速" aria-expanded="false" aria-controls="guideVideoSpeedMenu">倍速</button>
      <div class="guide-video-speed-menu" id="guideVideoSpeedMenu" aria-label="播放倍速" hidden>${[2, 1.5, 1.25, 1, .75].map(rate => `<button type="button" data-player-rate="${rate}" aria-pressed="${rate === 1}">${rate === 1 ? '正常 ' : ''}${rate}×</button>`).join('')}</div>
      <button type="button" class="guide-video-button" data-player-sound aria-label="静音" aria-pressed="false">${icon('sound')}</button>
      <button type="button" class="guide-video-button" data-player-fullscreen aria-label="全屏" aria-pressed="false">${icon('full')}</button>
    </div>`;
  const status = document.createElement('div');
  status.className = 'guide-video-status';
  status.setAttribute('role', 'status');
  status.hidden = true;
  const retry = document.createElement('button');
  retry.type = 'button'; retry.className = 'guide-video-retry'; retry.textContent = '重试'; retry.hidden = true;
  shell.append(controls, status, retry);
  const q = selector => controls.querySelector(selector);
  const seek = q('[data-player-seek]');
  const play = q('[data-player-play]');
  const sound = q('[data-player-sound]');
  const speed = q('[data-player-speed]');
  const menu = q('.guide-video-speed-menu');
  const full = q('[data-player-fullscreen]');
  let hideTimer, dragging = false, resumeAfterSeek = false, failed = false;
  const duration = () => Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  const time = value => {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return (seconds >= 3600 ? `${Math.floor(seconds / 3600)}:` : '') + `${Math.floor(seconds / 60) % 60}`.padStart(2, '0') + ':' + `${seconds % 60}`.padStart(2, '0');
  };
  const updateProgress = () => {
    const total = duration(), current = dragging ? Number(seek.value) / 1000 * total : video.currentTime;
    seek.disabled = !total;
    if (!dragging) seek.value = total ? String(current / total * 1000) : '0';
    q('[data-player-time]').textContent = time(current);
    q('[data-player-duration]').textContent = total ? time(total) : '--:--';
    seek.setAttribute('aria-valuetext', `${time(current)}，共${total ? time(total) : '未知时长'}`);
    q('[data-player-progress-fill]').style.width = `${total ? current / total * 100 : 0}%`;
    let buffered = 0;
    for (let i = 0; i < video.buffered.length; i++) {
      if (video.buffered.start(i) <= current && video.buffered.end(i) >= current) buffered = video.buffered.end(i);
    }
    q('[data-player-buffer]').style.width = `${total ? Math.min(100, buffered / total * 100) : 0}%`;
  };
  const closeMenu = () => { menu.hidden = true; speed.setAttribute('aria-expanded', 'false'); };
  const showControls = (autoHide = true) => {
    clearTimeout(hideTimer); shell.classList.remove('controls-hidden');
    if (autoHide && !video.paused && !failed && !dragging && menu.hidden && !shell.contains(document.activeElement)) {
      hideTimer = setTimeout(() => { if (!video.paused && !dragging && menu.hidden) shell.classList.add('controls-hidden'); }, 3000);
    }
  };
  const updatePlayback = () => {
    play.innerHTML = icon(video.paused ? 'play' : 'pause');
    play.setAttribute('aria-label', video.paused ? (video.ended ? '重新播放' : '播放') : '暂停');
    if (video.paused && !failed) status.hidden = true;
    showControls();
  };
  const tryPlay = async () => {
    try { await video.play(); }
    catch (error) {
      if (error.name === 'AbortError' || !video.getAttribute('src')) return;
      if (!failed) { status.textContent = '点击播放按钮开始播放'; status.hidden = false; }
      showControls(false);
    }
  };
  const jump = seconds => {
    if (duration()) video.currentTime = Math.max(0, Math.min(duration(), video.currentTime + seconds));
    updateProgress(); showControls();
  };
  const toggleFull = async () => {
    try {
      if (document.fullscreenElement === shell) await document.exitFullscreen();
      else if (shell.classList.contains('is-expanded')) shell.classList.remove('is-expanded');
      else if (shell.requestFullscreen && document.fullscreenEnabled) await shell.requestFullscreen();
      else shell.classList.add('is-expanded');
    } catch { shell.classList.toggle('is-expanded'); }
    updateFullscreen(); showControls(false);
  };
  const updateFullscreen = () => {
    const active = document.fullscreenElement === shell || shell.classList.contains('is-expanded');
    full.innerHTML = icon(active ? 'exit' : 'full');
    full.setAttribute('aria-pressed', String(active)); full.setAttribute('aria-label', active ? '退出全屏' : '全屏');
  };
  play.addEventListener('click', () => video.paused ? tryPlay() : video.pause());
  q('[data-player-rewind]').addEventListener('click', () => jump(-10));
  q('[data-player-forward]').addEventListener('click', () => jump(10));
  video.addEventListener('click', () => {
    closeMenu();
    if (video.paused || shell.classList.contains('controls-hidden')) showControls();
    else { clearTimeout(hideTimer); shell.classList.add('controls-hidden'); }
  });
  shell.addEventListener('pointermove', event => { if (event.pointerType === 'mouse') showControls(); });
  shell.addEventListener('focusin', () => showControls(false));
  shell.addEventListener('focusout', () => setTimeout(() => showControls(), 0));
  seek.addEventListener('pointerdown', () => { dragging = true; resumeAfterSeek = !video.paused; video.pause(); showControls(false); });
  seek.addEventListener('input', () => { dragging = true; updateProgress(); });
  const finishSeek = () => {
    if (!dragging) return;
    const target = Number(seek.value) / 1000 * duration();
    dragging = false;
    if (duration()) video.currentTime = target;
    if (resumeAfterSeek) tryPlay();
    resumeAfterSeek = false; updateProgress(); showControls();
  };
  seek.addEventListener('change', finishSeek);
  seek.addEventListener('pointerup', finishSeek);
  seek.addEventListener('pointercancel', finishSeek);
  seek.addEventListener('blur', finishSeek);
  speed.addEventListener('click', () => { const open = menu.hidden; menu.hidden = !open; speed.setAttribute('aria-expanded', String(open)); showControls(false); });
  menu.querySelectorAll('[data-player-rate]').forEach(button => button.addEventListener('click', () => { video.playbackRate = Number(button.dataset.playerRate); closeMenu(); speed.focus(); }));
  sound.addEventListener('click', () => { video.muted = !video.muted; });
  full.addEventListener('click', toggleFull);
  retry.addEventListener('click', () => { failed = false; retry.hidden = true; video.load(); tryPlay(); });
  shell.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!menu.hidden) { event.stopPropagation(); closeMenu(); speed.focus(); }
      else if (shell.classList.contains('is-expanded')) { event.stopPropagation(); shell.classList.remove('is-expanded'); updateFullscreen(); }
      return;
    }
    if (event.target.matches('input, button')) return;
    if ([' ', 'k', 'ArrowLeft', 'ArrowRight', 'm', 'f'].includes(event.key)) event.preventDefault();
    if (event.key === ' ' || event.key === 'k') video.paused ? tryPlay() : video.pause();
    else if (event.key === 'ArrowLeft') jump(-10);
    else if (event.key === 'ArrowRight') jump(10);
    else if (event.key === 'm') video.muted = !video.muted;
    else if (event.key === 'f') toggleFull();
  });
  // Keep keyboard focus inside the video dialog, including when the chrome is hidden.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    showControls(false);
    const buttons = [...shell.querySelectorAll('button,input')].filter(el => !el.disabled && !el.closest('[hidden]') && el.getClientRects().length);
    if (!buttons.length) return;
    if (event.shiftKey && (document.activeElement === buttons[0] || document.activeElement === shell)) { event.preventDefault(); buttons.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
  });
  ['timeupdate', 'durationchange', 'loadedmetadata', 'progress', 'seeked', 'emptied'].forEach(name => video.addEventListener(name, updateProgress));
  ['play', 'pause', 'ended'].forEach(name => video.addEventListener(name, updatePlayback));
  video.addEventListener('volumechange', () => { sound.innerHTML = icon(video.muted ? 'mute' : 'sound'); sound.setAttribute('aria-label', video.muted ? '取消静音' : '静音'); sound.setAttribute('aria-pressed', String(video.muted)); });
  video.addEventListener('ratechange', () => { speed.textContent = video.playbackRate === 1 ? '倍速' : `${video.playbackRate}×`; menu.querySelectorAll('[data-player-rate]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.playerRate) === video.playbackRate))); });
  video.addEventListener('waiting', () => { if (!video.paused && !failed) { status.textContent = '正在缓冲…'; status.hidden = false; } });
  video.addEventListener('playing', () => { failed = false; status.hidden = true; retry.hidden = true; });
  video.addEventListener('canplay', () => { if (!failed) status.hidden = true; });
  document.addEventListener('fullscreenchange', updateFullscreen);
  head.querySelector('.activity-video-dialog-close').innerHTML = icon('back');
  video.controls = false;
  video.setAttribute('webkit-playsinline', '');
  video.disablePictureInPicture = true;
  dialog.classList.add('has-guide-video-player');
  updateProgress(); updatePlayback();
  return {
    open() { failed = false; dragging = false; resumeAfterSeek = false; status.hidden = true; retry.hidden = true; closeMenu(); showControls(false); },
    close() { clearTimeout(hideTimer); dragging = false; resumeAfterSeek = false; failed = false; closeMenu(); status.hidden = true; retry.hidden = true; shell.classList.remove('is-expanded', 'controls-hidden'); if (document.fullscreenElement === shell) document.exitFullscreen().catch(() => {}); updateFullscreen(); },
    showError() { failed = true; status.textContent = '视频暂时无法播放，请重试'; status.hidden = false; retry.hidden = false; showControls(false); }
  };
};
