/**
 * Email Service
 * Handles all transactional email sending using Nodemailer
 */

import nodemailer from "nodemailer";
import logger from "../config/logger.config.js";

// Email configuration
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "amanyadavmhow66@gmail.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
const COMPANY_NAME = "PLhub";

// Create reusable transporter
let transporter = null;

/**
 * Initialize the email transporter
 */
const initTransporter = () => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    logger.warn("Email credentials not configured. Email sending disabled.");
    return null;
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    // For other SMTP providers, use:
    // host: process.env.SMTP_HOST,
    // port: process.env.SMTP_PORT || 587,
    // secure: process.env.SMTP_SECURE === "true",
  });

  return transporter;
};

/**
 * Get email transporter (lazy initialization)
 */
const getTransporter = () => {
  if (!transporter) {
    initTransporter();
  }
  return transporter;
};

/**
 * Base HTML email template with modern, Netflix-inspired design
 */
const getBaseTemplate = (content, previewText = "") => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${COMPANY_NAME}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }
    
    .email-header {
      background: linear-gradient(135deg, #e50914 0%, #831010 100%);
      padding: 48px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .email-header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%);
      pointer-events: none;
    }
    
    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      padding: 16px 32px;
      border-radius: 12px;
      margin-bottom: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .logo {
      font-size: 36px;
      margin-right: 12px;
    }
    
    .logo-text {
      font-size: 32px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -1px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    
    .email-header h1 {
      color: #ffffff;
      font-size: 32px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.2);
      position: relative;
      z-index: 1;
    }
    
    .hero-emoji {
      font-size: 48px;
      display: block;
      margin-bottom: 16px;
      animation: float 3s ease-in-out infinite;
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    .email-body {
      padding: 48px 40px;
      background: #ffffff;
    }
    
    .email-body h2 {
      color: #0f0f0f;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 20px 0;
      letter-spacing: -0.5px;
    }
    
    .email-body h3 {
      color: #1a1a1a;
      font-size: 20px;
      font-weight: 600;
      margin: 32px 0 16px 0;
    }
    
    .email-body p {
      color: #4a4a4a;
      font-size: 16px;
      line-height: 1.8;
      margin: 0 0 16px 0;
    }
    
    .subtitle {
      color: #666;
      font-size: 18px;
      font-weight: 500;
      margin: -10px 0 24px 0;
    }
    
    .highlight-box {
      background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
      border: 2px solid #e50914;
      border-radius: 16px;
      padding: 32px;
      margin: 32px 0;
      position: relative;
      overflow: hidden;
    }
    
    .highlight-box::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(229,9,20,0.05) 0%, transparent 70%);
      pointer-events: none;
    }
    
    .highlight-box-content {
      position: relative;
      z-index: 1;
    }
    
    .button-primary {
      display: inline-block;
      background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      text-align: center;
      box-shadow: 0 8px 24px rgba(229, 9, 20, 0.3);
      transition: all 0.3s ease;
      border: none;
    }
    
    .button-secondary {
      display: inline-block;
      background: transparent;
      color: #e50914 !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 50px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      text-align: center;
      border: 2px solid #e50914;
      transition: all 0.3s ease;
    }
    
    .info-card {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      border-left: 4px solid #e50914;
    }
    
    .info-card-dark {
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
      border-radius: 12px;
      padding: 28px;
      margin: 24px 0;
      border: 1px solid rgba(229, 9, 20, 0.3);
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }
    
    .ticket-number {
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', 'Courier New', monospace;
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
      color: #e50914;
      padding: 16px 28px;
      border-radius: 12px;
      font-size: 24px;
      font-weight: 700;
      display: inline-block;
      letter-spacing: 2px;
      margin: 16px 0;
      border: 2px solid rgba(229, 9, 20, 0.2);
      box-shadow: 0 4px 16px rgba(229, 9, 20, 0.15);
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
      margin: 24px 0;
    }
    
    .feature-item {
      background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      transition: all 0.3s ease;
    }
    
    .feature-item-icon {
      font-size: 24px;
      margin-right: 12px;
      display: inline-block;
      vertical-align: middle;
    }
    
    .feature-item-text {
      display: inline-block;
      vertical-align: middle;
      color: #333;
      font-size: 15px;
      font-weight: 500;
      max-width: calc(100% - 40px);
    }
    
    .stats-row {
      display: flex;
      justify-content: space-around;
      margin: 32px 0;
      padding: 24px 0;
      border-top: 2px solid #e0e0e0;
      border-bottom: 2px solid #e0e0e0;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-number {
      font-size: 32px;
      font-weight: 800;
      color: #e50914;
      display: block;
      line-height: 1;
    }
    
    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 8px;
    }
    
    .table-info {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    
    .table-info tr {
      border-bottom: 1px solid #e0e0e0;
    }
    
    .table-info tr:last-child {
      border-bottom: none;
    }
    
    .table-info td {
      padding: 16px 0;
      vertical-align: top;
    }
    
    .table-info td:first-child {
      color: #666;
      font-weight: 500;
      width: 140px;
      font-size: 14px;
    }
    
    .table-info td:last-child {
      color: #1a1a1a;
      font-weight: 600;
    }
    
    .email-footer {
      background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
      padding: 48px 40px;
      text-align: center;
      color: #ffffff;
    }
    
    .footer-logo {
      font-size: 28px;
      font-weight: 800;
      color: #e50914;
      margin-bottom: 16px;
      letter-spacing: -0.5px;
    }
    
    .footer-tagline {
      color: #888;
      font-size: 15px;
      margin-bottom: 32px;
    }
    
    .social-icons {
      margin: 32px 0;
    }
    
    .social-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      margin: 0 8px;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 18px;
      transition: all 0.3s ease;
    }
    
    .social-icon:hover {
      background: #e50914;
      border-color: #e50914;
      transform: translateY(-2px);
    }
    
    .footer-links {
      margin: 24px 0;
    }
    
    .footer-links a {
      color: #888;
      text-decoration: none;
      margin: 0 12px;
      font-size: 13px;
      transition: color 0.3s ease;
    }
    
    .footer-links a:hover {
      color: #e50914;
    }
    
    .footer-copyright {
      color: #555;
      font-size: 13px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
      border: none;
      margin: 32px 0;
    }
    
    .timeline-item {
      position: relative;
      padding-left: 32px;
      margin: 20px 0;
    }
    
    .timeline-item::before {
      content: '';
      position: absolute;
      left: 6px;
      top: 6px;
      width: 12px;
      height: 12px;
      background: #e50914;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(229, 9, 20, 0.2);
    }
    
    .timeline-item::after {
      content: '';
      position: absolute;
      left: 11px;
      top: 22px;
      width: 2px;
      height: calc(100% + 10px);
      background: linear-gradient(180deg, #e50914 0%, transparent 100%);
    }
    
    .timeline-item:last-child::after {
      display: none;
    }
    
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
      color: #ffffff;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      
      .email-body, .email-header, .email-footer {
        padding: 32px 24px !important;
      }
      
      .email-body h2 {
        font-size: 24px;
      }
      
      .logo-container {
        padding: 12px 24px;
      }
      
      .logo-text {
        font-size: 28px;
      }
      
      .hero-emoji {
        font-size: 40px;
      }
      
      .stats-row {
        flex-direction: column;
        gap: 20px;
      }
      
      .button-primary, .button-secondary {
        display: block;
        padding: 14px 32px;
      }
    }
  </style>
