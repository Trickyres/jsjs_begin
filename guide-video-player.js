/* Playback first: native controls, real video fullscreen, no CSS pseudo-fullscreen. */
window.createGuideVideoPlayer = function createGuideVideoPlayer(dialog) {
  const video = dialog?.querySelector('video');
  const head = dialog?.querySelector('.activity-video-dialog-head');
  if (!video || !head) return null;
  video.controls = true;
  video.playsInline = true;
  video.setAttribute('webkit-playsinline', '');
  video.disablePictureInPicture = false;
  dialog.classList.add('native-guide-video-player');
  const fullscreen = document.createElement('button');
  fullscreen.type = 'button'; fullscreen.className = 'guide-native-fullscreen';
  fullscreen.textContent = '全屏'; fullscreen.setAttribute('aria-label', '进入视频全屏');
  head.insertBefore(fullscreen, head.querySelector('[data-activity-video-close]'));
  // Messages are outside the picture and never intercept native playback controls.
  const feedback = document.createElement('div');
  feedback.className = 'guide-native-feedback'; feedback.hidden = true;
  const message = document.createElement('p'); message.setAttribute('role', 'status');
  const retry = document.createElement('button');
  retry.type = 'button'; retry.textContent = '重新播放'; retry.hidden = true;
  const direct = document.createElement('a');
  direct.textContent = '单独打开视频'; direct.target = '_blank'; direct.rel = 'noopener noreferrer'; direct.hidden = true;
  feedback.append(message, retry, direct); dialog.append(feedback);
  let nativeActive = false, orientationLocked = false, session = 0;
  const isFullscreen = () => nativeActive || !!video.webkitDisplayingFullscreen
    || video.webkitPresentationMode === 'fullscreen'
    || document.fullscreenElement === video || document.webkitFullscreenElement === video;
  const showMessage = (text, recover = false) => {
    message.textContent = text; feedback.hidden = false; retry.hidden = !recover;
    const url = video.getAttribute('src'); direct.hidden = !recover || !url;
    if (url) direct.href = url;
  };
  const clearMessage = () => { feedback.hidden = true; retry.hidden = true; direct.hidden = true; };
  const updateButton = () => {
    fullscreen.textContent = isFullscreen() ? '退出全屏' : '全屏';
    fullscreen.setAttribute('aria-label', isFullscreen() ? '退出视频全屏' : '进入视频全屏');
    fullscreen.setAttribute('aria-pressed', String(isFullscreen()));
  };
  const unlock = () => {
    if (!orientationLocked) return;
    try { screen.orientation?.unlock?.(); } catch { /* OS controls orientation. */ }
    orientationLocked = false;
  };
  const exitFullscreen = () => {
    unlock();
    try {
      if ((nativeActive || video.webkitDisplayingFullscreen) && video.webkitExitFullscreen) video.webkitExitFullscreen();
      else if (video.webkitPresentationMode === 'fullscreen' && video.webkitSetPresentationMode) video.webkitSetPresentationMode('inline');
      else if (document.fullscreenElement === video) Promise.resolve(document.exitFullscreen()).catch(() => {});
      else if (document.webkitFullscreenElement === video) document.webkitExitFullscreen?.();
    } catch { /* Already exited or denied by the browser. */ }
    nativeActive = false; updateButton();
  };
  const requestFullscreen = async () => {
    if (isFullscreen()) { exitFullscreen(); return; }
    if (video.readyState < 1) { showMessage('视频加载后再点全屏，也可使用视频自带的全屏按钮。'); return; }
    clearMessage();
    const currentSession = session;
    try {
      // Safari and compatible embedded browsers require this call during the user gesture.
      if (typeof video.webkitEnterFullscreen === 'function' && video.webkitSupportsFullscreen !== false) {
        video.webkitEnterFullscreen(); return;
      }
      if (typeof video.requestFullscreen === 'function' && document.fullscreenEnabled !== false) {
        await video.requestFullscreen();
        if (currentSession !== session) { exitFullscreen(); return; }
        if (window.matchMedia('(pointer: coarse)').matches && screen.orientation?.lock) {
          try {
            await screen.orientation.lock('landscape'); orientationLocked = true;
            if (currentSession !== session || !isFullscreen()) unlock();
          } catch { /* Never fake rotation or crop if locking is denied. */ }
        }
      } else if (typeof video.webkitRequestFullscreen === 'function') {
        video.webkitRequestFullscreen();
      } else {
        showMessage('当前内置浏览器未开放网页全屏，请使用视频自带的全屏按钮，或在 Safari／系统浏览器中打开。');
      }
    } catch {
      if (currentSession === session) showMessage('浏览器未允许全屏，请尝试视频自带的全屏按钮，或在系统浏览器中打开。');
    }
    updateButton();
  };
  fullscreen.addEventListener('click', requestFullscreen);
  retry.addEventListener('click', () => {
    clearMessage(); video.load();
    const request = video.play();
    request?.catch(error => {
      if (error.name !== 'AbortError') showMessage('请点击视频自带的播放按钮；仍无法播放时，可单独打开视频。', true);
    });
  });
  video.addEventListener('playing', clearMessage);
  video.addEventListener('loadstart', clearMessage);
  video.addEventListener('webkitbeginfullscreen', () => { nativeActive = true; updateButton(); });
  video.addEventListener('webkitendfullscreen', () => { nativeActive = false; unlock(); updateButton(); });
  video.addEventListener('webkitpresentationmodechanged', updateButton);
  const onFullscreenChange = () => { if (!isFullscreen()) unlock(); updateButton(); };
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  const fitViewport = () => {
    const visibleHeight = window.visualViewport?.height || window.innerHeight;
    const headerHeight = head.getBoundingClientRect().height || 64;
    const feedbackHeight = feedback.hidden ? 0 : feedback.getBoundingClientRect().height;
    dialog.style.setProperty('--guide-native-video-height', Math.max(80, Math.floor(visibleHeight - headerHeight - feedbackHeight - 32)) + 'px');
  };
  window.addEventListener('resize', fitViewport);
  window.visualViewport?.addEventListener('resize', fitViewport);
  new MutationObserver(fitViewport).observe(feedback, {attributes: true, attributeFilter: ['hidden']});
  updateButton();
  return {
    open() { session++; clearMessage(); nativeActive = false; updateButton(); requestAnimationFrame(fitViewport); },
    close() { session++; exitFullscreen(); clearMessage(); },
    showError() { showMessage('视频暂时无法播放。可重新播放，或单独打开视频。', true); },
    showPlayHint(error) {
      if (error.name === 'AbortError') return;
      if (!video.error) showMessage('请点击视频自带的播放按钮开始播放。');
    }
  };
};
