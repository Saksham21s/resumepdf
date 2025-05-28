# Resume PDF Generation API

This is a serverless API for generating PDF resumes using Puppeteer. It can be deployed to Vercel and used as a microservice for PDF generation in your resume builder application.

## Endpoints

### 1. `/generate-pdf` (POST)

Generate a PDF from raw HTML content.

**Request Body:**
```json
{
  "htmlContent": "<html>...</html>",
  "pdfOptions": {
    "format": "a4",
    "scale": 1,
    "printBackground": true,
    "margin": {
      "top": "0mm",
      "right": "0mm",
      "bottom": "0mm",
      "left": "0mm"
    }
  }
}
```

**Response:**
- Content-Type: application/pdf
- PDF file as binary data

### 2. `/resume-pdf` (POST)

Generate a PDF from resume template data.

**Request Body:**
```json
{
  "templateId": "modern-template",
  "templateData": {
    "personalInfo": {
      "name": "John Doe",
      "title": "Software Engineer",
      "email": "john@example.com",
      "phone": "(123) 456-7890",
      "location": "New York, NY"
    },
    "summary": "Experienced software engineer...",
    "experience": [
      {
        "title": "Senior Software Engineer",
        "company": "Tech Company",
        "startDate": "Jan 2020",
        "endDate": "Present",
        "description": "Led development of key features..."
      }
    ],
    "education": [
      {
        "degree": "Bachelor of Science in Computer Science",
        "school": "University Name",
        "startDate": "2014",
        "endDate": "2018",
        "description": "Graduated with honors"
      }
    ],
    "skills": ["JavaScript", "React", "Node.js"]
  },
  "customization": {
    "sectionOrder": {
      "left": ["summary", "experience", "education"],
      "right": ["skills"],
      "layout": "two-column"
    },
    "scale": 1
  },
  "pdfOptions": {
    "format": "a4",
    "printBackground": true
  }
}
```

**Response:**
- Content-Type: application/pdf
- PDF file as binary data

### 3. `/render-template` (POST)

Render a resume template as HTML.

**Request Body:**
```json
{
  "templateId": "modern-template",
  "templateData": {
    // Same structure as resume-pdf endpoint
  },
  "customization": {
    // Same structure as resume-pdf endpoint
  }
}
```

**Response:**
- Content-Type: text/html
- HTML content of the rendered template

## Deployment

### Deploying to Vercel

1. Make sure you have the Vercel CLI installed:
```bash
npm install -g vercel
```

2. Deploy the API:
```bash
cd api
vercel
```

3. Set environment variables in Vercel:
- `y`: `production`

4. After deployment, you can use the API URL in your resume builder application.

## Using the API in Your Application

Update your frontend code to use the deployed API for PDF generation:

```javascript
// Example API client
const generateResumePdf = async (templateId, templateData, customization) => {
  try {
    const response = await fetch('https://your-vercel-deployment.vercel.app/resume-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        templateId,
        templateData,
        customization,
        pdfOptions: {
          format: 'a4',
          printBackground: true,
          preferCSSPageSize: true,
          margin: {
            top: '0mm',
            right: '0mm',
            bottom: '0mm',
            left: '0mm'
          },
          scale: customization.scale || 1
        }
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Server PDF generation failed: ${await response.text()}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};
``` 