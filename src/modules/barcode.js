/* ============================================
   Barcode Scanner UI Module
   Handles scanner UI, form prefilling, and barcode lookup flows
   ============================================ */

import {
  startScanner,
  stopScanner,
  lookupBarcode,
  scanFromFile,
} from "./scanner.js";
import { formatLabel } from "../helpers/format.js";

/**
 * Prefill the add product form with scanned data
 * @param {Object} productData - Product data from barcode lookup
 */
export function prefillForm(productData) {
  // Set name and brand inputs
  document.getElementById("product-name").value = productData.name || "";
  document.getElementById("product-brand").value = productData.brand || "";

  // Select the product type chip
  const typeChips = document.querySelectorAll("#type-chips .chip");
  typeChips.forEach((chip) => chip.classList.remove("is-selected"));
  const typeChip = document.querySelector(
    `#type-chips .chip[data-type="${productData.type}"]`,
  );
  if (typeChip) {
    typeChip.classList.add("is-selected");
  }

  // Select the actives chips
  const activesChips = document.querySelectorAll("#actives-chips .chip");
  activesChips.forEach((chip) => chip.classList.remove("is-selected"));
  if (productData.actives && productData.actives.length > 0) {
    productData.actives.forEach((active) => {
      const activeChip = document.querySelector(
        `#actives-chips .chip[data-active="${active}"]`,
      );
      if (activeChip) {
        activeChip.classList.add("is-selected");
      }
    });
  }

  // Display safety score (if available)
  const safetyScoreSection = document.getElementById("scanned-safety-score");
  const safetyScoreBadge = document.getElementById("safety-score-badge");
  if (
    productData.safetyScore !== undefined &&
    productData.safetyScore !== null
  ) {
    const score = productData.safetyScore;
    safetyScoreBadge.textContent = `${score}/10`;
    // Color code: 1-4 = strong (red), 5-7 = medium (yellow), 8-10 = gentle (green)
    if (score <= 4) {
      safetyScoreBadge.className = "badge badge-strong";
    } else if (score <= 7) {
      safetyScoreBadge.className = "badge badge-medium";
    } else {
      safetyScoreBadge.className = "badge badge-gentle";
    }
    safetyScoreSection.hidden = false;
  } else {
    safetyScoreBadge.textContent = "N/A";
    safetyScoreBadge.className = "badge";
    safetyScoreSection.hidden = productData.safetyScore === undefined;
  }

  // Display skin compatibility (if available)
  const compatibilitySection = document.getElementById("scanned-compatibility");
  const compatibilityTags = document.getElementById("compatibility-tags");
  if (
    productData.skinCompatibility &&
    productData.skinCompatibility.length > 0
  ) {
    compatibilityTags.innerHTML = "";
    productData.skinCompatibility.forEach((skinType) => {
      const tag = document.createElement("span");
      tag.className = "badge badge-gentle";
      tag.textContent = formatLabel(skinType);
      compatibilityTags.appendChild(tag);
    });
    compatibilitySection.hidden = false;
  } else {
    compatibilitySection.hidden = true;
  }

  // Display allergen warnings (if any)
  const allergensSection = document.getElementById("scanned-allergens");
  const allergenList = document.getElementById("allergen-list");
  if (productData.allergenWarnings && productData.allergenWarnings.length > 0) {
    allergenList.innerHTML = "";
    productData.allergenWarnings.forEach((warning) => {
      const li = document.createElement("li");
      li.textContent = warning;
      allergenList.appendChild(li);
    });
    allergensSection.hidden = false;
  } else {
    allergensSection.hidden = true;
  }
}

/**
 * Handle successful barcode scan
 * @param {string} barcode - Scanned barcode string
 * @param {Object} DOM - DOM cache object
 * @param {Function} showScreen - Function to show a screen
 */
