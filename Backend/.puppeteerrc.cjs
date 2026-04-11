const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Skip automatic Chromium download - use installed system Chrome on Render
    // Set cacheDirectory to .cache to avoid taking up project space
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
