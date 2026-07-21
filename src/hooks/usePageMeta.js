import { useEffect } from 'react';

import { DEFAULT_PUBLIC_WEB_APP_URL, getPublicAssetUrl } from '../utils/appPaths.js';

const DEFAULT_TITLE = 'GroceryLister';
const DEFAULT_DESCRIPTION = 'Turn your recipes into grocery lists';
const DEFAULT_OG_IMAGE = `${DEFAULT_PUBLIC_WEB_APP_URL}/images/logo_color.png`;

function upsertMetaTag(attribute, key, content) {
  if (typeof document === 'undefined' || !content) {
    return;
  }

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function usePageMeta({
  title,
  description,
  url,
  image = getPublicAssetUrl('/images/logo_color.png') || DEFAULT_OG_IMAGE,
}) {
  useEffect(() => {
    const pageTitle = title ? `${title} | GroceryLister` : DEFAULT_TITLE;
    const pageDescription = description || DEFAULT_DESCRIPTION;

    document.title = pageTitle;
    upsertMetaTag('name', 'description', pageDescription);
    upsertMetaTag('property', 'og:title', pageTitle);
    upsertMetaTag('property', 'og:description', pageDescription);
    upsertMetaTag('property', 'og:type', 'website');
    upsertMetaTag('property', 'og:image', image);
    upsertMetaTag('name', 'twitter:card', 'summary');
    upsertMetaTag('name', 'twitter:title', pageTitle);
    upsertMetaTag('name', 'twitter:description', pageDescription);
    upsertMetaTag('name', 'twitter:image', image);

    if (url) {
      upsertMetaTag('property', 'og:url', url);
    }

    return () => {
      document.title = DEFAULT_TITLE;
      upsertMetaTag('name', 'description', DEFAULT_DESCRIPTION);
      upsertMetaTag('property', 'og:title', DEFAULT_TITLE);
      upsertMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
      upsertMetaTag('property', 'og:type', 'website');
      upsertMetaTag('property', 'og:image', DEFAULT_OG_IMAGE);
      upsertMetaTag('name', 'twitter:card', 'summary');
      upsertMetaTag('name', 'twitter:title', DEFAULT_TITLE);
      upsertMetaTag('name', 'twitter:description', DEFAULT_DESCRIPTION);
      upsertMetaTag('name', 'twitter:image', DEFAULT_OG_IMAGE);
    };
  }, [title, description, url, image]);
}
