const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to launch browser with retries
async function launchBrowserWithRetry(executablePath, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Browser launch attempt ${attempt}/${maxRetries}`);
      
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-audio-output',
          '--disable-remote-fonts',
          '--font-render-hinting=none',
          '--disable-web-security'
        ],
        defaultViewport: {
          width: 800,
          height: 1100,
          deviceScaleFactor: 1
        },
        executablePath: executablePath,
        headless: true,
        ignoreHTTPSErrors: true,
      });
      
      return browser;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      lastError = error;
      
      // If ETXTBSY error, wait before retrying
      if (error.message.includes('ETXTBSY')) {
        console.log('ETXTBSY error detected, waiting before retry...');
        await wait(1000 * attempt); // Exponential backoff
      } else {
        // For other errors, wait a bit less
        await wait(500);
      }
    }
  }
  
  // If we get here, all attempts failed
  throw new Error(`Failed to launch browser after ${maxRetries} attempts: ${lastError.message}`);
}

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

  let browser = null;
  
  try {
    // Extract data from request body
    const { htmlContent, pdfOptions = {} } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: 'Missing required parameter: htmlContent' });
    }

    // Default PDF options - minimal settings for low resource usage
    const defaultPdfOptions = {
      format: 'a4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      scale: 0.8,
      omitBackground: true,
    };

    // Merge default options with provided options
    const mergedPdfOptions = { ...defaultPdfOptions, ...pdfOptions };

    console.log('Launching browser with minimal settings...');
    
    // Configure chromium with minimal settings
    chromium.setHeadlessMode = true;
    
    // Use a specific version that's known to work
    const CHROMIUM_VERSION = "119.0.2";
    const executablePath = await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_VERSION}/chromium-v${CHROMIUM_VERSION}-pack.tar`);
    
    // Launch browser with retry logic
    browser = await launchBrowserWithRetry(executablePath);

    // Create a new page
    const page = await browser.newPage();
    
    // Extremely simplified HTML with only basic styling
    const minimalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    
    // Set content with minimal wait options
    await page.setContent(minimalHtml, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('Generating minimal PDF...');
    
    // Generate PDF with minimal options
    const pdfBuffer = await page.pdf({
      ...mergedPdfOptions,
      timeout: 30000,
      printBackground: true,
      preferCSSPageSize: false
    });

    // Close browser immediately
    if (browser) {
      await browser.close();
      browser = null;
    }

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    
    // Send PDF buffer as response
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    
    // Always make sure browser is closed
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    // Return appropriate error message
    if (error.message.includes('ETXTBSY')) {
      res.status(503).json({ 
        error: 'Server busy', 
        details: 'The server is currently busy processing other requests. Please try again in a few moments.',
        originalError: error.message
      });
    } else {
      res.status(500).json({ error: 'Failed to generate PDF', details: error.message });
    }
  }
}; 
