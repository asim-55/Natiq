# Plan: Paysys TTS Full-Stack Integration

Wire the Chatterbox TTS backend to the Paysys React frontend with proper Google + email/password auth, per-user sessions, API token generation with credits (100 free, 6 per generation), modular backend, and real data on overview/history pages.

---

## Phase 1: Backend Modularization & Database Redesign

### Step 1.1 — New backend file structure

```
chatter/
├── app.py                    # FastAPI factory, CORS, lifespan, exception handlers
├── config.py                 # BackendConfig, speaker maps, env vars
├── database.py               # SQLite init + all CRUD functions
├── auth.py                   # JWT, bcrypt, Google verify, auth dependencies
├── routes/
│   ├── auth_routes.py        # /auth/google, /auth/signup, /auth/login, /auth/api-tokens
│   ├── generation_routes.py  # /generate-audio-emotion, /generate-audio-no-emotion
│   ├── voice_routes.py       # /upload-voice, /my-voices
│   ├── user_routes.py        # /me, /my-generations, /play/{filename}
│   └── health_routes.py      # /health, /emotions
├── generation_helpers.py     # Backend selection, text building, run_generation
├── voice_helpers.py          # Base64 decode, temp file management
├── inference.py              # (unchanged)
├── model_manager.py          # (unchanged)
```

### Step 1.2 — New database schema (clean start, delete `auth_users.db`)

**`users`**

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | AUTOINCREMENT |
| email | TEXT UNIQUE | COLLATE NOCASE — used as username for both auth methods |
| password_hash | TEXT | NULL for Google-only users |
| name | TEXT | Display name |
| picture | TEXT | Google profile picture URL |
| google_sub | TEXT UNIQUE | Google `sub` claim — NULL for email/password users |
| auth_provider | TEXT | `"google"` or `"local"` |
| credits | INTEGER | Default 100 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

**`api_tokens`**

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | AUTOINCREMENT |
| user_id | INTEGER FK | → users.id |
| token_hash | TEXT UNIQUE | bcrypt hash of the raw token |
| token_prefix | TEXT | First 8 chars for display (e.g., `psk_abc1...`) |
| name | TEXT | User-given label |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |
| last_used_at | TEXT | Updated on each API call |
| is_active | INTEGER | DEFAULT 1 (soft-delete) |

**`voices`**

| Column | Type | Notes |
|---|---|---|
| voice_id | TEXT PK | `voice_{12hex}` |
| user_id | INTEGER FK | → users.id |
| name | TEXT | User-given label (from filename or "Untitled") |
| file_path | TEXT | Stores raw base64 payload |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

**`generations`**

| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | AUTOINCREMENT |
| user_id | INTEGER FK | → users.id |
| text | TEXT | Input text |
| language | TEXT | Language code |
| emotion | TEXT | Emotion tag or "neutral" |
| voice_id | TEXT | Which voice reference was used |
| backend | TEXT | Which model backend |
| output_path | TEXT | Filesystem path to WAV |
| filename | TEXT | Just the filename portion |
| credits_used | INTEGER | 6 |
| created_at | TEXT | DEFAULT CURRENT_TIMESTAMP |

### Step 1.3 — Migrate functions from chatterbox_fastapi.py

- Move DB functions → `database.py`
- Move auth logic → `auth.py`
- Move config/constants → `config.py`
- Move generation helpers → `generation_helpers.py`
- Move voice helpers → `voice_helpers.py`
- Move routes into `routes/*.py` as FastAPI `APIRouter` instances
- `app.py` imports and includes all routers

---

## Phase 2: Authentication System

### Step 2.1 — `POST /auth/google`

- Accept `{ credential: string }` (Google JWT from frontend)
- Verify the Google JWT server-side using `google-auth` library (`google.oauth2.id_token.verify_oauth2_token`)
- Extract `sub`, `email`, `name`, `picture` from verified payload
- Upsert user: if `google_sub` exists → update name/picture; if not → create user with 100 credits
- Return our JWT (`{ access_token, token_type, user: { email, name, picture, credits } }`)

### Step 2.2 — Email/password signup & login

- `POST /auth/signup`: Accept `{ email, password, name }` → create user with `auth_provider="local"`, 100 credits → return JWT
- `POST /auth/login`: Accept `{ email, password }` → verify → return JWT
- If a Google user tries email/password login, reject with "Use Google sign-in"

