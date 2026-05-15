/* ============================================
   SkinScript — Main JavaScript
   Navigation and app shell logic
   ============================================ */

import { stopScanner } from "./modules/scanner.js";
import { initScanScreen, prefillForm } from "./modules/barcode.js";
import { renderProducts as renderProductsList } from "./modules/search.js";
import { renderRoutine as renderRoutineUI } from "./modules/routine.js";
import { formatLabel } from "./helpers/format.js";
import { getProducts, saveProducts, deleteProduct } from "./helpers/storage.js";
import {
  getProductStrength,
  getUsageTiming,
  getActiveDescription,
  getUsageInstruction,
  getProductById,
} from "./helpers/products.js";

// DOM element cache
let DOM = {};

/**
 * Show a specific screen and update navigation state
 * @param {string} screenName - The data-screen attribute value to show
 */
function showScreen(screenName) {
  // Remove is-active from all screens
  const allScreens = document.querySelectorAll("[data-screen]");
  allScreens.forEach((screen) => {
    screen.classList.remove("is-active");
  });

  // Add is-active to the target screen
  const targetScreen = document.querySelector(`[data-screen="${screenName}"]`);
  if (targetScreen) {
    targetScreen.classList.add("is-active");
  }

  // Update aria-current on nav buttons
  const allNavButtons = document.querySelectorAll("[data-nav]");
  allNavButtons.forEach((button) => {
    if (button.dataset.nav === screenName) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  // Manage page-home class on body for homepage-specific styling
  if (screenName === "home") {
    document.body.classList.add("page-home");
  } else {
    document.body.classList.remove("page-home");
  }

  // Scroll to top of main container
  const mainContainer = document.getElementById("app-main");
  if (mainContainer) {
    mainContainer.scrollTop = 0;
  }
}

/**
 * Initialize the app
 */
function init() {
  // Seed data first
  seedIfEmpty();

  // Cache stable DOM elements
  DOM = {
    scannerSpinner: document.getElementById("scanner-spinner"),
    scannerError: document.getElementById("scanner-error"),
    scannerResult: document.getElementById("scanner-result"),
    routineContainer: document.getElementById("routine-container"),
    routineWarning: document.getElementById("routine-warning"),
    productsContainer: document.getElementById("products-container"),
    productsListView: document.getElementById("products-list-view"),
    productDetailView: document.getElementById("product-detail-view"),
  };

  // Wire up bottom navigation buttons
  const navButtons = document.querySelectorAll("[data-nav]");
  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const screenName = button.dataset.nav;

      // Stop scanner when leaving scan screen
      if (screenName !== "scan") {
        stopScanner();
      }

      showScreen(screenName);

      // Screen-specific rendering
      if (screenName === "products") {
        showProductsList();
        renderProducts();
      } else if (screenName === "routine") {
        renderRoutine("AM");
      }
    });
  });

  // Wire up action buttons
  const scanButton = document.querySelector('[data-action="go-scan"]');
  if (scanButton) {
    scanButton.addEventListener("click", () => {
      showScreen("scan");
      initScanScreen(DOM, showScreen);
    });
  }

  const addButtons = document.querySelectorAll('[data-action="go-add"]');
  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      showScreen("add");
    });
  });

  const productsButton = document.querySelector('[data-action="go-products"]');
  if (productsButton) {
    productsButton.addEventListener("click", () => {
      showScreen("products");
    });
  }

  // ── Product form chips ────────────────────────────────────────────
  // Type chips (single-select): Only one product type can be selected
  document.querySelectorAll("#type-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document
        .querySelectorAll("#type-chips .chip")
        .forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
    });
  });

  // Actives chips (multi-select): Multiple active ingredients allowed
  // Retinoid chip also toggles inline caution note when selected
  document.querySelectorAll("#actives-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      chip.classList.toggle("is-selected");

      // Show caution note only when retinoid is selected
      if (chip.dataset.active === "retinoid") {
        const caution = document.getElementById("retinoid-caution");
        if (caution) caution.hidden = !chip.classList.contains("is-selected");
      }
    });
  });

  // Filter chips (single-select): Filter products by type on products screen
  document.querySelectorAll("#filter-chips .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document
        .querySelectorAll("#filter-chips .chip")
        .forEach((c) => c.classList.remove("is-selected"));
      chip.classList.add("is-selected");
      renderProducts(chip.dataset.filter);
    });
  });

  // Add product form
  const form = document.getElementById("add-product-form");
  if (form) {
    form.addEventListener("submit", handleAddProductSubmit);
  }

  // Routine time toggle
  document.querySelectorAll(".segmented-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".segmented-toggle button")
        .forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      renderRoutine(btn.dataset.time);
    });
  });

  // Back to home buttons
  document.querySelectorAll('[data-action="go-home"]').forEach((btn) => {
    btn.addEventListener("click", () => {
      stopScanner();
      showScreen("home");
    });
  });

  // ── Beta notice dismiss ───────────────────────────────────────────
  // Hide beta bubble on close; persists dismissal in localStorage
  document.querySelectorAll('[data-dismiss]').forEach((btn) => {
    const id = btn.dataset.dismiss;

    // On load: hide immediately if previously dismissed
    if (localStorage.getItem(`dismissed-${id}`) === 'true') {
      const target = document.getElementById(id);
      if (target) target.classList.add('is-hidden');
    }

    btn.addEventListener('click', () => {
      const target = document.getElementById(id);
      if (target) target.classList.add('is-hidden');
      localStorage.setItem(`dismissed-${id}`, 'true'); // Remember dismissal
    });
  });

  // ── Product name autocomplete ─────────────────────────────────────
  // Filters saved products by name as user types; max 5 suggestions
  // Supports click selection and keyboard navigation (arrows + Enter + Escape)
  (function initAutocomplete() {
    const input = document.getElementById("product-name");
    const dropdown = document.getElementById("autocomplete-dropdown");
    let focusedIndex = -1; // Tracks keyboard-highlighted item

    if (!input || !dropdown) return;

    // Filter and render suggestions on input
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      focusedIndex = -1;

      if (!query) {
        closeDropdown();
        return;
      }

      // Match against saved products, limit to 5
      const matches = getProducts()
        .filter((p) => p.name.toLowerCase().includes(query))
        .slice(0, 5);

      if (matches.length === 0) {
        closeDropdown();
        return;
      }

      // Build dropdown items
      dropdown.innerHTML = "";
      matches.forEach((product, index) => {
        const item = document.createElement("li");
        item.className = "autocomplete-item";
        item.setAttribute("role", "option");
        item.dataset.index = index;
        item.innerHTML = `${product.name} <span class="autocomplete-item-brand">${product.brand}</span>`;

        // Click: prefill all form fields from selected product
        item.addEventListener("mousedown", (e) => {
          e.preventDefault(); // Prevent input blur before fill
          fillFromProduct(product);
          closeDropdown();
        });

        dropdown.appendChild(item);
      });

      dropdown.hidden = false;
    });

    // Keyboard navigation: arrows, Enter, Escape
    input.addEventListener("keydown", (e) => {
      const items = dropdown.querySelectorAll(".autocomplete-item");
      if (dropdown.hidden || items.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
        updateFocus(items);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusedIndex = Math.max(focusedIndex - 1, 0);
        updateFocus(items);
      } else if (e.key === "Enter" && focusedIndex >= 0) {
        e.preventDefault();
        items[focusedIndex].dispatchEvent(new Event("mousedown"));
      } else if (e.key === "Escape") {
        closeDropdown();
      }
    });

    // Close dropdown when input loses focus
    input.addEventListener("blur", () => {
      setTimeout(closeDropdown, 150); // Delay allows mousedown to fire first
    });

    // Highlight focused item via keyboard
    function updateFocus(items) {
      items.forEach((item, i) => {
        item.classList.toggle("is-focused", i === focusedIndex);
      });
    }

    function closeDropdown() {
      dropdown.hidden = true;
      dropdown.innerHTML = "";
      focusedIndex = -1;
    }

    // Prefill all form fields from a matched product
    function fillFromProduct(product) {
      document.getElementById("product-name").value = product.name;
      document.getElementById("product-brand").value = product.brand;

      // Set type chip
      document.querySelectorAll("#type-chips .chip").forEach((chip) => {
        chip.classList.toggle("is-selected", chip.dataset.type === product.type);
      });

      // Set actives chips
      document.querySelectorAll("#actives-chips .chip").forEach((chip) => {
        chip.classList.toggle("is-selected", product.actives.includes(chip.dataset.active));
      });

      // Show retinoid caution if retinoid is in actives
      const caution = document.getElementById("retinoid-caution");
      if (caution) caution.hidden = !product.actives.includes("retinoid");
    }
  })();

  console.log("SkinScript initialized ✓");
}

