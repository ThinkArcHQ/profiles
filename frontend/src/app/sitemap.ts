import { MetadataRoute } from 'next';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://profilebase.ai';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/profile/new`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    // Get all public AND active profiles for indexing
    const publicProfiles = await db
      .select({
        slug: profiles.slug,
        updatedAt: profiles.updatedAt,
      })
      .from(profiles)
      .where(and(eq(profiles.isPublic, true), eq(profiles.isActive, true)))
      .limit(50000); // Google supports up to 50,000 URLs per sitemap

    const profilePages: MetadataRoute.Sitemap = publicProfiles.map((profile) => ({
      url: `${baseUrl}/${profile.slug}`,
      lastModified: new Date(profile.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.9, // High priority for profile pages
    }));

    return [...staticPages, ...profilePages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Return static pages only if database query fails
    return staticPages;
  }
}