</head>
<body>
  <div style="display: none; max-height: 0; overflow: hidden;">${previewText}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <div class="email-container">
          ${content}
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/**
 * Newsletter Subscription Confirmation Email - Premium Netflix-Style Design
 */
const getNewsletterWelcomeTemplate = (email) => {
  const content = `
    <div class="email-header">
      <div class="logo-container">
        <span class="logo">🎬</span>
        <span class="logo-text">${COMPANY_NAME}</span>
      </div>
      <span class="hero-emoji">🎉</span>
      <h1>Welcome to the Family!</h1>
    </div>
    
    <div class="email-body">
      <h2>You're In! Let's Make Movie Magic Together</h2>
      <p class="subtitle">Thank you for subscribing to our newsletter. You've just unlocked exclusive access to the ultimate entertainment experience.</p>
      
      <div class="highlight-box">
        <div class="highlight-box-content">
          <h3 style="margin-top: 0; color: #e50914; font-size: 22px;">🌟 What's Waiting For You</h3>
          
          <div class="feature-grid">
            <div class="feature-item">
              <span class="feature-item-icon">📺</span>
              <span class="feature-item-text"><strong>Weekly Curated Content</strong> - Handpicked movies and TV shows just for you</span>
            </div>
            
            <div class="feature-item">
              <span class="feature-item-icon">✨</span>
              <span class="feature-item-text"><strong>Personalized Recommendations</strong> - AI-powered suggestions based on your taste</span>
            </div>
            
            <div class="feature-item">
              <span class="feature-item-icon">🎭</span>
              <span class="feature-item-text"><strong>Behind the Scenes</strong> - Exclusive interviews and insider content</span>
            </div>
            
            <div class="feature-item">
              <span class="feature-item-icon">🚀</span>
              <span class="feature-item-text"><strong>Early Access</strong> - Be the first to know about new features and updates</span>
            </div>
            
            <div class="feature-item">
              <span class="feature-item-icon">🎁</span>
              <span class="feature-item-text"><strong>Special Promotions</strong> - Exclusive deals and premium content</span>
            </div>
            
            <div class="feature-item">
              <span class="feature-item-icon">📰</span>
              <span class="feature-item-text"><strong>Industry News</strong> - Latest updates from the entertainment world</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-number">50K+</span>
          <span class="stat-label">Movies & Shows</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">100K+</span>
          <span class="stat-label">Happy Members</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">24/7</span>
          <span class="stat-label">Access</span>
        </div>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${FRONTEND_URL}" class="button-primary">🍿 Start Exploring Now</a>
      </div>
      
      <div class="info-card">
        <p style="margin: 0; font-size: 15px; color: #666;">
          <strong style="color: #e50914;">📧 Subscribed Email:</strong> ${email}
        </p>
        <p style="margin: 12px 0 0 0; font-size: 13px; color: #888;">
          Manage your preferences or <a href="${FRONTEND_URL}/newsletter/unsubscribe?email=${encodeURIComponent(email)}" style="color: #e50914; text-decoration: underline;">unsubscribe here</a>
        </p>
      </div>
      
      <hr class="divider">
      
      <div style="text-align: center; margin-top: 32px;">
        <p style="color: #888; font-size: 14px; margin-bottom: 8px;">Follow us for daily updates</p>
        <div style="margin-top: 16px;">
          <a href="https://twitter.com/plhub" style="text-decoration: none; display: inline-block; margin: 0 6px;">
            <div style="background: linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%); color: white; padding: 10px 20px; border-radius: 25px; font-size: 13px; font-weight: 600;">
              🐦 Twitter
            </div>
          </a>
          <a href="https://instagram.com/plhub" style="text-decoration: none; display: inline-block; margin: 0 6px;">
            <div style="background: linear-gradient(135deg, #E1306C 0%, #C13584 100%); color: white; padding: 10px 20px; border-radius: 25px; font-size: 13px; font-weight: 600;">
              📸 Instagram
            </div>
          </a>
          <a href="https://youtube.com/@plhub" style="text-decoration: none; display: inline-block; margin: 0 6px;">
            <div style="background: linear-gradient(135deg, #FF0000 0%, #cc0000 100%); color: white; padding: 10px 20px; border-radius: 25px; font-size: 13px; font-weight: 600;">
              ▶️ YouTube
            </div>
          </a>
        </div>
      </div>
    </div>
    
    <div class="email-footer">
      <div class="footer-logo">${COMPANY_NAME}</div>
      <div class="footer-tagline">Your Ultimate Destination for Movies & TV Series</div>
      
      <div class="social-icons">
        <a href="https://twitter.com/plhub" class="social-icon">𝕏</a>
        <a href="https://instagram.com/plhub" class="social-icon">📷</a>
        <a href="https://youtube.com/@plhub" class="social-icon">▶</a>
        <a href="https://facebook.com/plhub" class="social-icon">f</a>
      </div>
      
      <div class="footer-links">
        <a href="${FRONTEND_URL}/about">About</a>
        <a href="${FRONTEND_URL}/help">Help Center</a>
        <a href="${FRONTEND_URL}/privacy-policy">Privacy</a>
        <a href="${FRONTEND_URL}/terms">Terms</a>
        <a href="${FRONTEND_URL}/contact">Contact</a>
      </div>
      
      <div class="footer-copyright">
        © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br>
        Entertainment reimagined. Stream smarter, not harder.
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, "🎉 Welcome to PLhub! Your premium entertainment experience starts now.");
};

/**
 * Contact Form Confirmation Email - Premium Support Design
 */
const getContactConfirmationTemplate = (data) => {
  const { name, email, subject, category, ticketNumber, message } = data;
  
  const content = `
    <div class="email-header">
      <div class="logo-container">
        <span class="logo">📬</span>
        <span class="logo-text">${COMPANY_NAME}</span>
      </div>
      <span class="hero-emoji">✅</span>
      <h1>Message Received Successfully!</h1>
    </div>
    
    <div class="email-body">
      <h2>Hey ${name}, We're On It! 👋</h2>
      <p class="subtitle">Your message has been received and logged in our system. Our support heroes are already reviewing your request.</p>
      
      <div class="info-card-dark">
        <p style="color: #888; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Your Support Ticket</p>
        <div class="ticket-number">${ticketNumber}</div>
        <p style="color: #888; font-size: 13px; margin: 16px 0 0 0;">
          💾 Save this number for tracking your request
        </p>
      </div>
      
      <div class="highlight-box">
        <div class="highlight-box-content">
          <h3 style="margin-top: 0; color: #e50914; font-size: 20px;">📋 Request Summary</h3>
          
          <table class="table-info">
            <tr>
              <td>Category</td>
              <td><span class="badge">${category}</span></td>
            </tr>
            <tr>
              <td>Subject</td>
              <td>${subject}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>${email}</td>
            </tr>
            <tr>
              <td>Submitted</td>
              <td>${new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
            <tr>
              <td style="vertical-align: top;">Message</td>
              <td style="color: #555; font-weight: 400; line-height: 1.6;">${message.substring(0, 250)}${message.length > 250 ? '...' : ''}</td>
            </tr>
          </table>
        </div>
      </div>
      
      <h3 style="color: #0f0f0f; margin-bottom: 24px;">🚀 What Happens Next?</h3>
      
      <div class="timeline-item">
        <strong style="color: #1a1a1a; display: block; margin-bottom: 4px;">Step 1: Ticket Review</strong>
        <p style="color: #666; font-size: 14px; margin: 0;">Our support team is reviewing your request (usually within 2-4 hours)</p>
      </div>
      
      <div class="timeline-item">
        <strong style="color: #1a1a1a; display: block; margin-bottom: 4px;">Step 2: Priority Assignment</strong>
        <p style="color: #666; font-size: 14px; margin: 0;">Your ticket will be assigned based on urgency and category</p>
      </div>
      
      <div class="timeline-item">
        <strong style="color: #1a1a1a; display: block; margin-bottom: 4px;">Step 3: Expert Response</strong>
        <p style="color: #666; font-size: 14px; margin: 0;">You'll receive a detailed response at <strong>${email}</strong></p>
      </div>
      
      <div class="timeline-item">
        <strong style="color: #1a1a1a; display: block; margin-bottom: 4px;">Step 4: Resolution</strong>
        <p style="color: #666; font-size: 14px; margin: 0;">We'll work with you until your issue is completely resolved</p>
      </div>
      
      <div class="info-card" style="margin-top: 32px; text-align: center;">
        <p style="margin: 0; color: #e50914; font-weight: 600; font-size: 16px;">⏱️ Expected Response Time</p>
        <p style="margin: 8px 0 0 0; font-size: 28px; font-weight: 800; color: #1a1a1a;">24-48 Hours</p>
        <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">Urgent issues may be prioritized</p>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${FRONTEND_URL}/help" class="button-primary">📚 Browse Help Center</a>
        <a href="${FRONTEND_URL}/faq" class="button-secondary">💬 View FAQs</a>
      </div>
      
      <hr class="divider">
      
      <div class="info-card" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left-color: #0ea5e9;">
        <p style="margin: 0; font-size: 15px; color: #0c4a6e;">
          <strong>💡 Pro Tip:</strong> To follow up on this ticket, simply reply to this email with your ticket number <code style="background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 4px; font-family: monospace;">${ticketNumber}</code> in the subject line.
        </p>
      </div>
    </div>
    
    <div class="email-footer">
      <div class="footer-logo">${COMPANY_NAME} Support</div>
      <div class="footer-tagline">We're Here to Help 24/7</div>
      
      <div class="social-icons">
        <a href="${FRONTEND_URL}/help" class="social-icon">?</a>
        <a href="${FRONTEND_URL}/faq" class="social-icon">💬</a>
        <a href="${FRONTEND_URL}/contact" class="social-icon">📧</a>
        <a href="https://twitter.com/plhub" class="social-icon">𝕏</a>
      </div>
      
      <div class="footer-links">
        <a href="${FRONTEND_URL}/help">Help Center</a>
        <a href="${FRONTEND_URL}/faq">FAQs</a>
        <a href="${FRONTEND_URL}/contact">Contact</a>
        <a href="${FRONTEND_URL}/privacy-policy">Privacy</a>
        <a href="${FRONTEND_URL}/terms">Terms</a>
      </div>
      
      <div class="footer-copyright">
        © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br>
        Your satisfaction is our mission.
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `✅ Message Received! Ticket ${ticketNumber} - We'll respond within 24-48 hours`);
};

