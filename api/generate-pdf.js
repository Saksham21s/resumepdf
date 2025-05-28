const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');


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
    
    // Configure chromium
    chromium.setHeadlessMode = true;
    // Important: Set graphics mode to true to avoid font issues
    chromium.setGraphicsMode = true;
    
    // Use a specific version that we know works
    const chromiumPath = "https://github.com/Sparticuz/chromium/releases/download/v119.0.0/chromium-v119.0.0-pack.tar";
    console.log(`Using Chromium from: ${chromiumPath}`);
    
    // Launch headless browser using chromium-min with simplified configuration
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(chromiumPath),
      headless: true,
      ignoreHTTPSErrors: true,
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Use a simple HTML content if the provided one is too complex
    const simpleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
          }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;
    
    // Set content with simplified wait options
    await page.setContent(simpleHtml, {
      waitUntil: 'domcontentloaded'
    });
    
    console.log('Generating PDF...');
    
    // Generate PDF with simplified options
    const pdfBuffer = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
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
