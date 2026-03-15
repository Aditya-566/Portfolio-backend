import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import dns from 'dns';

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

// Helper to resolve Gmail SMTP to IPv4 manually
const getGmailIpv4 = async () => {
    try {
        const addresses = await dns.promises.resolve4('smtp.gmail.com');
        console.log('Resolved smtp.gmail.com IPv4 addresses:', addresses);
        return addresses[0]; // Use the first available IPv4
    } catch (error) {
        console.error('DNS Resolution for Gmail failed:', error);
        return 'smtp.gmail.com'; // Fallback to hostname
    }
};

// Contact Route
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Please provide all fields' });
  }

  try {
    console.log('--- Email Process Start ---');
    console.log('From:', name, `(${email})`);
    
    const smtpHost = await getGmailIpv4();
    console.log('Using SMTP Host:', smtpHost);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: (process.env.EMAIL_PASS || '').replace(/\s/g, ''),
      },
      tls: {
        // Essential when connecting via IP address
        servername: 'smtp.gmail.com'
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });

    console.log('Verifying Transporter...');
    await transporter.verify();
    console.log('Transporter verified successfully');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: `Portfolio Contact from ${name}`,
      text: `Hello Aditya,\n\nYou got a new message from your portfolio website:\n\nName: ${name}\nEmail: ${email}\nMessage:\n${message}`,
      replyTo: email,
    };

    console.log('Sending Mail...');
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    res.status(200).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Email Service Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message', 
      error: error.message,
      code: error.code
    });
  }
  console.log('--- Email Process End ---');
});

// Diagnostic/Test Route
app.get('/api/contact/test', async (req, res) => {
    try {
        console.log('--- SMTP Diagnostic Start ---');
        const ip = await getGmailIpv4();
        
        const transporter = nodemailer.createTransport({
            host: ip,
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: (process.env.EMAIL_PASS || '').replace(/\s/g, ''),
            },
            tls: { servername: 'smtp.gmail.com' }
        });

        await transporter.verify();
        console.log('Diagnostic: SMTP Connection Ready');
        res.json({ success: true, message: 'SMTP Connection Verified', host: ip });
    } catch (error) {
        console.error('Diagnostic Failed:', error);
        res.status(500).json({ success: false, error: error.message, code: error.code });
    }
});

// Hello endpoint for quick check
app.get('/', (req, res) => {
  res.send('Portfolio Backend is running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
