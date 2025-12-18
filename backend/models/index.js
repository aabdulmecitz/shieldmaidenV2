/**
 * Model Index
 * ShieldMaiden - Secure File Sharing System
 * 
 * Tüm modelleri tek bir yerden export eder
 */

const User = require('./User');
const File = require('./File');
const ShareLink = require('./ShareLink');
const DownloadLog = require('./DownloadLog');

module.exports = {
    User,
    File,
    ShareLink,
    DownloadLog
};
