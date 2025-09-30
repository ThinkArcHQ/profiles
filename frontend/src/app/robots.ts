import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/settings/',
          '/profile/new',
          '/request/',
          '/meeting-requests/',
          '/sent-requests/',
          '/quote-requests/',
          '/calendar/',
          '/support/',
          '/login/',
          '/logout/',
          '/auth/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: [
          '/profiles/',
          '/api/mcp/',
        ],
        disallow: [
          '/api/',
          '/settings/',
          '/profile/',
          '/request/',
          '/meeting-requests/',
          '/sent-requests/',
          '/quote-requests/',
          '/calendar/',
          '/support/',
          '/login/',
          '/logout/',
          '/auth/',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}