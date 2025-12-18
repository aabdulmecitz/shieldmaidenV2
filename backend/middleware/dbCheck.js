const mongoose = require('mongoose');
const { createErrorResponse } = require('../utils/responseHelper');

/**
 * Database Connection Check Middleware
 * MongoDB bağlantısını kontrol eder ve bağlantı yoksa hata döner
 */
const checkDatabase = (req, res, next) => {
  const dbStatus = mongoose.connection.readyState;
  
  // 1 = connected, 2 = connecting, 0 = disconnected, 3 = disconnecting
  if (dbStatus !== 1) {
    return res.status(503).json(createErrorResponse(
      'Database unavailable',
      'Sunucu şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.'
    ));
  }
  
  next();
};

module.exports = {
  checkDatabase
};

