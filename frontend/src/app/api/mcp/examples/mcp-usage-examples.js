/**
 * MCP Tools Usage Examples
 * 
 * This file demonstrates how AI agents can interact with the MCP endpoints
 * to search for profiles and request meetings.
 */

const BASE_URL = 'https://profilebase.ai/api/mcp';

/**
 * Example 1: Search for profiles by skills
 */
async function searchBySkills() {
  console.log('🔍 Searching for JavaScript developers...');
  
  const response = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      skills: ['JavaScript', 'TypeScript'],
      availableFor: ['meetings'],
      limit: 5,
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log(`Found ${data.profiles.length} profiles:`);
    data.profiles.forEach(profile => {
      console.log(`- ${profile.name} (${profile.slug})`);
      console.log(`  Skills: ${profile.skills.join(', ')}`);
      console.log(`  Available for: ${profile.availableFor.join(', ')}`);
      console.log(`  Profile: ${profile.profileUrl}`);
      console.log('');
    });
  } else {
    console.error('Search failed:', data.error);
  }
}

/**
 * Example 2: Search by text query
 */
async function searchByQuery() {
  console.log('🔍 Searching for "AI engineer"...');
  
  const response = await fetch(`${BASE_URL}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: 'AI engineer',
      limit: 3,
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log(`Found ${data.profiles.length} profiles matching "AI engineer":`);
    data.profiles.forEach(profile => {
      console.log(`- ${profile.name}: ${profile.bio}`);
    });
  } else {
    console.error('Search failed:', data.error);
  }
}

/**
 * Example 3: Get detailed profile information
 */
async function getProfileDetails(slug) {
  console.log(`📋 Getting details for profile: ${slug}`);
  
  const response = await fetch(`${BASE_URL}/get-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profileSlug: slug,
    }),
  });

  const data = await response.json();
  
  if (response.ok && data.found) {
    const profile = data.profile;
    console.log(`Profile Details for ${profile.name}:`);
    console.log(`- Bio: ${profile.bio}`);
    console.log(`- Skills: ${profile.skills.join(', ')}`);
    console.log(`- Available for: ${profile.availableFor.join(', ')}`);
    console.log(`- LinkedIn: ${profile.linkedinUrl || 'Not provided'}`);
    console.log(`- Other links:`, profile.otherLinks);
    console.log(`- Profile URL: ${profile.profileUrl}`);
  } else {
    console.error('Profile not found or error:', data.error);
  }
}

/**
 * Example 4: Request a meeting
 */
async function requestMeeting(profileSlug) {
  console.log(`📅 Requesting meeting with: ${profileSlug}`);
  
  const response = await fetch(`${BASE_URL}/request-meeting`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profileSlug: profileSlug,
      requesterName: 'AI Assistant',
      requesterEmail: 'assistant@ai-company.com',
      message: 'Hello! I am an AI assistant helping my user find experts in your field. Would you be available for a brief meeting to discuss potential collaboration opportunities? We are particularly interested in your expertise and would love to learn more about your work.',
      requestType: 'meeting',
      preferredTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    }),
  });

  const data = await response.json();
  
  if (response.ok && data.success) {
    console.log('✅ Meeting request sent successfully!');
    console.log(`Request ID: ${data.requestId}`);
    console.log(`Message: ${data.message}`);
    console.log(`Status: ${data.details.status}`);
  } else {
    console.error('❌ Meeting request failed:', data.error);
    console.error('Code:', data.code);
  }
}

/**
 * Example 5: Complete workflow - Search and request meeting
 */
async function completeWorkflow() {
  console.log('🚀 Starting complete MCP workflow...\n');
  
  try {
    // Step 1: Search for profiles
    console.log('Step 1: Searching for React developers...');
    const searchResponse = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        skills: ['React'],
        availableFor: ['meetings'],
        limit: 1,
      }),
    });

    const searchData = await searchResponse.json();
    
    if (!searchResponse.ok || searchData.profiles.length === 0) {
      console.log('No suitable profiles found.');
      return;
    }

    const profile = searchData.profiles[0];
    console.log(`Found profile: ${profile.name} (${profile.slug})\n`);

    // Step 2: Get detailed profile information
    console.log('Step 2: Getting detailed profile information...');
    await getProfileDetails(profile.slug);
    console.log('');

    // Step 3: Request a meeting
    console.log('Step 3: Requesting a meeting...');
    await requestMeeting(profile.slug);
    
  } catch (error) {
    console.error('Workflow failed:', error.message);
  }
}

/**
 * Example 6: Handle validation errors
 */
async function demonstrateValidation() {
  console.log('🔧 Demonstrating validation handling...\n');
  
  // Invalid email format
  console.log('Testing invalid email format:');
  const response = await fetch(`${BASE_URL}/request-meeting`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profileSlug: 'john-doe',
      requesterName: 'AI Assistant',
      requesterEmail: 'invalid-email', // Invalid format
      message: 'This is a test message',
      requestType: 'meeting',
    }),
  });

  const data = await response.json();
  console.log(`Status: ${response.status}`);
  console.log(`Error: ${data.error}`);
  console.log(`Code: ${data.code}\n`);

  // Invalid slug format
  console.log('Testing invalid slug format:');
  const response2 = await fetch(`${BASE_URL}/get-profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      profileSlug: 'Invalid Slug!', // Invalid format
    }),
  });

  const data2 = await response2.json();
  console.log(`Status: ${response2.status}`);
  console.log(`Error: ${data2.error}`);
  console.log(`Code: ${data2.code}`);
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    searchBySkills,
    searchByQuery,
    getProfileDetails,
    requestMeeting,
    completeWorkflow,
    demonstrateValidation,
  };
}

// Run examples if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  console.log('MCP Tools Usage Examples\n');
  console.log('Note: These examples assume the server is running at', BASE_URL);
  console.log('Update BASE_URL to match your actual server URL.\n');
  
  // Uncomment the examples you want to run:
  
  // searchBySkills();
  // searchByQuery();
  // getProfileDetails('john-doe');
  // requestMeeting('john-doe');
  // completeWorkflow();
  // demonstrateValidation();
  
  console.log('Uncomment the function calls at the bottom of this file to run examples.');
}