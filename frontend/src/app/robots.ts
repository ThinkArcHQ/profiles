import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://profilebase.ai';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/', // Allow homepage
          '/home', // Allow profile directory
          '/*', // Allow all profile slugs (individual profiles)
        ],
        disallow: [
          '/api/*', // Block API routes
          '/settings/*', // Block settings pages
          '/profile/new', // Block profile creation
          '/request/*', // Block request pages
          '/requests/*', // Block requests dashboard
          '/calendar/*', // Block calendar
          '/login/*', // Block auth pages
          '/logout/*',
          '/auth/*',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/home',
          '/*', // Explicitly allow Google to crawl all profiles
        ],
        disallow: [
          '/api/*',
          '/settings/*',
          '/profile/new',
          '/request/*',
          '/requests/*',
          '/calendar/*',
          '/login/*',
          '/logout/*',
          '/auth/*',
        ],
        crawlDelay: 0, // No delay for Google
      },
      {
        userAgent: 'GPTBot',
        allow: [
          '/*', // Allow AI bots to access profiles via MCP
          '/api/mcp/*',
        ],
        disallow: [
          '/api/*',
          '/settings/*',
          '/profile/new',
          '/request/*',
          '/requests/*',
          '/calendar/*',
          '/login/*',
          '/logout/*',
          '/auth/*',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}