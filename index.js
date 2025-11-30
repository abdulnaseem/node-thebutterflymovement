const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const helmet = require("helmet"); // For added security
require("dotenv").config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

// Allow requests only from your frontend
app.use(
    cors({
      origin: [
        "https://www.thebutterflymovement.health",        
        // "http://localhost:5173",
      ],
      methods: "GET,POST",
      allowedHeaders: "Content-Type",
    })
);
app.use(bodyParser.json());
app.use(helmet()); // Add security headers
//
app.options("/send-email", (req, res) => {
    console.log("Preflight request received");
    res.header("Access-Control-Allow-Origin", "https://www.thebutterflymovement.health");
    res.header("Access-Control-Allow-Methods", "GET,POST");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    res.send();
});

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., Gmail, Outlook)
  auth: {
    user: process.env.EMAIL_USER, // Your email address (from .env)
    pass: process.env.EMAIL_PASSWORD, // Your app-specific password (from .env)
  },
});

// Contact form submission
app.post("/send-email", async (req, res) => {
  const { name, subject, email, contactNumber, message, recaptchaToken } = req.body;

  // Basic input validation
  if (!name || !subject || !email || !contactNumber || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!recaptchaToken) {
    return res.status(400).json({ message: "reCAPTCHA validation failed." });
  }

  try {
    // Verify reCAPTCHA with Google
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    const params = new URLSearchParams();
    params.append("secret", secretKey);
    params.append("response", recaptchaToken);

    const googleRes = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    const verification = await googleRes.json();

    if (!verification.success) {
      console.error("reCAPTCHA verification failed:", verification);
      return res
        .status(400)
        .json({ message: "reCAPTCHA verification failed. Please try again." });
    }

    // At this point the request is likely human.
    // You can also inspect verification.score / action for v3.

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: subject,
      text: `
        Name: ${name}
        Email: ${email}
        Contact Number: ${contactNumber}
        Message: ${message}
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email" });
      } else {
        console.log("Email sent:", info.response);
        res.header(
          "Access-Control-Allow-Origin",
          "https://www.thebutterflymovement.health",
          // "http://localhost:5173"
        );
        return res.status(200).json({ message: "Email sent successfully!" });
      }
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});