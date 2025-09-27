'use client';

import { useState } from 'react';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  Phone, 
  Clock,
  CheckCircle,
  AlertCircle,
  Book,
  Video,
  FileText,
  Send,
  ExternalLink
} from 'lucide-react';

export default function SupportPage() {
  const { user } = useAuth();
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset form
    setContactForm({
      subject: '',
      message: '',
      priority: 'medium',
      category: 'general'
    });
    setIsSubmitting(false);
    
    // Show success message (in a real app, you'd handle this properly)
    alert('Your message has been sent! We\'ll get back to you within 24 hours.');
  };

  const faqItems = [
    {
      question: "How do I create my professional profile?",
      answer: "Navigate to the Dashboard and click 'Create Profile'. Fill in your professional information, skills, and availability preferences. Your profile will be visible to others once published."
    },
    {
      question: "How do appointment requests work?",
      answer: "Others can request appointments, quotes, or meetings through your profile. You'll receive notifications and can accept or decline requests from your Dashboard or Calendar."
    },
    {
      question: "Can I edit my profile after creating it?",
      answer: "Yes! Go to Settings > Profile to update your information, skills, bio, and availability preferences at any time."
    },
    {
      question: "How do I manage my privacy settings?",
      answer: "Visit Settings > Privacy to control who can see your profile, contact you directly, and whether search engines can index your profile."
    },
    {
      question: "What types of requests can I receive?",
      answer: "You can receive three types of requests: Appointments (1-on-1 meetings), Quotes (project estimates), and Meetings (group discussions). You can choose which types you're available for in your profile settings."
    },
    {
      question: "How do I search for other professionals?",
      answer: "Use the 'Browse Profiles' page or the search feature on the Dashboard. You can filter by skills, availability, and search by name or expertise."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard security measures to protect your data. Authentication is handled by WorkOS, and you control what information is visible on your profile."
    },
    {
      question: "How do I delete my account?",
      answer: "Go to Settings > Account and scroll to the Danger Zone. You can delete your profile there. Note that this action cannot be undone."
    }
  ];

  const quickHelpItems = [
    {
      title: "Getting Started Guide",
      description: "Learn the basics of creating and managing your profile",
      icon: <Book className="h-5 w-5" />,
      link: "#"
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step guides for common tasks",
      icon: <Video className="h-5 w-5" />,
      link: "#"
    },
    {
      title: "API Documentation",
      description: "Technical documentation for developers",
      icon: <FileText className="h-5 w-5" />,
      link: "#"
    }
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Center</h1>
        <p className="text-gray-600 mt-1">
          Get help with your account, find answers to common questions, and contact our support team
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">< 24h</div>
            <p className="text-xs text-muted-foreground">
              Average support response
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">
              Issues resolved successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support Hours</CardTitle>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24/7</div>
            <p className="text-xs text-muted-foreground">
              Available around the clock
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="faq" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Contact
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Book className="h-4 w-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="status" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faq" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Find quick answers to the most common questions about using the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((item, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Describe your issue and we'll get back to you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitContact} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select 
                        id="category"
                        className="w-full p-2 border rounded-md"
                        value={contactForm.category}
                        onChange={(e) => setContactForm(prev => ({ ...prev, category: e.target.value }))}
                      >
                        <option value="general">General Question</option>
                        <option value="technical">Technical Issue</option>
                        <option value="billing">Billing</option>
                        <option value="feature">Feature Request</option>
                        <option value="bug">Bug Report</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <select 
                        id="priority"
                        className="w-full p-2 border rounded-md"
                        value={contactForm.priority}
                        onChange={(e) => setContactForm(prev => ({ ...prev, priority: e.target.value }))}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      placeholder="Brief description of your issue"
                      value={contactForm.subject}
                      onChange={(e) => setContactForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Describe your issue in detail..."
                      rows={6}
                      value={contactForm.message}
                      onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Other Ways to Reach Us
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Email Support</p>
                      <p className="text-sm text-gray-600">support@profiles.finderbee.ai</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Live Chat</p>
                      <p className="text-sm text-gray-600">Available 24/7 for urgent issues</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">Phone Support</p>
                      <p className="text-sm text-gray-600">+1 (555) 123-4567</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Name:</span>
                        <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Email:</span>
                        <span className="text-sm font-medium">{user.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Account Type:</span>
                        <Badge variant="outline">Free</Badge>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">Please log in to see account information</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Help Resources
              </CardTitle>
              <CardDescription>
                Guides, tutorials, and documentation to help you get the most out of the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {quickHelpItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center space-x-3 mb-3">
                      {item.icon}
                      <h3 className="font-medium">{item.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Resource
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Popular Articles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "How to optimize your profile for better visibility",
                  "Best practices for managing appointment requests",
                  "Understanding privacy settings and data security",
                  "Tips for effective professional networking",
                  "Troubleshooting common login issues"
                ].map((article, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <span className="text-sm">{article}</span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                System Status
              </CardTitle>
              <CardDescription>
                Current status of all platform services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { service: "API Services", status: "operational", uptime: "99.9%" },
                  { service: "Authentication", status: "operational", uptime: "100%" },
                  { service: "Database", status: "operational", uptime: "99.8%" },
                  { service: "File Storage", status: "operational", uptime: "99.9%" },
                  { service: "Email Notifications", status: "operational", uptime: "99.7%" }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium">{item.service}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline" className="text-green-700 border-green-200">
                        {item.status}
                      </Badge>
                      <span className="text-sm text-gray-600">{item.uptime}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">All Systems Operational</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  All services are running normally. Last updated: {new Date().toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}