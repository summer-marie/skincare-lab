/* ============================================
   Barcode Verification Script
   Verifies and updates product barcodes using Open Beauty Facts API
   ============================================ */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current inci-data.json
const inciDataPath = path.join(__dirname, 'src', 'data', 'inci-data.json');
const products = JSON.parse(fs.readFileSync(inciDataPath, 'utf-8'));

// Statistics tracking
const stats = {
  total: products.length,
  verified: 0,
  updated: 0,
  notFound: 0,
  errors: 0,
};

const log = {
  verified: [],
  updated: [],
  notFound: [],
  errors: [],
};

/**
 * Search Open Beauty Facts for a product
 * @param {string} productName - Product name to search
 * @param {string} brandName - Brand name for matching
 * @returns {Promise<Object|null>} Product data or null if not found
 */
async function searchOpenBeautyFacts(productName, brandName) {
  const searchTerms = encodeURIComponent(productName);
  const url = `https://world.openbeautyfacts.org/cgi/search.pl?search_terms=${searchTerms}&search_simple=1&action=process&json=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.products || data.products.length === 0) {
      return null;
    }
    
    // Try to find best match by brand and product name
    const matches = data.products.filter(p => {
      const productBrand = (p.brands || '').toLowerCase();
      const searchBrand = brandName.toLowerCase();
      return productBrand.includes(searchBrand) || searchBrand.includes(productBrand);
    });
    
    // Return first match with a valid barcode
    const match = matches.find(p => p.code && p.code.length > 0) || data.products[0];
    
    if (match && match.code) {
      return {
        barcode: match.code,
        productName: match.product_name || productName,
        brands: match.brands || brandName,
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching for "${productName}":`, error.message);
    throw error;
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
 * Verify and update products
 */
async function verifyAllProducts() {
  console.log(`Starting verification of ${products.length} products...\n`);
  
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const productLabel = `${product.brand} ${product.name}`;
    
    console.log(`[${i + 1}/${products.length}] Checking: ${productLabel}`);
    
    try {
      const result = await searchOpenBeautyFacts(product.name, product.brand);
      
      if (result) {
        // Found a match
        const existingBarcodes = product.barcodes || [];
        const newBarcode = result.barcode;
        
        // Check if this barcode is already in our list
        if (!existingBarcodes.includes(newBarcode)) {
          // New barcode found - add it to the array
          product.barcodes = [newBarcode, ...existingBarcodes];
          product.barcodeVerified = true;
          
          stats.updated++;
          log.updated.push({
            product: productLabel,
            oldBarcodes: existingBarcodes,
            newBarcode: newBarcode,
          });
          console.log(`  ✓ Updated: Added barcode ${newBarcode}`);
        } else {
          // Barcode already exists - just mark as verified
          product.barcodeVerified = true;
          stats.verified++;
          log.verified.push(productLabel);
          console.log(`  ✓ Verified: Barcode ${newBarcode} confirmed`);
        }
      } else {
        // No match found
        product.barcodeVerified = false;
        stats.notFound++;
        log.notFound.push(productLabel);
        console.log(`  ⚠ Not found in Open Beauty Facts`);
      }
    } catch (error) {
      // Error during search
      product.barcodeVerified = false;
      stats.errors++;
      log.errors.push({
        product: productLabel,
        error: error.message,
      });
      console.log(`  ✗ Error: ${error.message}`);
    }
    
    // Delay between requests to avoid rate limiting (500ms)
    if (i < products.length - 1) {
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
  console.log('VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total products: ${stats.total}`);
  console.log(`Verified (existing barcode confirmed): ${stats.verified}`);
  console.log(`Updated (new barcode added): ${stats.updated}`);
  console.log(`Not found: ${stats.notFound}`);
  console.log(`Errors: ${stats.errors}`);
  console.log('='.repeat(60));
  
  if (log.updated.length > 0) {
    console.log('\nPRODUCTS UPDATED WITH NEW BARCODES:');
    log.updated.forEach(item => {
      console.log(`  • ${item.product}`);
      console.log(`    Old: [${item.oldBarcodes.join(', ')}]`);
      console.log(`    Added: ${item.newBarcode}`);
    });
  }
  
  if (log.notFound.length > 0) {
    console.log('\nPRODUCTS NOT FOUND IN OPEN BEAUTY FACTS:');
    log.notFound.forEach(product => {
      console.log(`  • ${product}`);
    });
  }
  
  if (log.errors.length > 0) {
    console.log('\nERRORS DURING VERIFICATION:');
    log.errors.forEach(item => {
      console.log(`  • ${item.product}: ${item.error}`);
    });
  }
}

// Run the verification
verifyAllProducts().catch(console.error);
