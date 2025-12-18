const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ALGORITHM = 'aes-256-ctr';

/**
 * Generates a random encryption key and IV
 */
const generateKeys = () => {
    return {
        key: crypto.randomBytes(32).toString('hex'),
        iv: crypto.randomBytes(16).toString('hex')
    };
};

/**
 * Encrypts a file buffer or stream
 * @param {Buffer} buffer - File buffer
 * @param {String} keyHex - 32 byte key in hex
 * @param {String} ivHex - 16 byte IV in hex
 */
const encryptBuffer = (buffer, keyHex, ivHex) => {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return encrypted;
};

/**
 * Decrypts a file buffer
 * @param {Buffer} encryptedBuffer 
 * @param {String} keyHex 
 * @param {String} ivHex 
 */
const decryptBuffer = (encryptedBuffer, keyHex, ivHex) => {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decrypted;
};

/**
 * Stream encryption helper (for large files)
 * Reads from inputPath, encrypts, writes to outputPath
 */
const encryptFileStream = (inputPath, outputPath, keyHex, ivHex) => {
    return new Promise((resolve, reject) => {
        const key = Buffer.from(keyHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        const input = fs.createReadStream(inputPath);
        const output = fs.createWriteStream(outputPath);

        input.pipe(cipher).pipe(output);

        output.on('finish', () => resolve());
        output.on('error', (err) => reject(err));
    });
};

/**
 * Stream decryption helper
 * Reads from encryptedPath, decrypts, pipes to res (or any writable stream)
 */
const decryptFileStream = (encryptedPath, writableStream, keyHex, ivHex) => {
    return new Promise((resolve, reject) => {
        const key = Buffer.from(keyHex, 'hex');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        const input = fs.createReadStream(encryptedPath);

        input.pipe(decipher).pipe(writableStream);

        writableStream.on('finish', () => resolve());
        writableStream.on('error', (err) => reject(err));
        input.on('error', (err) => reject(err));
    });
};

module.exports = {
    generateKeys,
    encryptBuffer,
    decryptBuffer,
    encryptFileStream,
    decryptFileStream
};
