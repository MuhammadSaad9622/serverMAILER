require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/SubmitCase', upload.any(), async (req, res) => {
  try {
    const formData = req.body;
    const files = req.files;

    // Generate PDF
    const pdfBytes = await generatePdf(formData);

    // Prepare email attachments
    const attachments = [
      {
        filename: 'Case_Details.pdf',
        content: pdfBytes
      },
      ...files.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
      }))
    ];

    const mailOptions = {
      from: `"Case Submission" <${process.env.EMAIL_USER}>`,
      to: 'guideme@guided4excellence.com',
      subject: 'New Case Submission',
      html: generateEmailHtml(formData),
      attachments: attachments,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Case submitted successfully' });
  } catch (error) {
    console.error('Error submitting case:', error);
    res.status(500).json({ error: 'Error submitting case' });
  }
});

async function generatePdf(formData) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  
  try {
    // Register fontkit
    pdfDoc.registerFontkit(fontkit);
    
    let font;
    // Try to load Roboto font, fallback to Helvetica if not available
    try {
      const fontPath = path.join(__dirname, 'fonts', 'Roboto-Regular.ttf');
      if (fs.existsSync(fontPath)) {
        const fontBytes = fs.readFileSync(fontPath);
        font = await pdfDoc.embedFont(fontBytes);
      } else {
        // Use standard Helvetica font if custom font not available
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
    } catch (fontError) {
      console.log('Using standard Helvetica font');
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // Add a new page
    const page = pdfDoc.addPage([595, 842]); // A4 size

    // Draw header
    page.drawText('Guided Excellence - Case Submission', {
      x: 50,
      y: 780,
      size: 20,
      font,
      color: rgb(0.05, 0.07, 0.32), // Dark blue color
    });
    
    page.drawText('Case Details', {
      x: 50,
      y: 750,
      size: 16,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
    
    // Draw a line
    page.drawLine({
      start: { x: 50, y: 740 },
      end: { x: 545, y: 740 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    // Draw form data
    let yPosition = 710;
    const sectionGap = 20;
    const fieldGap = 15;
    
    // Patient Information
    page.drawText('Patient Information:', {
      x: 50,
      y: yPosition,
      size: 14,
      font,
      color: rgb(0.05, 0.07, 0.32),
    });
    yPosition -= sectionGap;
    
    const patientFields = [
      'patientName', 'birthDate', 'surgeryDate', 'dueDate'
    ];
    
    patientFields.forEach(field => {
      if (formData[field]) {
        page.drawText(`${formatFieldName(field)}: ${formData[field]}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= fieldGap;
      }
    });
    
    // Planning Information
    yPosition -= sectionGap;
    page.drawText('Planning Information:', {
      x: 50,
      y: yPosition,
      size: 14,
      font,
      color: rgb(0.05, 0.07, 0.32),
    });
    yPosition -= sectionGap;
    
    const planningFields = [
      'surgicalGuideType', 'numberOfImplants', 'modelsDeliveryMethod'
    ];
    
    planningFields.forEach(field => {
      if (formData[field]) {
        page.drawText(`${formatFieldName(field)}: ${formData[field]}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= fieldGap;
      }
    });
    
    // Implant System
    yPosition -= sectionGap;
    page.drawText('Implant System:', {
      x: 50,
      y: yPosition,
      size: 14,
      font,
      color: rgb(0.05, 0.07, 0.32),
    });
    yPosition -= sectionGap;
    
    const implantFields = [
      'implantSystem', 'drillKitType', 'implantPositions', 
      'implantDimensions', 'tissueFlapType', 'expeditedRequest'
    ];
    
    implantFields.forEach(field => {
      if (formData[field]) {
        page.drawText(`${formatFieldName(field)}: ${formData[field]}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= fieldGap;
      }
    });
    
    // Doctor Information
    yPosition -= sectionGap;
    page.drawText('Doctor Information:', {
      x: 50,
      y: yPosition,
      size: 14,
      font,
      color: rgb(0.05, 0.07, 0.32),
    });
    yPosition -= sectionGap;
    
    const doctorFields = [
      'doctorName', 'doctorPhone', 'doctorAddress', 'doctorLicense'
    ];
    
    doctorFields.forEach(field => {
      if (formData[field]) {
        page.drawText(`${formatFieldName(field)}: ${formData[field]}`, {
          x: 60,
          y: yPosition,
          size: 12,
          font,
          color: rgb(0.2, 0.2, 0.2),
        });
        yPosition -= fieldGap;
      }
    });
    
    // Footer
    page.drawText('Submitted on: ' + new Date().toLocaleString(), {
      x: 50,
      y: 50,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
    
    // Save the PDF
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

function formatFieldName(field) {
  // Convert camelCase to Title Case
  const result = field.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function generateEmailHtml(formData) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #0c1152; border-bottom: 2px solid #0c1152; padding-bottom: 10px;">
        New Case Submission
      </h1>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #0c1152;">Patient Information</h2>
        ${renderFormFields(formData, ['patientName', 'birthDate', 'surgeryDate', 'dueDate'])}
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #0c1152;">Planning Information</h2>
        ${renderFormFields(formData, ['surgicalGuideType', 'numberOfImplants', 'modelsDeliveryMethod'])}
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #0c1152;">Implant System</h2>
        ${renderFormFields(formData, [
          'implantSystem', 'drillKitType', 'implantPositions', 
          'implantDimensions', 'tissueFlapType', 'expeditedRequest'
        ])}
      </div>
      
      <div style="margin-bottom: 30px;">
        <h2 style="color: #0c1152;">Doctor Information</h2>
        ${renderFormFields(formData, ['doctorName', 'doctorPhone', 'doctorAddress', 'doctorLicense'])}
      </div>
      
      <p style="font-size: 12px; color: #666; margin-top: 30px;">
        This case submission includes a PDF with all details attached.
      </p>
    </div>
  `;
}

function renderFormFields(formData, fields) {
  return fields.map(field => {
    if (formData[field]) {
      return `
        <p style="margin: 5px 0;">
          <strong style="color: #333;">${formatFieldName(field)}:</strong> 
          <span style="color: #555;">${formData[field]}</span>
        </p>
      `;
    }
    return '';
  }).join('');
}

// Basic endpoint and server listen
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
