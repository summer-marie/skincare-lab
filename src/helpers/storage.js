/* ============================================
   Storage Helpers
   LocalStorage persistence utilities for products
   ============================================ */

/**
 * Get products from localStorage
 * @returns {Array} Array of product objects
 */
export function getProducts() {
  const data = localStorage.getItem("skinscript_products");
  return data ? JSON.parse(data) : [];
}

/**
 * Save products to localStorage
 * @param {Array} products - Array of product objects
 */
export function saveProducts(products) {
  localStorage.setItem("skinscript_products", JSON.stringify(products));
}

/**
 * Delete a product by ID from localStorage
 * @param {string} productId - Product ID to delete
 */
export function deleteProduct(productId) {
  const updated = getProducts().filter((p) => p.id !== productId);
  saveProducts(updated);
}
