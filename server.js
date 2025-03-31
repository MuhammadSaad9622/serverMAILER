require('dotenv').config();
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');

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

    const mailOptions = {
      from: `"Case Submission" <${process.env.EMAIL_USER}>`,
      to: 'guideme@guided4excellence.com',
      subject: 'New Case Submission',
      html: generateEmailHtml(formData),
      attachments: files.map((file) => ({
        filename: file.originalname,
        content: file.buffer,
      })),
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Case submitted successfully' });
  } catch (error) {
    console.error('Error submitting case:', error);
    res.status(500).json({ error: 'Error submitting case' });
  }
});

function generateEmailHtml(formData) {
  return `
    <h1>New Case Submission</h1>
    ${Object.entries(formData)
      .map(
        ([key, value]) => `
      <p><strong>${key}:</strong> ${value}</p>
    `
      )
      .join('')}
    <p>Attachments: ${formData.attachment ? formData.attachment : 'None'}</p>
  `;
}

// Added code: Basic endpoint and server listen
const port = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

// If needed for serverless deployments (e.g., Vercel), export the Express app
module.exports = app;
