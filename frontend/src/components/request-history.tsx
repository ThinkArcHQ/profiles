'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  Mail,
  ArrowRight
} from 'lucide-react'

interface RequestHistoryItem {
  timestamp: string
  action: 'created' | 'accepted' | 'rejected' | 'counter_proposed'
  message?: string
  proposedTime?: string
  actor: 'requester' | 'recipient'
}

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
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'counter_proposed':
        return <Calendar className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'counter_proposed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Build history timeline
  const history: RequestHistoryItem[] = [
    {
      timestamp: request.createdAt,
      action: 'created',
      message: request.message,
      actor: 'requester'
    }
  ]

  if (request.status !== 'pending' && request.updatedAt) {
    history.push({
      timestamp: request.updatedAt,
      action: request.status as any,
      message: request.responseMessage,
      proposedTime: request.proposedTime,
      actor: 'recipient'
    })
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(request.status)}
          <span className="font-medium">Current Status:</span>
          <Badge className={getStatusColor(request.status)}>
            {request.status.replace('_', ' ').charAt(0).toUpperCase() + 
             request.status.replace('_', ' ').slice(1)}
          </Badge>
        </div>
        <div className="text-sm text-gray-500">
          Request Type: {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Request Timeline</h4>
        
        <div className="relative">
          {history.map((item, index) => (
            <div key={index} className="relative">
              {/* Timeline line */}
              {index < history.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200" />
              )}
              
              <div className="flex gap-4">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                  {item.action === 'created' && <MessageSquare className="h-4 w-4 text-blue-600" />}
                  {item.action === 'accepted' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {item.action === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                  {item.action === 'counter_proposed' && <Calendar className="h-4 w-4 text-blue-600" />}
                </div>

                {/* Timeline content */}
                <div className="flex-1 pb-8">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {item.actor === 'requester' ? (
                            <User className="h-4 w-4 text-gray-600" />
                          ) : (
                            <Mail className="h-4 w-4 text-gray-600" />
                          )}
                          <span className="font-medium">
                            {item.action === 'created' && 'Request Submitted'}
                            {item.action === 'accepted' && 'Request Accepted'}
                            {item.action === 'rejected' && 'Request Declined'}
                            {item.action === 'counter_proposed' && 'Alternative Time Proposed'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(item.timestamp)}
                        </span>
                      </div>

                      {item.action === 'created' && (
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-gray-700">From: </span>
                            <span className="text-sm text-gray-600">{request.requesterName}</span>
                          </div>
                          {request.preferredTime && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">Preferred time: </span>
                              <span className="text-sm text-gray-600">
                                {formatDateTime(request.preferredTime)}
                              </span>
                            </div>
                          )}
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">{item.message}</p>
                          </div>
                        </div>
                      )}

                      {item.action === 'counter_proposed' && (
                        <div className="space-y-2">
                          {item.proposedTime && (
                            <div className="flex items-center gap-2">
                              <ArrowRight className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-gray-700">New proposed time: </span>
                              <span className="text-sm text-blue-600 font-medium">
                                {formatDateTime(item.proposedTime)}
                              </span>
                            </div>
                          )}
                          {request.counterMessage && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-700">{request.counterMessage}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {(item.action === 'accepted' || item.action === 'rejected') && item.message && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-700">{item.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}