// Start the app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

/* ============================================
   Product Data Management
   ============================================ */

/**
 * Seed initial products if localStorage is empty
 */
function seedIfEmpty() {
  if (getProducts().length === 0) {
    const seedProducts = [
      {
        id: crypto.randomUUID(),
        name: "CeraVe Foaming Cleanser",
        brand: "CeraVe",
        type: "cleanser",
        actives: ["niacinamide"],
      },
      {
        id: crypto.randomUUID(),
        name: "The Ordinary Niacinamide 10%",
        brand: "The Ordinary",
        type: "serum",
        actives: ["niacinamide"],
      },
      {
        id: crypto.randomUUID(),
        name: "Paula's Choice 2% BHA Liquid",
        brand: "Paula's Choice",
        type: "exfoliant",
        actives: ["salicylic-acid"],
      },
      {
        id: crypto.randomUUID(),
        name: "CeraVe PM Facial Moisturizing Lotion",
        brand: "CeraVe",
        type: "moisturizer",
        actives: ["niacinamide"],
      },
      {
        id: crypto.randomUUID(),
        name: "La Roche-Posay Anthelios SPF 50",
        brand: "La Roche-Posay",
        type: "spf",
        actives: ["other"],
      },
    ];
    saveProducts(seedProducts);
  }
}

