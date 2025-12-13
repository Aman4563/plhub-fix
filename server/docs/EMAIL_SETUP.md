# Email Configuration Guide for PLhub

This guide will help you set up email functionality for PLhub, including transactional emails (confirmation, notifications) sent to users and admin notifications.

## 📧 Features

Once configured, the system will send:

### User Emails (Beautiful, Professional HTML Emails)
- ✅ **Newsletter Welcome Email** - When users subscribe to the newsletter
- ✅ **Contact Form Confirmation** - With ticket number and expected response time
- ✅ **Job Application Confirmation** - With application ID and next steps

### Admin Notifications (to amanyadavmhow66@gmail.com)
- 🔔 **Newsletter Subscription Alerts** - Get notified of new subscribers
- 🔔 **Contact Form Submissions** - With full details to respond quickly
- 🔔 **Job Applications** - With candidate info and application details

---

## 🚀 Quick Setup (Gmail)

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **"Security"** in the left sidebar
3. Under "Signing in to Google", click on **"2-Step Verification"**
4. Follow the prompts to enable 2FA

### Step 2: Create an App Password

1. Go to: https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. In the "Select app" dropdown, choose **"Mail"**
4. In the "Select device" dropdown, choose **"Other (Custom name)"**
5. Type **"PLhub Server"** as the name
6. Click **"Generate"**
7. **Copy the 16-character password** that appears (remove spaces)

### Step 3: Configure Environment Variables

1. Open or create `server/.env` file in your project
2. Add the following configuration:

```env
# Email Configuration
EMAIL_USER=your_gmail_address@gmail.com
EMAIL_PASS=your_16_character_app_password

# Admin Email (receives all notifications)
ADMIN_EMAIL=amanyadavmhow66@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Example:**
```env
EMAIL_USER=plhub.notifications@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop

ADMIN_EMAIL=amanyadavmhow66@gmail.com

FRONTEND_URL=http://localhost:3000
```

### Step 4: Restart the Server

```bash
# Stop the current server (Ctrl+C)
# Then start it again
cd server
npm start
```

---

## 🎨 Email Templates

All emails are professionally designed with:
- 🎬 PLhub branding with gradient headers
- 📱 Mobile-responsive design
- 🌙 Dark mode support
- 🔗 Social media links
- 🔒 Privacy policy and unsubscribe links
- ✨ Beautiful typography and spacing

---

## 🧪 Testing the Email System

### Test 1: Newsletter Subscription

1. Go to http://localhost:3000
2. Scroll to the footer
3. Enter an email address in the newsletter form
4. Click "Subscribe"
5. **Check both inboxes:**
   - User email should receive a welcome email
   - `amanyadavmhow66@gmail.com` should receive a notification

### Test 2: Contact Form

1. Go to http://localhost:3000/contact
2. Fill out the contact form
3. Submit
4. **Check both inboxes:**
   - User email should receive a confirmation with ticket number
   - `amanyadavmhow66@gmail.com` should receive the full submission details

### Test 3: Job Application

1. Go to http://localhost:3000/careers
2. Click "Apply Now" on any job listing
3. Fill out the application form
4. Submit
5. **Check both inboxes:**
   - Applicant email should receive a confirmation with application ID
   - `amanyadavmhow66@gmail.com` should receive the application details

---

## 🔧 Troubleshooting

### Problem: "connect ETIMEDOUT" Error

**Cause:** Email credentials not configured or incorrect

**Solution:**
1. Make sure you created an App Password (not your regular Gmail password)
2. Check that `.env` file exists in the `server/` directory
3. Verify `EMAIL_USER` and `EMAIL_PASS` are correct
4. Restart the server after making changes

### Problem: "Invalid login" Error

**Cause:** Using regular password instead of App Password

**Solution:**
1. Generate a new App Password from https://myaccount.google.com/apppasswords
2. Copy the 16-character code
3. Update `EMAIL_PASS` in `.env` (remove spaces from the code)
4. Restart the server

### Problem: Emails Go to Spam

**Solution:**
1. Mark the first email as "Not Spam"
2. Add the sender to your contacts
3. Create a filter to never send PLhub emails to spam

### Problem: Admin Not Receiving Notifications

**Solution:**
1. Check that `ADMIN_EMAIL` is set in `.env`
2. Verify the email address is correct
3. Check spam folder
4. Check server logs for email sending errors

---

## 📊 Email Logs

The server logs all email activities:

**Success:**
```
]: Email sent successfully {"to":"user@example.com","subject":"Welcome to PLhub","messageId":"..."}
```

**Failure:**
```
[error]: Failed to send email {"to":"user@example.com","subject":"...","error":"..."}
```

Check the server terminal for these logs after testing.

---

## 🔒 Security Best Practices

1. ✅ **Never commit `.env` file** - It contains sensitive credentials
2. ✅ **Use App Passwords** - Don't use your main Gmail password
3. ✅ **Rotate credentials** - Change App Password periodically
4. ✅ **Revoke unused passwords** - Delete old App Passwords from your Google Account

---

## 🌟 Alternative Email Services

If you don't want to use Gmail, you can configure other providers:

### SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com/
2. Get your API key
3. Update `server/src/utils/email.service.js`:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY
  }
});
```

### Mailgun

1. Sign up at https://www.mailgun.com/
2. Get your credentials
3. Update email service configuration

### AWS SES (Amazon Simple Email Service)

1. Set up AWS SES
2. Verify your domain
3. Use aws-sdk with nodemailer

---

## 📞 Support

If you encounter issues:

1. Check server logs in the terminal
2. Verify `.env` configuration
3. Test with a simple test email script
4. Check Gmail App Password settings

---

## ✅ Configuration Checklist

- [ ] 2FA enabled on Gmail
- [ ] App Password generated
- [ ] `.env` file created in `server/` directory
- [ ] `EMAIL_USER` configured
- [ ] `EMAIL_PASS` configured
- [ ] `ADMIN_EMAIL` set to `amanyadavmhow66@gmail.com`
- [ ] Server restarted
- [ ] Tested newsletter subscription
- [ ] Tested contact form
- [ ] Tested job application
- [ ] Verified both user and admin receive emails

---

**Last Updated:** December 2025  
**Version:** 1.0.0

