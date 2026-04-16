import { NextResponse } from 'next/server';
import { fetchAggregateFeed, SOURCES } from '@/lib/feeds';

export const revalidate = 900;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 30, 1), 100);
  const topic = searchParams.get('topic') || 'all';
  const q = searchParams.get('q') || '';

  const items = await fetchAggregateFeed({ limit, topic, q });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    sourceCount: SOURCES.length,
    filters: { topic, q, limit },
    items
  });
}
