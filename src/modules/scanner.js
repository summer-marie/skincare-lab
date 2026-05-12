/* ============================================
   SkinLoop — Barcode Scanner Module
   Html5-qrcode wrapper for barcode scanning
   ============================================ */

/**
 * Mock barcode database for testing
 */
const MOCK_BARCODES = {
  '036602320018': {
    name: 'CeraVe Foaming Cleanser',
    brand: 'CeraVe',
    type: 'cleanser',
    actives: ['niacinamide', 'ceramides']
  },
  '386160130000': {
    name: 'The Ordinary Niacinamide 10%',
    brand: 'The Ordinary',
    type: 'serum',
    actives: ['niacinamide', 'zinc']
  },
  '726150111719': {
    name: "Paula's Choice 2% BHA Liquid",
    brand: "Paula's Choice",
    type: 'exfoliant',
    actives: ['salicylic-acid']
  },
  '036602307026': {
    name: 'CeraVe PM Moisturizing Lotion',
    brand: 'CeraVe',
    type: 'moisturizer',
    actives: ['niacinamide', 'ceramides']
  },
  '3337875545082': {
    name: 'La Roche-Posay Anthelios SPF 50',
    brand: 'La Roche-Posay',
    type: 'spf',
    actives: ['avobenzone']
  }
};

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
    qrbox: { width: 250, height: 250 }
  };

  const cameraConfig = { facingMode: "environment" };

  scannerInstance
    .start(cameraConfig, config, (decodedText) => {
      stopScanner();
      onSuccess(decodedText);
    })
    .catch((err) => {
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

/* ============================================
   Barcode Lookup
   ============================================ */

/**
 * Look up product data by barcode
 * @param {string} barcode - UPC/EAN barcode string
 * @returns {Promise<Object|null>} Product data or null if not found
 */
export async function lookupBarcode(barcode) {
  // Check mock database first
  if (MOCK_BARCODES[barcode]) {
    return MOCK_BARCODES[barcode];
  }

  // Try Open Food Facts API
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    const data = await response.json();

    if (data.status === 1 && data.product) {
      return {
        name: data.product.product_name || 'Unknown Product',
        brand: data.product.brands || 'Unknown Brand',
        type: 'moisturizer',
        actives: []
      };
    }
  } catch (err) {
    console.error('Barcode lookup failed:', err);
  }

  return null;
}
