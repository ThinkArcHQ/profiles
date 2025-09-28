'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, MessageSquare, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CounterProposalDialogProps {
  requestId: string
  requesterName: string
  originalTime?: string
  onSubmit: (data: { proposedTime: string; counterMessage: string }) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CounterProposalDialog({
  requestId,
  requesterName,
  originalTime,
  onSubmit,
  onCancel,
  isLoading = false
}: CounterProposalDialogProps) {
  const [proposedTime, setProposedTime] = useState('')
  const [counterMessage, setCounterMessage] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!proposedTime) {
      newErrors.proposedTime = 'Please select a proposed time'
    }

    if (!counterMessage.trim()) {
      newErrors.counterMessage = 'Please provide a message with your counter-proposal'
    } else if (counterMessage.trim().length < 10) {
      newErrors.counterMessage = 'Message should be at least 10 characters long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit({
        proposedTime,
        counterMessage: counterMessage.trim()
      })
    } catch (error) {
      console.error('Error submitting counter-proposal:', error)
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return ''
    return new Date(dateTimeString).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Propose Alternative Time</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Suggest an alternative time for your meeting with {requesterName}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {originalTime && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Originally requested time:
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {formatDateTime(originalTime)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="proposedTime">
                Your proposed time *
              </Label>
              <Input
                id="proposedTime"
                type="datetime-local"
                value={proposedTime}
                onChange={(e) => setProposedTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className={errors.proposedTime ? 'border-red-500' : ''}
              />
              {errors.proposedTime && (
                <p className="text-sm text-red-600">{errors.proposedTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="counterMessage">
                Message to {requesterName} *
              </Label>
              <Textarea
                id="counterMessage"
                placeholder="Explain why you're proposing this alternative time and any additional details..."
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                rows={4}
                className={errors.counterMessage ? 'border-red-500' : ''}
              />
              {errors.counterMessage && (
                <p className="text-sm text-red-600">{errors.counterMessage}</p>
              )}
              <p className="text-xs text-gray-500">
                {counterMessage.length}/500 characters
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Proposal
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}