export async function handleScanSuccess(barcode, DOM, showScreen) {
  const spinner = DOM.scannerSpinner;
  const errorEl = DOM.scannerError;
  const resultEl = DOM.scannerResult;

  spinner.hidden = false;
  errorEl.hidden = true;
  resultEl.hidden = true;

  const result = await lookupBarcode(barcode);

  if (result) {
    spinner.hidden = true;
    prefillForm(result);
    showScreen("add");
    return result;
  } else {
    spinner.hidden = true;

    // Show descriptive error with the barcode that wasn't found
    errorEl.textContent = `We couldn't find this barcode (${barcode}) in our database or online. This is common for newer or regional products. Please enter your product details manually below.`;
    errorEl.hidden = false;

    // Scroll the manual entry button into view
    const manualEntryBtn = document.querySelector('[data-action="go-add"]');
    if (manualEntryBtn) {
      manualEntryBtn.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    return null;
  }
}

/**
 * Handle scanner error
 * @param {string} message - Error message
 * @param {Object} DOM - DOM cache object
 */
export function handleScanError(message, DOM) {
  const spinner = DOM.scannerSpinner;
  const errorEl = DOM.scannerError;

  spinner.hidden = true;
  errorEl.textContent = message;
  errorEl.hidden = false;
}

/**
 * Initialize the scan screen and wire up scanner
 * @param {Object} DOM - DOM cache object
 * @param {Function} showScreen - Function to show a screen
 */
export function initScanScreen(DOM, showScreen) {
  const cameraBtn = document.getElementById("use-camera-btn");

  if (cameraBtn) {
    // Remove any existing listeners by cloning
    const newBtn = cameraBtn.cloneNode(true);
    cameraBtn.parentNode.replaceChild(newBtn, cameraBtn);

    newBtn.addEventListener("click", () => {
      const spinner = DOM.scannerSpinner;
      const errorEl = DOM.scannerError;
      const resultEl = DOM.scannerResult;

      spinner.hidden = true;
      errorEl.hidden = true;
      resultEl.hidden = true;

      startScanner(
        "scanner-container",
        (barcode) => handleScanSuccess(barcode, DOM, showScreen),
        (message) => handleScanError(message, DOM),
      );
    });
  }

  // Wire up file upload barcode scanner
  const fileInput = document.getElementById("barcode-upload");
  if (fileInput) {
    // Remove any existing listeners by cloning
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);

    newFileInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const spinner = DOM.scannerSpinner;
      const errorEl = DOM.scannerError;
      const resultEl = DOM.scannerResult;

      spinner.hidden = false;
      errorEl.hidden = true;
      resultEl.hidden = true;

      try {
        const barcode = await scanFromFile(file);
        await handleScanSuccess(barcode, DOM, showScreen);
      } catch (err) {
        spinner.hidden = true;
        errorEl.textContent =
          "Couldn't read that barcode. Try a clearer photo in good lighting.";
        errorEl.hidden = false;
      }

      // Reset file input so same file can be resubmitted
      newFileInput.value = "";
    });
  }

  // Wire up manual barcode entry
  const manualBarcodeInput = document.getElementById("manual-barcode");
  const manualBarcodeBtn = document.getElementById("manual-barcode-btn");

  if (manualBarcodeBtn) {
    // Remove any existing listeners by cloning
    const newManualBtn = manualBarcodeBtn.cloneNode(true);
    manualBarcodeBtn.parentNode.replaceChild(newManualBtn, manualBarcodeBtn);

    const handleManualBarcodeLookup = async () => {
      const barcode = manualBarcodeInput.value.trim();
      const spinner = DOM.scannerSpinner;
      const errorEl = DOM.scannerError;
      const resultEl = DOM.scannerResult;

      if (!barcode) {
        errorEl.textContent = "Please enter a barcode number.";
        errorEl.hidden = false;
        return;
      }

      errorEl.hidden = true;
      spinner.hidden = false;
      resultEl.hidden = true;

      const result = await handleScanSuccess(barcode, DOM, showScreen);

      // Only clear input if product was found
      if (result) {
        manualBarcodeInput.value = "";
      }
    };

    newManualBtn.addEventListener("click", handleManualBarcodeLookup);

    if (manualBarcodeInput) {
      manualBarcodeInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleManualBarcodeLookup();
        }
      });
    }
  }
}
