'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

export default function SupportPage() {
  const handleEmailClick = () => {
    window.location.href = 'mailto:help@thinkarc.ai';
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-600 mt-2">
          Need help? We're here to assist you.
        </p>
      </div>

      {/* Email Contact Card */}
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Mail className="h-6 w-6" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Send us an email and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={handleEmailClick}
              className="w-full"
              size="lg"
            >
              <Mail className="h-4 w-4 mr-2" />
              Email help@thinkarc.ai
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}