### Step 2.3 — Unified auth dependency

- `get_current_user()` dependency: accepts Bearer token → decode JWT → extract `sub` (email) → look up user → return user dict
- Support both session JWTs (short-lived, from login) and API tokens (long-lived, `psk_` prefix)
- API token auth: if token starts with `psk_`, look up in `api_tokens` table (hash comparison), update `last_used_at`

### Step 2.4 — API token management

- `POST /auth/api-tokens`: Create API token → generate `psk_{32hex}` → hash it → store → return raw token ONCE
- `GET /auth/api-tokens`: List user's tokens (prefix + name + created_at + last_used_at, never the full token)
- `DELETE /auth/api-tokens/{token_id}`: Soft-delete (set `is_active=0`)

---

## Phase 3: Credits System

### Step 3.1 — Credit check in generation routes

- BEFORE calling inference: check `user.credits >= 6`, else HTTP 402 `{ error: "insufficient_credits", credits_remaining: N }`
- AFTER successful generation: decrement credits `UPDATE users SET credits = credits - 6 WHERE id = ?`
- Call `save_generation_record()` — currently defined in the backend but **never called** (key bug fix)

### Step 3.2 — Credits endpoint

- `GET /me`: Return user profile including `credits` balance
- Credits shown in frontend dashboard overview

---

## Phase 4: Backend API Enhancements

### Step 4.1 — Wire save_generation_record

In `generate_audio_file_response()`, after successful generation, insert into `generations` table with text, language, emotion, voice_id, backend, output_path, filename, credits_used, and decrement user credits.

### Step 4.2 — Enhanced endpoints

- `GET /my-generations`: Return generations with text, emotion, language, filename, created_at, plus a `play_url` field. Supports `?limit=N` query param for overview page (default: all).
- `GET /my-voices`: Return voices with voice_id, name, created_at
- `GET /emotions`: Return list of supported emotions (frontend already calls this)
- `GET /me`: Return user profile (email, name, picture, credits, created_at)

### Step 4.3 — CORS configuration

Add CORS middleware to `app.py` allowing the frontend origin (`http://localhost:5173` for dev).

---

## Phase 5: Frontend Overhaul

### Step 5.1 — Add dependencies

```bash
npm install react-router-dom
```

### Step 5.2 — Split App.tsx into components

```
src/
├── App.tsx                    # Router setup, top-level providers
├── main.tsx                   # (unchanged)
├── index.css                  # (unchanged)
├── api/
│   └── client.ts              # API client: base URL, auth headers, typed fetch wrappers
├── auth/
│   ├── AuthContext.tsx         # React context for user state, token, login/logout
│   ├── SignInModal.tsx         # Google + email/password sign-in modal
│   └── ProtectedRoute.tsx     # Redirects to / if not authenticated
├── pages/
│   ├── LandingPage.tsx        # Marketing: Hero, Models, Resources, Pricing, Contact
│   ├── ResourcePage.tsx       # Docs, About, Blog
│   └── dashboard/
│       ├── DashboardLayout.tsx # Sidebar + content area
│       ├── OverviewPage.tsx   # Metrics + latest generations
│       ├── VoicePage.tsx      # TTS playground
│       ├── ModelsPage.tsx     # Model catalog
│       ├── HistoryPage.tsx    # Generation history + uploaded voices
│       └── SettingsPage.tsx   # Profile + API tokens + logout
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── AudioResult.tsx
│   └── ...
├── types/
│   └── index.ts               # Shared TypeScript types
└── vite-env.d.ts
```

### Step 5.3 — AuthContext (core change)

Create `AuthContext` providing:
- `user: { email, name, picture, credits } | null`
- `token: string | null` (JWT for API calls)
- `login(token, user)` / `logout()`
- `refreshUser()` — calls `GET /me` to update credits
- Rehydrate from `localStorage` on mount (check token expiry)
- All API calls use this token instead of hardcoded `VITE_VOICE_API_TOKEN`

### Step 5.4 — Google Sign-In flow (frontend)

1. User clicks "Sign in with Google" → Google One Tap → gets credential
2. `POST /auth/google` with credential → gets `{ access_token, user }`
3. Store in AuthContext → redirect to dashboard

