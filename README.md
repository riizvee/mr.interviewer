# Mr. Interviewer 🎤

An AI-powered mock interview app. Pick a subject/role, difficulty, and number
of questions — Mr. Interviewer asks, scores, and coaches you through it,
then gives a final report.

## What was fixed / added in this version

Your uploaded project only had the **frontend** (React + Vite) — there was
no backend code at all, even though `client/src/api.js` calls
`/api/interview/start`, `/api/interview/answer`, `/api/interview/end`.
That missing/broken backend is why the interview stopped after 1-2
questions: there was nothing correctly tracking `questionIndex` against
`numQuestions` and looping until the real end.

This version adds:

1. **`server/`** — a full Express backend that:
   - Tracks each interview session in memory and only marks it `done` once
     `questionIndex` actually reaches `numQuestions` (this is the core fix
     for the "only 1-2 questions" bug).
   - Uses the Groq API (OpenAI-compatible, fast Llama models) to generate
     one fresh, non-repeating question at a time, score each answer 0–10,
     and write a closing report.
   - **Memory-trick logic**: if an answer scores **below 8**, the response
     includes a `model_answer_hint` — a concise ideal answer *plus* an
     explicit memory trick (mnemonic / vivid image / acronym) to help you
     retain it. The **next question then circles back** to test that same
     concept from a different angle, so you get a real chance to apply what
     you just learned before moving on. Score 8+ and it moves on to a new,
     slightly harder angle.

2. **`client/src/App.css`** — this file was referenced by `main.jsx` but
   never actually included in your upload, so the app would have failed to
   build. It's been written to match the dark neon theme in `index.css` and
   style every component you sent.

3. **A small frontend bug fix** in `App.jsx`: the "ideal answer" box in
   `InterviewScreen.jsx` reads `message.model_answer`, but the code that
   builds those messages was never actually passing that field through —
   so it could never appear. That's now wired up correctly.

## Project structure

```
mr-interviewer/
├── client/         React + Vite frontend (your original files)
└── server/         Express backend + Claude API integration (new)
```

## Setup

You'll need [Node.js 18+](https://nodejs.org) and a
[Groq API key](https://console.groq.com/keys) (Groq has a free tier).

```bash
# 1. Install dependencies for both client and server
npm run install:all

# 2. Configure your API key
cp server/.env.example server/.env
# then open server/.env and paste your key into GROQ_API_KEY=

# 3. Run both client and server together
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000 (the Vite dev server proxies `/api/*` to it — see `client/vite.config.js`)

If you'd rather run them in two separate terminals instead of `npm run dev`:

```bash
npm run dev:server   # terminal 1
npm run dev:client   # terminal 2
```

## Notes

- Sessions are stored in memory on the server, so restarting the server
  clears any interview in progress (this is fine for local practice use).
- `GROQ_MODEL` in `server/.env` defaults to `llama-3.3-70b-versatile` —
  change it there if you want a different model (see
  https://console.groq.com/docs/models for current options).
- For production, you'd want to swap the in-memory session Map for
  something persistent (Redis, a database) and deploy the client as a
  static build (`npm run build` inside `client/`) served separately from
  the API.
