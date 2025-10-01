'use client'

import { Badge } from '@/components/ui/badge'
import {
  Clock,
  CheckCircle,
  XCircle,
  Calendar,
  ArrowRight
} from 'lucide-react'

interface RequestHistoryProps {
  request: {
    id: string
    requesterName: string
    requesterEmail: string
    message: string
    preferredTime?: string
    requestType: string
    status: string
    createdAt: string
    updatedAt?: string
    proposedTime?: string
    counterMessage?: string
    responseMessage?: string
  }
}

export function RequestHistory({ request }: RequestHistoryProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-3.5 w-3.5 text-green-600" />
      case 'rejected':
        return <XCircle className="h-3.5 w-3.5 text-red-600" />
      case 'counter_proposed':
        return <Calendar className="h-3.5 w-3.5 text-purple-600" />
      default:
        return <Clock className="h-3.5 w-3.5 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-2">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Timeline</h4>

      {/* Created */}
      <div className="flex items-start gap-2 text-xs">
        <Clock className="h-3.5 w-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">Request Submitted</span>
            <span className="text-gray-500">{formatDate(request.createdAt)}</span>
          </div>
          <p className="text-gray-600 mt-1">{request.message}</p>
          {request.preferredTime && (
            <p className="text-gray-500 mt-1">
              Preferred: {formatDate(request.preferredTime)}
            </p>
          )}
        </div>
      </div>

      {/* Status update */}
      {request.status !== 'pending' && request.updatedAt && (
        <>
          <div className="border-t border-gray-200 my-2" />
          <div className="flex items-start gap-2 text-xs">
            {getStatusIcon(request.status)}
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {request.status === 'accepted' && 'Accepted'}
                  {request.status === 'rejected' && 'Declined'}
                  {request.status === 'counter_proposed' && 'Counter Proposed'}
                </span>
                <span className="text-gray-500">{formatDate(request.updatedAt)}</span>
              </div>

              {request.status === 'counter_proposed' && request.proposedTime && (
                <div className="flex items-center gap-1 mt-1 text-purple-600">
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium">{formatDate(request.proposedTime)}</span>
                </div>
              )}

              {request.counterMessage && (
                <p className="text-gray-600 mt-1">{request.counterMessage}</p>
              )}

              {request.responseMessage && (
                <p className="text-gray-600 mt-1">{request.responseMessage}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
