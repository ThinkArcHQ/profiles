import { MetadataRoute } from 'next';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/profiles`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/profile/new`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    // Get all public profiles for dynamic pages
    const publicProfiles = await db
      .select({
        slug: profiles.slug,
        updatedAt: profiles.updatedAt,
      })
      .from(profiles)
      .where(eq(profiles.isPublic, true))
      .limit(1000); // Limit to prevent huge sitemaps

    const profilePages: MetadataRoute.Sitemap = publicProfiles.map((profile) => ({
      url: `${baseUrl}/${profile.slug}`,
      lastModified: profile.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...profilePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if database query fails
    return staticPages;
  }
}