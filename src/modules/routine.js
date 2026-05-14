/* ============================================
   Routine Rendering Module
   Handles AM/PM routine UI rendering and warnings
   ============================================ */

import {
  getAMRoutine,
  getPMRoutine,
  getConflictWarnings,
} from "./routineEngine.js";
import { formatLabel } from "../helpers/format.js";

/**
 * Render routine for AM or PM
 * @param {string} timeOfDay - "AM" or "PM"
 * @param {HTMLElement} container - Routine container element
 * @param {HTMLElement} warningBanner - Warning banner element
 * @param {Array} products - Array of product objects
 * @param {Function} showScreen - Function to show a screen
 * @param {Function} renderProductDetail - Function to render product detail
 */
export function renderRoutine(
  timeOfDay,
  container,
  warningBanner,
  products,
  showScreen,
  renderProductDetail,
) {
  const routine =
    timeOfDay === "AM" ? getAMRoutine(products) : getPMRoutine(products);

  const warnings = getConflictWarnings(routine, timeOfDay);

  if (warnings.length > 0) {
    warningBanner.hidden = false;
    const warningText =
      warnings.length > 1 ? warnings.join(" · ") : warnings[0];
    warningBanner.querySelector("[data-warning-text]").textContent =
      warningText;
  } else {
    warningBanner.hidden = true;
  }

  container.innerHTML = "";

  // ── Render routine steps ─────────────────────────────────────────────
  // Each step shows either a filled product card or an empty placeholder
  routine.forEach(({ step, type, product }) => {
    const typeLabel = formatLabel(type);
    const stepCard = document.createElement("div");

    // Filled step: User has a product for this step
    if (product) {
      stepCard.className = "product-card";
      stepCard.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">${step}</div>
          <div class="flex-1">
            <p class="text-xs text-gray-500 dark:text-gray-400">${typeLabel}</p>
            <p class="font-semibold text-gray-900 dark:text-gray-50">${product.name}</p>
          </div>
          <span class="text-gray-400 dark:text-gray-500 text-xl">›</span>
        </div>
      `;
      stepCard.addEventListener("click", () => {
        showScreen("products");
        setTimeout(() => renderProductDetail(product.id), 100);
      });
    } else {
      // Empty step: No product assigned for this step in routine
      stepCard.className =
        "bg-white dark:bg-gray-800 rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-700";
      stepCard.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">${step}</div>
          <div class="flex-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">No ${typeLabel.toLowerCase()} added yet.</p>
          </div>
        </div>
      `;
    }

    container.appendChild(stepCard);
  });
}
