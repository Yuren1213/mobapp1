import bcrypt from "bcryptjs";
import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken"; 
import User from "../models/user.js";

const router = express.Router();

// EMAIL TRANSPORTER (Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// 🔑 AUTH MIDDLEWARE
const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "⚠️ No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "⚠️ User not found" });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: "⚠️ Invalid token", error: err.message });
  }
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, city, barangay } = req.body;

    if (!name || !email || !password || !city || !barangay) {
      return res.status(400).json({ message: "⚠️ All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "⚠️ Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      city,
      barangay,
    });

    await newUser.save();
    res.status(201).json({ message: "✅ User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "⚠️ Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "❌ User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "❌ Invalid credentials" });

    // ✅ generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ message: "✅ Login successful", user: safeUser, token });
  } catch (err) {
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

// GET CURRENT USER (Protected)
router.get("/me", auth, (req, res) => {
  res.json(req.user);
});

// REQUEST PASSWORD RESET
router.post("/request-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "⚠️ Email is required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "❌ User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = Date.now() + 1000 * 60 * 60;

    user.resetToken = token;
    user.resetExpires = new Date(expires);
    await user.save();

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
      from: `"Cantina App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested a password reset. Click the link below:</p>
        <a href="${resetLink}">${resetLink}</a>
        <p>This link will expire in 1 hour.</p>
      `,
    });

    res.json({ message: "✅ Password reset email sent to your Gmail." });
  } catch (err) {
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

// RESET PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: "⚠️ Token and new password required" });
    }

    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "❌ Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetExpires = undefined;
    await user.save();

    res.json({ message: "✅ Password has been reset. Please log in again." });
  } catch (err) {
    res.status(500).json({ message: "❌ Server error", error: err.message });
  }
});

export default router;