/* ============================================
   Product Rendering
   ============================================ */

/**
 * Render products list with optional filter
 * @param {string} filter - Filter by type ("all" or specific type)
 */
function renderProducts(filter = "all") {
  renderProductsList(
    DOM.productsContainer,
    getProducts(),
    filter,
    showScreen,
    renderProductDetail,
  );
}

/**
 * Build the HTML for product detail view
 * This creates a complex DOM structure with multiple cards showing:
 * - Product header (name, brand, type)
 * - Active ingredients with descriptions
 * - Usage timing and instructions
 * - Strength and safety information
 * - Routine placement visualization
 * @param {Object} product - Product object
 * @returns {HTMLElement} Complete detail view DOM element
 */
function buildDetailHTML(product) {
  const strength = getProductStrength(product);
  const timing = getUsageTiming(product);
  const instruction = getUsageInstruction(product);
  const typeLabel = formatLabel(product.type);

  // Determine badge styling based on product strength
  const strengthBadgeClass =
    strength === "gentle"
      ? "badge-gentle"
      : strength === "medium"
        ? "badge-medium"
        : "badge-strong";
  const strengthLabel = formatLabel(strength);

  // ── Build detail view DOM structure ──────────────────────────────
  // Create main container
  const container = document.createElement("div");
  container.className = "flex flex-col gap-5 px-5 py-6";

  // Back button
  const backBtn = document.createElement("button");
  backBtn.className = "btn btn-ghost self-start -ml-3";
  backBtn.id = "back-to-products";
  backBtn.textContent = "‹ Back to my products";
  container.appendChild(backBtn);

  // Header section
  const header = document.createElement("div");
  const title = document.createElement("h2");
  title.className = "text-2xl font-semibold text-gray-900 dark:text-gray-50";
  title.textContent = product.name;
  const subtitle = document.createElement("p");
  subtitle.className = "text-sm text-gray-600 dark:text-gray-400 mt-1";
  subtitle.textContent = `${product.brand} · ${typeLabel}`;
  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);

  // ── Three-column grid for What's In It / How to Use / Strength ──
  // Create wrapper for three-column desktop layout
  const detailSectionsGrid = document.createElement("div");
  detailSectionsGrid.className = "detail-sections-grid";

  // "What's in it" section
  const activesCard = document.createElement("div");
  activesCard.className = "section-card";
  const activesTitle = document.createElement("h3");
  activesTitle.className =
    "text-base font-semibold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2";
  activesTitle.innerHTML =
    'What\'s in it <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-xs">i</span>';
  activesCard.appendChild(activesTitle);

  const activesContent = document.createElement("div");
  activesContent.className = "flex flex-col gap-2";

  if (product.actives.length === 0) {
    const noActives = document.createElement("p");
    noActives.className = "text-sm text-gray-500 dark:text-gray-400";
    noActives.textContent = "No actives listed";
    activesContent.appendChild(noActives);
  } else {
    product.actives.forEach((active) => {
      const activeDiv = document.createElement("div");
      activeDiv.className = "text-sm";
      const activeName = document.createElement("span");
      activeName.className = "font-medium text-gray-900 dark:text-gray-50";
      activeName.textContent = active.replaceAll("-", " ");
      const activeDesc = document.createElement("span");
      activeDesc.className = "text-gray-600 dark:text-gray-400";
      activeDesc.textContent = ` — ${getActiveDescription(active)}`;
      activeDiv.appendChild(activeName);
      activeDiv.appendChild(activeDesc);
      activesContent.appendChild(activeDiv);
    });
  }

  activesCard.appendChild(activesContent);
  detailSectionsGrid.appendChild(activesCard);

  // ── How to use it section ────────────────────────────────────────
  // "How to use it" section
  const usageCard = document.createElement("div");
  usageCard.className = "section-card";
  const usageTitle = document.createElement("h3");
  usageTitle.className =
    "text-base font-semibold text-gray-900 dark:text-gray-50 mb-3";
  usageTitle.textContent = "How to use it";
  usageCard.appendChild(usageTitle);

  const timingBadgeContainer = document.createElement("div");
  timingBadgeContainer.className = "flex items-center gap-2 mb-2";
  const timingBadge = document.createElement("span");
  timingBadge.className = "badge badge-gentle";
  timingBadge.textContent = timing;
  timingBadgeContainer.appendChild(timingBadge);
  usageCard.appendChild(timingBadgeContainer);

  const usageInstruction = document.createElement("p");
  usageInstruction.className = "text-sm text-gray-600 dark:text-gray-400";
  usageInstruction.textContent = instruction;
  usageCard.appendChild(usageInstruction);
  detailSectionsGrid.appendChild(usageCard);

  // ── Strength & safety section ────────────────────────────────────
  // "Strength & safety" section
  const strengthCard = document.createElement("div");
  strengthCard.className = "section-card";
  const strengthTitle = document.createElement("h3");
  strengthTitle.className =
    "text-base font-semibold text-gray-900 dark:text-gray-50 mb-3";
  strengthTitle.textContent = "Strength & safety";
  strengthCard.appendChild(strengthTitle);

  const strengthBadgeContainer = document.createElement("div");
  strengthBadgeContainer.className = "flex items-center gap-2 mb-2";
  const strengthBadge = document.createElement("span");
  strengthBadge.className = `badge ${strengthBadgeClass}`;
  strengthBadge.textContent = strengthLabel;
  strengthBadgeContainer.appendChild(strengthBadge);
  strengthCard.appendChild(strengthBadgeContainer);

  if (strength === "medium" || strength === "strong") {
    const warningText = document.createElement("p");
    warningText.className = "text-sm text-gray-600 dark:text-gray-400 mt-2";
    warningText.textContent =
      "Avoid combining with other strong actives in the same routine.";
    strengthCard.appendChild(warningText);
  }

  // Extra caution for retinoid: not recommended for teen self-selection
  if (product.actives.includes("retinoid")) {
    const retinoidWarning = document.createElement("p");
    retinoidWarning.className = "retinoid-caution mt-2";
    retinoidWarning.textContent =
      "⚠️ Retinoids are occasionally prescribed to teens for severe acne but shouldn't be self-selected without a dermatologist's guidance.";
    strengthCard.appendChild(retinoidWarning);
  }

  detailSectionsGrid.appendChild(strengthCard);

  // Append the three-column grid to container
  container.appendChild(detailSectionsGrid);

  // ── In your routine section ──────────────────────────────────────
  // Shows simplified AM routine flow with current product highlighted
  // "In your routine" section
  const routineCard = document.createElement("div");
  routineCard.className = "section-card";
  const routineTitle = document.createElement("h3");
  routineTitle.className =
    "text-base font-semibold text-gray-900 dark:text-gray-50 mb-3";
  routineTitle.textContent = "In your routine";
  routineCard.appendChild(routineTitle);

  const routineFlow = document.createElement("div");
  routineFlow.className = "routine-flow";

  const cleanserStep = document.createElement("div");
  cleanserStep.className = "routine-step";
  cleanserStep.textContent = "Cleanser";
  routineFlow.appendChild(cleanserStep);

  const arrow1 = document.createElement("span");
  arrow1.className = "text-gray-400";
  arrow1.textContent = "→";
  routineFlow.appendChild(arrow1);

  const currentStep = document.createElement("div");
  currentStep.className = "routine-step is-current";
  currentStep.textContent = typeLabel;
  routineFlow.appendChild(currentStep);

  const arrow2 = document.createElement("span");
  arrow2.className = "text-gray-400";
  arrow2.textContent = "→";
  routineFlow.appendChild(arrow2);

  const moisturizerStep = document.createElement("div");
  moisturizerStep.className = "routine-step";
  moisturizerStep.textContent = "Moisturizer";
  routineFlow.appendChild(moisturizerStep);

  const arrow3 = document.createElement("span");
  arrow3.className = "text-gray-400";
  arrow3.textContent = "→";
  routineFlow.appendChild(arrow3);

  const spfStep = document.createElement("div");
  spfStep.className = "routine-step";
  spfStep.textContent = "SPF";
  routineFlow.appendChild(spfStep);

  routineCard.appendChild(routineFlow);
  container.appendChild(routineCard);

  // ── Action buttons ───────────────────────────────────────────────
  // Bottom back button
  const bottomBackBtn = document.createElement("button");
  bottomBackBtn.className = "btn btn-primary w-full mt-2";
  bottomBackBtn.id = "back-to-products-bottom";
  bottomBackBtn.textContent = "Back to my products";
  container.appendChild(bottomBackBtn);

  // Edit and Delete buttons
  const actionButtons = document.createElement("div");
  actionButtons.className = "flex gap-3 mt-2";

  const editBtn = document.createElement("button");
  editBtn.className = "btn btn-secondary flex-1";
  editBtn.id = "detail-edit-btn";
  editBtn.textContent = "Edit";
  actionButtons.appendChild(editBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "btn btn-danger flex-1";
  deleteBtn.id = "detail-delete-btn";
  deleteBtn.textContent = "Delete";
  actionButtons.appendChild(deleteBtn);

  container.appendChild(actionButtons);

  return container;
}

