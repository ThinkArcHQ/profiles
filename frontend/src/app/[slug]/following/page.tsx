import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FollowerList } from '@/components/follower-list';

interface FollowingPageProps {
  params: Promise<{ slug: string }>;
}

async function getProfile(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/profiles/slug/${slug}`, {
      cache: 'no-store',
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
  }
  return null;
}

export async function generateMetadata({ params }: FollowingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }

  return {
    title: `${profile.name} is Following - ProfileBase`,
    description: `View people ${profile.name} is following on ProfileBase`,
  };
}

export default async function FollowingPage({ params }: FollowingPageProps) {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    notFound();
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Back button and header */}
      <div className="mb-8">
        <Link href={`/${slug}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Profile
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{profile.name} is Following</h1>
        <p className="text-muted-foreground mt-2">
          People {profile.name} is following
        </p>
      </div>

      {/* Following list */}
      <FollowerList profileId={profile.id} type="following" />
    </div>
  );
}
