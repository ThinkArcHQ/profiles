'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, Search, Filter, User, Mail, Clock, MessageSquare, Quote, Eye, History, ArrowRight } from 'lucide-react'
import { RequestHistory } from '@/components/request-history'

interface SentRequest {
  id: string
  recipientName: string
  recipientEmail: string
  message: string
  requestType: 'meeting' | 'quote' | 'appointment'
  preferredTime?: string
  projectDetails?: string
  budgetRange?: string
  status: 'pending' | 'accepted' | 'rejected' | 'counter_proposed'
  createdAt: string
  updatedAt?: string
  proposedTime?: string
  counterMessage?: string
  responseMessage?: string
}

export default function SentRequestsPage() {
  const [requests, setRequests] = useState<SentRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<SentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showHistory, setShowHistory] = useState<string | null>(null)

  useEffect(() => {
    fetchSentRequests()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, searchTerm, statusFilter, typeFilter])

  const fetchSentRequests = async () => {
    try {
      const response = await fetch('/api/appointments/sent')
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match our interface
        const transformedRequests = data.map((req: any) => ({
          id: req.id.toString(),
          recipientName: req.profileName,
          recipientEmail: req.profileEmail,
          message: req.message,
          requestType: req.requestType,
          preferredTime: req.preferredTime,
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
      console.error('Error fetching sent requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterRequests = () => {
    let filtered = requests

    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.recipientEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'accepted': return 'default'
      case 'rejected': return 'destructive'
      case 'counter_proposed': return 'outline'
      default: return 'secondary'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return MessageSquare
      case 'quote': return Quote
      case 'appointment': return User
      default: return MessageSquare
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

  const getStatusStats = () => {
    const pending = requests.filter(r => r.status === 'pending').length
    const accepted = requests.filter(r => r.status === 'accepted').length
    const rejected = requests.filter(r => r.status === 'rejected').length
    return { pending, accepted, rejected }
  }

  const stats = getStatusStats()

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">Loading sent requests...</p>
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
            <Send className="h-8 w-8" />
            Sent Requests
          </h1>
          <p className="text-gray-600 mt-2">
            Track all your outgoing meeting and quote requests
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Total: {requests.length} | Showing: {filteredRequests.length}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
              <Send className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-red-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by recipient name, email, or message..."
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
              <Send className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                {requests.length === 0 ? 'No sent requests yet' : 'No requests match your filters'}
              </h3>
              <p className="text-gray-600">
                {requests.length === 0 
                  ? 'Your sent requests will appear here'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const TypeIcon = getTypeIcon(request.requestType)
            return (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${getTypeColor(request.requestType)}`}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{request.recipientName}</h3>
                          <Badge variant="outline" className="text-xs">
                            {request.requestType.charAt(0).toUpperCase() + request.requestType.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          {request.recipientEmail}
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

                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">Your Message:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{request.message}</p>
                    </div>

                    {request.preferredTime && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-sm">Your Preferred Time</span>
                        </div>
                        <p className="text-gray-700">{formatDate(request.preferredTime)}</p>
                      </div>
                    )}

                    {request.status === 'counter_proposed' && request.proposedTime && (
                      <div className="bg-orange-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ArrowRight className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-sm text-orange-700">They proposed:</span>
                          <span className="text-sm text-orange-700 font-medium">
                            {formatDate(request.proposedTime)}
                          </span>
                        </div>
                        {request.counterMessage && (
                          <p className="text-sm text-orange-700">{request.counterMessage}</p>
                        )}
                      </div>
                    )}

                    {request.responseMessage && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="h-4 w-4 text-gray-600" />
                          <span className="font-medium text-sm">Their Response:</span>
                        </div>
                        <p className="text-gray-700 text-sm">{request.responseMessage}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t mt-4">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Sent: {formatDate(request.createdAt)}
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
                      <div className="text-sm text-gray-500">
                        Awaiting response...
                      </div>
                    )}

                    {request.status === 'counter_proposed' && (
                      <div className="text-sm text-orange-600 font-medium">
                        Counter-proposal received
                      </div>
                    )}
                  </div>

                  {/* Request History */}
                  {showHistory === request.id && (
                    <div className="mt-6 pt-6 border-t">
                      <RequestHistory 
                        request={{
                          ...request,
                          requesterName: 'You',
                          requesterEmail: 'your-email@example.com', // This would come from user context
                        }} 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}