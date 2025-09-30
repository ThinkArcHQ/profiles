'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, Check, X, AlertCircle, Edit3, Save, RotateCcw, Loader2 } from 'lucide-react';
import { validateSlug } from '@/lib/services/slug-service';
import { useToast } from '@/components/ui/toast';

interface SlugEditorProps {
  currentSlug: string;
  onUpdate: (newSlug: string) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  baseUrl?: string;
}

export function SlugEditor({ 
  currentSlug, 
  onUpdate, 
  isLoading = false,
  className = "",
  baseUrl = ""
}: SlugEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newSlug, setNewSlug] = useState(currentSlug);
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    isAvailable: boolean | null;
    error: string | null;
  }>({
    isValid: true,
    isAvailable: null,
    error: null
  });
  const { addToast } = useToast();

  const profileUrl = `${baseUrl}/${currentSlug}`;
  const previewUrl = `${baseUrl}/${newSlug}`;

  // Reset state when currentSlug changes
  useEffect(() => {
    setNewSlug(currentSlug);
    setIsEditing(false);
    setValidationState({ isValid: true, isAvailable: null, error: null });
  }, [currentSlug]);

  // Validate slug format and availability
  useEffect(() => {
    if (!isEditing || newSlug === currentSlug) {
      setValidationState({ isValid: true, isAvailable: null, error: null });
      return;
    }

    const validateSlugAsync = async () => {
      setIsValidating(true);
      
      try {
        // First check format
        const isValidFormat = validateSlug(newSlug);
        if (!isValidFormat) {
          setValidationState({
            isValid: false,
            isAvailable: null,
            error: 'Slug must be 3-50 characters, lowercase letters, numbers, and hyphens only'
          });
          return;
        }

        // Check availability
        const response = await fetch(`/api/profiles/slug/check?slug=${encodeURIComponent(newSlug)}`);
        const data = await response.json();
        
        if (response.ok) {
          setValidationState({
            isValid: true,
            isAvailable: data.available,
            error: data.available ? null : 'This slug is already taken'
          });
        } else {
          setValidationState({
            isValid: false,
            isAvailable: null,
            error: data.error || 'Failed to check slug availability'
          });
        }
      } catch (error) {
        setValidationState({
          isValid: false,
          isAvailable: null,
          error: 'Failed to validate slug'
        });
      } finally {
        setIsValidating(false);
      }
    };

    const timeoutId = setTimeout(validateSlugAsync, 300); // Debounce validation
    return () => clearTimeout(timeoutId);
  }, [newSlug, currentSlug, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setNewSlug(currentSlug);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewSlug(currentSlug);
    setValidationState({ isValid: true, isAvailable: null, error: null });
  };

  const handleSave = async () => {
    if (!validationState.isValid || !validationState.isAvailable || newSlug === currentSlug) {
      return;
    }

    try {
      setSaving(true);
      await onUpdate(newSlug);
      setIsEditing(false);
      addToast({
        type: 'success',
        title: 'Profile URL updated',
        description: `Your profile is now available at /${newSlug}`
      });
    } catch (error) {
      console.error('Failed to update slug:', error);
      setValidationState({
        ...validationState,
        error: 'Failed to update slug. Please try again.'
      });
      addToast({
        type: 'error',
        title: 'Failed to update profile URL',
        description: 'Please try again or contact support if the problem persists.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSlugChange = (value: string) => {
    // Auto-format slug as user types
    const formatted = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '') // Remove invalid characters
      .replace(/--+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    setNewSlug(formatted);
  };

  const getValidationIcon = () => {
    if (isValidating) {
      return <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />;
    }
    
    if (!validationState.isValid || validationState.error) {
      return <X className="h-4 w-4 text-red-500" />;
    }
    
    if (validationState.isAvailable === true) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    
    return null;
  };

  const canSave = isEditing && 
                 validationState.isValid && 
                 validationState.isAvailable === true && 
                 newSlug !== currentSlug && 
                 !isValidating && 
                 !isSaving;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Profile URL
        </CardTitle>
        <CardDescription>
          Your unique profile URL that AI agents and people use to find you
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current URL Display */}
        <div className="space-y-3">
          <Label>Your Profile URL</Label>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="font-mono text-sm break-all">
                {isEditing ? previewUrl : profileUrl}
              </p>
              {isEditing && newSlug !== currentSlug && (
                <p className="text-xs text-gray-500 mt-1">
                  Preview of new URL
                </p>
              )}
            </div>
            <Badge variant={isEditing ? "secondary" : "default"}>
              {isEditing ? 'Preview' : 'Current'}
            </Badge>
          </div>
        </div>

        {/* Slug Editor */}
        <div className="space-y-3">
          <Label htmlFor="slug">Profile Slug</Label>
          {!isEditing ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                <p className="font-mono">{currentSlug}</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleEdit}
                disabled={isLoading}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    id="slug"
                    value={newSlug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="your-profile-slug"
                    className={`font-mono ${
                      validationState.error ? 'border-red-500' : 
                      validationState.isAvailable === true ? 'border-green-500' : ''
                    }`}
                    disabled={isSaving}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {getValidationIcon()}
                  </div>
                </div>
              </div>
              
              {/* Validation Message */}
              {validationState.error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {validationState.error}
                </div>
              )}
              
              {validationState.isAvailable === true && newSlug !== currentSlug && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  This slug is available!
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleSave}
                  disabled={!canSave}
                  size="sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSaving}
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Slug Requirements */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Slug Requirements</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 3-50 characters long</li>
            <li>• Lowercase letters, numbers, and hyphens only</li>
            <li>• Cannot start or end with a hyphen</li>
            <li>• Must be unique across all profiles</li>
          </ul>
        </div>

        {/* URL Sharing Info */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Share Your Profile</h4>
          <p className="text-sm text-green-700">
            This URL can be shared with anyone and is used by AI agents to discover and contact you. 
            Your old URL will automatically redirect to your new one if you change your slug.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}