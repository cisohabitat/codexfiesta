# AI RSS Trends Dashboard

A Next.js app (Vercel-ready) that aggregates key AI RSS feeds and prioritizes ChatGPT/Claude-relevant updates.

## Features

- Aggregates multiple AI feeds into one timeline
- Relevance scoring for ChatGPT + Claude + AI trend terms
- Filter tabs: **All AI**, **ChatGPT**, **Claude**, **AI Trends**
- Text search over title/snippet
- JSON API for integrations: `/api/feeds`

## Included feeds

- OpenAI News
- Anthropic News
- Hugging Face Blog
- Google DeepMind Blog
- The Batch (DeepLearning.AI)
- MIT AI News

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the repository.
3. Framework preset should be auto-detected as **Next.js**.
4. Deploy.

No environment variables are required.

## API

### Endpoint

`GET /api/feeds`

### Query parameters

- `limit` (1-100, default 30)
- `topic` (`all`, `chatgpt`, `claude`, `trends`)
- `q` (free-text search)

### Example

```bash
curl "http://localhost:3000/api/feeds?topic=chatgpt&limit=20&q=agent"
```