### Step 5.5 — Email/Password flow (frontend)

1. Sign up: `POST /auth/signup` → gets token + user → store in AuthContext
2. Login: `POST /auth/login` → gets token + user → store in AuthContext

### Step 5.6 — Dashboard pages wired to API

- **Overview**: Call `GET /me` for credits + `GET /my-generations?limit=5` for recent generations
- **Voice**: Use user's token for generation calls, selected voice_reference_id from uploaded voices
- **History**: Call `GET /my-generations` for all generations (with audio player) + `GET /my-voices` for uploaded voices
- **Settings**: Show profile info from `GET /me`, API token management (create/list/delete), logout

### Step 5.7 — Remove static token usage

- Remove `VITE_VOICE_API_TOKEN` from .env
- All API calls use the authenticated user's JWT from AuthContext
- Remove `VITE_DEFAULT_VOICE_REFERENCE_ID` — user must upload their own voice

---

## Phase 6: Cleanup

### Step 6.1 — Delete old database

- Delete `auth_users.db` (fresh start)
- Keep `chatterbox_fastapi.py` as backup reference initially

### Step 6.2 — New pip dependency

```bash
pip install google-auth
```

### Step 6.3 — Update .env files

- Backend: add `GOOGLE_CLIENT_ID`, keep `JWT_SECRET_KEY`
- Frontend: remove `VITE_VOICE_API_TOKEN`, keep `VITE_GOOGLE_CLIENT_ID`, `VITE_VOICE_API_BASE_URL`

---

## Relevant Files

**Backend (modify/create):**
- `chatterbox_fastapi.py` — decompose into modules below
- `app.py` — new: FastAPI app factory, CORS, lifespan, exception handlers
- `config.py` — new: all constants, BackendConfig, speaker maps
- `database.py` — new: schema init, all DB CRUD functions
- `auth.py` — new: JWT, bcrypt, Google verify, auth dependencies
- `routes/auth_routes.py` — new
- `routes/generation_routes.py` — new
- `routes/voice_routes.py` — new
- `routes/user_routes.py` — new
- `routes/health_routes.py` — new
- `generation_helpers.py` — new
- `voice_helpers.py` — new
- `inference.py` — unchanged
- `model_manager.py` — unchanged

**Frontend (modify/create):**
- `Paysys_Website/package.json` — add react-router-dom
- `Paysys_Website/src/App.tsx` — rewrite: router setup only
- `Paysys_Website/src/api/client.ts` — new
- `Paysys_Website/src/auth/AuthContext.tsx` — new
- `Paysys_Website/src/auth/SignInModal.tsx` — extracted
- `Paysys_Website/src/auth/ProtectedRoute.tsx` — new
- `Paysys_Website/src/pages/LandingPage.tsx` — extracted
- `Paysys_Website/src/pages/ResourcePage.tsx` — extracted
- `Paysys_Website/src/pages/dashboard/*.tsx` — extracted + wired to API
- `Paysys_Website/src/components/*.tsx` — extracted
- `Paysys_Website/.env` — updated

---

## Verification

1. `sqlite3 auth_users.db ".schema"` — verify new tables with correct schema
2. `POST /auth/google` with real Google credential → JWT returned + user created with 100 credits
3. `POST /auth/signup` + `/auth/login` → JWT returned, user created
4. `POST /auth/api-tokens` → `psk_` token returned → use in Authorization header for generation → works
5. Generate 17× (17 × 6 = 102 > 100) → 17th returns HTTP 402 `insufficient_credits`
6. `GET /my-generations` → records saved with text, emotion, language
7. Browser E2E: Google sign-in → dashboard → overview shows credits → generate → history updates → credits decrement
8. CORS: frontend :5173 ↔ backend :8000 works without errors
9. Page refresh → stays signed in (rehydrated from localStorage)

---

## Decisions & Constraints

- 100 free credits, 6 per generation
- Google + email/password auth coexist, both issue same JWT format
- SQLite (no migration to Postgres)
- `save_generation_record()` exists but is never called — will be wired in
- Credit top-up/purchase out of scope — admin can update DB manually
- No rate limiting in this iteration
- React Router added for proper routing (replacing hash-based)
