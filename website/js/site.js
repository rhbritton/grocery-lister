(function () {
  const config = window.GROCERYLISTER_CONFIG || {};

  document.querySelectorAll('[data-web-app]').forEach((el) => {
    if (config.webAppUrl) el.setAttribute('href', config.webAppUrl);
  });

  document.querySelectorAll('[data-app-store]').forEach((el) => {
    if (config.appStoreLive && config.appStoreUrl) {
      el.setAttribute('href', config.appStoreUrl);
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  });

  document.querySelectorAll('[data-play-store]').forEach((el) => {
    if (config.playStoreLive && config.playStoreUrl) {
      el.setAttribute('href', config.playStoreUrl);
      el.hidden = false;
    } else {
      el.hidden = true;
    }
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
