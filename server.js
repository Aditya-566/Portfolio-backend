import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

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
    console.log('Attempting to send email from:', name);
    console.log('GMAIL_USER configured:', process.env.GMAIL_USER ? 'Yes' : 'No');
    console.log('GMAIL_PASS configured:', process.env.GMAIL_PASS ? 'Yes' : 'No');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App Password
      },
      // Force IPv4 to avoid ENETUNREACH with IPv6 on some cloud platforms
      addressFamily: 4, 
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
      console.log('Transporter verified successfully');
    } catch (error) {
      console.error('Transporter Verification Failed:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Email service configuration error', 
        details: error.message 
      });
    }

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: 'aditya566sharma@gmail.com',
      subject: `Portfolio Contact from ${name}`,
      text: `Hello Aditya,\n\nYou got a new message from your portfolio website:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
      replyTo: email,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Final Email Error Catch:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Hello endpoint for quick check
app.get('/', (req, res) => {
  res.send('Portfolio Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
