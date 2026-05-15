/* ============================================
   Product Deduplication Script
   Consolidates duplicate products and converts barcode field to barcodes array
   ============================================ */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current inci-data.json
const inciDataPath = path.join(__dirname, 'src', 'data', 'inci-data.json');
const products = JSON.parse(fs.readFileSync(inciDataPath, 'utf-8'));

// Create a map to track unique products
// Key: unique product signature (name + brand + type + actives + safetyScore + skinCompatibility + allergenWarnings)
// Value: { product data, barcodes array }
const productMap = new Map();

for (const product of products) {
  // Create a unique signature for this product (excluding barcode)
  const signature = JSON.stringify({
    name: product.name,
    brand: product.brand,
    type: product.type,
    actives: product.actives,
    safetyScore: product.safetyScore,
    skinCompatibility: product.skinCompatibility,
    allergenWarnings: product.allergenWarnings,
  });

  if (productMap.has(signature)) {
    // Duplicate found - add barcode to existing entry
    productMap.get(signature).barcodes.push(product.barcode);
  } else {
    // New unique product - create entry with barcodes array
    productMap.set(signature, {
      ...product,
      barcodes: [product.barcode],
    });
    delete productMap.get(signature).barcode;
  }
}

// Convert map back to array
const consolidatedProducts = Array.from(productMap.values());

// Sort by brand, then name for better organization
consolidatedProducts.sort((a, b) => {
  if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
  return a.name.localeCompare(b.name);
});

// Write the consolidated data back to file
fs.writeFileSync(
  inciDataPath,
  JSON.stringify(consolidatedProducts, null, 2) + '\n',
  'utf-8'
);

console.log(`✓ Consolidated ${products.length} products into ${consolidatedProducts.length} unique products`);
console.log(`✓ Removed ${products.length - consolidatedProducts.length} duplicates`);

// Show products with multiple barcodes
const multiBarcode = consolidatedProducts.filter(p => p.barcodes.length > 1);
console.log(`\n✓ Products with multiple barcodes (${multiBarcode.length}):`);
multiBarcode.forEach(p => {
  console.log(`  - ${p.brand} ${p.name}: ${p.barcodes.length} barcodes`);
});
