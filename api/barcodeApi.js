// API Key for UPCitemdb - Replace with your own key for higher limits
// The 'demo_key' is very limited or might not work.
// Sign up at https://www.upcitemdb.com/api/register
import { Platform } from 'react-native';

export const UPCITEMDB_API_KEY = 'demo_key'; // IMPORTANT: Replace with your actual key

// IMPORTANT: For physical device testing, replace 'YOUR_COMPUTER_IP_ADDRESS' 
// with your development machine's IP address on your local network.
// Your physical device and computer must be on the same Wi-Fi network.
// Example: const KROGER_SERVICE_DEV_IP = '192.168.1.100'; 
// For iOS simulator, 'localhost' usually works for the KROGER_SERVICE_DEV_IP.
// For Android emulator, '10.0.2.2' usually works for the KROGER_SERVICE_DEV_IP.
const KROGER_SERVICE_DEV_IP = '192.168.1.181'; // <--- USER NEEDS TO CHANGE THIS FOR PHYSICAL DEVICE

const KROGER_SERVICE_BASE_URL = `http://${KROGER_SERVICE_DEV_IP}:4000`;

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
 * Looks up product price from the local priceGetter service (Kroger API).
 * @param {string} upc - The barcode to look up.
 * @param {string} zipCode - The user's ZIP code.
 * @returns {Promise<object|null>} Product data or null if not found/error.
 */
export async function lookupKrogerPrice(upc, zipCode) {
  try {
    const response = await fetch(`${KROGER_SERVICE_BASE_URL}/api/price?upc=${upc}&zip=${zipCode}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`Kroger priceGetter service error: ${response.status}`, errorData);
      throw new Error(errorData.error || `Failed to fetch price from Kroger service. Status: ${response.status}`);
    }
    
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error('Error fetching from Kroger priceGetter service:', error.message);
    throw error;
  }
}
