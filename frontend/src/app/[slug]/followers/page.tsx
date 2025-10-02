import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FollowerList } from '@/components/follower-list';

interface FollowersPageProps {
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

export async function generateMetadata({ params }: FollowersPageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getProfile(slug);

  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }

  return {
    title: `${profile.name}'s Followers - ProfileBase`,
    description: `View people following ${profile.name} on ProfileBase`,
  };
}

export default async function FollowersPage({ params }: FollowersPageProps) {
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
        <h1 className="text-3xl font-bold">{profile.name}&apos;s Followers</h1>
        <p className="text-muted-foreground mt-2">
          People following {profile.name}
        </p>
      </div>

      {/* Followers list */}
      <FollowerList profileId={profile.id} type="followers" />
    </div>
  );
}
