# 🧬 SkinScript

**Safer skincare routines for teens — a gender-neutral guide to understanding ingredients and building confidence**

SkinScript helps teenagers learn how to build safe, effective skincare routines without the overwhelm. Scan your products, understand what's inside them, and get personalized AM/PM routines that avoid irritating ingredient combinations.

**✨ Live App:** [myskinscript.app](https://myskinscript.app)

---

## Why SkinScript?

Skincare can be confusing — especially when you're just starting out. Brands target teens with trendy products, but rarely explain what's safe to use together. SkinScript was built to solve that problem.

**The challenge:**
- Teens are bombarded with skincare products but lack guidance on what's safe to combine
- Mixing certain actives (like retinoids + benzoyl peroxide) can irritate skin or cancel each other out
- There's no simple way to know if your routine makes sense
- Most skincare advice is either too technical or oversimplified

**What SkinScript does:**
- Scans product barcodes to instantly identify ingredients
- Builds personalized AM and PM routines from your products
- Detects conflicts before they happen (like mixing incompatible actives)
- Explains what each ingredient does in plain language
- Uses a gender-neutral, inclusive design that works for everyone

---

## 🎯 Current Status: Beta (Teen Products Only)

SkinScript is currently in **beta** with a curated database of **80+ verified teen-safe products** from trusted brands like CeraVe, The Ordinary, Paula's Choice, La Roche-Posay, and Neutrogena.

**What "beta" means:**
- The app is live and fully functional
- The product database focuses on teen-appropriate skincare only
- Some barcodes may not be recognized yet (pending ongoing verification)
- Active ingredients are limited to gentle-to-moderate strength formulations

**Future plans:**
- Expand to include adult-targeted products (stronger retinoids, prescription actives)
- Add 200+ more products across all age groups
- Introduce user accounts and cloud sync
- Build a comprehensive ingredient education library

---

## ✨ Key Features

### 📱 Product Scanning
- **Barcode Scanner** — Use your phone camera to scan product barcodes
- **Photo Upload** — Upload a barcode photo if camera scanning isn't available
- **Manual Entry** — Type in barcode numbers or add products by hand
- **Instant Recognition** — Search against 80+ verified products with real barcodes

### 🔬 Ingredient Intelligence
- **Safety Scores** — See how gentle or strong each product is (1-10 scale)
- **Active Descriptions** — Learn what niacinamide, salicylic acid, and other actives actually do
- **Allergen Warnings** — Get alerts for common irritants
- **Skin Type Matching** — Know which products suit oily, dry, sensitive, or combination skin

### 🌙 Smart Routine Builder
- **AM/PM Routines** — Get morning and evening routines auto-sorted in the right order
- **Conflict Detection** — See warnings when products shouldn't be used together:
  - Retinoid + benzoyl peroxide clash
  - Multiple exfoliants (AHA + BHA layering)
  - Too many strong actives at once
  - Missing SPF in your morning routine
- **Product Strength Analysis** — Understand which treatments are gentle, medium, or strong

### 🛡️ Designed for Teens
- **Gender-Neutral Design** — Clean, inclusive interface that works for everyone
- **Age-Appropriate Products** — Teen-safe formulations only (beta phase)
- **Retinoid Caution** — Special warnings for prescription-strength actives
- **Beginner-Friendly** — No jargon, just clear explanations

---

## 🆕 Recent Improvements

### Product Name Autocomplete
The manual add form now includes live suggestions as you type:
- Shows up to 5 matching products from your library
- Full keyboard navigation (arrow keys, Enter, Escape)
- Auto-fills all fields when you select a match (name, brand, type, actives)

### Enhanced Safety Features
- **Retinoid warnings** now appear both on the add form and product detail screens
- Clear caution notes explain when to seek dermatologist guidance

### Bug Fixes
- Fixed homepage navigation bar visibility issue
- Improved top-bar logo sizing for better readability
- Centered disclaimer bubble text for cleaner layout

### Data Quality Improvements
- Consolidated duplicate products into unified entries with multiple barcodes
- Verified 35+ barcodes through Open Beauty Facts and UPC Item DB
- Updated schema to support products with regional barcode variations
- 45 additional products pending verification (rate-limited API access)

---

## 📊 Product Database & Verification

SkinScript's database includes **80+ verified products** across major skincare brands. Each product has been cross-referenced with industry databases to ensure accuracy.

**Barcode Verification Process:**
1. **Pass 1:** Open Beauty Facts API — primary cosmetics database
2. **Pass 2:** UPC Item DB — secondary verification for products not in cosmetics-specific databases
3. Products are marked `barcodeVerified: true` when confirmed
4. Unverified entries are flagged for future review

**Included Brands:**
- CeraVe (cleansers, moisturizers, treatments)
- The Ordinary (serums, retinols, actives)
- Paula's Choice (exfoliants, treatments)
- La Roche-Posay (sunscreens, sensitive skin care)
- Neutrogena, EltaMD, Differin, Cetaphil
- K-beauty: COSRX, Beauty of Joseon, Purito
- Teen-focused: Bubble, Hero Cosmetics

**Data Sources:**
- Open Beauty Facts (cosmetics ingredient database)
- UPC Item DB (universal product codes)
- Clinical dermatology guidelines (conflict detection rules)
- Published research on ingredient interactions

---

## 📚 Documentation

- **[README.md](README.md)** (this file) — User-facing overview and features
- **[TECHNICAL-README.md](TECHNICAL-README.md)** — Architecture, modules, data pipeline, AI usage disclosure, and developer setup

For implementation details, code structure, or local development instructions, see the technical documentation.

---

## 🚀 Roadmap

### Short-term (Beta Phase)
- [ ] Sensitivity level filters (gentle/medium/strong)
- [ ] Finish barcode verification for remaining 45 products
- [ ] Ingredient education library with visual guides

### Medium-term (Version 2.0)
- [ ] User accounts & cloud sync
- [ ] Live API integration for real-time product lookups
- [ ] Expand database to 200+ products (all age groups)
- [ ] Include adult-targeted actives (prescription retinoids, stronger acids)
- [ ] Western vs. international product comparison (K-beauty, J-beauty)
- [ ] Skin type quiz with personalized product recommendations
- [ ] Expanded allergen database and custom allergen tracking
- [ ] PWA support for offline use
- [ ] Routine sharing via shareable links

### Long-term (Future Versions)
- [ ] AI-powered product recognition from photos
- [ ] Before/after photo tracking
- [ ] Skin journal and progress notes
- [ ] Multi-language support
- [ ] Export routines as PDF
- [ ] Product expiration tracking

---

## ⚠️ Important Disclaimer

**SkinScript is not a replacement for professional medical advice.**

This app provides educational guidance based on common ingredient interactions and dermatological best practices. Individual skin conditions vary widely. If you experience irritation, unusual reactions, or have specific skin concerns:

- Stop using the product immediately
- Consult a licensed dermatologist or healthcare provider
- Patch test new products before full application

SkinScript is a learning tool designed to help you understand skincare basics — not diagnose or treat skin conditions.

---

## 🛠️ Built With

- **Vanilla JavaScript** — No framework, just clean ES6+ modules
- **Tailwind CSS** — Utility-first styling
- **HTML5 QR Code** — Barcode scanning library
- **Vite** — Build tool and dev server
- **localStorage** — Client-side data persistence

AI-assisted development with human oversight and decision-making. See [TECHNICAL-README.md](TECHNICAL-README.md) for the full AI usage disclosure.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👤 Author

**Summer Marie**  
[GitHub](https://github.com/summer-marie) • [Live App](https://myskinscript.app)

---

## 🙏 Acknowledgments

- **Open Beauty Facts** — Cosmetics ingredient database and API
- **UPC Item DB** — Universal barcode verification
- **HTML5-qrcode** — Barcode scanning library
- **Tailwind CSS** — Styling framework
- **Vite** — Modern build tooling

---

**Built with care for healthier, happier skin 💙**
