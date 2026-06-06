import { FeedData } from './feed';

export function formatAtomFeed(data: FeedData): string {
  const { items, siteUrl, siteTitle, siteDescription, authorName, authorEmail, lastUpdated } = data;

  const entries = items.map(
    (item) => `    <entry>
      <title type="html"><![CDATA[${item.title}]]></title>
      <link href="${item.url}" rel="alternate"/>
      <id>${item.url}</id>
      <published>${item.date_published}</published>
      <updated>${item.date_modified}</updated>
      <author>
        <name>${authorName}</name>
        ${authorEmail ? `<email>${authorEmail}</email>` : ''}
      </author>
      <summary type="html"><![CDATA[${item.summary}]]></summary>
      <content type="html"><![CDATA[${item.content_html}]]></content>
      ${item.tags.map((k) => `<category term="${k}"/>`).join('\n      ')}
    </entry>`,
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title type="text">${siteTitle}</title>
  <subtitle type="text">${siteDescription}</subtitle>
  <link href="${siteUrl}" rel="alternate"/>
  <link href="${siteUrl}/feed.atom" rel="self"/>
  <id>${siteUrl}/</id>
  <updated>${lastUpdated}</updated>
  <author>
    <name>${authorName}</name>
    ${authorEmail ? `<email>${authorEmail}</email>` : ''}
  </author>
  <generator uri="https://nextjs.org/">Next.js</generator>
  <link href="${siteUrl}/feed.xml" rel="alternate" type="application/rss+xml"/>
  <link href="${siteUrl}/feed.json" rel="alternate" type="application/json"/>
${entries.join('\n')}
</feed>`;
}

export function formatRssFeed(data: FeedData): string {
  const { items, siteUrl, siteTitle, siteDescription, authorName, authorEmail, lastUpdated } = data;
  const buildDate = new Date(lastUpdated).toUTCString();
  const managingEditor = authorEmail ? `${authorEmail} (${authorName})` : authorName;

  const rssItems = items.map((item) => {
    const pubDate = new Date(item.date_published).toUTCString();

    return `  <item>
    <title><![CDATA[${item.title}]]></title>
    <link>${item.url}</link>
    <guid isPermaLink="true">${item.url}</guid>
    <description><![CDATA[${item.summary}]]></description>
    <content:encoded><![CDATA[${item.content_html}]]></content:encoded>
    <pubDate>${pubDate}</pubDate>
    <author>${managingEditor}</author>
    ${item.image ? `<enclosure url="${item.image}" type="image/jpeg" length="0" />` : ''}
    <category><![CDATA[${item.tags[0] || 'post'}]]></category>
    ${item.tags.map((k) => `<category><![CDATA[${k}]]></category>`).join('\n    ')}
  </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">
  <channel>
    <title><![CDATA[${siteTitle}]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${siteDescription}]]></description>
    <language>en-us</language>
    <managingEditor>${managingEditor}</managingEditor>
    <webMaster>${managingEditor}</webMaster>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <ttl>60</ttl>
    <generator>Next.js RSS Generator</generator>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <atom:link href="${siteUrl}/feed.atom" rel="alternate" type="application/atom+xml"/>
    <atom:link href="${siteUrl}/feed.json" rel="alternate" type="application/json"/>
${rssItems.join('\n')}
  </channel>
</rss>`;
}

export function formatJsonFeed(data: FeedData): Record<string, unknown> {
  const { items, siteUrl, siteTitle, siteDescription, authorName, authorEmail } = data;

  const jsonItems = items.map((item) => ({
    id: item.id,
    url: item.url,
    title: item.title,
    content_html: item.content_html,
    content_text: item.content_text,
    summary: item.summary,
    date_published: item.date_published,
    date_modified: item.date_modified,
    author: {
      name: authorName,
      ...(authorEmail ? { url: `mailto:${authorEmail}` } : {}),
    },
    tags: item.tags,
    ...(item.image ? { image: item.image } : {}),
  }));

  return {
    version: 'https://jsonfeed.org/version/1.1',
    title: siteTitle,
    description: siteDescription,
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    language: 'en',
    authors: [
      {
        name: authorName,
        ...(authorEmail ? { url: `mailto:${authorEmail}` } : {}),
      },
    ],
    items: jsonItems,
  };
}
