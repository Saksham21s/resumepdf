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
    const { 
      templateId, 
      templateData, 
      customization = {} 
    } = req.body;

    if (!templateId) {
      return res.status(400).json({ error: 'Missing required parameter: templateId' });
    }

    // Generate HTML content based on template data
    const htmlContent = generateResumeHtml(templateId, templateData, customization);

    // Send HTML content as response
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(htmlContent);

  } catch (error) {
    console.error('Error rendering template:', error);
    res.status(500).json({ error: 'Failed to render template', details: error.message });
  }
};

function generateResumeHtml(templateId, templateData, customization = {}) {
  // Create a basic HTML structure for the resume
  // In a real implementation, this would use the actual template rendering logic
  
  const baseStyles = `
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      background-color: white;
    }
    .resume-container {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 0 auto;
      background-color: white;
      position: relative;
      box-sizing: border-box;
    }
    .resume-page {
      width: 100%;
      min-height: 297mm;
      padding: 20mm;
      box-sizing: border-box;
      position: relative;
    }
    .section {
      margin-bottom: 15px;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #2a3b8f;
    }
    .section-content {
      margin-left: 0;
    }
    .entry {
      margin-bottom: 10px;
    }
    .entry-title {
      font-weight: bold;
    }
    .entry-subtitle {
      font-style: italic;
    }
    .entry-date {
      color: #666;
    }
    .entry-description {
      margin-top: 5px;
    }
  `;

  // Create HTML content based on template data
  // This is a simplified version - in production you'd want to use the actual template rendering
  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resume - ${templateId}</title>
      <style>${baseStyles}</style>
    </head>
    <body>
      <div class="resume-container" data-template="${templateId}">
        <div class="resume-page" data-page="1">
  `;

  // If we have template data, use it to populate the resume
  if (templateData) {
    // Add personal info section
    if (templateData.personalInfo) {
      const { name, title, email, phone, location } = templateData.personalInfo;
      
      htmlContent += `
        <div class="section personal-info">
          <h1 style="font-size: 24px; margin-bottom: 5px;">${name || 'Your Name'}</h1>
          <p style="font-size: 16px; margin-top: 0; color: #555;">${title || 'Professional Title'}</p>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;">
            ${email ? `<span>${email}</span>` : ''}
            ${phone ? `<span>${phone}</span>` : ''}
            ${location ? `<span>${location}</span>` : ''}
          </div>
        </div>
      `;
    }

    // Add sections based on section order if available
    const sectionOrder = customization.sectionOrder || {
      left: ['summary', 'experience', 'education', 'skills'],
      right: [],
      layout: 'one-column'
    };
    
    const sections = sectionOrder.layout === 'one-column' 
      ? [...sectionOrder.left] 
      : [...sectionOrder.left, ...sectionOrder.right];

    // Process each section
    sections.forEach(sectionKey => {
      const sectionData = templateData[sectionKey];
      
      if (sectionData) {
        switch (sectionKey) {
          case 'summary':
            htmlContent += `
              <div class="section summary-section">
                <div class="section-title">Professional Summary</div>
                <div class="section-content">${sectionData}</div>
              </div>
            `;
            break;
            
          case 'experience':
            htmlContent += `
              <div class="section experience-section">
                <div class="section-title">Work Experience</div>
                <div class="section-content">
            `;
            
            if (Array.isArray(sectionData)) {
              sectionData.forEach(job => {
                htmlContent += `
                  <div class="entry">
                    <div class="entry-title">${job.title || ''}</div>
                    <div class="entry-subtitle">${job.company || ''}</div>
                    <div class="entry-date">${job.startDate || ''} - ${job.endDate || 'Present'}</div>
                    <div class="entry-description">${job.description || ''}</div>
                  </div>
                `;
              });
            }
            
            htmlContent += `
                </div>
              </div>
            `;
            break;
            
          case 'education':
            htmlContent += `
              <div class="section education-section">
                <div class="section-title">Education</div>
                <div class="section-content">
            `;
            
            if (Array.isArray(sectionData)) {
              sectionData.forEach(edu => {
                htmlContent += `
                  <div class="entry">
                    <div class="entry-title">${edu.degree || ''}</div>
                    <div class="entry-subtitle">${edu.school || ''}</div>
                    <div class="entry-date">${edu.startDate || ''} - ${edu.endDate || ''}</div>
                    <div class="entry-description">${edu.description || ''}</div>
                  </div>
                `;
              });
            }
            
            htmlContent += `
                </div>
              </div>
            `;
            break;
            
          case 'skills':
            htmlContent += `
              <div class="section skills-section">
                <div class="section-title">Skills</div>
                <div class="section-content">
            `;
            
            if (Array.isArray(sectionData)) {
              htmlContent += '<ul style="columns: 2; column-gap: 20px; list-style-type: none; padding-left: 0;">';
              sectionData.forEach(skill => {
                htmlContent += `<li>${skill}</li>`;
              });
              htmlContent += '</ul>';
            }
            
            htmlContent += `
                </div>
              </div>
            `;
            break;
            
          default:
            // Handle other section types
            htmlContent += `
              <div class="section ${sectionKey}-section">
                <div class="section-title">${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)}</div>
                <div class="section-content">${JSON.stringify(sectionData)}</div>
              </div>
            `;
        }
      }
    });
  } else {
    // If no template data, add placeholder content
    htmlContent += `
      <div class="section personal-info">
        <h1 style="font-size: 24px; margin-bottom: 5px;">John Doe</h1>
        <p style="font-size: 16px; margin-top: 0; color: #555;">Software Engineer</p>
        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
          <span>john.doe@example.com</span>
          <span>(123) 456-7890</span>
          <span>New York, NY</span>
        </div>
      </div>
      
      <div class="section summary-section">
        <div class="section-title">Professional Summary</div>
        <div class="section-content">
          Experienced software engineer with a passion for developing innovative solutions.
        </div>
      </div>
      
      <div class="section experience-section">
        <div class="section-title">Work Experience</div>
        <div class="section-content">
          <div class="entry">
            <div class="entry-title">Senior Software Engineer</div>
            <div class="entry-subtitle">Tech Company Inc.</div>
            <div class="entry-date">Jan 2020 - Present</div>
            <div class="entry-description">
              Led development of key features for the company's main product.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Close the HTML structure
  htmlContent += `
        </div>
      </div>
    </body>
    </html>
  `;

  return htmlContent;
} 