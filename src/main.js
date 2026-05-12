/* ============================================
   SkinLoop — Main JavaScript
   Navigation and app shell logic
   ============================================ */

import { startScanner, stopScanner, lookupBarcode } from './modules/scanner.js';

// DOM element cache
let DOM = {};

/**
 * Show a specific screen and update navigation state
 * @param {string} screenName - The data-screen attribute value to show
 */
function showScreen(screenName) {
  // Remove is-active from all screens
  const allScreens = document.querySelectorAll('[data-screen]');
  allScreens.forEach((screen) => {
    screen.classList.remove('is-active');
  });

  // Add is-active to the target screen
  const targetScreen = document.querySelector(`[data-screen="${screenName}"]`);
  if (targetScreen) {
    targetScreen.classList.add('is-active');
  }

  // Update aria-current on nav buttons
  const allNavButtons = document.querySelectorAll('[data-nav]');
  allNavButtons.forEach((button) => {
    if (button.dataset.nav === screenName) {
      button.setAttribute('aria-current', 'page');
    } else {
      button.removeAttribute('aria-current');
    }
  });

  // Scroll to top of main container
  const mainContainer = document.getElementById('app-main');
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
    scannerSpinner: document.getElementById('scanner-spinner'),
    scannerError: document.getElementById('scanner-error'),
    scannerResult: document.getElementById('scanner-result'),
    routineContainer: document.getElementById('routine-container'),
    routineWarning: document.getElementById('routine-warning'),
    productsContainer: document.getElementById('products-container'),
    productsListView: document.getElementById('products-list-view'),
    productDetailView: document.getElementById('product-detail-view')
  };
  
  // Wire up bottom navigation buttons
  const navButtons = document.querySelectorAll('[data-nav]');
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const screenName = button.dataset.nav;
      
      // Stop scanner when leaving scan screen
      if (screenName !== 'scan') {
        stopScanner();
      }
      
      showScreen(screenName);
      
      // Screen-specific rendering
      if (screenName === 'products') {
        showProductsList();
        renderProducts();
      } else if (screenName === 'routine') {
        renderRoutine('AM');
      }
    });
  });

  // Wire up action buttons
  const scanButton = document.querySelector('[data-action="go-scan"]');
  if (scanButton) {
    scanButton.addEventListener('click', () => {
      showScreen('scan');
      initScanScreen();
    });
  }

  const addButtons = document.querySelectorAll('[data-action="go-add"]');
  addButtons.forEach((button) => {
    button.addEventListener('click', () => {
      showScreen('add');
    });
  });

  const productsButton = document.querySelector('[data-action="go-products"]');
  if (productsButton) {
    productsButton.addEventListener('click', () => {
      showScreen('products');
    });
  }
  
  // Type chips (single-select)
  document.querySelectorAll('#type-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#type-chips .chip').forEach(c => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
    });
  });
  
  // Actives chips (multi-select)
  document.querySelectorAll('#actives-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('is-selected');
    });
  });
  
  // Filter chips
  document.querySelectorAll('#filter-chips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#filter-chips .chip').forEach(c => c.classList.remove('is-selected'));
      chip.classList.add('is-selected');
      renderProducts(chip.dataset.filter);
    });
  });
  
  // Add product form
  const form = document.getElementById('add-product-form');
  if (form) {
    form.addEventListener('submit', handleAddProductSubmit);
  }
  
  // Routine time toggle
  document.querySelectorAll('.segmented-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.segmented-toggle button').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderRoutine(btn.dataset.time);
    });
  });
  
  // Back to home buttons
  document.querySelectorAll('[data-action="go-home"]').forEach(btn => {
    btn.addEventListener('click', () => {
      stopScanner();
      showScreen('home');
    });
  });

  console.log('SkinLoop initialized ✓');
}

/* ============================================
  Utility Functions
   ============================================ */

/**
 * Format a hyphenated string to title case with spaces
 * @param {string} str - String to format (e.g., "spot-treatment")
 * @returns {string} Formatted string (e.g., "Spot treatment")
 */
