const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Configures Puppeteer to store browser binaries inside project directory for Render deployment
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
