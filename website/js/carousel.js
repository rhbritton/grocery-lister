(function () {
  const config = window.GROCERYLISTER_CONFIG || {};
  const intervalMs = config.carouselIntervalMs || 4500;
  const carousel = document.querySelector('[data-hero-carousel]');

  if (!carousel) return;

  const track = carousel.querySelector('[data-carousel-track]');
  const dotsHost = carousel.querySelector('[data-carousel-dots]');
  const prevButton = carousel.querySelector('[data-carousel-prev]');
  const nextButton = carousel.querySelector('[data-carousel-next]');

  if (!track || !dotsHost) return;

  if (Array.isArray(config.carouselSlides) && config.carouselSlides.length) {
    track.innerHTML = config.carouselSlides
      .map(
        (slide, index) => `
          <div class="hero-carousel-slide${index === 0 ? ' is-active' : ''}" data-carousel-slide aria-hidden="${index === 0 ? 'false' : 'true'}">
            <img class="hero-screenshot" src="${slide.src}" alt="${slide.alt || 'GroceryLister app screenshot'}" loading="${index === 0 ? 'eager' : 'lazy'}" />
          </div>
        `
      )
      .join('');
  }

  const slides = Array.from(carousel.querySelectorAll('[data-carousel-slide]'));
  if (slides.length < 2) return;

  let index = 0;
  let timerId = null;
  let paused = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  slides.forEach((_, slideIndex) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero-carousel-dot';
    dot.setAttribute('aria-label', `Show screenshot ${slideIndex + 1}`);
    dot.addEventListener('click', () => {
      goTo(slideIndex);
      restartTimer();
    });
    dotsHost.appendChild(dot);
  });

  const dots = Array.from(dotsHost.querySelectorAll('.hero-carousel-dot'));

  function goTo(nextIndex) {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === index);
      slide.setAttribute('aria-hidden', slideIndex === index ? 'false' : 'true');
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === index);
      dot.setAttribute('aria-current', dotIndex === index ? 'true' : 'false');
    });
  }

  function next() {
    goTo(index + 1);
  }

  function prev() {
    goTo(index - 1);
  }

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      prev();
      restartTimer();
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', () => {
      next();
      restartTimer();
    });
  }

  function startTimer() {
    if (reducedMotion || paused) return;
    clearInterval(timerId);
    timerId = window.setInterval(next, intervalMs);
  }

  function restartTimer() {
    clearInterval(timerId);
    startTimer();
  }

  carousel.addEventListener('mouseenter', () => {
    paused = true;
    clearInterval(timerId);
  });

  carousel.addEventListener('mouseleave', () => {
    paused = false;
    startTimer();
  });

  carousel.addEventListener('focusin', () => {
    paused = true;
    clearInterval(timerId);
  });

  carousel.addEventListener('focusout', () => {
    paused = false;
    startTimer();
  });

  goTo(0);
  startTimer();
})();
