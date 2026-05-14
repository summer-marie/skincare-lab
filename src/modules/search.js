/* ============================================
   Product Search & Filter Module
   Handles product listing, filtering, and search UI
   ============================================ */

import { formatLabel } from "../helpers/format.js";

/**
 * Create a product card element
 * @param {Object} product - Product object
 * @param {Function} renderProductDetail - Function to render product detail
 * @returns {HTMLElement} Product card element
 */
export function createProductCard(product, renderProductDetail) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.dataset.productId = product.id;

  const typeLabel = formatLabel(product.type);
  const activesText =
    product.actives.length > 0
      ? product.actives.map((a) => a.replaceAll("-", " ")).join(", ")
      : "No actives listed";

  card.innerHTML = `
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 dark:text-gray-50">${product.name}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">${product.brand} · ${typeLabel}</p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">${activesText}</p>
      </div>
      <span class="text-gray-400 dark:text-gray-500 text-xl">›</span>
    </div>
  `;

  // Add click event to show product detail
  card.addEventListener("click", () => {
    renderProductDetail(product.id);
  });

  return card;
}

/**
 * Render products list with optional filter
 * @param {HTMLElement} container - Container element for products
 * @param {Array} products - Array of product objects
 * @param {string} filter - Filter by type ("all" or specific type)
 * @param {Function} showScreen - Function to show a screen
 * @param {Function} renderProductDetail - Function to render product detail
 */
export function renderProducts(
  container,
  products,
  filter = "all",
  showScreen,
  renderProductDetail,
) {
  let filtered = products;
  if (filter !== "all") {
    filtered = products.filter((p) => p.type === filter);
  }

  container.innerHTML = "";

  // If no products match the filter, show an empty state
  if (filtered.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.innerHTML = `
      <div class="text-4xl mb-4">🧴</div>
      <p class="font-medium text-gray-700 dark:text-gray-300 mb-1">Your stash is empty</p>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">Scan a barcode or add a product manually to get started.</p>
    `;
    const addButton = document.createElement("button");
    addButton.className = "btn btn-primary";
    addButton.textContent = "Add your first product";
    addButton.addEventListener("click", () => showScreen("add"));
    emptyState.appendChild(addButton);
    container.appendChild(emptyState);
    return;
  }

  // Render filtered products
  filtered.forEach((product) => {
    container.appendChild(createProductCard(product, renderProductDetail));
  });
}
