/**
 * Response Helper Utilities
 * API response'larını standardize etmek için yardımcı fonksiyonlar
 */

/**
 * Başarılı response oluşturur
 * @param {string} message - Başarı mesajı
 * @param {any} data - Response verisi
 * @returns {object} Standardize edilmiş response objesi
 */
const createResponse = (message, data = null) => {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
};

/**
 * Hata response oluşturur
 * @param {string} message - Hata mesajı
 * @param {string} error - Detaylı hata bilgisi (isteğe bağlı)
 * @returns {object} Standardize edilmiş hata response objesi
 */
const createErrorResponse = (message, error = null) => {
  return {
    success: false,
    message,
    error,
    timestamp: new Date().toISOString()
  };
};

/**
 * Validation error response oluşturur
 * @param {object} errors - Validation hataları
 * @returns {object} Standardize edilmiş validation error response objesi
 */
const createValidationErrorResponse = (errors) => {
  return {
    success: false,
    message: 'Veri doğrulama hatası',
    errors,
    timestamp: new Date().toISOString()
  };
};

/**
 * Pagination response oluşturur
 * @param {string} message - Başarı mesajı
 * @param {array} data - Response verisi
 * @param {object} pagination - Pagination bilgileri
 * @returns {object} Standardize edilmiş pagination response objesi
 */
const createPaginationResponse = (message, data, pagination) => {
  return {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: Math.ceil(pagination.total / pagination.limit)
    },
    timestamp: new Date().toISOString()
  };
};

module.exports = {
  createResponse,
  createErrorResponse,
  createValidationErrorResponse,
  createPaginationResponse
};