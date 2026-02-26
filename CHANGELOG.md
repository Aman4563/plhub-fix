# PLhub Changelog

## [2.1.0] - 2024-12-02 - UI Integration Complete

### 🔗 Component Integrations

#### MediaDetail Page
- **INTEGRATED**: WatchlistButton - Add/remove from watchlist with status options
- **INTEGRATED**: WatchProviders - Shows where to stream, rent, or buy
- **INTEGRATED**: DisplayStarRating - Shows user rating statistics
- **INTEGRATED**: MediaDetailSkeleton - Loading state while fetching data

#### MediaReview Component
- **INTEGRATED**: Star rating input (1-5 stars, converts to 1-10 scale)
- **INTEGRATED**: DisplayStarRating for showing existing review ratings
- **UPDATED**: Review submission now includes rating

#### HeroSlide Component
- **INTEGRATED**: HeroSkeleton - Loading state for hero carousel
- **ADDED**: Lazy loading for backdrop images with fade-in animation
- **OPTIMIZED**: Image loading with placeholder state

#### MediaSlide Component
- **INTEGRATED**: MediaSliderSkeleton - Loading state for media carousels
- **IMPROVED**: Loading state management

#### MediaItem Component
- **ADDED**: Lazy loading for poster images
- **ADDED**: Skeleton placeholder while loading
- **ADDED**: Error handling for failed image loads
- **IMPROVED**: Image fade-in animation

### 🎯 How to Use New Features

#### Watchlist
1. Go to any movie/TV show detail page
2. Click "Add to Watchlist" button
3. Select status: Want to Watch, Watching, Completed, On Hold, or Dropped
4. Access your watchlist from the user menu

#### User Ratings
1. Navigate to a movie/TV show detail page
2. Scroll to the Reviews section
3. Click the stars to rate (1-5 stars = 2-10 points)
4. Write your review and submit

#### Where to Watch
1. Open any movie/TV show detail page
2. Scroll to "Where to Watch" section
3. See streaming, rent, and buy options
4. Select your region for local availability

---

## [2.0.0] - 2024-12-02 - Major Security & Feature Update

### 🔒 Security Fixes (Critical)

#### CORS Configuration
- **FIXED**: Added `https://` prefix to production URL in CORS config
- **IMPROVED**: Dynamic origin validation with proper error handling
- **ADDED**: Preflight caching for better performance (24 hours)

#### Password Security
- **UPGRADED**: Replaced crypto.pbkdf2Sync with bcryptjs (12 salt rounds)
- **ADDED**: Account lockout after 5 failed login attempts (2-hour lockout)
- **ADDED**: Password strength validation (uppercase, lowercase, number required)

#### CAPTCHA Verification
- **FIXED**: Now properly checks `response.data.success` instead of HTTP status code
- **ADDED**: Detailed logging for CAPTCHA failures

#### JWT Authentication
- **IMPLEMENTED**: httpOnly cookies for token storage (prevents XSS attacks)
- **ADDED**: Proper refresh token flow with rotation
- **ADDED**: Token refresh endpoint with automatic retry on client
- **ADDED**: Logout endpoint that invalidates refresh tokens

#### Rate Limiting
- **ADDED**: General rate limiter (100 requests/15 min)
- **ADDED**: Auth rate limiter (5 attempts/15 min per IP+username)
- **ADDED**: Password reset rate limiter (3 attempts/hour)
- **ADDED**: API rate limiter (60 requests/minute)

#### Security Headers
- **ADDED**: Helmet.js middleware for HTTP security headers
- **CONFIGURED**: Content Security Policy (CSP)
- **CONFIGURED**: Cross-Origin Resource Policy

### 🗄️ Database Optimizations

#### MongoDB Indexes
- **ADDED**: Compound index on `user + mediaId` for favorites (unique)
- **ADDED**: Compound index on `user + mediaId` for reviews (unique)
- **ADDED**: Compound index on `user + mediaId` for watchlist (unique)
- **ADDED**: Index on `email`, `username`, `googleId` for users
- **ADDED**: Index on `resetPasswordToken + resetPasswordExpires`

### ✨ New Features

#### Watchlist (Netflix-style "My List")
- **ADDED**: Watchlist model with status tracking
- **STATUSES**: Want to Watch, Watching, Completed, On Hold, Dropped
- **ADDED**: TV show progress tracking (season/episode)
- **ADDED**: Personal notes and priority ordering
- **ADDED**: Reminder dates for upcoming releases
- **ADDED**: Watchlist statistics endpoint
- **ADDED**: Full CRUD API endpoints
- **ADDED**: WatchlistPage with filtering and status management
- **ADDED**: WatchlistButton component for media detail pages

