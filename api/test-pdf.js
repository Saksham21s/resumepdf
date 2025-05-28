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

  try {
    console.log('Starting test PDF generation...');
    
    // Configure chromium
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = true;
    
    console.log('Launching browser...');
    
    // Launch headless browser using chromium-min with simplified configuration
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath("https://github.com/Sparticuz/chromium/releases/download/v119.0.0/chromium-v119.0.0-pack.tar"),
      headless: true,
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Very simple HTML content
    const simpleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Test PDF</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
          }
          h1 {
            color: #333;
          }
        </style>
      </head>
      <body>
        <h1>Test PDF Generation</h1>
        <p>This is a simple test PDF generated with Puppeteer and Chromium.</p>
        <p>Current time: ${new Date().toISOString()}</p>
      </body>
      </html>
    `;
    
    // Set content
    await page.setContent(simpleHtml, {
      waitUntil: 'domcontentloaded'
    });
    
    console.log('Generating PDF...');
    
    // Generate PDF
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
    res.setHeader('Content-Disposition', 'attachment; filename=test.pdf');
    
    // Send PDF buffer as response
    res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error('Error generating test PDF:', error);
    res.status(500).json({ error: 'Failed to generate test PDF', details: error.message, stack: error.stack });
  }
}; 