function formatLabel(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replaceAll('-', ' ');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ============================================
   Product Data Management
   ============================================ */

/**
 * Get products from localStorage
 * @returns {Array} Array of product objects
 */
function getProducts() {
  const data = localStorage.getItem('skinloop_products');
  return data ? JSON.parse(data) : [];
}

/**
 * Save products to localStorage
 * @param {Array} products - Array of product objects
 */
function saveProducts(products) {
  localStorage.setItem('skinloop_products', JSON.stringify(products));
}

/**
 * Seed initial products if localStorage is empty
 */
function seedIfEmpty() {
  if (getProducts().length === 0) {
    const seedProducts = [
      {
        id: crypto.randomUUID(),
        name: 'CeraVe Foaming Cleanser',
        brand: 'CeraVe',
        type: 'cleanser',
        actives: ['niacinamide', 'ceramides']
      },
      {
        id: crypto.randomUUID(),
        name: 'The Ordinary Niacinamide 10%',
        brand: 'The Ordinary',
        type: 'serum',
        actives: ['niacinamide', 'zinc']
      },
      {
        id: crypto.randomUUID(),
        name: "Paula's Choice 2% BHA Liquid",
        brand: "Paula's Choice",
        type: 'exfoliant',
        actives: ['salicylic-acid']
      },
      {
        id: crypto.randomUUID(),
        name: 'CeraVe PM Facial Moisturizing Lotion',
        brand: 'CeraVe',
        type: 'moisturizer',
        actives: ['niacinamide', 'ceramides']
      },
      {
        id: crypto.randomUUID(),
        name: 'La Roche-Posay Anthelios SPF 50',
        brand: 'La Roche-Posay',
        type: 'spf',
        actives: ['avobenzone', 'mexoryl-sx']
      }
    ];
    saveProducts(seedProducts);
  }
}

/* ============================================
   Product Strength & Timing Logic
   ============================================ */

/**
 * Get product strength level based on actives and type
 * @param {Object} product - Product object
 * @returns {string} "gentle" | "medium" | "strong"
 */
function getProductStrength(product) {
  const strongActives = ['retinoid', 'benzoyl-peroxide'];
  const mediumActives = ['salicylic-acid'];
  
  if (product.actives.some(active => strongActives.includes(active))) {
    return 'strong';
  }
  if (product.actives.some(active => mediumActives.includes(active)) || product.type === 'exfoliant') {
    return 'medium';
  }
  return 'gentle';
}

/**
 * Get usage timing for a product
 * @param {Object} product - Product object
 * @returns {string} "AM" | "PM" | "AM/PM" | "2-3x per week"
 */
function getUsageTiming(product) {
  if (product.type === 'spf') return 'AM';
  if (product.type === 'exfoliant' || product.actives.includes('retinoid')) return 'PM';
  if (product.type === 'cleanser' || product.type === 'moisturizer' || product.type === 'serum') return 'AM/PM';
  return 'AM/PM';
}

/**
 * Get active ingredient descriptions
 * @param {string} active - Active ingredient key
 * @returns {string} Description text
 */
function getActiveDescription(active) {
  const descriptions = {
    'salicylic-acid': 'Helps with acne and clogged pores',
    'niacinamide': 'Helps with redness and barrier support',
    'benzoyl-peroxide': 'Helps target acne-causing bacteria',
    'retinoid': 'Helps with breakouts and texture',
    'ceramides': 'Help support the skin barrier',
    'zinc': 'Helps calm inflammation',
    'avobenzone': 'Helps protect skin from UV damage',
    'mexoryl-sx': 'Helps protect skin from UV damage',
    'other': 'Additional beneficial ingredient'
  };
  return descriptions[active] || 'Beneficial ingredient';
}

/**
 * Get usage instruction for a product
 * @param {Object} product - Product object
 * @returns {string} Usage instruction
 */
function getUsageInstruction(product) {
  if (product.type === 'spf') {
    return 'Apply as the last step in your morning routine.';
  }
  if (product.type === 'exfoliant' || product.actives.includes('retinoid')) {
    return 'Use after cleansing, before moisturizer.';
  }
  if (product.type === 'cleanser') {
    return 'Use morning and night.';
  }
  if (product.type === 'moisturizer') {
    return 'Use after treatments, before SPF in the morning.';
  }
  if (product.type === 'serum') {
    return 'Apply after cleansing, before moisturizer.';
  }
  return 'Apply as directed.';
}

/* ============================================
   Product Rendering
   ============================================ */

/**
 * Create a product card element
 * @param {Object} product - Product object
 * @returns {HTMLElement} Product card element
 */
function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.productId = product.id;
  
  const typeLabel = formatLabel(product.type);
  const activesText = product.actives.length > 0 
    ? product.actives.map(a => a.replaceAll('-', ' ')).join(', ')
    : 'No actives listed';
  
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
  
  card.addEventListener('click', () => {
    renderProductDetail(product.id);
  });
  
  return card;
}