/**
 * Render product detail view
 * @param {string} productId - Product ID
 */
function renderProductDetail(productId) {
  const product = getProductById(productId);

  if (!product) return;

  const listView = DOM.productsListView;
  const detailView = DOM.productDetailView;

  listView.classList.add("hidden");
  detailView.classList.remove("hidden");

  detailView.innerHTML = "";
  detailView.append(buildDetailHTML(product));

  document
    .getElementById("back-to-products")
    .addEventListener("click", showProductsList);
  document
    .getElementById("back-to-products-bottom")
    .addEventListener("click", showProductsList);

  document.getElementById("detail-edit-btn").addEventListener("click", () => {
    prefillFormForEdit(product);
    showScreen("add");
  });

  const deleteBtn = document.getElementById("detail-delete-btn");

  deleteBtn.addEventListener("click", () => {
    openDeleteModal(product.id, product.name);
  });
}

/**
 * Show products list view (hide detail view)
 */
function showProductsList() {
  const listView = DOM.productsListView;
  const detailView = DOM.productDetailView;

  listView.classList.remove("hidden");
  detailView.classList.add("hidden");
}

/* ============================================
   Delete Modal
   Confirmation modal for product deletion
   ============================================ */

let deleteModal = null;
let deleteModalBackdrop = null;
let pendingDeleteProductId = null; // Store ID of product awaiting deletion

