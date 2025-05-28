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
    
    // Configure chromium with improved settings
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = true;
    
    // Use the latest compatible version
    const executablePath = await chromium.executablePath();
    
    console.log(`Using Chromium executable path: ${executablePath}`);
    
    // Launch headless browser with enhanced configuration
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Enhanced HTML with font-display strategy and web-safe fonts
    const enhancedHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @font-face {
            font-family: 'System';
            font-style: normal;
            font-weight: 400;
            font-display: swap;
            src: local('Arial'), local('Helvetica'), local('sans-serif');
          }
          
          body { 
            font-family: 'System', Arial, Helvetica, sans-serif; 
            margin: 0; 
            padding: 20px;
          }
          
          * {
            font-family: 'System', Arial, Helvetica, sans-serif;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    
    // Wait for network idle to ensure all resources are loaded
    await page.setContent(enhancedHtml, {
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: 30000
    });
    
    // Wait a bit to ensure rendering is complete
    await page.waitForTimeout(1000);
    
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
