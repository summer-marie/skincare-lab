/* ============================================
   Barcode Verification Status Report
   Shows current verification status of all products
   ============================================ */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inciDataPath = path.join(__dirname, 'src', 'data', 'inci-data.json');
const products = JSON.parse(fs.readFileSync(inciDataPath, 'utf-8'));

// Count by verification status
const stats = {
  total: products.length,
  verified: products.filter(p => p.barcodeVerified === true).length,
  notVerified: products.filter(p => p.barcodeVerified === false).length,
  rateLimited: products.filter(p => p.barcodeVerified === 'rate-limited').length,
};

console.log('='.repeat(60));
console.log('BARCODE VERIFICATION STATUS REPORT');
console.log('='.repeat(60));
console.log(`Total products: ${stats.total}`);
console.log(`✓ Verified: ${stats.verified} (${((stats.verified / stats.total) * 100).toFixed(1)}%)`);
console.log(`⚠ Rate-limited (pending): ${stats.rateLimited}`);
console.log(`✗ Not verified: ${stats.notVerified}`);
console.log('='.repeat(60));

if (stats.rateLimited > 0) {
  console.log('\n⏳ NEXT STEPS:');
  console.log('Run verify-barcodes-upc.js again later to continue verification');
  console.log('(The script will automatically skip already-verified products)');
}

if (stats.verified > 0) {
  console.log(`\n📊 VERIFICATION BREAKDOWN:`);
  
  // Count products with multiple barcodes
  const multiBarcode = products.filter(p => p.barcodeVerified === true && p.barcodes.length > 1);
  console.log(`Products with multiple verified barcodes: ${multiBarcode.length}`);
  
  if (multiBarcode.length > 0) {
    console.log('\nTop 10 products with most barcodes:');
    const sorted = multiBarcode.sort((a, b) => b.barcodes.length - a.barcodes.length).slice(0, 10);
    sorted.forEach(p => {
      console.log(`  • ${p.brand} ${p.name}: ${p.barcodes.length} barcodes`);
    });
  }
}