/**
 * Lazy-create the delete modal on first use
 * Modal persists in DOM to avoid recreating on every delete
 */
function createDeleteModalIfNeeded() {
  if (deleteModal) return;

  // Backdrop
  deleteModalBackdrop = document.createElement("div");
  deleteModalBackdrop.className = "modal-backdrop";
  deleteModalBackdrop.hidden = true;

  // Modal container
  deleteModal = document.createElement("div");
  deleteModal.className = "modal";
  deleteModal.hidden = true;

  deleteModal.innerHTML = `
    <div class="modal-content">
      <h3 class="modal-title">Delete product?</h3>
      <p class="modal-body">
        This will remove <span data-modal-product-name></span> from your stash and routine.
      </p>
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" data-modal-cancel>Cancel</button>
        <button type="button" class="btn btn-danger" data-modal-confirm>Delete</button>
      </div>
    </div>
  `;

  document.body.appendChild(deleteModalBackdrop);
  document.body.appendChild(deleteModal);

  // Wire up buttons
  const cancelBtn = deleteModal.querySelector("[data-modal-cancel]");
  const confirmBtn = deleteModal.querySelector("[data-modal-confirm]");

  cancelBtn.addEventListener("click", closeDeleteModal);
  deleteModalBackdrop.addEventListener("click", closeDeleteModal);

  confirmBtn.addEventListener("click", () => {
    if (!pendingDeleteProductId) {
      closeDeleteModal();
      return;
    }

    deleteProduct(pendingDeleteProductId);
    pendingDeleteProductId = null;
    closeDeleteModal();
    showProductsList();
    renderProducts();
  });
}