/**
 * Job Application Confirmation Email - Premium Recruitment Design
 */
const getJobApplicationTemplate = (data) => {
  const { name, email, position, applicationId } = data;
  
  const content = `
    <div class="email-header">
      <div class="logo-container">
        <span class="logo">💼</span>
        <span class="logo-text">${COMPANY_NAME}</span>
      </div>
      <span class="hero-emoji">🎉</span>
      <h1>Application Submitted!</h1>
    </div>
    
    <div class="email-body">
      <h2>Fantastic News, ${name}! 🚀</h2>
      <p class="subtitle">Your application has been successfully submitted and is now in the hands of our talented recruitment team.</p>
      
      <div class="info-card-dark">
        <p style="color: #888; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Application ID</p>
        <div class="ticket-number">${applicationId}</div>
        <p style="color: #888; font-size: 13px; margin: 16px 0 0 0;">
          💼 Reference this ID for application tracking
        </p>
      </div>
      
      <div class="highlight-box">
        <div class="highlight-box-content">
          <h3 style="margin-top: 0; color: #e50914; font-size: 22px;">🎯 Your Application</h3>
          
          <table class="table-info">
            <tr>
              <td>Position</td>
              <td style="font-size: 18px; color: #e50914;">${position}</td>
            </tr>
            <tr>
              <td>Applicant</td>
              <td>${name}</td>
            </tr>
            <tr>
              <td>Email</td>
              <td>${email}</td>
            </tr>
            <tr>
              <td>Submitted</td>
              <td>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td><span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">Under Review</span></td>
            </tr>
          </table>
        </div>
      </div>
      
      <h3 style="color: #0f0f0f; margin-bottom: 24px;">📍 Your Journey With Us</h3>
      
      <div class="timeline-item">
        <strong style="color: #e50914; display: block; margin-bottom: 4px;">✓ Application Received</strong>
        <p style="color: #666; font-size: 14px; margin: 0;">Your application has been successfully submitted and logged</p>
      </div>
      
      <div class="timeline-item">
        <strong style="color: #1a1a1a; display: block; margin-bottom: 4px;">1. Initial Review (1-2 weeks)</strong>
        <p style="color: #666; font-size: 14px; margin: 0;">Our recruitment team will carefully review your profile and experience</p>
      </div>
      
      <div class="timeline-item">
        <strong style="color: #1a1a1a; display: block; margin-bottom: 4px;">2. Phone Screening (If Selected)</strong>
        <p style="color: #666; font-size: 14px; margin: 0;">A brief call to discuss your background and the role in detail</p>
      </div>
      
      <div class="timeline-item">
        <strong style="color: #1a1a1a; display: block; margin-bottom: 4px;">3. Interview Process</strong>
        <p style="color: #666; font-size: 14px; margin: 0;">Meet with the hiring manager and team members</p>
      </div>
      
      <div class="timeline-item">
        <strong style="color: #1a1a1a; display: block; margin-bottom: 4px;">4. Final Decision</strong>
        <p style="color: #666; font-size: 14px; margin: 0;">We'll make our decision and notify you regardless of the outcome</p>
      </div>
      
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-number">1-2</span>
          <span class="stat-label">Weeks Response</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">100%</span>
          <span class="stat-label">Feedback</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">24/7</span>
          <span class="stat-label">Support</span>
        </div>
      </div>
      
      <div class="info-card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left-color: #f59e0b;">
        <h4 style="margin: 0 0 12px 0; color: #92400e;">⭐ While You Wait...</h4>
        <div style="color: #78350f; font-size: 14px; line-height: 1.8;">
          <p style="margin: 0 0 8px 0;"><strong>🏢 Explore our company:</strong> Learn about our mission, values, and culture</p>
          <p style="margin: 0 0 8px 0;"><strong>🤝 Connect with us:</strong> Follow us on LinkedIn, Twitter, and Instagram</p>
          <p style="margin: 0 0 8px 0;"><strong>🎬 Try our platform:</strong> Experience what makes ${COMPANY_NAME} special</p>
          <p style="margin: 0;"><strong>📚 Read our blog:</strong> Stay updated with industry insights</p>
        </div>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${FRONTEND_URL}/about" class="button-primary">🌟 Discover ${COMPANY_NAME}</a>
        <a href="${FRONTEND_URL}/careers" class="button-secondary">💼 View Open Positions</a>
      </div>
      
      <hr class="divider">
      
      <div class="info-card" style="text-align: center;">
        <p style="margin: 0; font-size: 15px; color: #666;">
          <strong style="color: #1a1a1a;">Questions about your application?</strong><br>
          <span style="font-size: 14px;">Contact our talent team at </span>
          <a href="mailto:careers@plhub.com" style="color: #e50914; text-decoration: none; font-weight: 600;">careers@plhub.com</a>
        </p>
      </div>
      
      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 24px; border-radius: 12px; margin-top: 32px; text-align: center;">
        <p style="margin: 0; font-size: 18px; font-weight: 700; color: #166534;">🍀 Good Luck!</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #15803d;">We're excited to learn more about you and your potential contribution to our team.</p>
      </div>
    </div>
    
    <div class="email-footer">
      <div class="footer-logo">${COMPANY_NAME} Careers</div>
      <div class="footer-tagline">Building the Future of Entertainment Together</div>
      
      <div class="social-icons">
        <a href="https://linkedin.com/company/plhub" class="social-icon">in</a>
        <a href="https://twitter.com/plhub" class="social-icon">𝕏</a>
        <a href="${FRONTEND_URL}/careers" class="social-icon">💼</a>
        <a href="${FRONTEND_URL}/about" class="social-icon">ℹ</a>
      </div>
      
      <div class="footer-links">
        <a href="${FRONTEND_URL}/careers">Careers</a>
        <a href="${FRONTEND_URL}/about">About Us</a>
        <a href="${FRONTEND_URL}/press">Press</a>
        <a href="https://linkedin.com/company/plhub">LinkedIn</a>
        <a href="${FRONTEND_URL}/contact">Contact</a>
      </div>
      
      <div class="footer-copyright">
        © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br>
        Diversity and inclusion are at the heart of everything we do.
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `🎉 Application Received for ${position}! ID: ${applicationId} - Next steps inside`);
};

/**
 * Send email helper function
 */
const sendEmail = async (to, subject, html) => {
  const transport = getTransporter();
  
  if (!transport) {
    logger.warn("Email not sent - transporter not configured", { to, subject });
    return { success: false, error: "Email service not configured" };
  }

  try {
    const mailOptions = {
      from: `"${COMPANY_NAME}" <${EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const info = await transport.sendMail(mailOptions);
    logger.info("Email sent successfully", { to, subject, messageId: info.messageId });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Failed to send email", { to, subject, error: error.message });
    return { success: false, error: error.message };
  }
};

