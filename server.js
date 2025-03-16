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
      origin: "https://www.thebutterflymovement.health", // Replace with your frontend URL
      methods: "GET,POST",
      allowedHeaders: "Content-Type",
    })
);
app.use(bodyParser.json());
app.use(helmet()); // Add security headers

// This allows the server to respond to the OPTIONS preflight request
app.options("/send-email", cors());

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your email service (e.g., Gmail, Outlook)
  auth: {
    user: process.env.EMAIL_USER, // Your email address (from .env)
    pass: process.env.EMAIL_PASSWORD, // Your app-specific password (from .env)
  },
});

// Contact form submission
app.post("/send-email", (req, res) => {
  const { name, subject, email, contactNumber, message } = req.body;

  // Input validation
  if (!name || !subject || !email || !contactNumber || !message) {
    return res.status(400).send("All fields are required.");
  }

  const mailOptions = {
    from: process.env.EMAIL_USER, // Your email address (from .env)
    to: process.env.EMAIL_USER, // Recipient email (from .env)
    subject: subject, // Subject from the form
    text: `
      Name: ${name}
      Email: ${email}
      Contact Number: ${contactNumber}
      Message: ${message}
    `,
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error); // Log the full error for debugging
      res.status(500).send("Error sending email");
    } else {
      console.log("Email sent:", info.response);
      res.status(200).send("Email sent successfully!");
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});