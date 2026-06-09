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

function bindImageGalleries() {
  const galleries = document.querySelectorAll('.dr-img-gallery:not([data-dr-init])');

  for (const gallery of galleries) {
    gallery.dataset.drInit = '1';
    const track = gallery.querySelector('.dr-img-gallery__track');
    const slides = gallery.querySelectorAll('.dr-img-gallery__slide');
    const prevBtn = gallery.querySelector('.dr-img-gallery__prev');
    const nextBtn = gallery.querySelector('.dr-img-gallery__next');
    const dots = gallery.querySelectorAll('.dr-img-gallery__dot');

    if (!track || slides.length === 0) {
      continue;
    }

    let index = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragOffset = 0;

    const total = slides.length;

    const goTo = (targetIndex) => {
      index = ((targetIndex % total) + total) % total;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, i) => {
        dot.setAttribute('aria-current', i === index ? 'true' : 'false');
      });

      if (index === 0) {
        prevBtn.setAttribute('aria-disabled', 'true');
      } else {
        prevBtn.removeAttribute('aria-disabled');
      }

      if (index === total - 1) {
        nextBtn.setAttribute('aria-disabled', 'true');
      } else {
        nextBtn.removeAttribute('aria-disabled');
      }
    };

    const goNext = () => {
      if (index < total - 1) {
        goTo(index + 1);
      }
    };

    const goPrev = () => {
      if (index > 0) {
        goTo(index - 1);
      }
    };

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goPrev();
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      goNext();
    });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        goTo(i);
      });
    });

    gallery.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(total - 1);
      }
    });

    const handleDragStart = (clientX) => {
      dragging = true;
      dragStartX = clientX;
      track.style.transition = 'none';
    };

    const handleDragMove = (clientX) => {
      if (!dragging) {
        return;
      }

      dragOffset = clientX - dragStartX;
      const pct = -index * 100 + (dragOffset / gallery.offsetWidth) * 100;
      track.style.transform = `translateX(${pct}%)`;
    };

    const handleDragEnd = () => {
      if (!dragging) {
        return;
      }

      dragging = false;
      track.style.transition = '';

      const threshold = gallery.offsetWidth * 0.15;

      if (dragOffset < -threshold) {
        goNext();
      } else if (dragOffset > threshold) {
        goPrev();
      } else {
        goTo(index);
      }

      dragOffset = 0;
    };

    gallery.addEventListener('mousedown', (e) => {
      e.preventDefault();
      handleDragStart(e.clientX);
    });

    gallery.addEventListener('touchstart', (e) => {
      handleDragStart(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      handleDragMove(e.clientX);
    });

    window.addEventListener('touchmove', (e) => {
      handleDragMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('mouseup', handleDragEnd);
    window.addEventListener('touchend', handleDragEnd);

    goTo(0);
  }
}

bindReadingProgress();
bindImageComparisons();
bindImageGalleries();
bindZoomableImages();
bindArticleVideos();
