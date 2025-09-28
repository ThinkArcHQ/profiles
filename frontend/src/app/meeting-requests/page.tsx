'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Search, Filter, Calendar, User, Mail, Clock, History, ArrowRight } from 'lucide-react'
import { CounterProposalDialog } from '@/components/counter-proposal-dialog'
import { RequestHistory } from '@/components/request-history'

interface MeetingRequest {
  id: string
  requesterName: string
  requesterEmail: string
  message: string
  preferredTime?: string
  requestType: string
  status: 'pending' | 'accepted' | 'rejected' | 'counter_proposed'
  createdAt: string
  updatedAt?: string
  proposedTime?: string
  counterMessage?: string
  responseMessage?: string
}

export default function MeetingRequestsPage() {
  const [requests, setRequests] = useState<MeetingRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MeetingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showCounterProposal, setShowCounterProposal] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState<string | null>(null)
  const [responseMessage, setResponseMessage] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchMeetingRequests()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, searchTerm, statusFilter, typeFilter])

  const fetchMeetingRequests = async () => {
    try {
      const response = await fetch('/api/appointments/received')
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match our interface
        const transformedRequests = data.map((req: any) => ({
          id: req.id.toString(),
          requesterName: req.requesterName,
          requesterEmail: req.requesterEmail,
          message: req.message,
          preferredTime: req.preferredTime,
          requestType: req.requestType,
          status: req.status,
          createdAt: req.createdAt,
          updatedAt: req.updatedAt,
          proposedTime: req.proposedTime,
          counterMessage: req.counterMessage,
          responseMessage: req.responseMessage,
        }))
        setRequests(transformedRequests)
      }
    } catch (error) {
      console.error('Error fetching meeting requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterRequests = () => {
    let filtered = requests

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requesterEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(request => request.requestType === typeFilter)
    }

    setFilteredRequests(filtered)
  }

  const handleStatusUpdate = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    setActionLoading(requestId)
    try {
      const response = await fetch(`/api/appointments/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          responseMessage: responseMessage.trim() || undefined
        }),
      })

      if (response.ok) {
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { 
            ...req, 
            status: newStatus, 
            updatedAt: new Date().toISOString(),
            responseMessage: responseMessage.trim() || undefined
          } : req
        ))
        setResponseMessage('')
      }
    } catch (error) {
      console.error('Error updating request status:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCounterProposal = async (requestId: string, data: { proposedTime: string; counterMessage: string }) => {
    setActionLoading(requestId)
    try {
      const response = await fetch(`/api/appointments/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: 'counter_proposed',
          proposedTime: data.proposedTime,
          counterMessage: data.counterMessage
        }),
      })

      if (response.ok) {
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { 
            ...req, 
            status: 'counter_proposed' as const,
            updatedAt: new Date().toISOString(),
            proposedTime: data.proposedTime,
            counterMessage: data.counterMessage
          } : req
        ))
        setShowCounterProposal(null)
      }
    } catch (error) {
      console.error('Error submitting counter-proposal:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'accepted': return 'default'
      case 'rejected': return 'destructive'
      case 'counter_proposed': return 'outline'
      default: return 'secondary'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-600'
      case 'quote': return 'bg-green-100 text-green-600'
      case 'appointment': return 'bg-purple-100 text-purple-600'
      default: return 'bg-gray-100 text-gray-600'
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Loading meeting requests...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8" />
            Meeting Requests
          </h1>
          <p className="text-gray-600 mt-2">
            Manage all your meeting requests and consultations
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {requests.length} | Showing: {filteredRequests.length}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or message..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="quote">Quote</SelectItem>
                  <SelectItem value="appointment">Appointment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="counter_proposed">Counter Proposed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {requests.length === 0 ? 'No meeting requests yet' : 'No requests match your filters'}
              </h3>
              <p className="text-gray-600">
                {requests.length === 0 
                  ? 'Meeting requests will appear here when received'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-full ${getTypeColor(request.requestType)}`}>
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{request.requesterName}</h3>
                        <Badge variant="outline" className="text-xs">
                          {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4" />
                        {request.requesterEmail}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(request.status)}>
                      {request.status.replace('_', ' ').charAt(0).toUpperCase() + 
                       request.status.replace('_', ' ').slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Message:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{request.message}</p>
                </div>

                {request.preferredTime && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Preferred time:</span>
                      {formatDate(request.preferredTime)}
                    </div>
                  </div>
                )}

                {request.status === 'counter_proposed' && request.proposedTime && (
                  <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
                      <ArrowRight className="h-4 w-4" />
                      <span className="font-medium">Your proposed time:</span>
                      {formatDate(request.proposedTime)}
                    </div>
                    {request.counterMessage && (
                      <p className="text-sm text-blue-700">{request.counterMessage}</p>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Received: {formatDate(request.createdAt)}
                    </div>
                    {request.updatedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Updated: {formatDate(request.updatedAt)}
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(showHistory === request.id ? null : request.id)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <History className="h-4 w-4 mr-1" />
                      {showHistory === request.id ? 'Hide' : 'Show'} History
                    </Button>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate(request.id, 'accepted')}
                        disabled={actionLoading === request.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading === request.id ? 'Processing...' : 'Accept'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowCounterProposal(request.id)}
                        disabled={actionLoading === request.id}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        Counter Propose
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        disabled={actionLoading === request.id}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {actionLoading === request.id ? 'Processing...' : 'Decline'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Request History */}
                {showHistory === request.id && (
                  <div className="mt-6 pt-6 border-t">
                    <RequestHistory request={request} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Counter Proposal Dialog */}
      {showCounterProposal && (
        <CounterProposalDialog
          requestId={showCounterProposal}
          requesterName={requests.find(r => r.id === showCounterProposal)?.requesterName || ''}
          originalTime={requests.find(r => r.id === showCounterProposal)?.preferredTime}
          onSubmit={(data) => handleCounterProposal(showCounterProposal, data)}
          onCancel={() => setShowCounterProposal(null)}
          isLoading={actionLoading === showCounterProposal}
        />
      )}
    </div>
  )
}