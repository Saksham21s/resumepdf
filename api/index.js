/**
 * Resume PDF Generation API
 * Main entry point for the API
 */

const generatePdf = require('./generate-pdf');
const resumePdf = require('./resume-pdf');
const renderTemplate = require('./render-template');

module.exports = async (req, res) => {
  // Set CORS headers for all requests
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

  // Get the path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname.split('/').filter(Boolean);

  // Route the request based on the path
  if (path[0] === 'generate-pdf') {
    return generatePdf(req, res);
  } else if (path[0] === 'resume-pdf') {
    return resumePdf(req, res);
  } else if (path[0] === 'render-template') {
    return renderTemplate(req, res);
  } else {
    // Return API information for the root path
    return res.status(200).json({
      name: 'Resume PDF Generation API',
      version: '1.0.0',
      endpoints: [
        {
          path: '/generate-pdf',
          method: 'POST',
          description: 'Generate a PDF from HTML content',
          parameters: {
            htmlContent: 'HTML content to convert to PDF',
            pdfOptions: 'Optional PDF generation options'
          }
        },
        {
          path: '/resume-pdf',
          method: 'POST',
          description: 'Generate a PDF from resume template data',
          parameters: {
            templateId: 'ID of the template to use',
            templateData: 'Resume data to populate the template',
            customization: 'Optional customization options',
            pdfOptions: 'Optional PDF generation options'
          }
        },
        {
          path: '/render-template',
          method: 'POST',
          description: 'Render a resume template as HTML',
          parameters: {
            templateId: 'ID of the template to use',
            templateData: 'Resume data to populate the template',
            customization: 'Optional customization options'
          }
        }
      ]
    });
  }
}; 