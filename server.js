import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://portfolio-frontend-two-hazel.vercel.app',
  'https://portfolio-frontend-two-hazel-adityas-projects-0e52966b.vercel.app', // Adding variants just in case
  process.env.FRONTEND_URL,
].filter(Boolean);

console.log('Allowed Origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Middleware
app.use(express.json());

// Contact Route
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide all fields' });
  }

  try {
    console.log('--- Email Process Start ---');
    console.log('From:', name, `(${email})`);

    const msg = {
      to: process.env.EMAIL_TO,
      from: process.env.SENDER_EMAIL,
      subject: `Portfolio Contact from ${name}`,
      text: `Hello Aditya,\n\nYou got a new message from your portfolio website:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
      html: `<h2>New Portfolio Contact</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g, '<br>')}</p>`,
      replyTo: email,
    };

    console.log('Sending Email via SendGrid...');
    await sgMail.send(msg);
    console.log('Email sent successfully via SendGrid');

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Email Service Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message', 
      error: error.message,
    });
  }
  console.log('--- Email Process End ---');
});

// Diagnostic/Test Route
app.get('/api/contact/test', async (req, res) => {
    try {
        console.log('--- SMTP Diagnostic Start ---');
        
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: (process.env.EMAIL_PASS || '').replace(/\s/g, ''),
            },
            tls: {
                rejectUnauthorized: false,
            },
            connectionTimeout: 30000,
            socketTimeout: 30000,
        });

        await transporter.verify();
        console.log('Diagnostic: SMTP Connection Ready');
        res.json({ success: true, message: 'SMTP Connection Verified' });
    } catch (error) {endGrid Diagnostic Start ---');
        
        const msg = {
            to: process.env.EMAIL_TO,
            from: process.env.SENDER_EMAIL,
            subject: 'Test Email from Portfolio',
            text: 'This is a test email from your portfolio backend.',
            html: '<h2>Test Email</h2><p>This is a test email from your portfolio backend.</p>',
        };

        await sgMail.send(msg);
        console.log('Diagnostic: SendGrid Connection Ready');
        res.json({ success: true, message: 'SendGrid Connection Verified - Test email sent' });
    } catch (error) {
        console.error('Diagnostic Failed:', error);
        res.status(500).json({ success: false, error: error.messag