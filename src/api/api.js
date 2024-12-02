const fetch = require('node-fetch');

const LOG_PREFIX = '[API]';

const logger = {
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error)
};

const defaultHeaders = {
  'Content-Type': 'application/vnd.api+json'
};

const api = {
  /**
   * Make GET request and return JSON response
   * @param {string} url - Request URL
   * @param {Object} customOptions - Optional request options
   * @returns {Promise<Object>} Response data
   */
  async get(url, customOptions = {}) {
    try {
      const options = { 
        headers: defaultHeaders,
        ...customOptions 
      };
      const response = await fetch(url, options);
      const data = await response.json();
      return { data };
    } catch (error) {
      logger.error(`GET request failed: ${url}`, error);
      throw error;
    }
  },

  /**
   * Make GET request and return HTML response
   * @param {string} url - Request URL
   * @returns {Promise<string>} HTML content
   */
  async getHtml(url) {
    try {
      const response = await fetch(url);
      return response.text();
    } catch (error) {
      logger.error(`HTML request failed: ${url}`, error);
      throw error;
    }
  },

  /**
   * Make GET request and return response stream
   * @param {string} url - Request URL
   * @returns {Promise<ReadableStream>} Response stream
   */
  async getFileStream(url) {
    try {
      const response = await fetch(url);
      return response.body;
    } catch (error) {
      logger.error(`Stream request failed: ${url}`, error);
      throw error;
    }
  },

  /**
   * Make POST request with JSON body
   * @param {string} url - Request URL
   * @param {Object} body - Request body
   * @param {Object} customHeader - Optional additional headers
   * @returns {Promise<Object>} Response data
   */
  async post(url, body, customHeader = {}) {
    try {
      const options = {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 
          'Content-Type': 'application/json',
          ...customHeader 
        }
      };
      const response = await fetch(url, options);
      return response.json();
    } catch (error) {
      logger.error(`POST request failed: ${url}`, error);
      throw error;
    }
  }
};

module.exports = api;
