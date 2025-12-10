/**
 * Email Templates
 * Professional HTML templates for transactional emails
 * Consistent with PLHub dark theme branding
 */

const brandColor = "#ff4136";
const darkBg = "#0f0f1a";
const cardBg = "#1a1a2e";
const textPrimary = "#ffffff";
const textSecondary = "#a0a0a0";
const borderColor = "#2d2d44";

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  background-color: ${cardBg};
  color: ${textPrimary};
  border-radius: 12px;
  overflow: hidden;
`;

const headerStyles = `
  background: linear-gradient(135deg, ${brandColor} 0%, #c41230 100%);
  padding: 40px 30px;
  text-align: center;
`;

const contentStyles = `
  padding: 40px 30px;
`;

const buttonStyles = `
  display: inline-block;
  padding: 16px 32px;
  background: linear-gradient(135deg, ${brandColor} 0%, #c41230 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const footerStyles = `
  padding: 30px;
  background-color: #141424;
  border-top: 1px solid ${borderColor};
  text-align: center;
`;

const iconCircleStyles = `
  width: 60px;
  height: 60px;
  background-color: rgba(255, 65, 54, 0.15);
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

/**
 * Email Verification Template
 */
export const emailVerificationTemplate = ({ displayName, verificationUrl, expiresIn = '24 hours' }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - PLHub</title>
</head>
<body style="margin: 0; padding: 30px; background-color: ${darkBg};">
  <div style="${baseStyles}">
    <!-- Header -->
    <div style="${headerStyles}">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">PLHub</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Movie & TV Discovery Platform</p>
    </div>
    
    <!-- Content -->
    <div style="${contentStyles}">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="${iconCircleStyles}">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <h2 style="color: ${textPrimary}; margin: 0 0 10px; font-size: 24px; font-weight: 600;">
          Verify Your Email
        </h2>
        <p style="color: ${textSecondary}; margin: 0; font-size: 16px;">
          Welcome to PLHub, ${displayName}!
        </p>
      </div>
      
      <p style="color: ${textSecondary}; line-height: 1.7; font-size: 15px; margin: 0 0 25px;">
        Thanks for signing up! Please verify your email address to complete your registration 
        and unlock all features. Click the button below to get started.
      </p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${verificationUrl}" style="${buttonStyles}">
          Verify Email Address
        </a>
      </div>
      
      <div style="background-color: rgba(255,255,255,0.03); border-radius: 8px; padding: 20px; margin-top: 30px;">
        <p style="color: ${textSecondary}; font-size: 13px; margin: 0; line-height: 1.6;">
          <strong style="color: ${textPrimary};">Link expires in ${expiresIn}.</strong><br>
          If you didn't create an account with PLHub, you can safely ignore this email.
        </p>
      </div>
      
      <p style="color: ${textSecondary}; font-size: 12px; margin-top: 25px; line-height: 1.6;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: ${brandColor}; word-break: break-all; font-size: 11px;">
          ${verificationUrl}
        </a>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="${footerStyles}">
      <p style="color: ${textSecondary}; font-size: 12px; margin: 0 0 8px;">
        &copy; ${new Date().getFullYear()} PLHub. All rights reserved.
      </p>
      <p style="color: ${textSecondary}; font-size: 11px; margin: 0;">
        This is an automated message. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Welcome Email Template (sent after email verification)
 */
export const welcomeEmailTemplate = ({ displayName, loginUrl }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to PLHub!</title>
</head>
<body style="margin: 0; padding: 30px; background-color: ${darkBg};">
  <div style="${baseStyles}">
    <!-- Header -->
    <div style="${headerStyles}">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">PLHub</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Movie & TV Discovery Platform</p>
    </div>
    
    <!-- Content -->
    <div style="${contentStyles}">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="${iconCircleStyles}">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h2 style="color: ${textPrimary}; margin: 0 0 10px; font-size: 24px; font-weight: 600;">
          Welcome Aboard!
        </h2>
        <p style="color: ${textSecondary}; margin: 0; font-size: 16px;">
          Your account is now fully activated, ${displayName}
        </p>
      </div>
      
      <p style="color: ${textSecondary}; line-height: 1.7; font-size: 15px; margin: 0 0 25px;">
        Your email has been verified and you're all set to explore PLHub. 
        Here's what you can do:
      </p>
      
      <!-- Features Grid -->
      <div style="margin: 30px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${borderColor};">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <div style="width: 32px; height: 32px; background-color: rgba(255,65,54,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="${brandColor}">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
                        <line x1="7" y1="2" x2="7" y2="22" stroke="${cardBg}" stroke-width="2"/>
                        <line x1="17" y1="2" x2="17" y2="22" stroke="${cardBg}" stroke-width="2"/>
                        <line x1="2" y1="12" x2="22" y2="12" stroke="${cardBg}" stroke-width="2"/>
                        <line x1="2" y1="7" x2="22" y2="7" stroke="${cardBg}" stroke-width="2"/>
                        <line x1="2" y1="17" x2="22" y2="17" stroke="${cardBg}" stroke-width="2"/>
                      </svg>
                    </div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${textPrimary}; font-weight: 600; margin: 0 0 2px; font-size: 14px;">Discover</p>
                    <p style="color: ${textSecondary}; margin: 0; font-size: 13px;">Browse thousands of movies and TV shows</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${borderColor};">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <div style="width: 32px; height: 32px; background-color: rgba(255,65,54,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="${brandColor}">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${textPrimary}; font-weight: 600; margin: 0 0 2px; font-size: 14px;">Favorites</p>
                    <p style="color: ${textSecondary}; margin: 0; font-size: 13px;">Save your favorite content for later</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${borderColor};">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <div style="width: 32px; height: 32px; background-color: rgba(255,65,54,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="${brandColor}">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                    </div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${textPrimary}; font-weight: 600; margin: 0 0 2px; font-size: 14px;">Reviews</p>
                    <p style="color: ${textSecondary}; margin: 0; font-size: 13px;">Share your thoughts with the community</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 40px; vertical-align: top;">
                    <div style="width: 32px; height: 32px; background-color: rgba(255,65,54,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </div>
                  </td>
                  <td style="padding-left: 12px;">
                    <p style="color: ${textPrimary}; font-weight: 600; margin: 0 0 2px; font-size: 14px;">Search</p>
                    <p style="color: ${textSecondary}; margin: 0; font-size: 13px;">Find exactly what you're looking for</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${loginUrl}" style="${buttonStyles}">
          Start Exploring
        </a>
      </div>
      
      <p style="color: ${textSecondary}; font-size: 14px; margin-top: 30px; text-align: center;">
        Need help? Visit our FAQ or contact support anytime.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="${footerStyles}">
      <p style="color: ${textSecondary}; font-size: 12px; margin: 0 0 8px;">
        &copy; ${new Date().getFullYear()} PLHub. All rights reserved.
      </p>
      <p style="color: ${textSecondary}; font-size: 11px; margin: 0;">
        You're receiving this because you signed up for PLHub.
      </p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Password Reset Template
 */
export const passwordResetTemplate = ({ displayName, resetUrl, expiresIn = '1 hour' }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - PLHub</title>
</head>
<body style="margin: 0; padding: 30px; background-color: ${darkBg};">
  <div style="${baseStyles}">
    <!-- Header -->
    <div style="${headerStyles}">
      <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: 1px;">PLHub</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Movie & TV Discovery Platform</p>
    </div>
    
    <!-- Content -->
    <div style="${contentStyles}">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="${iconCircleStyles}">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${brandColor}" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h2 style="color: ${textPrimary}; margin: 0 0 10px; font-size: 24px; font-weight: 600;">
          Password Reset Request
        </h2>
      </div>
      
      <p style="color: ${textSecondary}; line-height: 1.7; font-size: 15px; margin: 0 0 10px;">
        Hello ${displayName},
      </p>
      
      <p style="color: ${textSecondary}; line-height: 1.7; font-size: 15px; margin: 0 0 25px;">
        We received a request to reset the password for your PLHub account. 
        Click the button below to create a new password.
      </p>
      
      <div style="text-align: center; margin: 35px 0;">
        <a href="${resetUrl}" style="${buttonStyles}">
          Reset Password
        </a>
      </div>
      
      <div style="background-color: rgba(255, 152, 0, 0.1); border-left: 4px solid #ff9800; border-radius: 4px; padding: 16px; margin: 30px 0;">
        <p style="color: #ffb74d; margin: 0; font-size: 14px; line-height: 1.6;">
          <strong>Security Notice:</strong> This link expires in ${expiresIn}. 
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
      
      <div style="background-color: rgba(255,255,255,0.03); border-radius: 8px; padding: 16px; margin-top: 25px;">
        <p style="color: ${textSecondary}; font-size: 13px; margin: 0; line-height: 1.6;">
          <strong style="color: ${textPrimary};">Important:</strong> Never share this link with anyone. 
          PLHub staff will never ask for your password.
        </p>
      </div>
      
      <p style="color: ${textSecondary}; font-size: 12px; margin-top: 25px; line-height: 1.6;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: ${brandColor}; word-break: break-all; font-size: 11px;">
          ${resetUrl}
        </a>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="${footerStyles}">
      <p style="color: ${textSecondary}; font-size: 12px; margin: 0 0 8px;">
        &copy; ${new Date().getFullYear()} PLHub. All rights reserved.
      </p>
      <p style="color: ${textSecondary}; font-size: 11px; margin: 0;">
        This is an automated message. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
`;

export default {
  emailVerificationTemplate,
  welcomeEmailTemplate,
  passwordResetTemplate,
};
