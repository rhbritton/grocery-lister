/**
 * Update these URLs before deploying to production.
 * Used by all marketing pages (index, privacy, support, terms).
 */
window.GROCERYLISTER_CONFIG = {
  siteName: 'GroceryLister',
  webAppUrl: 'https://rhbritton.github.io/gl',
  appStoreUrl: 'https://apps.apple.com/app/id0000000000',
  playStoreUrl: 'https://play.google.com/store/apps/details?id=com.rhbritton.grocerylister',
  supportEmail: 'support@grocerylister.com',
  // Legal — shown on Privacy Policy and Terms (update address before App Store submission)
  legalOperator: 'Ryan Britton',
  legalAddressLine1: '',
  legalAddressLine2: '',
  legalCountry: 'United States',
  governingLawRegion: '',
  governingLawCountry: 'United States',
  // Set to true when each store listing is live (hides "Coming soon" hint)
  appStoreLive: false,
  playStoreLive: false,
  // Hero carousel: ms between auto-advances (4.5s default)
  carouselIntervalMs: 4500,
  carouselSlides: [
    { src: './images/screenshots/recipes.png', alt: 'GroceryLister recipe library with search' },
    { src: './images/screenshots/recipe-detail.png', alt: 'Recipe view with ingredients and steps' },
    { src: './images/screenshots/grocery-lists.png', alt: 'Grocery lists with progress tracking' },
    { src: './images/screenshots/grocery-list-detail.png', alt: 'Grocery list sorted by aisle while shopping' },
    { src: './images/screenshots/grocery-lists-overview.png', alt: 'Shared grocery list ready for shopping' },
  ],
};