/**
 * Render products list with optional filter
 * @param {string} filter - Filter by type ("all" or specific type)
 */
function renderProducts(filter = 'all') {
  const container = DOM.productsContainer;
  const products = getProducts();
  
  let filtered = products;
  if (filter !== 'all') {
    filtered = products.filter(p => p.type === filter);
  }
  
  container.innerHTML = '';
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No products here yet.</div>';
    return;
  }
  
  filtered.forEach(product => {
    container.appendChild(createProductCard(product));
  });
}

/**
 * Get a product by its ID
 * @param {string} id - Product ID
 * @returns {Object|null} Product object or null if not found
 */
function getProductById(id) {
  return getProducts().find(p => p.id === id) || null;
}

/**
 * Build the HTML for product detail view
 * @param {Object} product - Product object
 * @returns {string} HTML string for the detail view
 */
function buildDetailHTML(product) {
  const strength = getProductStrength(product);
  const timing = getUsageTiming(product);
  const instruction = getUsageInstruction(product);
  const typeLabel = formatLabel(product.type);
  
  const strengthBadgeClass = strength === 'gentle' ? 'badge-gentle' : strength === 'medium' ? 'badge-medium' : 'badge-strong';
  const strengthLabel = formatLabel(strength);
  
  // Create main container
  const container = document.createElement('div');
  container.className = 'flex flex-col gap-5 px-5 py-6';
  
  // Back button
  const backBtn = document.createElement('button');
  backBtn.className = 'btn btn-ghost self-start -ml-3';
  backBtn.id = 'back-to-products';
  backBtn.textContent = '‹ Back to my products';
  container.appendChild(backBtn);
  
  // Header section
  const header = document.createElement('div');
  const title = document.createElement('h2');
  title.className = 'text-2xl font-semibold text-gray-900 dark:text-gray-50';
  title.textContent = product.name;
  const subtitle = document.createElement('p');
  subtitle.className = 'text-sm text-gray-600 dark:text-gray-400 mt-1';
  subtitle.textContent = `${product.brand} · ${typeLabel}`;
  header.appendChild(title);
  header.appendChild(subtitle);
  container.appendChild(header);
  
  // "What's in it" section
  const activesCard = document.createElement('div');
  activesCard.className = 'section-card';
  const activesTitle = document.createElement('h3');
  activesTitle.className = 'text-base font-semibold text-gray-900 dark:text-gray-50 mb-3 flex items-center gap-2';
  activesTitle.innerHTML = 'What\'s in it <span class="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-xs">i</span>';
  activesCard.appendChild(activesTitle);
  
  const activesContent = document.createElement('div');
  activesContent.className = 'flex flex-col gap-2';
  
  if (product.actives.length === 0) {
    const noActives = document.createElement('p');
    noActives.className = 'text-sm text-gray-500 dark:text-gray-400';
    noActives.textContent = 'No actives listed';
    activesContent.appendChild(noActives);
  } else {
    product.actives.forEach(active => {
      const activeDiv = document.createElement('div');
      activeDiv.className = 'text-sm';
      const activeName = document.createElement('span');
      activeName.className = 'font-medium text-gray-900 dark:text-gray-50';
      activeName.textContent = active.replaceAll('-', ' ');
      const activeDesc = document.createElement('span');
      activeDesc.className = 'text-gray-600 dark:text-gray-400';
      activeDesc.textContent = ` — ${getActiveDescription(active)}`;
      activeDiv.appendChild(activeName);
      activeDiv.appendChild(activeDesc);
      activesContent.appendChild(activeDiv);
    });
  }
  
  activesCard.appendChild(activesContent);
  container.appendChild(activesCard);
  
  // "How to use it" section
  const usageCard = document.createElement('div');
  usageCard.className = 'section-card';
  const usageTitle = document.createElement('h3');
  usageTitle.className = 'text-base font-semibold text-gray-900 dark:text-gray-50 mb-3';
  usageTitle.textContent = 'How to use it';
  usageCard.appendChild(usageTitle);
  
  const timingBadgeContainer = document.createElement('div');
  timingBadgeContainer.className = 'flex items-center gap-2 mb-2';
  const timingBadge = document.createElement('span');
  timingBadge.className = 'badge badge-gentle';
  timingBadge.textContent = timing;
  timingBadgeContainer.appendChild(timingBadge);
  usageCard.appendChild(timingBadgeContainer);
  
  const usageInstruction = document.createElement('p');
  usageInstruction.className = 'text-sm text-gray-600 dark:text-gray-400';
  usageInstruction.textContent = instruction;
  usageCard.appendChild(usageInstruction);
  container.appendChild(usageCard);
  
  // "Strength & safety" section
  const strengthCard = document.createElement('div');
  strengthCard.className = 'section-card';
  const strengthTitle = document.createElement('h3');
  strengthTitle.className = 'text-base font-semibold text-gray-900 dark:text-gray-50 mb-3';
  strengthTitle.textContent = 'Strength & safety';
  strengthCard.appendChild(strengthTitle);
  
  const strengthBadgeContainer = document.createElement('div');
  strengthBadgeContainer.className = 'flex items-center gap-2 mb-2';
  const strengthBadge = document.createElement('span');
  strengthBadge.className = `badge ${strengthBadgeClass}`;
  strengthBadge.textContent = strengthLabel;
  strengthBadgeContainer.appendChild(strengthBadge);
  strengthCard.appendChild(strengthBadgeContainer);
  
  if (strength === 'medium' || strength === 'strong') {
    const warningText = document.createElement('p');
    warningText.className = 'text-sm text-gray-600 dark:text-gray-400 mt-2';
    warningText.textContent = 'Avoid combining with other strong actives in the same routine.';
    strengthCard.appendChild(warningText);
  }
  
  container.appendChild(strengthCard);
  
  // "In your routine" section
  const routineCard = document.createElement('div');
  routineCard.className = 'section-card';
  const routineTitle = document.createElement('h3');
  routineTitle.className = 'text-base font-semibold text-gray-900 dark:text-gray-50 mb-3';
  routineTitle.textContent = 'In your routine';
  routineCard.appendChild(routineTitle);
  
  const routineFlow = document.createElement('div');
  routineFlow.className = 'routine-flow';
  
  const cleanserStep = document.createElement('div');
  cleanserStep.className = 'routine-step';
  cleanserStep.textContent = 'Cleanser';
  routineFlow.appendChild(cleanserStep);
  
  const arrow1 = document.createElement('span');
  arrow1.className = 'text-gray-400';
  arrow1.textContent = '→';
  routineFlow.appendChild(arrow1);
  
  const currentStep = document.createElement('div');
  currentStep.className = 'routine-step is-current';
  currentStep.textContent = typeLabel;
  routineFlow.appendChild(currentStep);
  
  const arrow2 = document.createElement('span');
  arrow2.className = 'text-gray-400';
  arrow2.textContent = '→';
  routineFlow.appendChild(arrow2);
  
  const moisturizerStep = document.createElement('div');
  moisturizerStep.className = 'routine-step';
  moisturizerStep.textContent = 'Moisturizer';
  routineFlow.appendChild(moisturizerStep);
  
  const arrow3 = document.createElement('span');
  arrow3.className = 'text-gray-400';
  arrow3.textContent = '→';
  routineFlow.appendChild(arrow3);
  
  const spfStep = document.createElement('div');
  spfStep.className = 'routine-step';
  spfStep.textContent = 'SPF';
  routineFlow.appendChild(spfStep);
  
  routineCard.appendChild(routineFlow);
  container.appendChild(routineCard);
  
  // Bottom back button
  const bottomBackBtn = document.createElement('button');
  bottomBackBtn.className = 'btn btn-primary w-full mt-2';
  bottomBackBtn.id = 'back-to-products-bottom';
  bottomBackBtn.textContent = 'Back to my products';
  container.appendChild(bottomBackBtn);
  
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
  
  listView.classList.add('hidden');
  detailView.classList.remove('hidden');
  
  detailView.innerHTML = '';
  detailView.append(buildDetailHTML(product));
  
  document.getElementById('back-to-products').addEventListener('click', showProductsList);
  document.getElementById('back-to-products-bottom').addEventListener('click', showProductsList);
}

