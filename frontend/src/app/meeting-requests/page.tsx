'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MessageSquare, Search, Filter, Calendar, User, Mail, Clock } from 'lucide-react'

interface MeetingRequest {
  id: string
  requester_name: string
  requester_email: string
  message: string
  preferred_time?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at?: string
}

export default function MeetingRequestsPage() {
  const [requests, setRequests] = useState<MeetingRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<MeetingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchMeetingRequests()
  }, [])

  useEffect(() => {
    filterRequests()
  }, [requests, searchTerm, statusFilter])

  const fetchMeetingRequests = async () => {
    try {
      const response = await fetch('/api/appointments/received')
      if (response.ok) {
        const data = await response.json()
        const meetingRequests = data.filter((req: any) => req.type === 'meeting')
        setRequests(meetingRequests)
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
        request.requester_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    setFilteredRequests(filtered)
  }

  const handleStatusUpdate = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const response = await fetch(`/api/appointments/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setRequests(prev => prev.map(req => 
          req.id === requestId ? { ...req, status: newStatus, updated_at: new Date().toISOString() } : req
        ))
      }
    } catch (error) {
      console.error('Error updating request status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'accepted': return 'default'
      case 'rejected': return 'destructive'
      default: return 'secondary'
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
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{request.requester_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Mail className="h-4 w-4" />
                        {request.requester_email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getStatusColor(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Message:</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{request.message}</p>
                </div>

                {request.preferred_time && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">Preferred time:</span>
                      {formatDate(request.preferred_time)}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Received: {formatDate(request.created_at)}
                    </div>
                    {request.updated_at && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Updated: {formatDate(request.updated_at)}
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleStatusUpdate(request.id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleStatusUpdate(request.id, 'rejected')}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}