/**
 * Security Configuration
 * Centralized security settings for the application
 */

export const securityConfig = {
  // JWT Configuration
  jwt: {
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Use 'lax' for OAuth compatibility (strict blocks cross-site requests from OAuth redirects)
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000, // 15 minutes for access token
    },
    refreshCookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // Use 'lax' for OAuth compatibility
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
    },
  },

  // Password Hashing Configuration
  password: {
    saltRounds: 12, // Industry standard for bcrypt
    minLength: 8,
    maxLength: 128,
  },

  // Rate Limiting Configuration
  rateLimit: {
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per window
      message: { status: 429, message: "Too many requests, please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    },
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 login attempts per window
      message: { status: 429, message: "Too many login attempts, please try again later." },
      standardHeaders: true,
      legacyHeaders: false,
    },
    api: {
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      message: { status: 429, message: "API rate limit exceeded." },
      standardHeaders: true,
      legacyHeaders: false,
    },
  },

  // CORS Configuration - Uses environment variable for frontend URL
  cors: {
    // allowedOrigins is now dynamically built in index.js using FRONTEND_URL env var
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true,
    maxAge: 86400, // 24 hours preflight cache
  },

  // Helmet Security Headers Configuration
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.themoviedb.org"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  },
};

export default securityConfig;

