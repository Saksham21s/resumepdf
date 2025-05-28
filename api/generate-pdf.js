const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Please use POST.' });
  }

  try {
    // Extract data from request body
    const { htmlContent, pdfOptions = {} } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: 'Missing required parameter: htmlContent' });
    }

    // Default PDF options
    const defaultPdfOptions = {
      format: 'a4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      scale: 1
    };

    // Merge default options with provided options
    const mergedPdfOptions = { ...defaultPdfOptions, ...pdfOptions };

    console.log('Launching browser...');
    
    // Configure chromium with specific settings for Vercel
    chromium.setHeadlessMode = true;
    // Important: Set graphics mode to true to avoid font issues
    chromium.setGraphicsMode = true;
    
    // Use a specific version that's known to work
    const CHROMIUM_VERSION = "119.0.2";
    const executablePath = await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_VERSION}/chromium-v${CHROMIUM_VERSION}-pack.tar`);
    
    console.log(`Using Chromium executable path: ${executablePath}`);
    
    // Launch headless browser with minimal configuration
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials'
      ],
      defaultViewport: {
        width: 1280,
        height: 1696,
        deviceScaleFactor: 1
      },
      executablePath: executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Use a simpler HTML wrapper with system fonts
    const wrappedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            margin: 0; 
            padding: 0;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    
    // Set content with simplified wait options
    await page.setContent(wrappedHtml, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('Generating PDF...');
    
    // Generate PDF with optimized options
    const pdfBuffer = await page.pdf({
      ...mergedPdfOptions,
      timeout: 60000
    });

    // Close browser
    await browser.close();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    
    // Send PDF buffer as response
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
  }
}; 
