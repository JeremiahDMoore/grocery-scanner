// API Key for UPCitemdb - Replace with your own key for higher limits
// The 'demo_key' is very limited or might not work.
// Sign up at https://www.upcitemdb.com/api/register
const UPCITEMDB_API_KEY = 'demo_key'; // IMPORTANT: Replace with your actual key

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
    // Note: UPCitemdb's 'lookup' endpoint might require a 'user_key' and 'key_type' in headers
    // or as query parameters depending on their API version and your account type.
    // The example in the prompt used headers, but their public API docs sometimes show query params.
    // Let's try with query params first as it's simpler for GET.
    // If using headers:
    // const headers = { 'user_key': UPCITEMDB_API_KEY, 'key_type': '3scale' }; // or your specific key_type
    // const response = await fetch(`https://api.upcitemdb.com/prod/v1/lookup?upc=${barcode}`, { headers });

    const response = await fetch(`https://api.upcitemdb.com/prod/v1/lookup?upc=${barcode}&user_key=${UPCITEMDB_API_KEY}&key_type=3scale`);


    if (!response.ok) {
      console.error(`UPCitemdb API error: ${response.status}`);
      // Try to parse error message from API if available
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
      return data; // Return the whole data object as it contains 'items' array
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
