import axios from "axios";

const MAX_RETRIES = 2;
const INITIAL_DELAY = 500;
const TIMEOUT = 15000; // 15 seconds

// Free public CORS proxy services (fallback when direct/local proxy fails)
const PUBLIC_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get proxy configuration from environment variables
 * Set PROXY_URL in .env to use a local proxy (e.g., http://127.0.0.1:7890)
 */
const getLocalProxyConfig = () => {
  const proxyUrl = process.env.PROXY_URL;
  
  if (!proxyUrl) {
    return null;
  }

  try {
    const url = new URL(proxyUrl);
    return {
      proxy: {
        host: url.hostname,
        port: parseInt(url.port) || 80,
        protocol: url.protocol.replace(':', ''),
        ...(url.username && url.password ? {
          auth: {
            username: url.username,
            password: url.password,
          }
        } : {}),
      }
    };
  } catch (error) {
    console.warn(`Invalid PROXY_URL format: ${proxyUrl}`);
    return null;
  }
};

/**
 * Try to fetch URL directly
 */
const fetchDirect = async (url) => {
  const response = await axios.get(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "identity",
    },
    timeout: TIMEOUT,
  });
  return response.data;
};

/**
 * Try to fetch URL via local proxy
 */
const fetchViaLocalProxy = async (url, proxyConfig) => {
  const response = await axios.get(url, {
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "identity",
    },
    timeout: TIMEOUT,
    ...proxyConfig,
  });
  return response.data;
};

/**
 * Try to fetch URL via public CORS proxy
 */
const fetchViaPublicProxy = async (url, proxyUrl) => {
  const proxiedUrl = proxyUrl + encodeURIComponent(url);
  const response = await axios.get(proxiedUrl, {
    headers: {
      Accept: "application/json",
    },
    timeout: TIMEOUT,
  });
  return response.data;
};

/**
 * Send a GET request with automatic fallback:
 * 1. Try direct connection
 * 2. Try local proxy (if configured)
 * 3. Try public CORS proxies
 *
 * @param {string} url - The URL to send the GET request to.
 * @returns {Promise<Object>} - The response data from the server.
 * @throws {Error} - Throws an error if all methods fail.
 */
const get = async (url) => {
  const localProxyConfig = getLocalProxyConfig();
  const errors = [];

  // Strategy 1: Try direct connection first
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fetchDirect(url);
    } catch (error) {
      if (attempt === 0) {
        errors.push(`Direct: ${error.code || error.message}`);
      }
      
      const isRetryable =
        error.code === "ECONNRESET" ||
        error.code === "ECONNABORTED" ||
        error.response?.status >= 500;

      if (!isRetryable) break;
      await sleep(INITIAL_DELAY * Math.pow(2, attempt));
    }
  }

  // Strategy 2: Try local proxy if configured
  if (localProxyConfig) {
    try {
      const result = await fetchViaLocalProxy(url, localProxyConfig);
      console.log(`✓ Fetched via local proxy: ${url.split('?')[0]}`);
      return result;
    } catch (error) {
      errors.push(`Local proxy: ${error.code || error.message}`);
    }
  }

  // Strategy 3: Try public CORS proxies as last resort
  for (const proxyUrl of PUBLIC_PROXIES) {
    try {
      const result = await fetchViaPublicProxy(url, proxyUrl);
      console.log(`✓ Fetched via public proxy: ${url.split('?')[0]}`);
      return result;
    } catch (error) {
      errors.push(`Public proxy (${proxyUrl.split('/')[2]}): ${error.code || error.message}`);
    }
  }

  // All methods failed
  console.error(`All fetch methods failed for ${url.split('?')[0]}:`, errors.join(', '));
  throw new Error(`Failed to fetch data from ${url}. Please try again.`);
};

export default { get };
