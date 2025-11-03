/**
 * Validate shop domain format
 * @param {string} shop - Shop domain to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function isValidShopDomain(shop) {
  if (!shop || typeof shop !== 'string') {
    return false;
  }

  // Shop domain must match pattern: {shop-name}.myshopify.com
  // - Must start with alphanumeric character
  // - Can contain alphanumeric characters and hyphens
  // - Must end with .myshopify.com
  const shopDomainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;

  return shopDomainRegex.test(shop);
}

/**
 * Validate shop domain and throw error if invalid
 * @param {string} shop - Shop domain to validate
 * @throws {Error} - If shop domain is invalid
 */
function validateShopDomain(shop) {
  if (!isValidShopDomain(shop)) {
    throw new Error('Invalid shop domain format');
  }
}

module.exports = {
  isValidShopDomain,
  validateShopDomain
};
