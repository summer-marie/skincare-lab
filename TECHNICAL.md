# 🧬 SkinScript — Technical Reference

This document covers the architecture, data pipeline, module design, AI usage disclosure, and known limitations of SkinScript. For feature overview and setup instructions, see [README.md](./README.md).

---

## Architecture Overview

SkinScript is a single-page vanilla JavaScript app with no framework. All screens live in one `index.html` file and are shown or hidden via a JS-controlled class toggle on `<body>`. There is no routing library — navigation is handled entirely by the `showScreen()` function in `main.js`.

```
index.html          ← All screen markup lives here
src/
├── main.js         ← App init, screen switching, event listeners, form logic
├── style.css       ← Tailwind imports + custom component styles
├── modules/
│   ├── scanner.js       ← Barcode scanning, Open Beauty Facts API calls
│   └── routineEngine.js ← Routine ordering logic, conflict detection
└── data/
    └── inci-data.json   ← Local product database (100+ verified entries)
```

---

## Screen Navigation

The homepage hides the top navigation bar using a `page-home` class applied directly to `<body>` on initial load. JavaScript adds or removes this class on every screen transition via `showScreen()`. The class is set in HTML by default so the nav is hidden before JS runs — this prevents a flash of the nav bar on page load.

```js
// main.js — simplified screen switching
function showScreen(screenId) {
  document.body.classList.toggle('page-home', screenId === 'home');
  // show/hide screen elements...
}
```

---

## Data Layer

### `inci-data.json`

The local product database is the app's primary data source. Each entry follows this schema:

```json
{
  "barcodes": ["036602307026", "3606000537453"],
  "name": "CeraVe PM Facial Moisturizing Lotion",
  "brand": "CeraVe",
  "type": "moisturizer",
  "actives": ["niacinamide", "ceramides", "hyaluronic acid"],
  "safetyScore": 9,
  "skinCompatibility": ["all"],
  "allergenWarnings": [],
  "barcodeVerified": true
}
```

**Key schema notes:**
- `barcodes` is an array — products that appear under multiple regional barcodes are consolidated into one entry
- `barcodeVerified` flag tracks which entries have been confirmed against Open Beauty Facts or UPC Item DB
- Products with `"barcodeVerified": "rate-limited"` are pending a future verification run (UPC Item DB trial tier caps at ~3–4 requests/day)

### Barcode Verification Pipeline

Barcodes were verified in two passes:

1. **Pass 1 — Open Beauty Facts** (`world.openbeautyfacts.org`) — Cosmetics-only database, primary source
2. **Pass 2 — UPC Item DB** (`upcitemdb.com`) — Secondary fallback for products not found in pass 1; rate-limited to ~3–4 requests/run on the trial tier

Products not found in either database retain their original barcode and are flagged `barcodeVerified: false`.

---

## Modules

### `scanner.js`

Handles three barcode input methods:
- **Camera** — Uses the `html5-qrcode` library for live camera scanning
- **File upload** — Passes an image file to `html5-qrcode` for processing
- **Manual entry** — Direct barcode string lookup

On a successful scan, the module:
1. Searches `inci-data.json` locally by iterating `product.barcodes[]`
2. If no local match, falls back to the Open Beauty Facts API
3. Prefills the add product form with matched data

**Important:** All references to barcodes use `product.barcodes[0]` as the primary display value since the schema migration from `barcode` (string) to `barcodes` (array).

### `routineEngine.js`

Builds AM and PM routines from the user's saved products and runs conflict detection.

**Step ordering (hardcoded):**
```js
const AM_ORDER = ['cleanser', 'serum', 'treatment', 'moisturizer', 'spf'];
const PM_ORDER = ['cleanser', 'exfoliant', 'serum', 'treatment', 'moisturizer'];
```

**Conflict detection rules:**
- Retinoid + benzoyl peroxide in the same PM routine
- Multiple exfoliants (AHA + salicylic acid)
- 2+ strong actives used simultaneously
- Missing SPF in AM routine

These rules are hardcoded constants — not pulled from a database or API. The routine output is dynamic (reads from the user's saved product list at runtime), but the logic governing which combinations trigger warnings is static.

---

## Product Name Autocomplete

The manual add form includes a live autocomplete dropdown that filters against the user's saved products as they type. Key implementation details:

- Filters `getProducts()` in real time on `keyup`
- Shows a maximum of 5 suggestions
- Supports full keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
- Clicking or selecting a suggestion auto-fills all form fields: name, brand, type, and actives chips
- Also toggles the retinoid caution note if the matched product contains retinoid
- Uses `setTimeout(closeDropdown, 150)` on blur to allow mousedown events to fire before the dropdown closes

---

## Retinoid Safety Feature

Retinoid is available as a selectable active in the add form but is flagged with an inline caution note when selected:

> *"⚠️ Retinoids are occasionally prescribed to teens for severe acne but shouldn't be self-selected without a dermatologist's guidance."*

This warning also appears in the product detail Strength & Safety card for any saved product containing retinoid. The decision to flag rather than remove retinoid was intentional — dermatologists do occasionally prescribe retinoids to teens, so removing the option entirely would be inaccurate.

---

## Design System

| Token | Value | Usage |
|---|---|---|
| Primary | `#4a8c8f` / `#5da5a8` (dark) | Buttons, active states, borders |
| Warning | Amber | Medium-strength ingredients, caution notes |
| Error | Red | Strong actives, allergen alerts |
| Max width | 430px | Mobile-first constraint |
| Font | DM Sans 300–700 | Body text, UI labels |
| Nav | Fixed bottom, 3 tabs | Home, Products, Routine |

---

## AI Usage Disclosure

This project was built with AI coding assistance (Cursor IDE, Claude, and Perplexity) under a policy emphasizing developer control. The following reflects how AI was used:

**AI generated or scaffolded:**
- Initial boilerplate structure for `main.js` and `routineEngine.js`
- The 100+ product entries in `inci-data.json`
- The barcode verification scripts for Open Beauty Facts and UPC Item DB
- CSS component styles and Tailwind utility patterns

**Reviewed, refactored, or written independently:**
- The `initAutocomplete()` function — refactored from an IIFE to a named function call to match codebase style; the blur/mousedown timing fix was debugged and understood before committing
- The `showScreen()` / `page-home` body class pattern — diagnosed and fixed a nav-bar flash bug caused by missing initial class on `<body>`
- Conflict detection rule logic in `routineEngine.js` — reviewed each rule against published dermatology guidance before keeping
- The retinoid caution feature — deliberate product decision based on research, not an AI suggestion
- All commit messages — written to accurately reflect what changed and why

**Intentionally avoided:**
- No third-party component libraries (all UI is custom)
- No framework (React, Vue, etc.) — vanilla JS only per project requirements
- No live product API calls at runtime — all data is local to avoid dependency on external uptime

---

## Known Limitations

| Limitation | Reason | Future fix |
|---|---|---|
| Routine rules are hardcoded | No dermatologist dataset available; rules based on published guidelines | Replace with editable rules config or API |
| 45 barcodes unverified | UPC Item DB trial rate limit (~3–4 req/day) | Re-run verification script over time |
| Autocomplete limited to saved products | No live product search API | Add Open Beauty Facts name search as fallback |
| No user accounts | localStorage only; data is device-specific | Cloud sync in future roadmap |
| Retinoid age guidance is general | No age verification in app | Could add onboarding age check |

---

## Scripts

```bash
npm run dev       # Start development server (Vite, port 3005)
npm run build     # Production build
npm run preview   # Preview production build
```