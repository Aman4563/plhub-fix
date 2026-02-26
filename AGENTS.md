# AGENTS.md

## Cursor Cloud specific instructions

### Overview

PLHub is a full-stack movie/TV discovery platform with a **React 18 (CRA)** frontend (`client/`) and an **Express.js** backend (`server/`). Data comes from the TMDB API; user data (accounts, reviews, favorites) lives in MongoDB.

### Services

| Service | Directory | Port | Start Command |
|---------|-----------|------|---------------|
| MongoDB | — | 27017 | `sudo mkdir -p /data/db && sudo chown -R $(whoami) /data/db && mongod --dbpath /data/db --fork --logpath /tmp/mongod.log` |
| Express API | `server/` | 5000 | `cd server && yarn start` (uses nodemon) |
| React Dev Server | `client/` | 3000 | `cd client && BROWSER=none yarn start` |

Start MongoDB first, then the server, then the client.

### Environment Files (not committed)

**`server/.env`** — required variables:
- `MONGODB_URL=mongodb://localhost:27017/plhub`
- `TOKEN_SECRET=<any random string>`
- `TMDB_BASE_URL=https://api.themoviedb.org/3`
- `TMDB_KEY=<your TMDB API key>` — get a free key at https://www.themoviedb.org/settings/api
- `PORT=5000`

**`client/.env`** — optional (Google/reCAPTCHA features):
- `REACT_APP_GOOGLE_CLIENT_ID=<your google client id>`
- `REACT_APP_RECAPTCHA_SITE_KEY=<your recaptcha site key>`

### Important Gotchas

- **CORS trailing slashes**: The CORS origin list in `server/index.js` must NOT have trailing slashes (e.g. `http://localhost:3000` not `http://localhost:3000/`). This was a bug that has been fixed.
- **Client API base URLs**: `client/src/api/client/private.client.js` and `public.client.js` contain the API base URL. For local dev, these must point to `http://localhost:5000/api/v1/`. The repo currently has them set to the local dev URL.
- **ReCAPTCHA / Google OAuth**: These are commented out in the auth forms for local development since they require valid API keys. Sign-up and sign-in work without them because the server's `verifyCaptcha` function returns the HTTP status (200), which is always truthy.
- **No automated tests**: The codebase has no test files. `yarn test` in `client/` will exit with code 1 (`--passWithNoTests` flag needed to avoid failure).
- **Lockfiles**: Both `client/` and `server/` have both `yarn.lock` and `package-lock.json`. Use `yarn` as the package manager (matches the lockfile and README instructions).

### Lint / Test / Build

- **Lint**: `cd client && npx eslint src/` (2 warnings in AuthModal.jsx — pre-existing)
- **Test**: `cd client && CI=true yarn test --passWithNoTests` (no tests exist)
- **Build**: `cd client && yarn build`
