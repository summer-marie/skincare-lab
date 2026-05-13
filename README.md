# 🧬 SkinScript

**Safer skincare routines for teens**

SkinScript is a mobile-first web app that helps teenagers understand what's in their skincare products, build safe routines, and avoid mixing ingredients that can irritate their skin.

---

## ✨ Features

### 📱 Product Management
- **Barcode Scanner** — Scan product barcodes using your device camera
- **Manual Entry** — Add products by hand with name, brand, type, and active ingredients
- **Product Library** — View and filter all your products in one place
- **Edit & Delete** — Update product details or remove items from your stash

### 🔬 Ingredient Intelligence
- **Safety Scores** — See ingredient safety ratings (1-10 scale) for scanned products
- **Skin Compatibility** — Know which skin types each product suits best
- **Allergen Warnings** — Get alerts for common allergens and irritants
- **Active Descriptions** — Learn what each ingredient does

### 🌙 Smart Routine Builder
- **AM/PM Routines** — Get personalized morning and evening skincare sequences
- **Conflict Detection** — Receive warnings when mixing incompatible actives
- **Product Strength Analysis** — Understand gentle, medium, and strong treatments
- **Usage Timing** — Know when to use each product for best results

### 🛡️ Safety Checks
- **Retinoid + Benzoyl Peroxide** warning
- **AHA + Salicylic Acid** layering alerts
- **Multiple Strong Actives** detection
- **Missing SPF** reminders for AM routines

---

## 🚀 Tech Stack

- **JavaScript** — Vanilla ES6+ modules (no framework)
- **Vite** — Fast dev server and build tool
- **Tailwind CSS** — Utility-first styling via @tailwindcss/vite plugin
- **HTML5 QR Code** — Barcode scanning library
- **localStorage** — Client-side data persistence

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/summer-marie/skincare-lab.git
cd skincare-lab

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3005` (or 3006 if port is in use).

---

## 🏗️ Project Structure

```
skincare-lab/
├── src/
│   ├── main.js              # App initialization & core logic
│   ├── style.css            # Tailwind imports & custom styles
│   ├── modules/
│   │   ├── scanner.js       # Barcode scanning + API integration
│   │   └── routineEngine.js # Routine logic & conflict detection
│   └── data/
│       └── inci-data.json   # Ingredient database (if present)
├── index.html               # App shell & screen markup
├── vite.config.ts           # Vite configuration
├── package.json             # Dependencies & scripts
└── README.md                # You are here
```

---

## 🎨 Design System

### Colors
- **Primary** — Muted blue-green (#4a8c8f / #5da5a8 dark)
- **Warning** — Amber for medium-strength ingredients
- **Error** — Red for strong actives and allergen alerts
- **Gender-neutral palette** — Inclusive design for all teens

### Typography
- **Font** — DM Sans (300-700 weights)
- **Scale** — Responsive sizing with rem units
- **Hierarchy** — Clear headings and labels

### Components
- **Buttons** — Primary, Secondary, Ghost, Danger variants
- **Chips** — Single-select (type) and multi-select (actives)
- **Cards** — Product cards, section cards, detail views
- **Badges** — Gentle/Medium/Strong color coding

### Layout
- **Max Width** — 430px (26.875rem) for optimal mobile experience
- **Bottom Nav** — Fixed navigation with 3 tabs
- **Screen Transitions** — Smooth 200ms fade-in animations

---

## 🧪 Key Functionality

### Barcode Scanning Flow
1. User taps "Scan product barcode" on home screen
2. Camera permission requested
3. Html5-qrcode library initializes with rear camera
4. Mock data checked first (5 test barcodes)
5. If not found, queries Open Food Facts API
6. Product data prefills the add form
7. User reviews and saves to localStorage

### Routine Building Logic
- **AM Order** — Cleanser → Serum → Treatment → Moisturizer → SPF
- **PM Order** — Cleanser → Exfoliant → Serum → Treatment → Moisturizer
- Products auto-sorted by type and usage timing
- Empty slots displayed with dashed borders
- Click any step to view product details

### Conflict Warnings
- ⚠️ Too many strong treatments (2+ strong actives)
- ⚠️ BP + retinoid clash (PM only)
- ⚠️ Multiple exfoliants layered together
- ⚠️ Missing SPF in morning routine

---

## 🔧 Scripts

```bash
npm run dev       # Start development server (Vite)
npm run build     # Build for production
npm run preview   # Preview production build
```

---

## 📚 Data Sources

- **Mock Barcodes** — 5 test products (CeraVe, The Ordinary, Paula's Choice, La Roche-Posay)
- **Open Food Facts API** — Fallback for unknown barcodes
- **Ingredient Database** — Custom INCI data for safety scores & compatibility (if implemented)

---

## 🎯 Target Audience

SkinScript is designed for:
- **Teens** (ages 13-19) new to skincare
- **Parents** helping kids build safe routines
- **Beginners** learning about active ingredients
- **Anyone** wanting to avoid irritating product combinations

---

## ⚠️ Disclaimer

**SkinScript is not a replacement for a dermatologist.** This app provides educational guidance based on common ingredient interactions, but individual skin conditions vary. When in doubt, consult a licensed dermatologist or skincare professional.

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 💡 Future Enhancements

- [ ] User accounts & cloud sync
- [ ] Photo upload for product recognition
- [ ] Expanded ingredient database
- [ ] Routine sharing with friends
- [ ] Progress tracking & skin journals
- [ ] Dark mode improvements
- [ ] PWA support for offline use
- [ ] Multi-language support

---

## 👤 Author

**Summer Marie** — [GitHub](https://github.com/summer-marie)

---

## 🙏 Acknowledgments

- **Open Food Facts** — Product data API
- **Html5-qrcode** — Barcode scanning library
- **Tailwind CSS** — Utility-first CSS framework
- **Vite** — Next-generation frontend tooling

---

Built with 💙 for healthier skin routines
