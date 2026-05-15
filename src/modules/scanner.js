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
 * Static lookup strategy - checks only local inci-data.json database.
 * No external API calls - fully offline capable.
 *
 * @param {string} barcode - UPC/EAN barcode string
 * @returns {Promise<Object|null>} Product data from local database or null if not found
 */
export async function lookupBarcode(barcode) {
  // Check local INCI data only
  if (INCI_MAP[barcode]) {
    return INCI_MAP[barcode];
  }

  // Not found in local database
  return null;
}