#### User Ratings (IMDb-style 1-10)
- **ADDED**: Rating field to review model (1-10 scale)
- **ADDED**: Average rating calculation per media
- **ADDED**: Rating distribution statistics
- **ADDED**: InteractiveStarRating component
- **ADDED**: DisplayStarRating component
- **ADDED**: RatingBadge component

#### Where to Watch (Watch Providers)
- **ADDED**: TMDB watch providers integration
- **SHOWS**: Streaming, Rent, Buy, Free options
- **ADDED**: Region selection support
- **ADDED**: WatchProviders component
- **ADDED**: CompactWatchProviders for cards

#### Review Enhancements
- **ADDED**: Helpful votes system
- **ADDED**: Spoiler flag
- **ADDED**: Review editing capability
- **ADDED**: One review per user per media (enforced)

### 🎨 UI/UX Improvements

#### Theme Updates (Netflix/IMDb inspired)
- **UPDATED**: Primary color to Netflix red (#E50914)
- **UPDATED**: Secondary color to IMDb yellow (#F5C518)
- **IMPROVED**: Typography with Netflix Sans font stack
- **IMPROVED**: Button hover animations
- **IMPROVED**: Card hover effects
- **ADDED**: Custom scrollbar styling

#### Skeleton Loaders
- **ADDED**: MediaCardSkeleton
- **ADDED**: MediaGridSkeleton
- **ADDED**: MediaSliderSkeleton
- **ADDED**: HeroSkeleton
- **ADDED**: MediaDetailSkeleton
- **ADDED**: CastSliderSkeleton
- **ADDED**: ReviewSkeleton

#### Lazy Loading
- **ADDED**: LazyImage component with Intersection Observer
- **ADDED**: Image optimization (TMDB size variants)
- **ADDED**: Fade-in animation on load
- **ADDED**: Error state with fallback

### 🚀 Performance Improvements

#### Caching Layer
- **ADDED**: Redis caching middleware (with memory fallback)
- **CACHE TTL**: Genres (24h), Trending (1h), Popular (30min), Detail (10min)
- **ADDED**: Cache statistics endpoint
- **ADDED**: Cache invalidation utilities

#### API Optimizations
- **ADDED**: Concurrent TMDB API calls in media detail
- **ADDED**: Query parameter validation
- **IMPROVED**: Error handling with proper logging

### 📝 Logging & Monitoring

#### Winston Logger
- **ADDED**: Structured logging with Winston
- **ADDED**: Log levels (error, warn, info, http, debug)
- **ADDED**: File transports for production
- **ADDED**: Request logging middleware

### 🔧 Developer Experience

#### Code Quality
- **IMPROVED**: Consistent error response format
- **ADDED**: Comprehensive JSDoc comments
- **IMPROVED**: API response handler with all status codes
- **ADDED**: Graceful shutdown handling

### 📁 New Files Added

#### Server
- `src/config/security.config.js` - Security configuration
- `src/config/logger.config.js` - Winston logger setup
- `src/middlewares/rateLimiter.middleware.js` - Rate limiting
- `src/middlewares/cache.middleware.js` - Redis/memory caching
- `src/models/watchlist.model.js` - Watchlist schema
- `src/controllers/watchlist.controller.js` - Watchlist logic
- `src/routes/watchlist.route.js` - Watchlist endpoints

#### Client
- `src/api/modules/watchlist.api.js` - Watchlist API client
- `src/redux/features/watchlistSlice.js` - Watchlist state
- `src/components/common/MediaSkeleton.jsx` - Loading skeletons
- `src/components/common/StarRating.jsx` - Rating components
- `src/components/common/WatchProviders.jsx` - Streaming info
- `src/components/common/WatchlistButton.jsx` - Add to watchlist
- `src/components/common/LazyImage.jsx` - Optimized images
- `src/pages/WatchlistPage.jsx` - Watchlist page

### 📦 New Dependencies

#### Server
- `bcryptjs` - Password hashing
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `winston` - Logging
- `ioredis` - Redis client

### ⚠️ Breaking Changes

1. **Password Storage**: Existing passwords hashed with crypto need migration
2. **Token Storage**: Tokens now stored in httpOnly cookies (localStorage fallback)
3. **Review API**: Endpoint changed from POST `/reviews` to POST `/reviews/:mediaId`
4. **User Model**: New fields added (refreshToken, failedLoginAttempts, lockUntil)

### 🔄 Migration Notes

1. Run database migration to add new indexes
2. Update environment variables:
   - `REFRESH_TOKEN_SECRET` - For refresh token signing
   - `REDIS_URL` (optional) - For caching
3. Clear existing user sessions after deployment
4. Existing users may need to reset passwords

---

## [1.0.0] - Initial Release

- Basic movie/TV show browsing
- TMDB API integration
- User authentication (local + Google)
- Favorites system
- Reviews system
- Search functionality
- Filter by genre/year/rating

