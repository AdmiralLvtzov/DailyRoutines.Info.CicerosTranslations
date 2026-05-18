function bindReadingProgress() {
  const root = document.documentElement;
  const progressBar = document.querySelector('.dr-reading-progress__bar');

  if (!progressBar) {
    return;
  }

  let frameId = 0;
  const update = () => {
    frameId = 0;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    progressBar.style.setProperty('--dr-read-progress', progress.toFixed(4));
  };

  const requestUpdate = () => {
    if (frameId !== 0) {
      return;
    }

    frameId = window.requestAnimationFrame(update);
  };

  const enableFallback = () => {
    if (root.classList.contains('dr-progress-fallback')) {
      requestUpdate();
      return;
    }

    root.classList.remove('dr-progress-timeline');
    root.classList.add('dr-progress-fallback');
    requestUpdate();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate, { passive: true });
  };

  if (!CSS.supports('animation-timeline: scroll()')) {
    enableFallback();
    return;
  }

  root.classList.add('dr-progress-timeline');

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (window.scrollY !== 0) {
        return;
      }

      const computedTransform = window.getComputedStyle(progressBar).transform;
      const scaleX =
        computedTransform === 'none'
          ? 1
          : Number.parseFloat(computedTransform.match(/^matrix\(([^,]+)/)?.[1] ?? '1');

      if (!Number.isFinite(scaleX) || scaleX > 0.05) {
        enableFallback();
      }
    });
  });
}

function bindZoomableImages() {
  const overlay = document.querySelector('.dr-media-overlay');
  const overlayImage = overlay?.querySelector('.dr-media-overlay__image');

  if (!overlay || !overlayImage) {
    return;
  }

  if (overlay.parentElement !== document.body) {
    document.body.append(overlay);
  }

  let lastFocused = null;

  const closeOverlay = () => {
    overlay.hidden = true;
    overlayImage.removeAttribute('src');
    overlayImage.removeAttribute('alt');
    document.body.classList.remove('dr-media-overlay-open');
    lastFocused?.focus();
    lastFocused = null;
  };

  const openOverlay = (target) => {
    lastFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    overlayImage.src = target.currentSrc || target.src;
    overlayImage.alt = target.alt;
    overlay.hidden = false;
    document.body.classList.add('dr-media-overlay-open');
    overlay.focus();
  };

  const zoomableImages = document.querySelectorAll('.dr-doc-content img[data-dr-zoomable="true"]');

  for (const image of zoomableImages) {
    image.tabIndex = 0;
    image.setAttribute('role', 'button');

    image.addEventListener('click', () => openOverlay(image));
    image.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      openOverlay(image);
    });
  }

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeOverlay();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !overlay.hidden) {
      closeOverlay();
    }
  });
}

function bindArticleVideos() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const videos = document.querySelectorAll('.dr-doc-content video[data-dr-video="true"]');

  if (videos.length === 0) {
    return;
  }

  const applyReducedMotionState = () => {
    for (const video of videos) {
      if (!reduceMotion.matches) {
        continue;
      }

      video.autoplay = false;
      video.pause();
    }
  };

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const video = entry.target;

          if (!entry.isIntersecting) {
            video.pause();
            continue;
          }

          if (!reduceMotion.matches && video.dataset.drAutoplay === 'true') {
            void video.play().catch(() => {});
          }
        }
      }, {
        rootMargin: '96px 0px'
      })
    : null;

  for (const video of videos) {
    video.dataset.drAutoplay = String(video.autoplay);

    video.addEventListener('loadedmetadata', () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        video.style.setProperty('--dr-video-ratio', `${video.videoWidth} / ${video.videoHeight}`);
      }
    }, { once: true });

    observer?.observe(video);
  }

  applyReducedMotionState();
  reduceMotion.addEventListener('change', applyReducedMotionState);
}

function bindImageComparisons() {
  const containers = document.querySelectorAll('.dr-img-comp:not([data-dr-init])');

  for (const container of containers) {
    container.dataset.drInit = '1';
    const before = container.querySelector('.dr-img-comp__before');
    const slider = container.querySelector('.dr-img-comp__slider');
    let dragging = false;

    const slide = (e) => {
      if (!dragging) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      before.style.width = `${pct}%`;
      slider.style.left = `${pct}%`;
    };

    container.addEventListener('mousedown', (e) => {
      dragging = true;
      e.preventDefault();
    });

    container.addEventListener('touchstart', () => {
      dragging = true;
    });

    const stop = () => {
      dragging = false;
    };

    window.addEventListener('mousemove', slide);
    window.addEventListener('touchmove', slide, { passive: true });
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
  }
}

bindReadingProgress();
bindImageComparisons();
bindZoomableImages();
bindArticleVideos();
