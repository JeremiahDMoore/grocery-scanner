// API Key for UPCitemdb - Replace with your own key for higher limits
// The 'demo_key' is very limited or might not work.
// Sign up at https://www.upcitemdb.com/api/register
import { Platform } from 'react-native';

export const UPCITEMDB_API_KEY = 'demo_key'; // IMPORTANT: Replace with your actual key

// The base URL for the deployed priceGetter service on Render.com
const KROGER_SERVICE_BASE_URL = 'https://grocery-scanner-server.onrender.com';

/**
 * Looks up product information from OpenFoodFacts API.
 * @param {string} barcode - The barcode to look up.
 * @returns {Promise<object|null>} Product data or null if not found/error.
 */
export async function lookupOpenFoodFacts(barcode) {
  try {
    const response = await fetch(`https://world.openfoodfacts.net/api/v2/product/${barcode}?fields=product_name,brands,nutriments`);
    if (!response.ok) {
      console.error(`OpenFoodFacts API error: ${response.status}`);
      return null;
    }
    const data = await response.json();
    if (data.status === 0) { // status 0 means product not found
        console.log(`Product ${barcode} not found on OpenFoodFacts.`);
        return null;
    }
    return data.product || null;
  } catch (error) {
    console.error('Error fetching from OpenFoodFacts:', error);
    return null;
  }
}

/**
 * Looks up product information from UPCitemdb API.
 * @param {string} barcode - The barcode to look up.
 * @returns {Promise<object|null>} Item data or null if not found/error.
 */
export async function lookupUPCitemdb(barcode) {
  if (UPCITEMDB_API_KEY === 'demo_key') {
    console.warn("Using demo_key for UPCitemdb. This key is very limited or may not work. Please replace it with your own API key in app/api/barcodeApi.js.");
    // Optionally, you could prevent the API call entirely if it's just a demo key
    // return null; 
  }
  try {
    const headers = { 
      'user_key': UPCITEMDB_API_KEY, 
      'key_type': '3scale'
    };
    const response = await fetch(`https://api.upcitemdb.com/prod/v1/lookup?upc=${barcode}`, { headers });

    if (!response.ok) {
      console.error(`UPCitemdb API error: ${response.status}`);
      try {
        const errorData = await response.json();
        console.error('UPCitemdb API error details:', errorData);
      } catch (e) {
        // ignore if error response is not json
      }
      return null;
    }
    const data = await response.json();
    if (data.code === "OK" && data.items && data.items.length > 0) {
      return data;
    } else if (data.code !== "OK") {
        console.log(`UPCitemdb: Product ${barcode} lookup failed. Code: ${data.code}, Message: ${data.message}`);
        return null;
    } else {
        console.log(`Product ${barcode} not found on UPCitemdb or no items in response.`);
        return null;
    }
  } catch (error) {
    console.error('Error fetching from UPCitemdb:', error);
    return null;
  }
}

/**
 * Looks up product price from the deployed priceGetter service (Kroger API).
 * @param {string} upc - The barcode to look up.
 * @param {string} zipCode - The user's ZIP code.
 * @returns {Promise<object|null>} Product data or null if not found/error.
 */
export async function lookupKrogerPrice(upc, zipCode) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

  try {
    const response = await fetch(`${KROGER_SERVICE_BASE_URL}/api/price?upc=${upc}&zip=${zipCode}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId); // Clear the timeout if the fetch completes in time

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`Kroger priceGetter service error: ${response.status}`, errorData);
      throw new Error(errorData.error || `Failed to fetch price from Kroger service. Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data; 
  } catch (error) {
    clearTimeout(timeoutId); // Ensure timeout is cleared even if an error occurs
    if (error.name === 'AbortError') {
      console.error('Error fetching from Kroger priceGetter service: Request timed out.');
      throw new Error('Price check request timed out. Please try again.');
    }
    console.error('Error fetching from Kroger priceGetter service:', error.message);
    throw error;
  }
}
