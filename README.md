# RemiTrainer

A household workout generator that keeps shared workouts aligned while adapting
each person's exercises, intensity, equipment, and limitations.

The browser app still has a local fallback generator, but this repo is now a
Next.js app with server routes ready for Neon Postgres and OpenAI.

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```bash
DATABASE_URL="postgres://USER:PASSWORD@HOST.neon.tech/remitrainer?sslmode=require"
OPENAI_API_KEY="sk-proj-..."
OPENAI_MODEL="gpt-5.1"
BLOB_READ_WRITE_TOKEN="vercel-blob-rw-token"
OPENAI_IMAGE_MODEL="gpt-image-1"
REMITRAINER_PASSWORD="choose-a-shared-household-password"
REMITRAINER_SESSION_SECRET="optional-long-random-cookie-signing-secret"
```

Do not commit `.env.local`.

`REMITRAINER_PASSWORD` is a lightweight household gate for Jon and Jeanne. It
sets an HTTP-only cookie after login and protects the OpenAI workout generation
route from anonymous calls. `REMITRAINER_SESSION_SECRET` is optional; if omitted,
the password is also used to sign the cookie.

## Neon setup

Create a Neon database, then run `db/schema.sql` in the Neon SQL editor. The
schema includes:

- `household`
- `profiles`
- `household_equipment`
- `profile_limitations`
- `profile_banned_exercises`
- `shared_workout_sessions`
- `user_workout_instances`
- `workout_exercise_instances`
- `exercise_feedback`
- `exercise_instruction_assets`

## Server routes

- `GET /api/health` checks whether `DATABASE_URL` and `OPENAI_API_KEY` are configured.
- `GET /api/household/state` loads the shared household state from Neon after login.
- `POST /api/household/state` saves profiles, equipment, generated sessions, feedback,
  bans, and instruction asset metadata to Neon.
- `GET/POST/PATCH /api/shared-workout-invites` checks, sends, and opens manual
  shared workout invites between Jon and Jeanne.
- `POST /api/exercise-images/generate` generates missing exercise illustrations with
  OpenAI, uploads them to Vercel Blob, and saves the Blob URL to Neon.
- `POST /api/workouts/generate` requests strict JSON from OpenAI, saves the generated
  workout to Neon when `DATABASE_URL` is configured, and returns the validated workout.

If the API route is unavailable or missing secrets, the browser falls back to the
local generator so the app remains usable.
