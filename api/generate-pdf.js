const chromium = require('@sparticuz/chromium');
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
    
    // Launch headless browser using chromium with memory-optimized configuration
    // and specific flags to handle missing libraries
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-web-security',
        '--disable-features=site-per-process',
        '--disable-extensions',
        '--disable-sync',
        '--no-zygote'
      ],
      defaultViewport: {
        width: 794,
        height: 1123,
        deviceScaleFactor: 1.5
      },
      executablePath: await chromium.executablePath(
        "https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar"
      ),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Set content with optimized wait options
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for any fonts to load
    await page.evaluateHandle('document.fonts.ready');
    
    console.log('Generating PDF...');
    
    // Generate PDF
    const pdfBuffer = await page.pdf(mergedPdfOptions);

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