/**
 * Show products list view (hide detail view)
 */
function showProductsList() {
  const listView = DOM.productsListView;
  const detailView = DOM.productDetailView;
  
  listView.classList.remove('hidden');
  detailView.classList.add('hidden');
}

/* ============================================
   Routine Rendering
   ============================================ */

/**
 * Render routine for AM or PM
 * @param {string} timeOfDay - "AM" or "PM"
 */
function renderRoutine(timeOfDay = 'AM') {
  const container = DOM.routineContainer;
  const products = getProducts();
  const warningBanner = DOM.routineWarning;
  
  // Define routine order
  const routineOrder = timeOfDay === 'AM'
    ? ['cleanser', 'serum', 'moisturizer', 'spf']
    : ['cleanser', 'serum', 'exfoliant', 'moisturizer'];
  
  const routine = routineOrder.map((type, index) => {
    const product = products.find(p => p.type === type && (
      getUsageTiming(p) === timeOfDay || getUsageTiming(p) === 'AM/PM'
    ));
    
    return { step: index + 1, type, product };
  });
  
  // Check for warning (2+ strong products in PM)
  if (timeOfDay === 'PM') {
    const strongCount = routine.filter(r => r.product && getProductStrength(r.product) === 'strong').length;
    if (strongCount >= 2) {
      warningBanner.hidden = false;
    } else {
      warningBanner.hidden = true;
    }
  } else {
    warningBanner.hidden = true;
  }
  
  container.innerHTML = '';
  
  routine.forEach(({ step, type, product }) => {
    const typeLabel = formatLabel(type);
    
    const stepCard = document.createElement('div');
    stepCard.className = 'product-card';
    
    if (product) {
      stepCard.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">
            ${step}
          </div>
          <div class="flex-1">
            <p class="text-xs text-gray-500 dark:text-gray-400">${typeLabel}</p>
            <p class="font-semibold text-gray-900 dark:text-gray-50">${product.name}</p>
          </div>
          <span class="text-gray-400 dark:text-gray-500 text-xl">›</span>
        </div>
      `;
      
      stepCard.addEventListener('click', () => {
        showScreen('products');
        setTimeout(() => renderProductDetail(product.id), 100);
      });
    } else {
      stepCard.className = 'bg-white dark:bg-gray-800 rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-700';
      stepCard.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-700 dark:text-gray-300">
            ${step}
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-500 dark:text-gray-400">No ${typeLabel.toLowerCase()} added yet.</p>
          </div>
        </div>
      `;
    }
    
    container.appendChild(stepCard);
  });
}

