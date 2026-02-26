# AGENTS.md

## Cursor Cloud specific instructions

### Overview

PLHub is a full-stack movie/TV discovery platform with a **React 18 (CRA)** frontend (`client/`) and an **Express.js** backend (`server/`). Data comes from the TMDB API; user data (accounts, reviews, favorites) lives in MongoDB.

### Services

| Service | Directory | Port | Start Command |
|---------|-----------|------|---------------|
| MongoDB | — | 27017 | `sudo mkdir -p /data/db && sudo chown -R $(whoami) /data/db && mongod --dbpath /data/db --fork --logpath /tmp/mongod.log` |
| Express API | `server/` | 5000 | `cd server && NODE_ENV=development BYPASS_CAPTCHA=true yarn start` (uses nodemon; add env overrides for injected secrets) |
| React Dev Server | `client/` | 3000 | `cd client && BROWSER=none yarn start` |

Start MongoDB first, then the server, then the client.

### Environment Files (not committed)

**`server/.env`** — required variables:
- `MONGODB_URL=mongodb://localhost:27017/plhub`
- `TOKEN_SECRET=<any random string>`
- `TMDB_BASE_URL` — the TMDB v3 API base URL with a trailing slash (trailing slash required — `tmdb.config.js` concatenates `${baseUrl}${endpoint}` without a separator)
- `TMDB_KEY=<your TMDB API key>` — get a free key at https://www.themoviedb.org/settings/api
- `PORT=5000`

**`client/.env`** — optional (Google/reCAPTCHA features):
- `REACT_APP_GOOGLE_CLIENT_ID=<your google client id>`
- `REACT_APP_RECAPTCHA_SITE_KEY=<your recaptcha site key>`

### Important Gotchas

- **CORS trailing slashes**: The CORS origin list in `server/index.js` must NOT have trailing slashes (e.g. `http://localhost:3000` not `http://localhost:3000/`). This was a bug that has been fixed.
- **Client API base URLs**: `client/src/api/client/private.client.js` and `public.client.js` contain the API base URL. For local dev, these must point to `http://localhost:5000/api/v1/`. The repo currently has them set to the local dev URL.
- **ReCAPTCHA / Google OAuth**: The auth forms have full ReCAPTCHA and Google OAuth integration active. For local development, set `BYPASS_CAPTCHA=true` and `NODE_ENV=development` when starting the server so the `verifyCaptcha` function bypasses Google verification. The client `.env` should have `REACT_APP_RECAPTCHA_SITE_KEY` set (Google's test key `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI` works for local dev).
- **No automated tests**: The codebase has no test files. `yarn test` in `client/` will exit with code 1 (`--passWithNoTests` flag needed to avoid failure).
- **Lockfiles**: Both `client/` and `server/` have both `yarn.lock` and `package-lock.json`. Use `yarn` as the package manager (matches the lockfile and README instructions).
- **TMDB_BASE_URL trailing slash**: `tmdb.config.js` builds URLs as `${baseUrl}${endpoint}?...` with no separator, so `TMDB_BASE_URL` **must** end with `/`.
- **Injected secrets key=value format**: Secrets injected by the Cloud environment may include the key name as part of the value (e.g. `TMDB_KEY=TMDB_KEY=abc123`). When starting the server, override with explicit correct values via command-line prefix: `MONGODB_URL=mongodb://localhost:27017/plhub TMDB_BASE_URL="https://api.themoviedb.org/3/" TMDB_KEY=<actual_key> TOKEN_SECRET=<secret> PORT=5000 NODE_ENV=development BYPASS_CAPTCHA=true npx nodemon index.js`
- **dotenv does not override**: `server/index.js` uses `import "dotenv/config"` which does NOT override existing env vars. If secrets are injected as env vars, the `.env` file values are ignored — you must override via command-line prefix.

### Lint / Test / Build

- **Lint**: `cd client && npx eslint src/` (1 warning in formStyles.js — pre-existing). Requires `typescript` as a dev dependency for the eslint parser.
- **Test**: `cd client && CI=true yarn test --passWithNoTests` (no tests exist)
- **Build**: `cd client && yarn build`
