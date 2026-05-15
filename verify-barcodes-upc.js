/* ============================================
   UPC Item DB Barcode Verification Script
   Second pass verification for products not found in Open Beauty Facts
   ============================================ */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current inci-data.json
const inciDataPath = path.join(__dirname, 'src', 'data', 'inci-data.json');
const products = JSON.parse(fs.readFileSync(inciDataPath, 'utf-8'));

// Filter to only products with barcodeVerified: false or 'rate-limited'
// This allows the script to resume from where it left off after hitting rate limits
const unverifiedProducts = products.filter(
  p => p.barcodeVerified === false || p.barcodeVerified === 'rate-limited'
);

// Statistics tracking
const stats = {
  total: unverifiedProducts.length,
  verified: 0,
  stillNotFound: 0,
  rateLimited: 0,
  errors: 0,
  processedCount: 0,
};

const log = {
  verified: [],
  stillNotFound: [],
  errors: [],
};

/**
 * Lookup a barcode directly in UPC Item DB
 * @param {string} barcode - Barcode to lookup
 * @returns {Promise<Object|null>} Product data or null if not found
 */
async function lookupBarcode(barcode) {
  const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
  
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.code === 'OK' && data.items && data.items.length > 0) {
      return data.items[0];
    }
    
    return null;
  } catch (error) {
    if (error.message === 'RATE_LIMIT') {
      throw error;
    }
    console.error(`  Error looking up barcode ${barcode}:`, error.message);
    return null;
  }
}

/**
 * Search UPC Item DB by product name
 * @param {string} productName - Product name to search
 * @param {string} brandName - Brand name for matching
 * @returns {Promise<Object|null>} Product data or null if not found
 */
async function searchByName(productName, brandName) {
  const searchTerms = encodeURIComponent(productName);
  const url = `https://api.upcitemdb.com/prod/trial/search?s=${searchTerms}&type=product`;
  
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    
    if (data.code === 'OK' && data.items && data.items.length > 0) {
      // Try to find best match by brand
      const matches = data.items.filter(item => {
        const itemBrand = (item.brand || '').toLowerCase();
        const itemTitle = (item.title || '').toLowerCase();
        const searchBrand = brandName.toLowerCase();
        
        // Check if brand matches in either brand field or title
        return itemBrand.includes(searchBrand) || 
               searchBrand.includes(itemBrand) ||
               itemTitle.includes(searchBrand);
      });
      
      // Return first match with valid UPC/EAN
      const match = matches.find(item => item.upc || item.ean);
      
      if (match) {
        return match;
      }
      
      // If no brand match, return null (don't guess)
      return null;
    }
    
    return null;
  } catch (error) {
    if (error.message === 'RATE_LIMIT') {
      throw error;
    }
    console.error(`  Error searching for "${productName}":`, error.message);
    return null;
  }
}

/**
 * Delay helper to avoid rate limiting
 * @param {number} ms - Milliseconds to delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verify unverified products using UPC Item DB
 */
