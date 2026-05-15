/* ============================================
   SkinScript — Barcode Scanner Module
   Html5-qrcode wrapper for barcode scanning
   ============================================ */

import inciData from "../data/inci-data.json";

/**
 * Build a fast O(1) lookup map from the INCI JSON array on first import.
 * This converts the array to a Map structure for instant barcode lookups,
 * avoiding O(n) array searches on every scan.
 * Key: barcode string  →  Value: product object
 * Note: Products can have multiple barcodes, so each barcode maps to the same product
 */
const INCI_MAP = Object.fromEntries(
  inciData.flatMap((product) =>
    product.barcodes.map((barcode) => [barcode, product])
  )
);

/**
 * Html5Qrcode scanner instance
 */
let scannerInstance = null;

/* ============================================
   Scanner Control
   ============================================ */

/**
 * Start the barcode scanner
 * @param {string} containerId - ID of the container element
 * @param {Function} onSuccess - Callback for successful scan (receives decodedText)
 * @param {Function} onError - Callback for error (receives error message)
 */
export function startScanner(containerId, onSuccess, onError) {
  if (scannerInstance) {
    stopScanner();
  }

  scannerInstance = new Html5Qrcode(containerId);

  const config = {
    fps: 10,
    qrbox: { width: 250, height: 250 },
  };

  const cameraConfig = { facingMode: "environment" };

  scannerInstance
    .start(cameraConfig, config, (decodedText) => {
      stopScanner();
      onSuccess(decodedText);
    })
    .catch(() => {
      onError("Camera access was denied. Try adding your product manually.");
    });
}

/**
 * Stop and clear the scanner instance
 */
export function stopScanner() {
  if (scannerInstance) {
    scannerInstance
      .stop()
      .then(() => {
        scannerInstance.clear();
        scannerInstance = null;
      })
      .catch(() => {
        scannerInstance = null;
      });
  }
}

/**
 * Scan barcode from an uploaded image file
 * Creates a temporary scanner instance because Html5Qrcode requires
 * a DOM element ID, but we're scanning from memory (no video feed)
 * @param {File} file - Image file containing a barcode
 * @returns {Promise<string>} Decoded barcode text
 * @throws {Error} If scan fails
 */
export async function scanFromFile(file) {
  // Create unique temp ID to avoid conflicts with main scanner
  const tempId = `temp-scanner-${Date.now()}`;
  const tempScanner = new Html5Qrcode(tempId);

  try {
    const decodedText = await tempScanner.scanFile(file, false);
    tempScanner.clear();
    return decodedText;
  } catch (err) {
    tempScanner.clear();
    throw new Error("Could not read barcode from image");
  }
}

/* ============================================
   Barcode Lookup
   ============================================ */

/**
 * Look up product data by barcode.
 * Two-tier lookup strategy:
 *   1. Local inci-data.json  → Full skincare metadata (actives, safety, etc.)
 *   2. Open Food Facts API   → Fallback for general products (name/brand only)
 * This ensures comprehensive data for curated products while still supporting
 * lookups for products not in our database.
 *
 * @param {string} barcode - UPC/EAN barcode string
 * @returns {Promise<Object|null>} Normalized product data or null if not found
 */
export async function lookupBarcode(barcode) {
  // ── 1. Check local INCI data (preferred source) ──────────────────────
  if (INCI_MAP[barcode]) {
    return INCI_MAP[barcode];
  }

  // ── 2. Fall back to Open Food Facts API (general products) ───────────
  // Provides basic product info but lacks skincare-specific metadata
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
    );
    const data = await response.json();

    if (data.status === 1 && data.product) {
      return {
        barcode,
        name: data.product.product_name || "Unknown Product",
        brand: data.product.brands || "Unknown Brand",
        type: "moisturizer", // best-guess default; user can correct in form
        actives: [],
        safetyScore: null, // not available from OFF
        skinCompatibility: [],
        allergenWarnings: [],
      };
    }
  } catch (err) {
    console.error("Barcode lookup failed:", err);
  }

  return null;
}
