'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Calendar,
  ExternalLink,
  Share2,
  MessageCircle,
  Mail,
  Check,
  Linkedin,
  Globe,
  Pencil,
  Plus,
  Briefcase,
  GraduationCap,
  X,
  Save,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@workos-inc/authkit-nextjs/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ProfileData {
  id: number;
  workosUserId: string;
  slug: string;
  name: string;
  email: string;
  bio: string | null;
  headline?: string | null;
  location?: string | null;
  skills: string[];
  availableFor: string[];
  linkedinUrl: string | null;
  otherLinks: any;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  projects?: ProjectItem[];
  customSections?: CustomSection[];
}

interface ExperienceItem {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

interface EducationItem {
  id: string;
  degree: string;
  school: string;
  field?: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface ProjectItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  tags?: string[];
}

interface CustomSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export default function SlugProfileClient() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Edit dialogs state
  const [editBasicInfo, setEditBasicInfo] = useState(false);
  const [editAbout, setEditAbout] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [editExperience, setEditExperience] = useState(false);
  const [editEducation, setEditEducation] = useState(false);
  const [editProjects, setEditProjects] = useState(false);
  const [editLinks, setEditLinks] = useState(false);
  const [addCustomSection, setAddCustomSection] = useState(false);
  const [showMeetingRequest, setShowMeetingRequest] = useState(false);

