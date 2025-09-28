import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || 'Profile';
    const skills = searchParams.get('skills') || '';

    // Create a simple SVG image for Open Graph
    const svg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#fed7aa;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ffffff;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1200" height="630" fill="url(#bg)"/>
        
        <!-- Logo/Brand -->
        <text x="60" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="bold" fill="#9a3412">
          Profiles
        </text>
        
        <!-- Profile Circle -->
        <circle cx="200" cy="315" r="80" fill="#ea580c" opacity="0.9"/>
        <text x="200" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">
          ${name.charAt(0).toUpperCase()}
        </text>
        
        <!-- Name -->
        <text x="320" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" fill="#9a3412">
          ${name}
        </text>
        
        <!-- Skills -->
        ${skills ? `
        <text x="320" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="24" fill="#c2410c">
          ${skills}
        </text>
        ` : ''}
        
        <!-- Call to action -->
        <text x="320" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#7c2d12">
          Connect and collaborate
        </text>
        
        <!-- Bottom decoration -->
        <rect x="0" y="580" width="1200" height="50" fill="#ea580c" opacity="0.1"/>
      </svg>
    `;

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    // Return a simple fallback SVG
    const fallbackSvg = `
      <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="630" fill="#fed7aa"/>
        <text x="600" y="315" font-family="system-ui, -apple-system, sans-serif" font-size="48" font-weight="bold" fill="#9a3412" text-anchor="middle">
          Profiles
        </text>
      </svg>
    `;

    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
}