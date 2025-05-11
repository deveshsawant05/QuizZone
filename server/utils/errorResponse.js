/**
 * Custom error class for API responses
 * @class ErrorResponse
 * @extends Error
 */
class ErrorResponse extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {any} data - Additional error data (optional)
   */
  constructor(message, statusCode, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}

module.exports = ErrorResponse; 