/* ============================================
   Form Handling
   ============================================ */

/**
 * Reset the add product form
 */
function resetAddProductForm() {
  document.getElementById('product-name').value = '';
  document.getElementById('product-brand').value = '';
  document.querySelectorAll('#type-chips .chip').forEach(chip => chip.classList.remove('is-selected'));
  document.querySelectorAll('#actives-chips .chip').forEach(chip => chip.classList.remove('is-selected'));
  document.getElementById('form-error').hidden = true;
}

/**
 * Handle add product form submission
 */
function handleAddProductSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('product-name').value.trim();
  const brand = document.getElementById('product-brand').value.trim();
  const selectedType = document.querySelector('#type-chips .chip.is-selected');
  const selectedActives = Array.from(document.querySelectorAll('#actives-chips .chip.is-selected'))
    .map(chip => chip.dataset.active);
  
  const errorEl = document.getElementById('form-error');
  
  if (!name || !brand || !selectedType) {
    errorEl.textContent = 'Please fill in product name, brand, and select a type.';
    errorEl.hidden = false;
    return;
  }
  
  const product = {
    id: crypto.randomUUID(),
    name,
    brand,
    type: selectedType.dataset.type,
    actives: selectedActives
  };
  
  const products = getProducts();
  products.push(product);
  saveProducts(products);
  
  resetAddProductForm();
  showScreen('products');
  renderProducts();
}

