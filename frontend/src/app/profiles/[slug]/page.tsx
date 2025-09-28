import { Metadata } from 'next';
import { PublicProfile } from '@/lib/types/profile';
import SlugProfileClient from './client';

// Generate metadata for SEO optimization
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    // Fetch profile data for metadata
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/profiles/slug/${slug}`, {
      cache: 'no-store' // Ensure fresh data for metadata
    });
    
    if (response.ok) {
      const profile: PublicProfile = await response.json();
      
      const title = `${profile.name} - Profiles`;
      const description = profile.bio 
        ? `${profile.bio.substring(0, 160)}${profile.bio.length > 160 ? '...' : ''}`
        : `Connect with ${profile.name} on Profiles. Available for ${profile.availableFor.join(', ')}.`;
      
      const keywords = [
        profile.name,
        ...profile.skills,
        ...profile.availableFor,
        'profile',
        'connect',
        'meeting',
        'professional'
      ].join(', ');

      return {
        title,
        description,
        keywords,
        authors: [{ name: profile.name }],
        openGraph: {
          title,
          description,
          url: profile.profileUrl,
          siteName: 'Profiles',
          type: 'profile',
          images: [
            {
              url: `${baseUrl}/api/og?name=${encodeURIComponent(profile.name)}&skills=${encodeURIComponent(profile.skills.slice(0, 3).join(', '))}`,
              width: 1200,
              height: 630,
              alt: `${profile.name}'s Profile`,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [`${baseUrl}/api/og?name=${encodeURIComponent(profile.name)}&skills=${encodeURIComponent(profile.skills.slice(0, 3).join(', '))}`],
        },
        alternates: {
          canonical: profile.profileUrl,
        },
        robots: {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
          },
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }

  // Fallback metadata
  return {
    title: `Profile - Profiles`,
    description: 'View profile on Profiles - Connect with professionals worldwide.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function SlugProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  return <SlugProfileClient params={params} />;
}