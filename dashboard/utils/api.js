import config from "@config";

// Use CLIENT_API_URL for API requests (usually localhost:4000)
const API_BASE_URL = `${config.API_URL}:${config.API_PORT}`;

/**
 * Standard API request wrapper
 * @param {string} endpoint - The API endpoint (e.g., '/auth/user')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} - The JSON response
 */
async function request(
  endpoint,
  options = {},
  { showConsoleError = false, redirectOn401 = true } = {},
) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint}`;

  let response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    if (showConsoleError) console.error(`API Request Error [${url}]:`, error);
    // Properly tag network errors
    const networkError = new Error(error.message || "Failed to connect to API");
    networkError.isApiError = true;
    networkError.isConnectionError = true;
    throw networkError;
  }

  try {
    if (response.status === 401) {
      if (typeof window !== "undefined" && redirectOn401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message =
        data.error ||
        data.message ||
        `Request failed with status ${response.status}`;

      const error = new Error(message);
      error.status = response.status;

      // Only mark as ApiError if it's a server failure (5xx)
      // 4xx errors are usually functional (not found, unauthorized)
      // and shouldn't necessarily crash the whole dashboard UI.
      if (response.status >= 500) {
        error.isApiError = true;
      }

      if (showConsoleError)
        console.error(`API Request Error [${url}]:`, message);
      throw error;
    }

    return data;
  } catch (error) {
    // Ensure network/connection errors are always marked as ApiErrors
    if (!error.status || error.status >= 500) {
      error.isApiError = true;
      error.isConnectionError = !response;
    }
    if (showConsoleError) console.error(`API Request Error [${url}]:`, error);
    throw error;
  }
}

export const api = {
  /**
   * Perform a GET request
   * @param {string} endpoint - API endpoint
   * @param {object} [options] - Fetch options
   * @param {object} [config] - Request config
   */
  get: (endpoint, options = {}, config = {}) =>
    request(endpoint, { ...options, method: "GET" }, config),

  /**
   * Perform a POST request
   * @param {string} endpoint - API endpoint
   * @param {object|FormData} body - Request body
   * @param {object} [options] - Fetch options
   * @param {object} [config] - Request config
   */
  post: (endpoint, body, options = {}, config = {}) =>
    request(
      endpoint,
      {
        ...options,
        method: "POST",
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      config,
    ),

  /**
   * Perform a PATCH request
   * @param {string} endpoint - API endpoint
   * @param {object|FormData} body - Request body
   * @param {object} [options] - Fetch options
   * @param {object} [config] - Request config
   */
  patch: (endpoint, body, options = {}, config = {}) =>
    request(
      endpoint,
      {
        ...options,
        method: "PATCH",
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      config,
    ),

  /**
   * Perform a PUT request
   * @param {string} endpoint - API endpoint
   * @param {object|FormData} body - Request body
   * @param {object} [options] - Fetch options
   * @param {object} [config] - Request config
   */
  put: (endpoint, body, options = {}, config = {}) =>
    request(
      endpoint,
      {
        ...options,
        method: "PUT",
        body: body instanceof FormData ? body : JSON.stringify(body),
      },
      config,
    ),

  /**
   * Perform a DELETE request
   * @param {string} endpoint - API endpoint
   * @param {object} [options] - Fetch options
   * @param {object} [config] - Request config
   */
  delete: (endpoint, options = {}, config = {}) =>
    request(endpoint, { ...options, method: "DELETE" }, config),

  /**
   * Upload a file via POST (wrapper for FormData)
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - The FormData object
   * @param {object} [options] - Fetch options
   * @param {object} [config] - Request config
   */
  upload: (endpoint, formData, options = {}, config = {}) =>
    request(
      endpoint,
      {
        ...options,
        method: "POST",
        body: formData,
      },
      config,
    ),
};
