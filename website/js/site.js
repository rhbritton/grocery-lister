(function () {
  const config = window.GROCERYLISTER_CONFIG || {};

  document.querySelectorAll('[data-web-app]').forEach((el) => {
    if (config.webAppUrl) el.setAttribute('href', config.webAppUrl);
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

  document.querySelectorAll('[data-site-name]').forEach((el) => {
    el.textContent = config.siteName || 'GroceryLister';
  });

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
})();
