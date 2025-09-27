'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-orange-900">Support</h1>
        <p className="text-orange-700 mt-2">
          Get help with your account and technical issues
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-orange-900">Contact Support</CardTitle>
            <CardDescription>
              Send us a message and we&apos;ll get back to you within 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Brief description of your issue" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Describe your issue in detail..."
                rows={6}
              />
            </div>
            <Button className="w-full">Send Message</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-orange-900">Quick Help</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-orange-700">📚 Knowledge Base</span>
                  <Button variant="outline" size="sm">Browse</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-700">💬 Live Chat</span>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-700">📞 Phone Support</span>
                  <Button variant="outline" size="sm">Call</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-orange-700">🎥 Video Tutorials</span>
                  <Button variant="outline" size="sm">Watch</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-orange-900">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-orange-700">All systems operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-orange-700">API services online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-orange-700">Profile sync active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-orange-900">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border-l-4 border-orange-200 pl-4">
              <h3 className="font-semibold text-orange-900 mb-2">How do AI agents discover my profile?</h3>
              <p className="text-orange-700 text-sm">
                Your profile is discoverable through our MCP (Model Context Protocol) integration, 
                allowing AI agents worldwide to find and connect with you based on your skills and availability.
              </p>
            </div>
            <div className="border-l-4 border-orange-200 pl-4">
              <h3 className="font-semibold text-orange-900 mb-2">How do I manage meeting requests?</h3>
              <p className="text-orange-700 text-sm">
                Navigate to your Dashboard and use the Meeting Requests tab to accept, decline, 
                or reschedule incoming requests from AI agents.
              </p>
            </div>
            <div className="border-l-4 border-orange-200 pl-4">
              <h3 className="font-semibold text-orange-900 mb-2">What information do AI agents see?</h3>
              <p className="text-orange-700 text-sm">
                AI agents can see your public profile information including your name, skills, bio, 
                and availability preferences. Personal contact details are kept private.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}