import { withAuth } from '@workos-inc/authkit-nextjs';
import Link from 'next/link';
import Profiles from './Profiles';
import ClipboardButton from './ClipboardButton';
import { Button } from '@/components/ui/button';
import { FeaturesSectionWithHoverEffects } from '@/components/blocks/feature-section-with-hover-effects';
import { db } from '@/lib/db/connection';
import { profiles } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function Home() {
  const { user } = await withAuth();
  
  // Check if user has a profile
  let userProfile = null;
  if (user) {
    try {
      const userProfiles = await db
        .select()
        .from(profiles)
        .where(and(eq(profiles.workosUserId, user.id), eq(profiles.isActive, true)))
        .limit(1);
      userProfile = userProfiles.length > 0 ? userProfiles[0] : null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 pt-6">
            {/* Name/Logo in Top Left */}
            <div className="text-white text-2xl font-bold">
              Profiles
            </div>

            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/profiles" className="text-white/80 hover:text-white">
                      Browse Profiles
                    </Link>
                  </Button>
                  {userProfile ? (
                    <Button asChild>
                      <Link href="/dashboard">
                        Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link href="/profile/new">
                        Register Profile
                      </Link>
                    </Button>
                  )}
                  <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-white/20">
                    <div className="text-sm">
                      <span className="text-white/80">Welcome,</span>
                      <span className="text-white font-semibold ml-1">{user.firstName}</span>
                    </div>
                    <a
                      href="/logout"
                      className="text-white/80 hover:text-white text-sm font-medium transition-colors"
                    >
                      Sign out
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link href="/login" className="text-white/80 hover:text-white">
                      Sign In
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/profile/new">
                      Get Started
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button className="text-white/80 hover:text-white p-2">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black min-h-screen">
        {/* Background patterns */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(251,146,60,0.3),transparent_70%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.2),transparent_70%)]"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-orange-500/20 text-orange-200 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-orange-400 rounded-full mr-2 animate-pulse"></span>
              Profile Discovery for AI
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight">
              Be Discovered by
              <span className="block bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                AI Agents Worldwide
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-300 mb-12 leading-relaxed max-w-3xl mx-auto">
              Create your profile and let AI agents find you for meeting requests and quote opportunities.
              Connect with intelligent systems looking for your skills and expertise.
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              {user && userProfile ? (
                <Button size="lg" asChild className="text-lg px-8 py-6 rounded-2xl">
                  <Link href="/dashboard" className="flex items-center">
                    Go to Dashboard
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="text-lg px-8 py-6 rounded-2xl">
                  <Link href="/profile/new" className="flex items-center">
                    Create Your Profile
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </Link>
                </Button>
              )}

              {!user && (
                <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6 rounded-2xl border-2 border-orange-500/50 hover:bg-orange-500 hover:text-white backdrop-blur-sm">
                  <Link href="#profiles" className="flex items-center">
                    View Profiles
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="animate-bounce">
            <svg className="w-6 h-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold text-orange-900 mb-6">
              Why Register Your Profile?
            </h2>
            <p className="text-xl text-orange-700 max-w-3xl mx-auto">
              The first social platform designed for AI discovery. Anyone can join and be found by intelligent systems worldwide for meetings, quotes, and connections.
            </p>
          </div>

          <FeaturesSectionWithHoverEffects />

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 rounded-3xl p-8 border border-orange-200">
              <h3 className="text-2xl font-bold text-orange-900 mb-4">
                Ready to be discovered?
              </h3>
              <p className="text-orange-700 mb-6 max-w-2xl mx-auto">
                Join the first social platform designed for AI agents. Create your profile and start receiving meeting requests and opportunities.
              </p>
              {user && userProfile ? (
                <Button size="lg" asChild className="text-lg px-8 py-6 rounded-2xl">
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <Button size="lg" asChild className="text-lg px-8 py-6 rounded-2xl">
                  <Link href="/profile/new">
                    Create Your Profile Now
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Profiles />

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-orange-100 to-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-orange-400/10 to-transparent"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-orange-900 mb-8">
            Ready to Be Discovered by
            <span className="block bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
              AI Agents Worldwide?
            </span>
          </h2>
          <p className="text-xl text-orange-700 mb-12 leading-relaxed">
            Join thousands of professionals who are getting discovered by AI agents for exciting opportunities and projects.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {user && userProfile ? (
              <Button size="lg" asChild className="text-lg px-8 py-6 rounded-2xl">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            ) : (
              <Button size="lg" asChild className="text-lg px-8 py-6 rounded-2xl">
                <Link href="/profile/new">
                  Create Your Profile
                </Link>
              </Button>
            )}
            
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-6 rounded-2xl">
              <Link href="/profiles">
                Browse Profiles
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* AI Agent Builders Section */}
      <section className="py-24 bg-orange-500 relative overflow-hidden">
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-8">For AI Agent Builders</h2>
          <div className="bg-white rounded-3xl p-8 border border-gray-200">
            <p className="text-gray-800 mb-6 text-xl font-semibold">MCP Endpoint:</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
              <code className="bg-gray-100 text-gray-800 px-6 py-4 rounded-2xl text-lg font-mono border border-gray-200 min-w-0">
                https://profiles.finderbee.ai/mcp
              </code>
              <ClipboardButton textToCopy="https://profiles.finderbee.ai/mcp" />
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              Integrate with our profile database to discover and connect with talented individuals for your AI agents.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">

                <div>
                  <h3 className="text-2xl font-bold text-white">Profiles by FinderBee.ai</h3>
                  <p className="text-orange-400">by ThinkArc, Inc.</p>
                </div>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
                Connecting people with AI agents worldwide. 
                Showcase your skills and get discovered for amazing opportunities.
              </p>
              
              <div className="flex space-x-6">
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.042-3.441.219-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.194-.333 1.361-.053.225-.174.271-.402.163-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.747-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-white mb-6">Platform</h4>
              <ul className="space-y-4">
                <li><Link href="#profiles" className="text-gray-400 hover:text-orange-400 transition-colors">Browse Profiles</Link></li>
                <li><Link href="/profile/new" className="text-gray-400 hover:text-orange-400 transition-colors">Register Profile</Link></li>
                <li><Link href="/login" className="text-gray-400 hover:text-orange-400 transition-colors">Sign In</Link></li>
                <li><Link href="/dashboard" className="text-gray-400 hover:text-orange-400 transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Support</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                © 2025 ThinkArc, Inc. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm mt-4 md:mt-0">
                connecting people with AI worldwide.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}