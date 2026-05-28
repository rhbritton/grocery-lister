(function () {
  const config = window.GROCERYLISTER_CONFIG || {};

  document.querySelectorAll('[data-web-app]').forEach((el) => {
    if (config.webAppUrl) el.setAttribute('href', config.webAppUrl);
  });

  document.querySelectorAll('[data-app-store]').forEach((el) => {
    configureStoreLink(el, {
      live: config.appStoreLive && config.appStoreUrl,
      url: config.appStoreUrl,
      liveLine: 'Download on the',
      comingSoonLine: 'Coming soon to',
      footerLabel: 'App Store',
    });
  });

  document.querySelectorAll('[data-play-store]').forEach((el) => {
    configureStoreLink(el, {
      live: config.playStoreLive && config.playStoreUrl,
      url: config.playStoreUrl,
      liveLine: 'Get it on',
      comingSoonLine: 'Coming soon to',
      footerLabel: 'Google Play',
    });
  });

  function configureStoreLink(el, { live, url, liveLine, comingSoonLine, footerLabel }) {
    const badgeLine = el.querySelector('[data-store-line]');

    if (badgeLine) {
      if (live) {
        el.setAttribute('href', url);
        el.removeAttribute('aria-disabled');
        el.classList.remove('store-coming-soon');
        badgeLine.textContent = liveLine;
      } else {
        el.setAttribute('href', '#');
        el.setAttribute('aria-disabled', 'true');
        el.classList.add('store-coming-soon');
        badgeLine.textContent = comingSoonLine;
      }
      return;
    }

    if (live) {
      el.setAttribute('href', url);
      el.removeAttribute('aria-disabled');
      el.classList.remove('store-coming-soon');
      el.textContent = footerLabel;
      el.hidden = false;
    } else {
      el.setAttribute('href', '#');
      el.setAttribute('aria-disabled', 'true');
      el.classList.add('store-coming-soon');
      el.textContent = `${footerLabel} (coming soon)`;
      el.hidden = false;
    }
  }

  document.querySelectorAll('.store-coming-soon[href="#"]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.preventDefault();
    });
  });

  document.querySelectorAll('[data-support-email]').forEach((el) => {
    const email = config.supportEmail || 'support@grocerylisterapp.com';
    el.setAttribute('href', `mailto:${email}`);
    if (el.hasAttribute('data-support-email-text')) {
      el.textContent = email;
    }
  });

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  document.querySelectorAll('[data-legal-operator]').forEach((el) => {
    el.textContent = config.legalOperator || config.siteName || 'GroceryLister';
  });

  const addressParts = [
    config.legalAddressLine1,
    config.legalAddressLine2,
    config.legalCountry,
  ].filter((line) => line && String(line).trim());

  document.querySelectorAll('[data-legal-address]').forEach((el) => {
    el.innerHTML = addressParts.map(escapeHtml).join('<br>');
  });

  const governingLawRegion = config.governingLawRegion && String(config.governingLawRegion).trim();
  const governingLawCountry = config.governingLawCountry || 'United States';
  const governingLawText = governingLawRegion
    ? `the laws of the State of ${governingLawRegion}, ${governingLawCountry}`
    : `the laws of ${governingLawCountry}`;

  document.querySelectorAll('[data-governing-law]').forEach((el) => {
    el.textContent = governingLawText;
  });

  const storeHint = document.querySelector('[data-store-hint]');
  if (storeHint && !config.appStoreLive && !config.playStoreLive) {
    storeHint.hidden = false;
  }
})();
