import Parser from 'rss-parser';

const parser = new Parser({ timeout: 10000 });

export const SOURCES = [
  { name: 'OpenAI News', url: 'https://openai.com/news/rss.xml', tags: ['chatgpt', 'openai'] },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news/rss.xml', tags: ['claude', 'anthropic'] },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', tags: ['oss', 'models'] },
  { name: 'Google DeepMind Blog', url: 'https://deepmind.google/blog/rss.xml', tags: ['research'] },
  { name: 'The Batch (DeepLearning.AI)', url: 'https://www.deeplearning.ai/the-batch/feed/', tags: ['industry'] },
  { name: 'MIT AI News', url: 'https://news.mit.edu/rss/topic/artificial-intelligence2', tags: ['research'] }
];

const KEYWORDS = {
  chatgpt: ['chatgpt', 'gpt-4', 'gpt-4o', 'gpt-5', 'openai'],
  claude: ['claude', 'anthropic', 'constitutional ai'],
  trend: ['agent', 'reasoning', 'inference', 'multimodal', 'benchmark', 'tool use', 'safety']
};

function normalizeText(item = {}) {
  return `${item.title ?? ''} ${item.contentSnippet ?? ''} ${item.content ?? ''}`.toLowerCase();
}

function matchCount(text, terms = []) {
  return terms.reduce((count, term) => (text.includes(term) ? count + 1 : count), 0);
}

export function scoreItem(item = {}) {
  const text = normalizeText(item);
  const chatgptHits = matchCount(text, KEYWORDS.chatgpt);
  const claudeHits = matchCount(text, KEYWORDS.claude);
  const trendHits = matchCount(text, KEYWORDS.trend);

  return {
    score: chatgptHits * 4 + claudeHits * 4 + trendHits,
    flags: {
      chatgpt: chatgptHits > 0,
      claude: claudeHits > 0,
      trend: trendHits > 0
    }
  };
}

function toTimestamp(value) {
  const ts = new Date(value ?? 0).getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function cleanSnippet(raw = '') {
  return String(raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function toItem(source, item) {
  const { score, flags } = scoreItem(item);

  return {
    id: item.guid || item.link || `${source.name}-${item.title}`,
    source: source.name,
    sourceTags: source.tags,
    title: item.title || 'Untitled',
    link: item.link,
    publishedAt: item.isoDate || item.pubDate || null,
    snippet: cleanSnippet(item.contentSnippet || item.content || ''),
    score,
    flags
  };
}

function dedupeByLink(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item.link || seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });
}

export async function fetchAggregateFeed({ limit = 30, topic = 'all', q = '' } = {}) {
  const allItems = [];

  await Promise.all(
    SOURCES.map(async (source) => {
      try {
        const feed = await parser.parseURL(source.url);
        const parsed = (feed.items ?? []).map((item) => toItem(source, item));
        allItems.push(...parsed);
      } catch (error) {
        allItems.push({
          id: `${source.name}-error`,
          source: source.name,
          sourceTags: source.tags,
          title: `Failed to load ${source.name}`,
          link: source.url,
          publishedAt: null,
          snippet: String(error?.message || error),
          score: -1,
          flags: { chatgpt: false, claude: false, trend: false },
          failed: true
        });
      }
    })
  );

  const topicFilter = String(topic || 'all').toLowerCase();
  const query = String(q || '').toLowerCase().trim();

  return dedupeByLink(allItems)
    .filter((item) => {
      if (item.failed) return true;
      if (topicFilter === 'chatgpt') return item.flags.chatgpt;
      if (topicFilter === 'claude') return item.flags.claude;
      if (topicFilter === 'trends') return item.flags.trend;
      return true;
    })
    .filter((item) => {
      if (!query) return true;
      const haystack = `${item.title} ${item.snippet}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return toTimestamp(b.publishedAt) - toTimestamp(a.publishedAt);
    })
    .slice(0, limit);
}
