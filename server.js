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
  'https://portfolio-frontend-two-hazel.vercel.app', // Explicitly add the new Vercel URL
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Temporarily allow all during debugging to fix CORS errors
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Middleware
app.use(express.json());

// Contact Route
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  console.log('Received contact request from:', name, email);

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide all fields' });
  }

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      throw new Error('Email credentials not configured on server');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App Password
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER, // Gmail often requires 'from' to be the authenticated user
      to: 'aditya566sharma@gmail.com',
      subject: `Portfolio Contact from ${name}`,
      text: `Hello Aditya,\n\nYou got a new message from your portfolio website:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
      replyTo: email,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.response);
    
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Email Error Details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message', 
      error: error.message,
      hint: 'Ensure GMAIL_USER and GMAIL_PASS are set in environment variables.' 
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
