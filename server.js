import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - allow Vercel frontend and local dev
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
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

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide all fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App Password
      },
    });

    const mailOptions = {
      from: email,
      to: 'aditya566sharma@gmail.com',
      subject: `Portfolio Contact from ${name}`,
      text: `Hello Aditya,\n\nYou got a new message from your portfolio website:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
      replyTo: email,
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Email Error:', error);
    res.status(500).json({ success: false, message: 'Failed to send message', error: error.message });
  }
});

// Hello endpoint for quick check
app.get('/', (req, res) => {
  res.send('Portfolio Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