/**
 * Send newsletter welcome email
 */
const sendNewsletterWelcome = async (email) => {
  const html = getNewsletterWelcomeTemplate(email);
  return sendEmail(email, "🎬 Welcome to PLhub Newsletter!", html);
};

/**
 * Send contact form confirmation email
 */
const sendContactConfirmation = async (data) => {
  const html = getContactConfirmationTemplate(data);
  return sendEmail(data.email, `📬 We've Received Your Message [${data.ticketNumber}]`, html);
};

/**
 * Send job application confirmation email
 */
const sendJobApplicationConfirmation = async (data) => {
  const html = getJobApplicationTemplate(data);
  return sendEmail(data.email, `💼 Application Received - ${data.position}`, html);
};

/**
 * Admin Notification Email Templates
 */

/**
 * Newsletter Subscription Notification to Admin - Clean Dashboard Style
 */
const getAdminNewsletterNotificationTemplate = (data) => {
  const { email, source, subscribedAt } = data;
  
  const content = `
    <div class="email-header">
      <div class="logo-container">
        <span class="logo">📧</span>
        <span class="logo-text">ADMIN</span>
      </div>
      <h1>New Newsletter Subscription</h1>
    </div>
    
    <div class="email-body">
      <div class="badge" style="margin-bottom: 20px;">NEW SUBSCRIBER</div>
      <h2>Newsletter Subscription Alert</h2>
      <p>A new user has joined the ${COMPANY_NAME} newsletter community.</p>
      
      <div class="highlight-box">
        <div class="highlight-box-content">
          <h3 style="margin-top: 0; color: #e50914;">📊 Subscription Details</h3>
          
          <table class="table-info">
            <tr>
              <td>Subscriber Email</td>
              <td style="font-family: monospace; color: #e50914;">${email}</td>
            </tr>
            <tr>
              <td>Source</td>
              <td><span style="background: #f3f4f6; padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">${source}</span></td>
            </tr>
            <tr>
              <td>Date & Time</td>
              <td>${new Date(subscribedAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date(subscribedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td><span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">ACTIVE</span></td>
            </tr>
          </table>
        </div>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="mailto:${email}" class="button-primary">📧 Contact Subscriber</a>
      </div>
      
      <div class="info-card" style="background: #f0f9ff; border-left-color: #0ea5e9;">
        <p style="margin: 0; font-size: 14px; color: #0c4a6e;">
          <strong>📈 Action Required:</strong> Welcome email has been automatically sent to the subscriber.
        </p>
      </div>
    </div>
    
    <div class="email-footer">
      <div class="footer-logo">${COMPANY_NAME} Admin</div>
      <div class="footer-tagline">Automated System Notification</div>
      <div class="footer-copyright" style="margin-top: 24px;">
        © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br>
        This is an automated notification. Do not reply to this email.
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `🔔 New newsletter subscription from ${email}`);
};

/**
 * Contact Form Notification to Admin - Support Dashboard Style
 */
const getAdminContactNotificationTemplate = (data) => {
  const { name, email, subject, category, message, ticketNumber } = data;
  
  // Get priority badge based on category
  const getPriorityBadge = (cat) => {
    const priorities = {
      'Technical Issue': { color: '#dc2626', label: 'HIGH PRIORITY' },
      'Billing': { color: '#ea580c', label: 'URGENT' },
      'Account': { color: '#f59e0b', label: 'MEDIUM' },
      'default': { color: '#6b7280', label: 'NORMAL' }
    };
    const priority = priorities[cat] || priorities.default;
    return `<span style="background: ${priority.color}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;">${priority.label}</span>`;
  };
  
  const content = `
    <div class="email-header">
      <div class="logo-container">
        <span class="logo">📬</span>
        <span class="logo-text">SUPPORT</span>
      </div>
      <h1>New Support Ticket</h1>
    </div>
    
    <div class="email-body">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div class="badge">NEW TICKET</div>
        ${getPriorityBadge(category)}
      </div>
      
      <h2>Contact Form Submission</h2>
      <p>A new support ticket has been created and requires your attention.</p>
      
      <div class="info-card-dark">
        <p style="color: #888; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Ticket Number</p>
        <div class="ticket-number">${ticketNumber}</div>
      </div>
      
      <div class="highlight-box">
        <div class="highlight-box-content">
          <h3 style="margin-top: 0; color: #e50914;">📋 Ticket Information</h3>
          
          <table class="table-info">
            <tr>
              <td>Customer Name</td>
              <td style="font-weight: 700; color: #1a1a1a;">${name}</td>
            </tr>
            <tr>
              <td>Email Address</td>
              <td><a href="mailto:${email}" style="color: #e50914; text-decoration: none; font-weight: 600;">${email}</a></td>
            </tr>
            <tr>
              <td>Category</td>
              <td><span style="background: #f3f4f6; padding: 6px 14px; border-radius: 6px; font-weight: 600;">${category}</span></td>
            </tr>
            <tr>
              <td>Subject</td>
              <td style="font-weight: 600; color: #1a1a1a;">${subject}</td>
            </tr>
            <tr>
              <td>Submitted</td>
              <td>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
          </table>
        </div>
      </div>
      
      <div class="info-card" style="background: #fef3c7; border-left-color: #f59e0b;">
        <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">💬 Customer Message</h4>
        <div style="background: white; padding: 16px; border-radius: 8px; color: #1a1a1a; line-height: 1.7; white-space: pre-wrap; font-size: 15px;">
${message}
        </div>
      </div>
      
      <div class="info-card" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left-color: #dc2626;">
        <p style="margin: 0; color: #991b1b; font-weight: 600; font-size: 15px;">
          ⏰ <strong>Action Required:</strong> Please respond within 24-48 hours to maintain service quality standards.
        </p>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)} [${ticketNumber}]&body=Hi ${encodeURIComponent(name)},%0D%0A%0D%0AThank you for contacting ${COMPANY_NAME} support.%0D%0A%0D%0A" class="button-primary">✉️ Reply to Customer</a>
      </div>
      
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-number">24-48</span>
          <span class="stat-label">Hours SLA</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${category}</span>
          <span class="stat-label">Category</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">NEW</span>
          <span class="stat-label">Status</span>
        </div>
      </div>
    </div>
    
    <div class="email-footer">
      <div class="footer-logo">${COMPANY_NAME} Support Admin</div>
      <div class="footer-tagline">Customer Support Dashboard Notification</div>
      <div class="footer-copyright" style="margin-top: 24px;">
        © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br>
        This is an automated notification. Do not reply to this email.
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `🔔 New Support Ticket ${ticketNumber} - ${category} - Action Required`);
};