async function verifyUnverifiedProducts() {
  console.log(`Starting UPC Item DB verification of ${unverifiedProducts.length} unverified products...\n`);
  
  let rateLimitHit = false;
  
  for (let i = 0; i < unverifiedProducts.length; i++) {
    const product = unverifiedProducts[i];
    const productLabel = `${product.brand} ${product.name}`;
    
    console.log(`[${i + 1}/${unverifiedProducts.length}] Checking: ${productLabel}`);
    
    try {
      // First, try direct barcode lookup with first barcode
      const firstBarcode = product.barcodes[0];
      let result = await lookupBarcode(firstBarcode);
      
      if (result) {
        console.log(`  ✓ Direct lookup: Found via barcode ${firstBarcode}`);
      } else {
        console.log(`  ○ Direct lookup: No match for barcode ${firstBarcode}`);
        
        // Fallback to name search
        console.log(`  → Trying name search...`);
        result = await searchByName(product.name, product.brand);
        
        if (result) {
          console.log(`  ✓ Name search: Found match`);
        }
      }
      
      if (result) {
        // Found a match - get the barcode (prefer UPC, fallback to EAN)
        const verifiedBarcode = result.upc || result.ean;
        
        if (verifiedBarcode) {
          // Check if this barcode is different from existing ones
          if (!product.barcodes.includes(verifiedBarcode)) {
            // Add new verified barcode to the beginning of array
            product.barcodes = [verifiedBarcode, ...product.barcodes];
            console.log(`  ✓ Added verified barcode: ${verifiedBarcode}`);
          } else {
            console.log(`  ✓ Barcode ${verifiedBarcode} already in array`);
          }
          
          // Mark as verified
          product.barcodeVerified = true;
          stats.verified++;
          log.verified.push({
            product: productLabel,
            barcode: verifiedBarcode,
            method: result.upc ? 'UPC' : 'EAN',
          });
        } else {
          console.log(`  ⚠ Match found but no valid barcode in response`);
          stats.stillNotFound++;
          log.stillNotFound.push(productLabel);
        }
      } else {
        // No match found
        console.log(`  ⚠ Not found in UPC Item DB`);
        stats.stillNotFound++;
        log.stillNotFound.push(productLabel);
      }
      
      stats.processedCount++;
      
    } catch (error) {
      if (error.message === 'RATE_LIMIT') {
        console.log(`\n⚠️  RATE LIMIT HIT - Stopping verification`);
        console.log(`Processed ${stats.processedCount} of ${unverifiedProducts.length} products`);
        rateLimitHit = true;
        
        // Mark remaining products as rate-limited
        for (let j = i; j < unverifiedProducts.length; j++) {
          unverifiedProducts[j].barcodeVerified = 'rate-limited';
          stats.rateLimited++;
        }
        
        break;
      } else {
        // Other error - log and continue
        stats.errors++;
        log.errors.push({
          product: productLabel,
          error: error.message,
        });
        console.log(`  ✗ Error: ${error.message}`);
      }
    }
    
    // Delay between requests to avoid rate limiting (500ms)
    if (i < unverifiedProducts.length - 1 && !rateLimitHit) {
      await delay(500);
    }
  }
  
  // Write updated data back to file
  fs.writeFileSync(
    inciDataPath,
    JSON.stringify(products, null, 2) + '\n',
    'utf-8'
  );
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('UPC ITEM DB VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total unverified products: ${stats.total}`);
  console.log(`Processed: ${stats.processedCount}`);
  console.log(`Verified (barcode found & added): ${stats.verified}`);
  console.log(`Still not found: ${stats.stillNotFound}`);
  console.log(`Rate limited (marked for retry): ${stats.rateLimited}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('='.repeat(60));
  
  if (log.verified.length > 0) {
    console.log('\nPRODUCTS VERIFIED WITH UPC ITEM DB:');
    log.verified.forEach(item => {
      console.log(`  • ${item.product}`);
      console.log(`    Barcode: ${item.barcode} (${item.method})`);
    });
  }
  
  if (log.stillNotFound.length > 0) {
    console.log(`\nPRODUCTS STILL NOT FOUND (${log.stillNotFound.length}):`);
    log.stillNotFound.forEach(product => {
      console.log(`  • ${product}`);
    });
  }
  
  if (log.errors.length > 0) {
    console.log('\nERRORS DURING VERIFICATION:');
    log.errors.forEach(item => {
      console.log(`  • ${item.product}: ${item.error}`);
    });
  }
  
  if (rateLimitHit) {
    console.log('\n⚠️  RATE LIMIT NOTICE:');
    console.log(`${stats.rateLimited} products marked as "rate-limited"`);
    console.log('Run this script again later to continue verification.');
  }
}

// Run the verification
verifyUnverifiedProducts().catch(console.error);
