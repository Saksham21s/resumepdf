const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('Starting minimal test PDF generation...');
    
    // Configure chromium with minimal settings
    chromium.setHeadlessMode = true;
    
    // Use a specific version that's known to work
    const CHROMIUM_VERSION = "119.0.2";
    const executablePath = await chromium.executablePath(`https://github.com/Sparticuz/chromium/releases/download/v${CHROMIUM_VERSION}/chromium-v${CHROMIUM_VERSION}-pack.tar`);
    
    // Launch browser with absolute minimal configuration
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

    // Create a new page
    const page = await browser.newPage();
    
    // Ultra-minimal test HTML
    const minimalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12px;
          }
          h1 { font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>PDF Test</h1>
        <p>Basic PDF test. Time: ${new Date().toISOString()}</p>
      </body>
      </html>
    `;
    
    // Set content with minimal wait options
    await page.setContent(minimalHtml, {
      waitUntil: 'domcontentloaded',
      timeout: 20000
    });
    
    console.log('Generating minimal test PDF...');
    
    // Generate PDF with minimal options
    const pdfBuffer = await page.pdf({
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
      timeout: 30000
    });

    // Close browser immediately
    await browser.close();

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=test.pdf');
    
    // Send PDF buffer as response
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('Error generating test PDF:', error);
    res.status(500).json({ error: 'Failed to generate test PDF', details: error.message });
  }
}; 