/**
 * Job Application Notification to Admin - Recruitment Dashboard Style
 */
const getAdminJobApplicationNotificationTemplate = (data) => {
  const { name, email, position, experience, linkedinUrl, portfolioUrl, coverLetter, applicationId } = data;
  
  const content = `
    <div class="email-header">
      <div class="logo-container">
        <span class="logo">💼</span>
        <span class="logo-text">RECRUITMENT</span>
      </div>
      <h1>New Job Application</h1>
    </div>
    
    <div class="email-body">
      <div class="badge" style="margin-bottom: 20px;">NEW CANDIDATE</div>
      <h2>Application Received for Review</h2>
      <p>A qualified candidate has applied for an open position and is awaiting your review.</p>
      
      <div class="info-card-dark">
        <p style="color: #888; font-size: 14px; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Application ID</p>
        <div class="ticket-number">${applicationId}</div>
      </div>
      
      <div class="highlight-box">
        <div class="highlight-box-content">
          <h3 style="margin-top: 0; color: #e50914; font-size: 22px;">👤 Candidate Profile</h3>
          
          <table class="table-info">
            <tr>
              <td>Position Applied</td>
              <td style="font-size: 18px; font-weight: 700; color: #e50914;">${position}</td>
            </tr>
            <tr>
              <td>Full Name</td>
              <td style="font-weight: 700; color: #1a1a1a;">${name}</td>
            </tr>
            <tr>
              <td>Email Address</td>
              <td><a href="mailto:${email}" style="color: #e50914; text-decoration: none; font-weight: 600;">${email}</a></td>
            </tr>
            ${experience ? `
            <tr>
              <td>Experience Level</td>
              <td><span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">${experience} Years</span></td>
            </tr>
            ` : ''}
            ${linkedinUrl ? `
            <tr>
              <td>LinkedIn Profile</td>
              <td><a href="${linkedinUrl}" target="_blank" style="color: #0077b5; text-decoration: none; font-weight: 600;">🔗 View Profile</a></td>
            </tr>
            ` : ''}
            ${portfolioUrl ? `
            <tr>
              <td>Portfolio/Website</td>
              <td><a href="${portfolioUrl}" target="_blank" style="color: #e50914; text-decoration: none; font-weight: 600;">🌐 Visit Portfolio</a></td>
            </tr>
            ` : ''}
            <tr>
              <td>Applied On</td>
              <td>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td><span style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">PENDING REVIEW</span></td>
            </tr>
          </table>
        </div>
      </div>
      
      ${coverLetter ? `
      <div class="info-card" style="background: #f0fdf4; border-left-color: #10b981;">
        <h4 style="margin: 0 0 16px 0; color: #065f46; font-size: 16px;">📝 Cover Letter</h4>
        <div style="background: white; padding: 20px; border-radius: 8px; color: #1a1a1a; line-height: 1.8; white-space: pre-wrap; font-size: 15px; max-height: 300px; overflow-y: auto;">
${coverLetter}
        </div>
      </div>
      ` : ''}
      
      <div class="stats-row">
        <div class="stat-item">
          <span class="stat-number">📧</span>
          <span class="stat-label">Contact Available</span>
        </div>
        ${linkedinUrl ? `
        <div class="stat-item">
          <span class="stat-number">💼</span>
          <span class="stat-label">LinkedIn Profile</span>
        </div>
        ` : ''}
        ${portfolioUrl ? `
        <div class="stat-item">
          <span class="stat-number">🌐</span>
          <span class="stat-label">Portfolio</span>
        </div>
        ` : ''}
        <div class="stat-item">
          <span class="stat-number">NEW</span>
          <span class="stat-label">Application</span>
        </div>
      </div>
      
      <div class="info-card" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left-color: #f59e0b;">
        <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">⚡ Quick Actions</h4>
        <div style="color: #78350f; font-size: 14px; line-height: 1.8;">
          <p style="margin: 0 0 8px 0;">✅ Review the candidate's qualifications and experience</p>
          <p style="margin: 0 0 8px 0;">🔍 Check their LinkedIn profile and portfolio (if provided)</p>
          <p style="margin: 0 0 8px 0;">📧 Schedule a phone screening if they're a good fit</p>
          <p style="margin: 0;">📝 Update the application status in your ATS system</p>
        </div>
      </div>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="mailto:${email}?subject=Re: Your Application for ${encodeURIComponent(position)} [${applicationId}]&body=Hi ${encodeURIComponent(name)},%0D%0A%0D%0AThank you for your interest in the ${encodeURIComponent(position)} position at ${COMPANY_NAME}.%0D%0A%0D%0A" class="button-primary">📧 Contact Candidate</a>
        ${linkedinUrl ? `<a href="${linkedinUrl}" target="_blank" class="button-secondary">💼 View LinkedIn</a>` : ''}
      </div>
      
      <div class="info-card" style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-left-color: #3b82f6; text-align: center;">
        <p style="margin: 0; color: #1e40af; font-weight: 600; font-size: 15px;">
          📊 <strong>Next Steps:</strong> Review this application and update the candidate within 1-2 weeks to maintain a positive candidate experience.
        </p>
      </div>
    </div>
    
    <div class="email-footer">
      <div class="footer-logo">${COMPANY_NAME} Recruitment</div>
      <div class="footer-tagline">Talent Acquisition Dashboard Notification</div>
      <div class="footer-copyright" style="margin-top: 24px;">
        © ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.<br>
        This is an automated notification. Do not reply to this email.
      </div>
    </div>
  `;
  
  return getBaseTemplate(content, `🔔 New Application for ${position} - ${name} [${applicationId}]`);
};

