# 🎵 EmotiTune AI

> *Transform your emotions into cinematic music, immersive visuals, and intelligent emotional experiences — powered by Grok AI.*

![EmotiTune AI](https://img.shields.io/badge/EmotiTune-AI-7c5cfc?style=for-the-badge&logoColor=white)
![Grok AI](https://img.shields.io/badge/Powered%20by-Grok%20AI-22d3ee?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=for-the-badge&logo=vercel)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Supported Emotions](#-supported-emotions)
- [Project Structure](#-project-structure)
- [Local Setup](#-local-setup)
- [Deploy on Vercel](#-deploy-on-vercel)
- [Vercel Serverless API Route](#-vercel-serverless-api-route)
- [Environment Variables](#-environment-variables)
- [Deployment Checklist](#-deployment-checklist)
- [License](#-license)

---

## 🌟 Overview

EmotiTune AI is a real-time emotion-to-music web app. Type how you feel and the app responds with a live synthesized soundtrack, emotion analytics, AI-written song lyrics, and an empathetic AI companion chat. All AI features are powered by **Grok AI (xAI)** through a secure Vercel serverless API route — your key never touches the browser.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎵 **Emotion Studio** | Describe your mood → get live synthesized music via Tone.js |
| 📊 **Mood Analytics** | Track and visualize your emotional history over time |
| 🤖 **AI Companion** | Chat with an empathetic Grok-powered music companion |
| 📖 **Memory Studio** | Paste a journal entry → receive a cinematic soundtrack |
| ✍️ **Lyrics Generator** | Choose emotion + genre → get a full professional song |
| ⚡ **Smart Modes** | Focus, Sleep, Meditate, Workout, Study, Relax modes |
| 🎼 **Live Waveform** | Real-time audio visualizer using Canvas API |

---

## 🛠 Tech Stack

- **React 18** — UI and component architecture
- **Grok AI (xAI)** — Emotion analysis, lyric generation, companion chat
- **Tone.js** — Real-time audio synthesis (no audio files needed)
- **Web Audio API** — Live waveform visualization
- **Vercel Serverless Functions** — Secure API proxy (hides Grok API key)
- **Vercel** — Hosting and deployment

---

## 🎭 Supported Emotions

| Emotion | Music Style | BPM |
|---|---|---|
| ☀️ Happiness | Upbeat Pop Piano | 118 |
| 🌧️ Sadness | Emotional Piano Ballad | 54 |
| ⚡ Stress | Driving Rock Beat | 155 |
| 🌀 Anxiety | Tense Electronic Pulse | 138 |
| 🌿 Calmness | Peaceful Ambient Guitar | 62 |
| 🌌 Loneliness | Cinematic String Elegy | 46 |
| 🎉 Excitement | Festival EDM Drop | 148 |
| 🚀 Motivation | Epic Orchestral Anthem | 126 |
| 🔥 Anger | Heavy Metal Riff | 168 |

---

## 📁 Project Structure

```
emotitune-ai/
├── api/
│   └── grok.js               # Vercel serverless function (Grok API proxy)
├── public/
│   └── index.html
├── src/
│   ├── App.js                # Main EmotiTune AI component
│   └── index.js
├── .env.local                # Local environment variables (never commit)
├── .gitignore
├── vercel.json               # Vercel routing config
├── package.json
└── README.md
```

---

## 💻 Local Setup

### Prerequisites

- Node.js 18+
- A Grok API key from [console.x.ai](https://console.x.ai)
- Vercel CLI (optional, for local serverless testing)

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/emotitune-ai.git
cd emotitune-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment file

Create `.env.local` in the project root:

```env
GROK_API_KEY=xai-xxxxxxxxxxxxxxxxxx
```

> ⚠️ Use `.env.local` — React and Vercel both respect this file locally.
> Never commit it to GitHub. It is already covered by `.gitignore`.

### 4. Run locally

```bash
# React frontend only
npm start
```

To test the serverless API function locally, install the Vercel CLI:

```bash
npm install -g vercel
vercel dev
```

Then open [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deploy on Vercel

### Step 1 — Create the Serverless API Route

Create a new file: `api/grok.js`

```js
// api/grok.js
// Vercel serverless function — proxies requests to Grok AI
// Keeps your API key secure on the server side

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // API key lives only on the server — never sent to the browser
        "Authorization": `Bearer ${process.env.GROK_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
```

### Step 2 — Add `vercel.json`

Create `vercel.json` in your project root:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Step 3 — Update the API URL in your frontend

In `src/App.js`, change:

```js
// Before
const GROK_API_URL = "https://api.x.ai/v1/chat/completions";
```

```js
// After — points to your Vercel serverless function
const GROK_API_URL = "/api/grok";
```

Also remove the `Authorization` header from the fetch call — the server handles it:

```js
// Before
headers: {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${GROK_API_KEY}`,
},

// After
headers: {
  "Content-Type": "application/json",
  // Authorization is added server-side in api/grok.js
},
```

And remove or leave blank the client-side key constant:

```js
// Safe — key is now only on the server
const GROK_API_KEY = ""; // unused
```

### Step 4 — Push to GitHub

```bash
git init
git add .
git commit -m "EmotiTune AI with Vercel serverless proxy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/emotitune-ai.git
git push -u origin main
```

### Step 5 — Deploy on Vercel

**Option A — Vercel Dashboard (recommended for beginners)**

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your `emotitune-ai` GitHub repo
4. Vercel auto-detects React — keep default settings:

| Field | Value |
|---|---|
| Framework Preset | `Create React App` |
| Build Command | `npm run build` |
| Output Directory | `build` |

5. Click **"Environment Variables"** and add:

| Key | Value |
|---|---|
| `GROK_API_KEY` | `xai-xxxxxxxxxxxxxxxxxx` |

6. Click **"Deploy"**

Done! Your app is live at:
```
https://emotitune-ai.vercel.app
```

---

**Option B — Vercel CLI (deploy from terminal)**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (follow the prompts)
vercel

# Add your environment variable
vercel env add GROK_API_KEY

# Deploy to production
vercel --prod
```

---

## 🔁 Vercel Serverless API Route

Here is how the proxy flow works after deployment:

```
Browser (React)
     │
     │  POST /api/grok  { model, messages }
     ▼
Vercel Serverless Function  (api/grok.js)
     │
     │  POST https://api.x.ai/v1/chat/completions
     │  Authorization: Bearer xai-xxxx   ← key is secret, server-side only
     ▼
Grok AI (xAI)
     │
     │  { choices[0].message.content }
     ▼
Vercel Serverless Function
     │
     │  JSON response
     ▼
Browser (React)  ← receives AI reply, no key ever exposed
```

**Why this matters:**
- Your `GROK_API_KEY` is set only in Vercel's environment — it never appears in your built JavaScript bundle
- No CORS issues — the serverless function is on the same domain as your app
- Free on Vercel's Hobby plan (100GB bandwidth, unlimited serverless invocations)

---

## 🔑 Environment Variables

| Variable | Where to set | Description |
|---|---|---|
| `GROK_API_KEY` | Vercel Dashboard → Project → Settings → Environment Variables | Used by `api/grok.js` serverless function |
| `GROK_API_KEY` | `.env.local` (local only, never commit) | Used by `vercel dev` for local testing |

> Do **not** use `REACT_APP_` prefix — that would expose the key in the browser bundle.

---

## ✅ Deployment Checklist

- [ ] `api/grok.js` created with serverless proxy
- [ ] `vercel.json` added to project root
- [ ] Frontend API URL changed to `/api/grok`
- [ ] `Authorization` header removed from frontend fetch
- [ ] `.env.local` is in `.gitignore` (never committed)
- [ ] `GROK_API_KEY` added in Vercel Dashboard → Environment Variables
- [ ] GitHub repo is connected to Vercel project
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`
- [ ] Deployed and tested at `https://your-app.vercel.app`

---

## 🔄 Redeploying After Changes

Every push to `main` auto-deploys on Vercel. To manually redeploy:

```bash
# Via CLI
vercel --prod

# Or just push to GitHub
git add .
git commit -m "Update"
git push
```

---

## 📄 License

MIT — free to fork, remix, and build on.

---

*Built with 🎵 sound, 💜 emotion, and ⚡ Grok AI. Deployed on ▲ Vercel.*

MIT — free to fork, remix, and build on.

---

*Built with 🎵 sound, 💜 emotion, and ⚡ Grok AI.*