  // Form data
  const [formData, setFormData] = useState<any>({});
  const [currentExperience, setCurrentExperience] = useState<ExperienceItem | null>(null);
  const [currentEducation, setCurrentEducation] = useState<EducationItem | null>(null);
  const [currentProject, setCurrentProject] = useState<ProjectItem | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newCustomSection, setNewCustomSection] = useState({ title: '', content: '' });
  const [meetingRequest, setMeetingRequest] = useState({
    requesterName: '',
    requesterEmail: '',
    message: '',
    preferredTime: ''
  });

  useEffect(() => {
    if (slug) {
      fetchProfile(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (user && profile) {
      setIsOwner(user.id === profile.workosUserId);
    }
  }, [user, profile]);

  const fetchProfile = async (slug: string) => {
    try {
      const response = await fetch(`/api/profiles/slug/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        trackProfileView(data.id, 'direct');
      } else if (response.status === 404) {
        setError('Profile not found');
      } else {
        throw new Error('Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const trackProfileView = async (profileId: number, source: string) => {
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, eventType: 'view', source }),
      });
    } catch (error) {
      console.debug('Analytics tracking failed:', error);
    }
  };

  const updateProfile = async (updates: Partial<ProfileData>) => {
    try {
      const response = await fetch(`/api/profiles/${profile?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (response.ok) {
        const updated = await response.json();
        setProfile(updated);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCopyProfile = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const saveBasicInfo = () => {
    updateProfile({
      name: formData.name || profile?.name,
      headline: formData.headline,
      location: formData.location,
    });
    setEditBasicInfo(false);
  };

  const saveAbout = () => {
    updateProfile({ bio: formData.bio });
    setEditAbout(false);
  };

  const addSkill = () => {
    if (newSkill.trim() && profile) {
      updateProfile({ skills: [...profile.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (profile) {
      updateProfile({ skills: profile.skills.filter(s => s !== skillToRemove) });
    }
  };

  const saveExperience = () => {
    if (currentExperience && profile) {
      const experiences = profile.experience || [];
      const existingIndex = experiences.findIndex(e => e.id === currentExperience.id);

      if (existingIndex >= 0) {
        experiences[existingIndex] = currentExperience;
      } else {
        experiences.push({ ...currentExperience, id: Date.now().toString() });
      }

      updateProfile({ experience: experiences });
      setCurrentExperience(null);
      setEditExperience(false);
    }
  };

  const saveEducation = () => {
    if (currentEducation && profile) {
      const educations = profile.education || [];
      const existingIndex = educations.findIndex(e => e.id === currentEducation.id);

      if (existingIndex >= 0) {
        educations[existingIndex] = currentEducation;
      } else {
        educations.push({ ...currentEducation, id: Date.now().toString() });
      }

      updateProfile({ education: educations });
      setCurrentEducation(null);
      setEditEducation(false);
    }
  };

  const saveProject = () => {
    if (currentProject && profile) {
      const projects = profile.projects || [];
      const existingIndex = projects.findIndex(p => p.id === currentProject.id);

      if (existingIndex >= 0) {
        projects[existingIndex] = currentProject;
      } else {
        projects.push({ ...currentProject, id: Date.now().toString() });
      }

      updateProfile({ projects });
      setCurrentProject(null);
      setEditProjects(false);
    }
  };

  const saveCustomSection = () => {
    if (newCustomSection.title && newCustomSection.content && profile) {
      const sections = profile.customSections || [];
      sections.push({
        ...newCustomSection,
        id: Date.now().toString(),
        order: sections.length
      });
      updateProfile({ customSections: sections });
      setNewCustomSection({ title: '', content: '' });
      setAddCustomSection(false);
    }
  };

  const submitMeetingRequest = async () => {
    if (!profile || !meetingRequest.requesterName || !meetingRequest.requesterEmail || !meetingRequest.message) {
      return;
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          requesterName: meetingRequest.requesterName,
          requesterEmail: meetingRequest.requesterEmail,
          message: meetingRequest.message,
          preferredTime: meetingRequest.preferredTime || null,
          requestType: 'meeting'
        }),
      });

      if (response.ok) {
        setShowMeetingRequest(false);
        setMeetingRequest({
          requesterName: '',
          requesterEmail: '',
          message: '',
          preferredTime: ''
        });
        alert('Meeting request sent successfully!');
      }
    } catch (error) {
      console.error('Failed to send meeting request:', error);
      alert('Failed to send meeting request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="animate-pulse space-y-8">
            <div className="flex gap-6">
              <div className="h-24 w-24 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This profile does not exist.'}</p>
          <Button asChild>
            <Link href="/home">Browse Profiles</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation */}
      <div className="border-b border-gray-200 sticky top-0 z-10 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/home" className="text-xl font-bold">
              <span className="text-black">Profile</span>
              <span className="text-orange-600">Base</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/home" className="text-sm text-gray-600 hover:text-gray-900">
                Browse
              </Link>
              {user ? (
                <Link href="/settings">
                  <Button variant="outline" size="sm">Settings</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button size="sm">Sign In</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Single Page Layout */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="mb-12">
          <div className="flex items-start gap-8 mb-8">
            <Avatar className="h-24 w-24 flex-shrink-0">
              <AvatarFallback className="text-2xl font-semibold bg-gray-100 text-gray-700">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{profile.name}</h1>
                  {profile.headline ? (
                    <p className="text-xl text-gray-600 mb-3">{profile.headline}</p>
                  ) : isOwner ? (
                    <p className="text-xl text-gray-400 italic mb-3">Add your professional headline</p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {profile.location ? (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {profile.location}
                      </div>
                    ) : isOwner ? (
                      <div className="flex items-center gap-1 text-gray-400 italic">
                        <MapPin className="h-4 w-4" />
                        Add location
                      </div>
                    ) : null}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDate(profile.createdAt)}
                    </div>
                  </div>
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        name: profile.name,
                        headline: profile.headline,
                        location: profile.location
                      });
                      setEditBasicInfo(true);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {!isOwner && (
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowMeetingRequest(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Request Meeting
                  </Button>
                )}
                <Button variant="outline" onClick={handleCopyProfile}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </>
                  )}
                </Button>
                {profile.email && !isOwner && (
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-12" />

        {/* About Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">About</h2>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFormData({ bio: profile.bio || '' });
                  setEditAbout(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          {profile.bio ? (
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">{profile.bio}</p>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Sparkles className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-600 leading-relaxed">
                  {isOwner ? (
                    <>
                      <span className="font-medium text-gray-900">Tell your story!</span> Share what makes you unique - your background, passions, and what you're working on. This helps others understand who you are.
                    </>
                  ) : (
                    <span className="text-gray-500 italic">{profile.name} hasn't added an about section yet.</span>
                  )}
                </p>
                {isOwner && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setFormData({ bio: '' });
                      setEditAbout(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add About
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-12" />

        {/* Skills Section - Always show */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
            {isOwner && (
              <Button variant="ghost" size="sm" onClick={() => setEditSkills(true)}>
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
          {profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 font-normal"
                >
                  {skill}
                  {isOwner && (
                    <button
                      onClick={() => removeSkill(skill)}
                      className="ml-2 hover:text-gray-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Sparkles className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-600 leading-relaxed">
                  {isOwner ? (
                    <>
                      <span className="font-medium text-gray-900">Showcase your expertise!</span> Add skills to highlight what you're great at. This helps people find you and understand your strengths.
                    </>
                  ) : (
                    <span className="text-gray-500 italic">No skills added yet.</span>
                  )}
                </p>
                {isOwner && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => setEditSkills(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Skills
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-12" />

        {/* Experience Section - Always show */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Experience</h2>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentExperience({
                    id: '',
                    title: '',
                    company: '',
                    location: '',
                    startDate: '',
                    endDate: '',
                    current: false,
                    description: ''
                  });
                  setEditExperience(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            )}
          </div>
          {profile.experience && profile.experience.length > 0 ? (
            <div className="space-y-8">
              {profile.experience.map((exp) => (
                <div key={exp.id} className="relative pl-8 border-l-2 border-gray-200">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-gray-300"></div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{exp.title}</h3>
                      <p className="text-gray-700">{exp.company}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate!)}
                        {exp.location && ` • ${exp.location}`}
                      </p>
                      {exp.description && (
                        <p className="text-gray-600 mt-3 leading-relaxed">{exp.description}</p>
                      )}
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentExperience(exp);
                          setEditExperience(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Sparkles className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-600 leading-relaxed">
                  {isOwner ? (
                    <>
                      <span className="font-medium text-gray-900">Build your professional timeline!</span> Add your work experience to show your career journey and achievements.
                    </>
                  ) : (
                    <span className="text-gray-500 italic">No work experience added yet.</span>
                  )}
                </p>
                {isOwner && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setCurrentExperience({
                        id: '',
                        title: '',
                        company: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        current: false,
                        description: ''
                      });
                      setEditExperience(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Experience
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-12" />

        {/* Education Section - Always show */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Education</h2>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentEducation({
                    id: '',
                    degree: '',
                    school: '',
                    field: '',
                    startDate: '',
                    endDate: '',
                    description: ''
                  });
                  setEditEducation(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            )}
          </div>
          {profile.education && profile.education.length > 0 ? (
            <div className="space-y-8">
              {profile.education.map((edu) => (
                <div key={edu.id} className="relative pl-8 border-l-2 border-gray-200">
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-gray-300"></div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{edu.school}</h3>
                      <p className="text-gray-700">{edu.degree}{edu.field && `, ${edu.field}`}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                      </p>
                      {edu.description && (
                        <p className="text-gray-600 mt-3 leading-relaxed">{edu.description}</p>
                      )}
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentEducation(edu);
                          setEditEducation(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Sparkles className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-600 leading-relaxed">
                  {isOwner ? (
                    <>
                      <span className="font-medium text-gray-900">Share your learning journey!</span> Add your educational background - schools, degrees, certifications, and achievements.
                    </>
                  ) : (
                    <span className="text-gray-500 italic">No education added yet.</span>
                  )}
                </p>
                {isOwner && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setCurrentEducation({
                        id: '',
                        degree: '',
                        school: '',
                        field: '',
                        startDate: '',
                        endDate: '',
                        description: ''
                      });
                      setEditEducation(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Education
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-12" />

        {/* Projects Section - Always show */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentProject({
                    id: '',
                    title: '',
                    description: '',
                    url: '',
                    tags: []
                  });
                  setEditProjects(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            )}
          </div>
          {profile.projects && profile.projects.length > 0 ? (
            <div className="space-y-6">
              {profile.projects.map((project) => (
                <div key={project.id} className="pb-6 border-b border-gray-200 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
                        {project.url && (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      <p className="text-gray-600 mt-2 leading-relaxed">{project.description}</p>
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {project.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCurrentProject(project);
                          setEditProjects(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Sparkles className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-600 leading-relaxed">
                  {isOwner ? (
                    <>
                      <span className="font-medium text-gray-900">Showcase your work!</span> Share projects you've built, contributed to, or are proud of. Include links and details.
                    </>
                  ) : (
                    <span className="text-gray-500 italic">No projects added yet.</span>
                  )}
                </p>
                {isOwner && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setCurrentProject({
                        id: '',
                        title: '',
                        description: '',
                        url: '',
                        tags: []
                      });
                      setEditProjects(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Project
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <Separator className="my-12" />

        {/* Links Section - Always show */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Links</h2>
            {isOwner && (
              <Button variant="ghost" size="sm" onClick={() => setEditLinks(true)}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          {(profile.linkedinUrl || (profile.otherLinks && Object.keys(profile.otherLinks).length > 0)) ? (
            <div className="space-y-3">
              {profile.linkedinUrl && (
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900"
                >
                  <Linkedin className="h-5 w-5 text-blue-600" />
                  <span className="flex-1">LinkedIn</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              )}
              {profile.otherLinks && Object.entries(profile.otherLinks).map(([key, url]: [string, any], index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-gray-700 hover:text-gray-900"
                >
                  <Globe className="h-5 w-5 text-gray-600" />
                  <span className="flex-1">{key}</span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </a>
              ))}
            </div>
          ) : (
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Sparkles className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-gray-600 leading-relaxed">
                  {isOwner ? (
                    <>
                      <span className="font-medium text-gray-900">Connect your online presence!</span> Add links to your LinkedIn, portfolio, GitHub, or personal website.
                    </>
                  ) : (
                    <span className="text-gray-500 italic">No links added yet.</span>
                  )}
                </p>
                {isOwner && (
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => setEditLinks(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Links
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Custom Sections */}
        {profile.customSections && profile.customSections.map((section) => (
          <div key={section.id}>
            <Separator className="my-12" />
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          </div>
        ))}

        {/* Add Custom Section */}
        {isOwner && (
          <>
            <Separator className="my-12" />
            <button
              onClick={() => setAddCustomSection(true)}
              className="w-full py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-600">
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium">Add Custom Section</span>
                <span className="text-xs text-gray-400">Awards, Publications, Volunteer Work, etc.</span>
              </div>
            </button>
          </>
        )}
      </div>

      {/* Edit Basic Info Dialog */}
      <Dialog open={editBasicInfo} onOpenChange={setEditBasicInfo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Basic Info</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="headline">Headline</Label>
              <Input
                id="headline"
                placeholder="e.g., Software Engineer at Company"
                value={formData.headline || ''}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., San Francisco, CA"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBasicInfo(false)}>Cancel</Button>
            <Button onClick={saveBasicInfo}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit About Dialog */}
      <Dialog open={editAbout} onOpenChange={setEditAbout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit About</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Tell us about yourself..."
              rows={6}
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAbout(false)}>Cancel</Button>
            <Button onClick={saveAbout}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Skills Dialog */}
      <Dialog open={editSkills} onOpenChange={setEditSkills}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Skill</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter a skill"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
              />
              <Button onClick={addSkill}>Add</Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEditSkills(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Experience Dialog */}
      <Dialog open={editExperience} onOpenChange={setEditExperience}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentExperience?.id ? 'Edit' : 'Add'} Experience</DialogTitle>
          </DialogHeader>
          {currentExperience && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="exp-title">Title *</Label>
                <Input
                  id="exp-title"
                  placeholder="e.g., Software Engineer"
                  value={currentExperience.title}
                  onChange={(e) => setCurrentExperience({ ...currentExperience, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="exp-company">Company *</Label>
                <Input
                  id="exp-company"
                  placeholder="e.g., Google"
                  value={currentExperience.company}
                  onChange={(e) => setCurrentExperience({ ...currentExperience, company: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="exp-location">Location</Label>
                <Input
                  id="exp-location"
                  placeholder="e.g., San Francisco, CA"
                  value={currentExperience.location || ''}
                  onChange={(e) => setCurrentExperience({ ...currentExperience, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exp-start">Start Date *</Label>
                  <Input
                    id="exp-start"
                    type="month"
                    value={currentExperience.startDate}
                    onChange={(e) => setCurrentExperience({ ...currentExperience, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="exp-end">End Date</Label>
                  <Input
                    id="exp-end"
                    type="month"
                    disabled={currentExperience.current}
                    value={currentExperience.endDate || ''}
                    onChange={(e) => setCurrentExperience({ ...currentExperience, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exp-current"
                  checked={currentExperience.current}
                  onChange={(e) => setCurrentExperience({ ...currentExperience, current: e.target.checked })}
                />
                <Label htmlFor="exp-current">I currently work here</Label>
              </div>
              <div>
                <Label htmlFor="exp-description">Description</Label>
                <Textarea
                  id="exp-description"
                  rows={4}
                  placeholder="Describe your role and achievements..."
                  value={currentExperience.description || ''}
                  onChange={(e) => setCurrentExperience({ ...currentExperience, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditExperience(false)}>Cancel</Button>
            <Button onClick={saveExperience}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Education Dialog */}
      <Dialog open={editEducation} onOpenChange={setEditEducation}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentEducation?.id ? 'Edit' : 'Add'} Education</DialogTitle>
          </DialogHeader>
          {currentEducation && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edu-school">School *</Label>
                <Input
                  id="edu-school"
                  placeholder="e.g., Stanford University"
                  value={currentEducation.school}
                  onChange={(e) => setCurrentEducation({ ...currentEducation, school: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edu-degree">Degree *</Label>
                <Input
                  id="edu-degree"
                  placeholder="e.g., Bachelor of Science"
                  value={currentEducation.degree}
                  onChange={(e) => setCurrentEducation({ ...currentEducation, degree: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edu-field">Field of Study</Label>
                <Input
                  id="edu-field"
                  placeholder="e.g., Computer Science"
                  value={currentEducation.field || ''}
                  onChange={(e) => setCurrentEducation({ ...currentEducation, field: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edu-start">Start Date *</Label>
                  <Input
                    id="edu-start"
                    type="month"
                    value={currentEducation.startDate}
                    onChange={(e) => setCurrentEducation({ ...currentEducation, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edu-end">End Date</Label>
                  <Input
                    id="edu-end"
                    type="month"
                    value={currentEducation.endDate || ''}
                    onChange={(e) => setCurrentEducation({ ...currentEducation, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edu-description">Description</Label>
                <Textarea
                  id="edu-description"
                  rows={3}
                  placeholder="Add details about your education..."
                  value={currentEducation.description || ''}
                  onChange={(e) => setCurrentEducation({ ...currentEducation, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEducation(false)}>Cancel</Button>
            <Button onClick={saveEducation}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Projects Dialog */}
      <Dialog open={editProjects} onOpenChange={setEditProjects}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{currentProject?.id ? 'Edit' : 'Add'} Project</DialogTitle>
          </DialogHeader>
          {currentProject && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="proj-title">Title *</Label>
                <Input
                  id="proj-title"
                  placeholder="e.g., E-commerce Platform"
                  value={currentProject.title}
                  onChange={(e) => setCurrentProject({ ...currentProject, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="proj-description">Description *</Label>
                <Textarea
                  id="proj-description"
                  rows={4}
                  placeholder="Describe your project..."
                  value={currentProject.description}
                  onChange={(e) => setCurrentProject({ ...currentProject, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="proj-url">URL</Label>
                <Input
                  id="proj-url"
                  type="url"
                  placeholder="https://..."
                  value={currentProject.url || ''}
                  onChange={(e) => setCurrentProject({ ...currentProject, url: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="proj-tags">Tags (comma separated)</Label>
                <Input
                  id="proj-tags"
                  placeholder="e.g., React, Node.js, MongoDB"
                  value={currentProject.tags?.join(', ') || ''}
                  onChange={(e) => setCurrentProject({
                    ...currentProject,
                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProjects(false)}>Cancel</Button>
            <Button onClick={saveProject}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Custom Section Dialog */}
      <Dialog open={addCustomSection} onOpenChange={setAddCustomSection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="section-title">Section Title *</Label>
              <Input
                id="section-title"
                placeholder="e.g., Awards, Publications, Volunteer Work"
                value={newCustomSection.title}
                onChange={(e) => setNewCustomSection({ ...newCustomSection, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="section-content">Content *</Label>
              <Textarea
                id="section-content"
                rows={6}
                placeholder="Add content for this section..."
                value={newCustomSection.content}
                onChange={(e) => setNewCustomSection({ ...newCustomSection, content: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustomSection(false)}>Cancel</Button>
            <Button onClick={saveCustomSection}>Add Section</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Request Dialog */}
      <Dialog open={showMeetingRequest} onOpenChange={setShowMeetingRequest}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Meeting with {profile.name}</DialogTitle>
            <DialogDescription>
              Send a meeting request. {profile.name} will be notified and can accept, decline, or propose a different time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="req-name">Your Name *</Label>
              <Input
                id="req-name"
                placeholder="Enter your full name"
                value={meetingRequest.requesterName}
                onChange={(e) => setMeetingRequest({ ...meetingRequest, requesterName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="req-email">Your Email *</Label>
              <Input
                id="req-email"
                type="email"
                placeholder="your.email@example.com"
                value={meetingRequest.requesterEmail}
                onChange={(e) => setMeetingRequest({ ...meetingRequest, requesterEmail: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="req-time">Preferred Date & Time (Optional)</Label>
              <Input
                id="req-time"
                type="datetime-local"
                value={meetingRequest.preferredTime}
                onChange={(e) => setMeetingRequest({ ...meetingRequest, preferredTime: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="req-message">Message *</Label>
              <Textarea
                id="req-message"
                rows={5}
                placeholder="Introduce yourself and explain why you'd like to meet..."
                value={meetingRequest.message}
                onChange={(e) => setMeetingRequest({ ...meetingRequest, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMeetingRequest(false)}>Cancel</Button>
            <Button
              onClick={submitMeetingRequest}
              disabled={!meetingRequest.requesterName || !meetingRequest.requesterEmail || !meetingRequest.message}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}