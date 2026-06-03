# Google Play — Main store listing

Paste these into **Play Console → Grow → Store presence → Main store listing**.

Privacy policy URL: `https://grocerylisterapp.com/privacy.html`  
Delete account URL: `https://grocerylisterapp.com/privacy.html`  
Contact email: `support@grocerylisterapp.com`

---

## Short description (max 80 characters)

```
Recipe-powered grocery lists—aisle sorted, shareable, offline when signed in.
```

*(79 characters)*

**Alternate (73 chars):**

```
Turn recipes into aisle-sorted grocery lists. Share links, shop offline, sync.
```

---

## Full description

```
GroceryLister turns your recipes into one aisle-sorted grocery list—so meal planning takes minutes, not an hour with sticky notes or a spreadsheet.

RECIPE-POWERED LISTS
Pick the meals you're making and GroceryLister pulls ingredients into a single list. No copying from five different tabs.

SORTED BY AISLE
Ingredients are grouped the way stores are laid out—produce, meat, dairy, freezer, and more—so you walk the floor once.

SHOP OFFLINE (WHEN SIGNED IN)
Spotty signal in the aisles? Keep checking items off. Changes save on your device and sync to your account when you're back online.

SHARE BY LINK
• Recipe links — anyone with the link can view a recipe (internet required).
• Grocery list links — share a 7-day shopping link so others can check items off. Guests need an internet connection.

STAYS IN SYNC
When everyone is online, check-offs update across devices—handy when you're splitting aisles.

Sign in with Google to save recipes, build lists, and sync across devices. Guests can open shared links without an account.

Free to use. No ads.

Questions? support@grocerylisterapp.com
Privacy: https://grocerylisterapp.com/privacy.html
```

---

## Graphics (in this folder)

| File | Size | Use in Play Console |
|------|------|---------------------|
| `play-store-icon-512.png` | 512×512 | **App icon** |
| `play-store-feature-1024x500.png` | 1024×500 | **Feature graphic** |

Regenerate after logo changes:

```powershell
powershell -ExecutionPolicy Bypass -File website/store/google-play/generate-assets.ps1
```

---

## Phone screenshots (already in repo)

Use PNGs from `website/images/screenshots/`:

- `recipes.png` — recipe library
- `recipe-detail.png` — recipe detail
- `grocery-lists.png` — list overview
- `grocery-list-detail.png` — aisle-sorted list while shopping
- `grocery-lists-overview.png` — shared list

Play requires **at least 2** phone screenshots. Upload **4–8** if you can.

---

## Where to paste in Play Console

1. **Grow → Store presence → Main store listing**
2. Short description → paste short text above
3. Full description → paste full text above
4. App icon → upload `play-store-icon-512.png`
5. Feature graphic → upload `play-store-feature-1024x500.png`
6. Phone screenshots → upload from `website/images/screenshots/`
7. **Save**
