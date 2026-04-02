import React, { useState, useEffect } from 'react'
import { ExternalLink, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { threadsApi, Thread } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ThreadsProps {
  tenantId: string
}

export default function Threads({ tenantId }: ThreadsProps) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [filteredThreads, setFilteredThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10

  useEffect(() => {
    const loadThreads = async () => {
      try {
        const data = await threadsApi.list(tenantId)
        setThreads(data)
      } catch (error) {
        console.error('Failed to load threads:', error)
      } finally {
        setLoading(false)
      }
    }
    loadThreads()
  }, [tenantId])

  useEffect(() => {
    let filtered = threads

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    // Platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter((t) => t.platform === platformFilter)
    }

    setFilteredThreads(filtered)
    setCurrentPage(1)
  }, [threads, searchTerm, statusFilter, platformFilter])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'blue'
      case 'reviewed':
        return 'yellow'
      case 'responded':
        return 'green'
      case 'dismissed':
        return 'gray'
      default:
        return 'default'
    }
  }

  const platforms = [...new Set(threads.map((t) => t.platform))]

  // Pagination
  const totalPages = Math.ceil(filteredThreads.length / itemsPerPage)
  const startIdx = (currentPage - 1) * itemsPerPage
  const paginatedThreads = filteredThreads.slice(startIdx, startIdx + itemsPerPage)

  const updateThreadStatus = async (threadId: string, newStatus: string) => {
    try {
      await threadsApi.update(tenantId, threadId, { status: newStatus as any })
      setThreads(threads.map((t) => (t.id === threadId ? { ...t, status: newStatus as any } : t)))
    } catch (error) {
      console.error('Failed to update thread:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center text-muted-foreground">Loading threads...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-6">
        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Search
              </label>
              <Input
                placeholder="Search threads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Status
              </label>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="responded">Responded</option>
                <option value="dismissed">Dismissed</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Platform
              </label>
              <Select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
              >
                <option value="all">All Platforms</option>
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {paginatedThreads.length} of {filteredThreads.length} threads
          </div>
        </div>

        {/* Threads List */}
        <div className="space-y-3">
          {paginatedThreads.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No threads found</p>
              </CardContent>
            </Card>
          ) : (
            paginatedThreads.map((thread) => (
              <Card
                key={thread.id}
                className="cursor-pointer hover:border-accent transition-colors"
                onClick={() =>
                  setExpandedId(expandedId === thread.id ? null : thread.id)
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold line-clamp-1">
                          {thread.title}
                        </h3>
                        <Badge variant="blue">{thread.platform}</Badge>
                        <Badge variant={getStatusBadgeVariant(thread.status)}>
                          {thread.status}
                        </Badge>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            Relevance Score
                          </span>
                          <span className="text-xs font-medium">
                            {Math.round(thread.relevanceScore * 100)}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent rounded-full transition-all"
                            style={{
                              width: `${Math.max(
                                thread.relevanceScore * 100,
                                5
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {new Date(thread.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-muted-foreground transition-transform',
                        expandedId === thread.id && 'rotate-180'
                      )}
                    />
                  </div>

                  {/* Expanded Content */}
                  {expandedId === thread.id && (
                    <div className="mt-6 pt-6 border-t border-border space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Content Preview</h4>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {thread.content}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateThreadStatus(thread.id, 'reviewed')
                            }}
                          >
                            Mark Reviewed
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateThreadStatus(thread.id, 'responded')
                            }}
                          >
                            Mark Responded
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateThreadStatus(thread.id, 'dismissed')
                            }}
                          >
                            Dismiss
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(thread.url, '_blank')
                            }}
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Original
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
