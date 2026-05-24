# GroceryLister marketing site

Static landing + legal pages. No build step required.

Logo assets live in `images/` (copied from `public/images/logo_color.png` in the main app).

### Hero carousel

The home page auto-advances through mock app screens every 4.5s. Pause by hovering or focusing a dot.

To use real screenshots instead, add PNGs to `images/screenshots/` and wire them up in `js/config.js` via `carouselSlides`, or replace the mock-phone blocks in `index.html` with:

```html
<img class="hero-screenshot" src="./images/screenshots/grocery-list.png" alt="..." />
```

## Configure

Edit `js/config.js`:

- `webAppUrl` — your hosted React app (default: GitHub Pages `/gl`)
- `appStoreUrl` / `playStoreUrl` — store listing URLs
- `supportEmail` — shown on support & privacy pages
- Set `appStoreLive` / `playStoreLive` to `true` when listings are live (enables store buttons)

## Preview locally

```bash
npx serve website
```

Open http://localhost:3000

## Deploy options

### Cloudflare Pages / Netlify

- **Publish directory:** `website`
- No build command

### Firebase Hosting (separate site)

```json
{
  "hosting": {
    "public": "website",
    "ignore": ["README.md"]
  }
}
```

```bash
firebase deploy --only hosting
```

### GitHub Pages (project site)

Push `website/` contents to a `gh-pages` branch or use a separate repo. For apex domain marketing + `/gl` app, use custom domain routing:

- `grocerylister.com` → this site
- `app.grocerylister.com` or `/gl` → React app

## Store listing URLs

Use these in App Store Connect / Google Play Console:

| Field | URL |
|-------|-----|
| Privacy | `https://your-domain.com/privacy.html` |
| Support | `https://your-domain.com/support.html` |
| Marketing | `https://your-domain.com/` |
