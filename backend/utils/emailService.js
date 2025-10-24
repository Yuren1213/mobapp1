import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER, // your gmail
    pass: process.env.GMAIL_PASS, // your app password
  },
});

/**
 * Send Email
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} text - plain text message
 * @param {string} html - html message  
 */

export const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: `"MobApp Support" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📩 Email sent: " + info.response);
  } catch (err) {
    console.error("❌ Email error:", err);
    throw err;
  }
};
