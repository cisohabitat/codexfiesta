# CLAUDE.md — AI RSS Trends Dashboard (codexfiesta)

## Project Overview

This is a Next.js web application that aggregates AI-related news from multiple RSS feeds and surfaces the most relevant content through relevance scoring, topic filtering, and free-text search. It requires no environment variables and is ready to deploy to Vercel.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2.5 (App Router) |
| UI | React 18.3.1, custom CSS (dark theme) |
| RSS parsing | rss-parser 3.13.0 |
| Deployment | Vercel (zero-config) |
| Language | JavaScript (ES6+, no TypeScript) |

---

## Directory Structure

```
codexfiesta/
├── app/
│   ├── api/feeds/route.js   # GET /api/feeds — validates params, calls fetchAggregateFeed
│   ├── layout.js            # Root HTML layout + metadata
│   ├── page.js              # Home page (client component, all UI logic)
│   └── globals.css          # Dark theme (navy/blue palette)
├── lib/
│   └── feeds.js             # SOURCES list, scoring, aggregation engine
├── next.config.mjs          # Next.js config (ISR revalidation: 900s)
├── vercel.json              # Vercel deployment config
└── package.json             # Scripts + dependencies
```

---

## Development Commands

```bash
npm install       # Install dependencies
npm run dev       # Start dev server at http://localhost:3000
npm run build     # Production build
npm start         # Run production build locally
npm run lint      # ESLint
```

No environment variables are needed.

---

## Architecture & Data Flow

```
Browser (app/page.js)
  └─ fetch /api/feeds?topic=X&limit=Y&q=Z
       └─ app/api/feeds/route.js
            └─ fetchAggregateFeed() from lib/feeds.js
                 ├─ Promise.all(SOURCES.map(parseURL))
                 ├─ scoreItem() per item
                 ├─ dedupeByLink()
                 ├─ filter by topic + query
                 └─ sort by score desc, then date desc
```

- **`app/page.js`** — `'use client'` component. Manages tab state (`all`, `chatgpt`, `claude`, `trends`), search query, loading/error state. Fetches with `cache: 'no-store'`. Renders "Top Highlights" (score ≥ 6) and full item list.
- **`app/api/feeds/route.js`** — Validates `limit` (1–100), `topic`, and `q` params. Returns JSON: `{ generatedAt, sourceCount, filters, items }`.
- **`lib/feeds.js`** — Core logic. Exports `SOURCES`, `scoreItem()`, and `fetchAggregateFeed()`.

---

## Scoring Algorithm

Defined in `lib/feeds.js` — `scoreItem(item)`:

```
score = (chatgptHits × 4) + (claudeHits × 4) + (trendHits × 1)
```

**Keyword sets:**
- `chatgpt`: `chatgpt`, `gpt-4`, `gpt-4o`, `gpt-5`, `openai`
- `claude`: `claude`, `anthropic`, `constitutional ai`
- `trend`: `agent`, `reasoning`, `inference`, `multimodal`, `benchmark`, `tool use`, `safety`

Items with `score ≥ 6` appear in the "Top Highlights" panel in the UI.

---

## RSS Feed Sources

Defined in the `SOURCES` array in `lib/feeds.js`. Each source has a `name`, `url`, and `tags` array used for display and filtering:

| # | Name | Tags |
|---|------|------|
| 1 | OpenAI News | `chatgpt`, `openai` |
| 2 | Anthropic News | `claude`, `anthropic` |
| 3 | Hugging Face Blog | `oss`, `models` |
| 4 | Google DeepMind Blog | `research` |
| 5 | The Batch (DeepLearning.AI) | `industry` |
| 6 | MIT AI News | `research` |
| 7 | TechCrunch AI | `industry`, `news` |
| 8 | VentureBeat AI | `industry`, `news` |
| 9 | The Verge AI | `news` |
| 10 | Wired AI | `news` |
| 11 | Meta AI Blog | `research`, `meta` |
| 12 | Microsoft AI Blog | `industry`, `microsoft` |

---

## API Reference

### `GET /api/feeds`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `topic` | string | `all` | `all` \| `chatgpt` \| `claude` \| `trends` |
| `limit` | number | `30` | Max items to return (1–100) |
| `q` | string | — | Free-text search over title + snippet |

**Response shape:**
```json
{
  "generatedAt": "2025-01-01T00:00:00.000Z",
  "sourceCount": 12,
  "filters": { "topic": "all", "q": "", "limit": 30 },
  "items": [
    {
      "id": "...",
      "source": "OpenAI News",
      "sourceTags": ["chatgpt", "openai"],
      "title": "...",
      "link": "...",
      "publishedAt": "2025-01-01T00:00:00.000Z",
      "snippet": "...",
      "score": 8,
      "flags": { "chatgpt": true, "claude": false, "trend": true }
    }
  ]
}
```

---

## Deployment

- **Platform**: Vercel (auto-detects Next.js — no config needed)
- **ISR revalidation**: 900 seconds (15 minutes) — set in `next.config.mjs`
- **Steps**: Push to GitHub → Import in Vercel → Deploy

---

## Conventions & Patterns

### Adding a new RSS feed
Edit the `SOURCES` array in `lib/feeds.js`:
```js
{ name: 'Source Name', url: 'https://example.com/feed.xml', tags: ['tag1', 'tag2'] }
```
Tags are informational and displayed in the UI. The scoring is keyword-based, not tag-based.

### Adding new scoring keywords
Edit the `KEYWORDS` object in `lib/feeds.js`. Add to an existing group (`chatgpt`, `claude`, `trend`) or add a new group with a corresponding weight in `scoreItem()`.

### Error handling
Feed fetch failures produce error items (`failed: true`, `score: -1`). They pass all topic filters and appear at the bottom of results. The UI displays them with an error style. Do not swallow these — they help identify broken feeds.

### Caching
The API uses ISR (`next.config.mjs`). The client fetches with `cache: 'no-store'` so refreshing the UI always hits the API. Adjust `revalidate` in `next.config.mjs` to change the server-side cache TTL.
