import { getFeedResponse } from '@/lib/feed';

export const dynamic = 'force-static';

export async function GET() {
  return getFeedResponse('rss');
}
