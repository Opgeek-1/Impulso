<p align="center">
  <img src="public/tomo-mark-color.png" alt="Impulso" width="48" height="48" />
</p>

<h1 align="center">Impulso</h1>

<p align="center">
  AI-powered marketing content pipeline for X (Twitter).<br/>
  Generate tweets, design visuals, schedule posts — all in one place.
</p>

<p align="center">
  <a href="https://mkt.tomo.inc">Live App</a>
</p>

---

## How it works

Impulso turns a topic into a week of scheduled posts in four steps:

| Step | What happens |
|------|-------------|
| **1. Generate** | Describe a topic and AI writes a batch of tweet angles in your chosen tone and language |
| **2. Curate & Design** | Approve drafts, add visual briefs, and generate on-brand images with AI |
| **3. Schedule** | Drag ready posts onto a weekly calendar to plan your publishing cadence |
| **4. Publish** | Posts go out automatically via your connected X account |

## Features

- **Multi-account** — manage multiple X handles, each with its own pipeline and schedule
- **Brand kit** — upload logos, set colors, and define style guidelines per account
- **AI image generation** — GPT Image, Gemini Flash, and DALL-E 3 with iterative feedback
- **Team workspace** — invite collaborators to manage content together
- **Per-project X connections** — connect and disconnect each account independently
- **Dark mode** — automatic or manual theme switching

## Getting started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your database URL, auth secrets, and API keys

# Push database schema
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## Deployment

Impulso runs on any platform that supports Node.js. A `Dockerfile` is included for container deployments.

```bash
# Build and run with Docker
docker build -t impulso .
docker run -p 3000:3000 --env-file .env impulso
```

## License

Private — internal use only.