function openDeleteModal(productId, productName) {
  createDeleteModalIfNeeded();

  pendingDeleteProductId = productId;

  const nameSpan = deleteModal.querySelector("[data-modal-product-name]");
  if (nameSpan) nameSpan.textContent = productName;

  deleteModal.hidden = false;
  deleteModalBackdrop.hidden = false;
}

function closeDeleteModal() {
  if (!deleteModal) return;
  deleteModal.hidden = true;
  deleteModalBackdrop.hidden = true;
  pendingDeleteProductId = null;
}

/* ============================================
   Routine Rendering
   ============================================ */

/**
 * Render routine for AM or PM
 * @param {string} timeOfDay - "AM" or "PM"
 */
function renderRoutine(timeOfDay = "AM") {
  renderRoutineUI(
    timeOfDay,
    DOM.routineContainer,
    DOM.routineWarning,
    getProducts(),
    showScreen,
    renderProductDetail,
  );
}

/* ============================================
   Form Handling
   ============================================ */

/**
 * Reset the add product form
 */
function resetAddProductForm() {
  document.getElementById("product-name").value = "";
  document.getElementById("product-brand").value = "";
  document
    .querySelectorAll("#type-chips .chip")
    .forEach((chip) => chip.classList.remove("is-selected"));
  document
    .querySelectorAll("#actives-chips .chip")
    .forEach((chip) => chip.classList.remove("is-selected"));
  document.getElementById("form-error").hidden = true;
  document.getElementById("add-product-form").dataset.editingId = "";
  document.querySelector('[data-screen="add"] h2').textContent =
    "Add a product";

  // Clear scanned product data sections
  document.getElementById("scanned-safety-score").hidden = true;
  document.getElementById("scanned-compatibility").hidden = true;
  document.getElementById("scanned-allergens").hidden = true;
  document.getElementById("compatibility-tags").innerHTML = "";
  document.getElementById("allergen-list").innerHTML = "";
}

/**
 * Handle add product form submission
 */
function handleAddProductSubmit(e) {
  e.preventDefault();

  const form = document.getElementById("add-product-form");
  const name = document.getElementById("product-name").value.trim();
  const brand = document.getElementById("product-brand").value.trim();
  const selectedType = document.querySelector("#type-chips .chip.is-selected");
  const selectedActives = Array.from(
    document.querySelectorAll("#actives-chips .chip.is-selected"),
  ).map((chip) => chip.dataset.active);

  const errorEl = document.getElementById("form-error");

  if (!name || !brand || !selectedType) {
    errorEl.textContent =
      "Please fill in product name, brand, and select a type.";
    errorEl.hidden = false;
    return;
  }

  const editingId = form.dataset.editingId;

  if (editingId) {
    // Edit mode: update existing product
    const products = getProducts();
    const index = products.findIndex((p) => p.id === editingId);
    if (index !== -1) {
      products[index] = {
        id: editingId,
        name,
        brand,
        type: selectedType.dataset.type,
        actives: selectedActives,
      };
      saveProducts(products);
    }
  } else {
    // Add mode: create new product
    const product = {
      id: crypto.randomUUID(),
      name,
      brand,
      type: selectedType.dataset.type,
      actives: selectedActives,
    };

    const products = getProducts();
    products.push(product);
    saveProducts(products);
  }

  resetAddProductForm();
  showScreen("products");
  renderProducts();
}

/* ============================================
   Form Prefilling for Edit Mode
   ============================================ */

/**
 * Prefill the add product form for editing an existing product
 * @param {Object} product - Product object to edit
 */
function prefillFormForEdit(product) {
  const form = document.getElementById("add-product-form");
  form.dataset.editingId = product.id;
  prefillForm(product);
  document.querySelector('[data-screen="add"] h2').textContent = "Edit product";
}
