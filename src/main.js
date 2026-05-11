/* ============================================
   SkinLoop — Main JavaScript
   Navigation and app shell logic
   ============================================ */

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
  // Wire up bottom navigation buttons
  const navButtons = document.querySelectorAll('[data-nav]');
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const screenName = button.dataset.nav;
      showScreen(screenName);
    });
  });

  // Wire up action buttons
  const scanButton = document.querySelector('[data-action="go-scan"]');
  if (scanButton) {
    scanButton.addEventListener('click', () => {
      showScreen('scan');
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

  console.log('SkinLoop initialized ✓');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}