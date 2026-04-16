'use client';

import { useEffect, useMemo, useState } from 'react';

const TOPICS = [
  { id: 'all', label: 'All AI' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'claude', label: 'Claude' },
  { id: 'trends', label: 'AI Trends' }
];

function formatDate(dateText) {
  if (!dateText) return 'Unknown date';
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return dateText;
  return date.toLocaleString();
}

function buildQuery(topic, query) {
  const params = new URLSearchParams({ limit: '40' });
  if (topic && topic !== 'all') params.set('topic', topic);
  if (query.trim()) params.set('q', query.trim());
  return params.toString();
}

export default function HomePage() {
  const [topic, setTopic] = useState('all');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load(currentTopic = topic, currentQuery = appliedQuery) {
    setLoading(true);
    setError('');
    try {
      const queryString = buildQuery(currentTopic, currentQuery);
      const response = await fetch(`/api/feeds?${queryString}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const body = await response.json();
      setData(body);
    } catch (err) {
      setError(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(topic, appliedQuery);
  }, [topic, appliedQuery]);

  const highlights = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((item) => !item.failed && item.score >= 6).slice(0, 6);
  }, [data]);

  function applySearch(e) {
    e.preventDefault();
    setAppliedQuery(query);
  }

  return (
    <main>
      <h1>AI RSS Trends Dashboard</h1>
      <p className="description">
        Aggregates key AI feeds and lets you focus on ChatGPT news, Claude news, or broader AI trend coverage.
      </p>

      <div className="panel">
        <div className="header-row">
          <div>
            <strong>Sources:</strong> {data?.sourceCount ?? '-'}
            <br />
            <small>Last refresh: {data?.generatedAt ? formatDate(data.generatedAt) : 'Not loaded yet'}</small>
          </div>
          <button onClick={() => load()} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh'}</button>
        </div>

        <div className="topic-row">
          {TOPICS.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setTopic(entry.id)}
              className={topic === entry.id ? 'active' : ''}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <form onSubmit={applySearch} className="search-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search headline/snippet (e.g. agents, pricing, benchmark)"
          />
          <button type="submit">Apply</button>
        </form>
      </div>

      {error ? <div className="panel">Error: {error}</div> : null}

      <section className="panel">
        <h2>Top Highlights</h2>
        {loading ? <p>Loading…</p> : null}
        <ul>
          {highlights.map((item) => (
            <li key={item.id}>
              <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a>
              <div className="meta">
                <span>{item.source}</span>
                <span>{formatDate(item.publishedAt)}</span>
                <span>Relevance: {item.score}</span>
              </div>
            </li>
          ))}
          {!loading && highlights.length === 0 ? <li>No highlighted stories for this filter yet.</li> : null}
        </ul>
      </section>

      <section className="panel">
        <h2>All Aggregated Items</h2>
        {loading ? <p>Loading…</p> : null}
        <ul>
          {(data?.items || []).map((item) => (
            <li key={item.id}>
              <a href={item.link} target="_blank" rel="noreferrer">{item.title}</a>
              <div className="meta">
                <span>{item.source}</span>
                <span>{formatDate(item.publishedAt)}</span>
                <span>Score: {item.score}</span>
              </div>
              {item.snippet ? <p>{item.snippet.slice(0, 220)}{item.snippet.length > 220 ? '…' : ''}</p> : null}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
