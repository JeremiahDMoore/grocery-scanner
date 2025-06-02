// index.js
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 4000;

// Initialize Cache
// Access Token TTL: 30 minutes (1800 seconds)
// Location ID TTL: 24 hours (86400 seconds)
const tokenCache = new NodeCache({ stdTTL: 1740 }); // Slightly less than 30 mins for safety
const locationCache = new NodeCache({ stdTTL: 86400 });

const KROGER_CLIENT_ID = process.env.KROGER_CLIENT_ID;
const KROGER_CLIENT_SECRET = process.env.KROGER_CLIENT_SECRET;
const KROGER_DEFAULT_SCOPE = process.env.KROGER_DEFAULT_SCOPE || 'product.compact';

const KROGER_API_BASE_URL = 'https://api.kroger.com/v1';
const USER_AGENT = 'priceGetter/1.0';

// 1a. Request & cache the access-token
async function getKrogerAccessToken() {
  const cachedToken = tokenCache.get('krogerAccessToken');
  if (cachedToken) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${KROGER_CLIENT_ID}:${KROGER_CLIENT_SECRET}`).toString('base64');

  try {
    const response = await axios.post(
      `${KROGER_API_BASE_URL}/connect/oauth2/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: KROGER_DEFAULT_SCOPE,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'User-Agent': USER_AGENT,
        },
      }
    );

    const accessToken = response.data.access_token;
    const expiresIn = response.data.expires_in || 1800; // Default to 30 mins
    tokenCache.set('krogerAccessToken', accessToken, expiresIn - 60); // Cache for slightly less than actual expiry

    return accessToken;
  } catch (error) {
    console.error('Error fetching Kroger access token:', error.response ? error.response.data : error.message);
    throw new Error('Failed to obtain Kroger access token.');
  }
}

// 1b. Look up locationId from a user ZIP (with a 24-hour cache)
async function getKrogerLocationId(zipCode) {
  const cacheKey = `location-${zipCode}`;
  const cachedLocationId = locationCache.get(cacheKey);
  if (cachedLocationId) {
    return cachedLocationId;
  }

  try {
    const accessToken = await getKrogerAccessToken();
    const response = await axios.get(`${KROGER_API_BASE_URL}/locations`, {
      params: {
        'filter.zipCode.near': zipCode,
        'filter.limit': 1,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const locationId = response.data.data[0].locationId;
      locationCache.set(cacheKey, locationId);
      return locationId;
    } else {
      return null; // No location found
    }
  } catch (error) {
    console.error(`Error fetching Kroger location ID for ZIP ${zipCode}:`, error.response ? error.response.data : error.message);
    // Propagate error to be handled as 502 by the route
    const serviceError = new Error(`Failed to fetch location data from Kroger for ZIP ${zipCode}.`);
    serviceError.cause = error; // Store original error
    throw serviceError;
  }
}

// 1c. Query Products API by UPC + locationId
async function getKrogerProductPrice(upc, locationId) {
  try {
    const accessToken = await getKrogerAccessToken();
    // Attempting to use 'filter.term' instead of 'filter.upc' based on API error PRODUCT-2016
    const response = await axios.get(`${KROGER_API_BASE_URL}/products`, {
      params: {
        'filter.term': upc, // Changed from 'filter.upc'
        'filter.locationId': locationId,
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
      },
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const product = response.data.data[0];
      if (product.items && product.items.length > 0) {
        const item = product.items[0];
        return {
          upc: product.upc,
          brand: product.brand || 'N/A', // Kroger API sometimes omits brand
          description: product.description,
          price: {
            regular: item.price ? item.price.regular : null,
            promo: item.price ? item.price.promo : 0, // Promo price can be 0
          },
        };
      }
    }
    return null; // Product or price not found
  } catch (error) {
    console.error(`Error fetching Kroger product price for UPC ${upc} at location ${locationId}:`, error.response ? error.response.data : error.message);
    // Propagate error to be handled as 502 by the route
    const serviceError = new Error(`Failed to fetch product data from Kroger for UPC ${upc}.`);
    serviceError.cause = error; // Store original error
    throw serviceError;
  }
}

// 1d. Expose GET /api/price?upc=...&zip=...
app.get('/api/price', async (req, res) => {
  const { upc, zip } = req.query;

  if (!upc || !zip) {
    return res.status(400).json({ error: 'Missing required query parameters: upc and zip.' });
  }

  try {
    const locationId = await getKrogerLocationId(zip);
    if (!locationId) {
      return res.status(404).json({ error: `No Kroger store found for ZIP code ${zip}.` });
    }

    const productData = await getKrogerProductPrice(upc, locationId);
    if (!productData) {
      return res.status(404).json({ error: `Product with UPC ${upc} not found at the determined Kroger store (Location ID: ${locationId}).` });
    }

    return res.json(productData);
  } catch (error) {
    // 1e. Handle errors & Kroger rate limits gracefully
    // Fail fast on network errors; return 502 to the app with a helpful JSON error payload.
    console.error(`Error in /api/price for UPC ${upc}, ZIP ${zip}:`, error.message);
    const details = error.cause && error.cause.response ? error.cause.response.data : error.message;

    // If the error is due to Kroger API (token, location, product), it's an upstream issue.
    // Our service should return 502 Bad Gateway.
    // This includes Kroger's rate limits (e.g., 429) which are treated as an inability of the upstream service to respond.
    return res.status(502).json({
      error: 'Failed to retrieve data from Kroger.',
      details: typeof details === 'string' ? details : JSON.stringify(details), // Ensure details are serializable
    });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`priceGetter service listening on port ${port}`);
  });
}

module.exports = app; // Export for testing
