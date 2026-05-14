/* ============================================
   Product Helpers
   Shared product utilities for strength, timing, and metadata
   ============================================ */

import { getProducts } from "./storage.js";

/**
 * Get product strength level based on actives and type
 * @param {Object} product - Product object
 * @returns {string} "gentle" | "medium" | "strong"
 */
export function getProductStrength(product) {
  const strongActives = ["retinoid", "benzoyl-peroxide"];
  const mediumActives = ["salicylic-acid"];

  if (product.actives.some((active) => strongActives.includes(active))) {
    return "strong";
  }
  if (
    product.actives.some((active) => mediumActives.includes(active)) ||
    product.type === "exfoliant"
  ) {
    return "medium";
  }
  return "gentle";
}

/**
 * Get usage timing for a product
 * @param {Object} product - Product object
 * @returns {string} "AM" | "PM" | "AM/PM"
 */
export function getUsageTiming(product) {
  if (product.type === "spf") return "AM";
  if (product.type === "exfoliant" || product.actives.includes("retinoid"))
    return "PM";
  if (
    product.type === "cleanser" ||
    product.type === "moisturizer" ||
    product.type === "serum"
  )
    return "AM/PM";
  return "AM/PM";
}

/**
 * Get active ingredient descriptions
 * @param {string} active - Active ingredient key
 * @returns {string} Description text
 */
export function getActiveDescription(active) {
  const descriptions = {
    "salicylic-acid": "Helps with acne and clogged pores",
    niacinamide: "Helps with redness and barrier support",
    "benzoyl-peroxide": "Helps target acne-causing bacteria",
    retinoid: "Helps with breakouts and texture",
    ceramides: "Help support the skin barrier",
    zinc: "Helps calm inflammation",
    avobenzone: "Helps protect skin from UV damage",
    "mexoryl-sx": "Helps protect skin from UV damage",
    other: "Additional beneficial ingredient",
  };
  return descriptions[active] || "Beneficial ingredient";
}

/**
 * Get usage instruction for a product
 * @param {Object} product - Product object
 * @returns {string} Usage instruction
 */
export function getUsageInstruction(product) {
  if (product.type === "spf") {
    return "Apply as the last step in your morning routine.";
  }
  if (product.type === "exfoliant" || product.actives.includes("retinoid")) {
    return "Use after cleansing, before moisturizer.";
  }
  if (product.type === "cleanser") {
    return "Use morning and night.";
  }
  if (product.type === "moisturizer") {
    return "Use after treatments, before SPF in the morning.";
  }
  if (product.type === "serum") {
    return "Apply after cleansing, before moisturizer.";
  }
  return "Apply as directed.";
}

/**
 * Get a product by its ID
 * @param {string} id - Product ID
 * @returns {Object|null} Product object or null if not found
 */
export function getProductById(id) {
  return getProducts().find((p) => p.id === id) || null;
}
