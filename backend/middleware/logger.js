/**
 * Logger Middleware
 * HTTP isteklerini loglar
 */

/**
 * Request logger middleware
 * Tüm HTTP isteklerini console'a loglar
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const startTimestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Request log
  console.log(`[${startTimestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Response tamamlandığında süreyi logla
  res.on('finish', () => {
    const finishTimestamp = new Date().toISOString();
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const statusEmoji = statusCode >= 500 ? '❌' : statusCode >= 400 ? '⚠️' : '✅';
    console.log(`[${finishTimestamp}] ${statusEmoji} ${method} ${url} - ${statusCode} - ${duration}ms`);
  });
  
  next();
};

/**
 * Error logger
 * Hataları detaylı şekilde loglar
 */
const errorLogger = (error, context = '') => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ERROR ${context}:`, {
    message: error.message,
    stack: error.stack,
    name: error.name,
    code: error.code
  });
};

/**
 * Info logger
 * Genel bilgilendirme mesajlarını loglar
 */
const infoLogger = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] INFO: ${message}`, data || '');
};

/**
 * Debug logger
 * Development environment için debug mesajları
 */
const debugLogger = (message, data = null) => {
  if (process.env.NODE_ENV !== 'production') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] DEBUG: ${message}`, data || '');
  }
};

module.exports = {
  requestLogger,
  errorLogger,
  infoLogger,
  debugLogger
};