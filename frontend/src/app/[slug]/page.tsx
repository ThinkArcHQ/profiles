import { Metadata } from 'next';
import Script from 'next/script';
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
      
      const title = `${profile.name} - ProfileBase`;
      const description = profile.bio
        ? `${profile.bio.substring(0, 160)}${profile.bio.length > 160 ? '...' : ''}`
        : `Connect with ${profile.name} on ProfileBase. Available for ${profile.availableFor.join(', ')}.`;
      
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
          siteName: 'ProfileBase',
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
    title: `Profile - ProfileBase`,
    description: 'View profile on ProfileBase - Connect with professionals worldwide.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

async function getProfileData(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://profilebase.ai';
    const response = await fetch(`${baseUrl}/api/profiles/slug/${slug}`, {
      cache: 'no-store'
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching profile for JSON-LD:', error);
  }
  return null;
}

export default async function SlugProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getProfileData(slug);

  // Generate JSON-LD structured data for better SEO
  const jsonLd = profile ? {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: profile.profileUrl,
    description: profile.bio || `Professional profile of ${profile.name}`,
    email: profile.email,
    jobTitle: profile.skills.join(', '),
    knowsAbout: profile.skills,
    sameAs: [
      profile.linkedinUrl,
      ...(profile.otherLinks ? Object.values(profile.otherLinks) : [])
    ].filter(Boolean),
    worksFor: {
      '@type': 'Organization',
      name: 'ProfileBase',
      url: 'https://profilebase.ai'
    },
    alumniOf: profile.skills.length > 0 ? {
      '@type': 'EducationalOrganization',
      name: profile.skills[0]
    } : undefined,
    offers: profile.availableFor.map((service: string) => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Service',
        name: service,
        description: `${profile.name} is available for ${service}`
      }
    }))
  } : null;

  return (
    <>
      {jsonLd && (
        <Script
          id="profile-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SlugProfileClient params={params} />
    </>
  );
}