/* ============================================
   Scanner Integration
   ============================================ */

/**
 * Prefill the add product form with scanned data
 * @param {Object} productData - Product data from barcode lookup
 */
function prefillForm(productData) {
  // Set name and brand inputs
  document.getElementById('product-name').value = productData.name || '';
  document.getElementById('product-brand').value = productData.brand || '';
  
  // Select the product type chip
  const typeChips = document.querySelectorAll('#type-chips .chip');
  typeChips.forEach(chip => chip.classList.remove('is-selected'));
  const typeChip = document.querySelector(`#type-chips .chip[data-type="${productData.type}"]`);
  if (typeChip) {
    typeChip.classList.add('is-selected');
  }
  
  // Select the actives chips
  const activesChips = document.querySelectorAll('#actives-chips .chip');
  activesChips.forEach(chip => chip.classList.remove('is-selected'));
  if (productData.actives && productData.actives.length > 0) {
    productData.actives.forEach(active => {
      const activeChip = document.querySelector(`#actives-chips .chip[data-active="${active}"]`);
      if (activeChip) {
        activeChip.classList.add('is-selected');
      }
    });
  }
}

/**
 * Initialize the scan screen and wire up scanner
 */
function initScanScreen() {
  const cameraBtn = document.getElementById('use-camera-btn');
  
  if (cameraBtn) {
    // Remove any existing listeners by cloning
    const newBtn = cameraBtn.cloneNode(true);
    cameraBtn.parentNode.replaceChild(newBtn, cameraBtn);
    
    newBtn.addEventListener('click', () => {
      const spinner = DOM.scannerSpinner;
      const errorEl = DOM.scannerError;
      const resultEl = DOM.scannerResult;
      
      spinner.hidden = true;
      errorEl.hidden = true;
      resultEl.hidden = true;
      
      startScanner('scanner-container', handleScanSuccess, handleScanError);
    });
  }
}

/**
 * Handle successful barcode scan
 * @param {string} barcode - Scanned barcode string
 */
async function handleScanSuccess(barcode) {
  const spinner = DOM.scannerSpinner;
  const errorEl = DOM.scannerError;
  const resultEl = DOM.scannerResult;
  
  spinner.hidden = false;
  errorEl.hidden = true;
  resultEl.hidden = true;
  
  const result = await lookupBarcode(barcode);
  
  if (result) {
    prefillForm(result);
    showScreen('add');
  } else {
    spinner.hidden = true;
    resultEl.innerHTML = `
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Product not found — add it manually</p>
      <button class="btn btn-secondary" data-action="go-add">Add manually</button>
    `;
    resultEl.hidden = false;
    
    // Wire up the new button
    resultEl.querySelector('[data-action="go-add"]').addEventListener('click', () => {
      showScreen('add');
    });
  }
}

/**
 * Handle scanner error
 * @param {string} message - Error message
 */
function handleScanError(message) {
  const spinner = DOM.scannerSpinner;
  const errorEl = DOM.scannerError;
  
  spinner.hidden = true;
  errorEl.textContent = message;
  errorEl.hidden = false;
}