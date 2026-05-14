/* ============================================
   Format Helpers
   Text formatting, capitalization, and display utilities
   ============================================ */

/**
 * Format a hyphenated string to title case with spaces
 * @param {string} str - String to format (e.g., "spot-treatment")
 * @returns {string} Formatted string (e.g., "Spot treatment")
 */
export function formatLabel(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replaceAll("-", " ");
}
