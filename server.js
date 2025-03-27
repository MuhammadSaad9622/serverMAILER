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
    user: 'websiteguided@gmail.com',
    pass: 'thyh bgjo vmuk irnn'
  }
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
      attachments: files.map(file => ({
        filename: file.originalname,
        content: file.buffer
      }))
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
    ${Object.entries(formData).map(([key, value]) => `
      <p><strong>${key}:</strong> ${value}</p>
    `).join('')}
    <p>Attachments: ${formData.attachment ? formData.attachment : 'None'}</p>
  `;
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));