/**
 * Send admin notification for newsletter subscription
 */
const sendAdminNewsletterNotification = async (data) => {
  if (!ADMIN_EMAIL) {
    logger.warn("Admin email not configured, skipping notification");
    return { success: false, error: "Admin email not configured" };
  }
  
  const html = getAdminNewsletterNotificationTemplate(data);
  return sendEmail(ADMIN_EMAIL, `📧 New Newsletter Subscription - ${data.email}`, html);
};

/**
 * Send admin notification for contact form
 */
const sendAdminContactNotification = async (data) => {
  if (!ADMIN_EMAIL) {
    logger.warn("Admin email not configured, skipping notification");
    return { success: false, error: "Admin email not configured" };
  }
  
  const html = getAdminContactNotificationTemplate(data);
  return sendEmail(ADMIN_EMAIL, `📬 New Contact Form [${data.ticketNumber}] - ${data.category}`, html);
};

/**
 * Send admin notification for job application
 */
const sendAdminJobApplicationNotification = async (data) => {
  if (!ADMIN_EMAIL) {
    logger.warn("Admin email not configured, skipping notification");
    return { success: false, error: "Admin email not configured" };
  }
  
  const html = getAdminJobApplicationNotificationTemplate(data);
  return sendEmail(ADMIN_EMAIL, `💼 New Job Application [${data.applicationId}] - ${data.position}`, html);
};

export default {
  sendEmail,
  sendNewsletterWelcome,
  sendContactConfirmation,
  sendJobApplicationConfirmation,
  sendAdminNewsletterNotification,
  sendAdminContactNotification,
  sendAdminJobApplicationNotification,
  getTransporter,
};

