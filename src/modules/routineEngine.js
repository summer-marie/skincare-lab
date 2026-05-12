/* ============================================
   Routine Engine
   Logic for AM/PM routines and conflict detection
   ============================================ */

const AM_ORDER = ['cleanser', 'serum', 'treatment', 'moisturizer', 'spf'];
const PM_ORDER = ['cleanser', 'exfoliant', 'serum', 'treatment', 'moisturizer'];

/**
 * Get usage timing for a product (private helper)
 * @param {Object} product - Product object
 * @returns {string} "AM" | "PM" | "AM/PM"
 */
function getUsageTiming(product) {
  if (product.type === 'spf') return 'AM';
  if (product.type === 'exfoliant' || product.actives.includes('retinoid')) return 'PM';
  if (product.type === 'cleanser' || product.type === 'moisturizer' || product.type === 'serum') return 'AM/PM';
  return 'AM/PM';
}

/**
 * Get AM routine steps
 * @param {Array} products - All products
 * @returns {Array} Routine steps with step number, type, and product
 */
export function getAMRoutine(products) {
  return AM_ORDER.map((type, index) => ({
    step: index + 1,
    type,
    product: products.find(p =>
      p.type === type && ['AM', 'AM/PM'].includes(getUsageTiming(p))
    ) || null
  }));
}

/**
 * Get PM routine steps
 * @param {Array} products - All products
 * @returns {Array} Routine steps with step number, type, and product
 */
export function getPMRoutine(products) {
  return PM_ORDER.map((type, index) => ({
    step: index + 1,
    type,
    product: products.find(p =>
      p.type === type && ['PM', 'AM/PM'].includes(getUsageTiming(p))
    ) || null
  }));
}

/**
 * Detect conflicts and warnings in a routine
 * @param {Array} routine - Routine steps from getAMRoutine or getPMRoutine
 * @param {string} timing - "AM" or "PM"
 * @returns {Array} Array of warning messages
 */
export function getConflictWarnings(routine, timing) {
  const warnings = [];
  const active = routine.filter(p => p.product !== null).map(p => p.product);

  // 1. 2+ strong actives
  const strongCount = active.filter(p =>
    p.actives.some(a => ['retinoid', 'benzoyl-peroxide'].includes(a))
  ).length;
  if (strongCount >= 2) {
    warnings.push('Too many strong treatments. Consider removing one.');
  }

  // 2. Benzoyl peroxide + retinoid in PM
  if (timing === 'PM') {
    const hasBP = active.some(p => p.actives.includes('benzoyl-peroxide'));
    const hasRetinoid = active.some(p => p.actives.includes('retinoid'));
    if (hasBP && hasRetinoid) {
      warnings.push('Benzoyl peroxide can deactivate retinoids. Use on alternate nights.');
    }
  }

  // 3. AHA + salicylic acid together
  const hasAHA = active.some(p => p.actives.includes('aha'));
  const hasSA = active.some(p => p.actives.includes('salicylic-acid'));
  if (hasAHA && hasSA) {
    warnings.push('Layering multiple exfoliants can irritate skin.');
  }

  // 4. No SPF in AM
  if (timing === 'AM') {
    const hasSPF = active.some(p => p.type === 'spf');
    if (!hasSPF) {
      warnings.push("Don't forget SPF in the morning.");
    }
  }

  return warnings;
}
