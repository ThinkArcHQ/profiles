import { withAuth } from "@workos-inc/authkit-nextjs";
import Link from "next/link";
import Profiles from "./Profiles";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { db } from "@/lib/db/connection";
import { profiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  Sparkles,
  Users,
  ArrowRight,
  Check,
  Clock,
  Heart,
  Zap,
} from "lucide-react";

export default async function Home() {
  const { user } = await withAuth();

  // Check if user has a profile
  let userProfile = null;
  if (user) {
    try {
      const userProfiles = await db
        .select()
        .from(profiles)
        .where(
          and(eq(profiles.workosUserId, user.id), eq(profiles.isActive, true))
        )
        .limit(1);
      userProfile = userProfiles.length > 0 ? userProfiles[0] : null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-40">
        <div className="w-full px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                <span className="text-black">Profile</span>
                <span className="text-orange-600">Base</span>
              </div>
              <Badge
                variant="secondary"
                className="ml-2 bg-orange-100 text-orange-700 border-orange-200"
              >
                Beta
              </Badge>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {user ? (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="text-gray-600 hover:text-orange-600"
                  >
                    <Link href="/home">Home</Link>
                  </Button>
                  {userProfile ? (
                    <Button
                      asChild
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Link href="/requests">Requests</Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Link href="/profile/new">Create Profile</Link>
                    </Button>
                  )}
                  <Separator orientation="vertical" className="h-6 mx-2" />
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      Welcome,{" "}
                      <span className="font-semibold text-gray-900">
                        {user.firstName}
                      </span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <Link href="/logout">Sign out</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    asChild
                    className="text-gray-600 hover:text-orange-600"
                  >
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button asChild className="bg-orange-600 hover:bg-orange-700">
                    <Link href="/profile/new">Get Started</Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Single Column Layout */}
      <div className="min-h-[85vh] flex items-center justify-center">
        {/* Centered Content */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-12 xl:px-20">
          <div className="py-16 lg:py-24 text-center">
            {/* Hero Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-orange-50 rounded-full border border-orange-200 text-orange-700 text-sm font-medium mb-8">
              <Clock className="w-4 h-4 mr-2" />
              Profiles Meet Availability • AI-Powered Discovery
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight mx-auto">
              Connect With People
              <span className="block bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent">
                At The Right Time
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
              The world's first open network where profiles meet availability.
              Be discoverable by AI agents, search by skills, see who's free,
              and send a meet request — no back-and-forth.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center">
              {user && userProfile ? (
                <Button
                  size="lg"
                  asChild
                  className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-6"
                >
                  <Link href="/calendar" className="flex items-center">
                    Check Calendar
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              ) : (
                <Button
                  size="lg"
                  asChild
                  className="bg-orange-600 hover:bg-orange-700 text-lg px-8 py-6"
                >
                  <Link href="/profile/new" className="flex items-center">
                    Create Your Profile
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              )}

              <Button
                variant="outline"
                size="lg"
                asChild
                className="text-lg px-8 py-6 border-orange-200 text-orange-600 hover:bg-orange-50"
              >
                <Link href="/home" className="flex items-center">
                  View Profiles
                  <Users className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>

            {/* Feature List */}
            <div className="space-y-4 max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Why people choose ProfileBase:
              </h3>
              <div className="grid gap-3 text-left">
                {[
                  "See when people are available — not just who they are",
                  "AI agents discover you 24/7 for opportunities",
                  "No more back-and-forth scheduling",
                  "For everyone: students, freelancers, hobbyists, professionals",
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <span className="text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles Section */}
      <Profiles />

      {/* Vision Section */}
      <div className="bg-white py-20 border-y border-orange-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-orange-50 rounded-full border border-orange-200 text-orange-700 text-sm font-medium mb-6">
              <Heart className="w-4 h-4 mr-2" />
              Our Vision
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              More Than Just Profiles
            </h2>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              At ProfileBase, we believe that{" "}
              <strong>
                real connection is more than just knowing who someone is
              </strong>{" "}
              — it's about knowing when they're available. Social platforms
              today show endless profiles, but they leave out the most important
              detail: <strong>time</strong>.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              That's why we're building the world's first open network where{" "}
              <strong>profiles meet availability</strong>. Whether you're a
              student searching for a study partner, a freelancer looking for
              clients, a hobbyist hoping to share passions, or simply someone
              who wants to connect with others, ProfileBase makes it effortless.
            </p>

            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              Just search by skills or interests, see who's free when you are,
              and send a meet request.{" "}
              <strong>
                No more back-and-forth, no more missed opportunities
              </strong>{" "}
              — just people, ready to connect, at the right time.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mt-12">
              <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center mb-3">
                  <Sparkles className="w-5 h-5 text-orange-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">Open Source</h3>
                </div>
                <p className="text-gray-700">
                  Built in the open with community-driven development. No vendor
                  lock-in, full transparency.
                </p>
              </div>

              <div className="bg-orange-50 rounded-xl p-6 border border-orange-100">
                <div className="flex items-center mb-3">
                  <Zap className="w-5 h-5 text-orange-600 mr-2" />
                  <h3 className="font-semibold text-gray-900">AI-Powered</h3>
                </div>
                <p className="text-gray-700">
                  Be discoverable by AI agents worldwide 24/7. They can find
                  you, check your availability, and send meeting requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                <div>
                  <h3 className="text-2xl font-bold">
                    <span className="text-white">Profile</span>
                    <span className="text-orange-600">Base</span>
                  </h3>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                Your profile, your choice. Connecting people with AI agents
                worldwide. Register to make yourself discoverable by AI agents
                and control what they know about you.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/home"
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile/new"
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    Create Profile
                  </Link>
                </li>
                {user && userProfile && (
                  <li>
                    <Link
                      href={`/${userProfile.slug}`}
                      className="text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      Your Profile
                    </Link>
                  </li>
                )}
                <li>
                  <Link
                    href="/requests"
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    Requests
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-gray-800" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2025 ProfileBase. All rights reserved.
            </p>
            <p className="text-gray-600 text-sm mt-4 md:mt-0">
              Connecting people with AI worldwide.
            </p>
          </div>
        </div>
      </footer>

      {/* Large Branding Section */}
      <div className="bg-[#0a0a0a] py-16 overflow-hidden">
        <div className="text-center">
          <h2 className="text-[8rem] sm:text-[10rem] md:text-[12rem] lg:text-[14rem] xl:text-[16rem] font-bold leading-none tracking-tighter select-none whitespace-nowrap">
            <span className="text-white/20">Profile</span>
            <span className="text-orange-600/40">Base</span>
          </h2>
        </div>
      </div>
    </div>
  );
}
