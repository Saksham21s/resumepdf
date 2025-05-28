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
    console.log('Starting test PDF generation...');
    
    // Configure chromium
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = true;
    
    const executablePath = await chromium.executablePath();
    console.log(`Using Chromium from: ${executablePath}`);
    
    // Launch browser
    const browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-web-security'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Simple test HTML
    const testHtml = `
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
          
          h1 {
            color: #2c3e50;
          }
          
          p {
            color: #34495e;
          }
        </style>
      </head>
      <body>
        <h1>PDF Generation Test</h1>
        <p>This is a test PDF generated using Puppeteer and Chromium on Vercel.</p>
        <p>Current time: ${new Date().toISOString()}</p>
      </body>
      </html>
    `;
    
    // Set content
    await page.setContent(testHtml, {
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: 30000
    });
    
    // Wait a bit to ensure rendering is complete
    await page.waitForTimeout(1000);
    
    console.log('Generating test PDF...');
    
    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'a4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      timeout: 60000
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
    res.status(500).json({ error: 'Failed to generate test PDF', details: error.message });
  }
}; 
