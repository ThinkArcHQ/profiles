// Debug script to check profile data
// Run with: node debug-profile.js

const { db } = require('./src/lib/db/connection');
const { profiles } = require('./src/lib/db/schema');
const { eq } = require('drizzle-orm');

async function checkProfile(slug) {
  try {
    console.log(`Checking profile: ${slug}`);
    
    const result = await db
      .select()
      .from(profiles)
      .where(eq(profiles.slug, slug))
      .limit(1);

    if (result.length === 0) {
      console.log('❌ Profile not found');
      return;
    }

    const profile = result[0];
    console.log('✅ Profile found:');
    console.log(`  - ID: ${profile.id}`);
    console.log(`  - Name: ${profile.name}`);
    console.log(`  - Email: ${profile.email}`);
    console.log(`  - isPublic: ${profile.isPublic}`);
    console.log(`  - isActive: ${profile.isActive}`);
    console.log(`  - Skills: ${profile.skills?.join(', ') || 'None'}`);
    console.log(`  - Available for: ${profile.availableFor?.join(', ') || 'None'}`);
    console.log(`  - Bio: ${profile.bio ? 'Yes' : 'No'}`);
    console.log(`  - Created: ${profile.createdAt}`);

    // Check privacy
    if (!profile.isPublic) {
      console.log('🔒 Profile is PRIVATE - only owner can see full details');
    }
    if (!profile.isActive) {
      console.log('⚠️  Profile is INACTIVE - not visible to anyone');
    }
    if (profile.isPublic && profile.isActive) {
      console.log('🌍 Profile is PUBLIC and ACTIVE - visible to everyone');
    }

  } catch (error) {
    console.error('Error checking profile:', error);
  }
}

// Check the specific profile
checkProfile('vishnu-alle').then(() => {
  process.exit(0);
});