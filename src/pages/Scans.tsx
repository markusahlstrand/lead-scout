import React, { useState, useEffect } from 'react'
import { Play, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { scansApi, sourcesApi, Scan, Source } from '@/lib/api'

interface ScansProps {
  tenantId: string
}

export default function Scans({ tenantId }: ScansProps) {
  const [scans, setScans] = useState<Scan[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        const [scansData, sourcesData] = await Promise.all([
          scansApi.list(tenantId),
          sourcesApi.list(tenantId),
        ])
        setScans(scansData)
        setSources(sourcesData)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tenantId])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'yellow'
      case 'running':
        return 'blue'
      case 'completed':
        return 'green'
      case 'failed':
        return 'red'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />
      case 'running':
        return <Zap className="w-4 h-4 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'failed':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  const filteredScans =
    statusFilter === 'all'
      ? scans
      : scans.filter((s) => s.status === statusFilter)

  const getSourceName = (sourceId: string) => {
    return sources.find((s) => s.id === sourceId)?.name || 'Unknown source'
  }

  const handleStartScan = async (sourceId: string) => {
    try {
      const newScan = await scansApi.create(tenantId, {
        tenantId,
        sourceId,
        scanType: 'full',
        status: 'pending',
        threadsFound: 0,
        startedAt: new Date().toISOString(),
      })
      setScans([newScan, ...scans])
    } catch (error) {
      console.error('Failed to start scan:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center text-muted-foreground">Loading scans...</div>
      </div>
    )
  }

  const activeSources = sources.filter((s) => s.active)
  const statuses = ['all', 'pending', 'running', 'completed', 'failed']

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-6">
        {/* Header with Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Scans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scans.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {scans.filter((s) => s.status === 'completed').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Running
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {scans.filter((s) => s.status === 'running').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Threads Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scans.reduce((sum, s) => sum + s.threadsFound, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="bg-card border border-border rounded-lg p-4">
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Status
          </label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === 'all' ? 'All Statuses' : status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        {/* Quick Scan */}
        {activeSources.length > 0 && (
          <Card className="border-accent/50 bg-accent/5">
            <CardHeader>
              <CardTitle className="text-base">Quick Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Manually start a scan on any of your active sources
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeSources.map((source) => (
                  <Button
                    key={source.id}
                    variant="outline"
                    onClick={() => handleStartScan(source.id)}
                    className="justify-start"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Scan {source.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Scans List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Scan History</h2>

          {filteredScans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No scans found</p>
              </CardContent>
            </Card>
          ) : (
            filteredScans.map((scan) => (
              <Card
                key={scan.id}
                className="hover:border-accent transition-colors"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(scan.status)}
                          <h3 className="text-lg font-semibold">
                            {getSourceName(scan.sourceId)}
                          </h3>
                        </div>
                        <Badge variant={getStatusBadgeVariant(scan.status)}>
                          {scan.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                        <div>
                          <p className="text-muted-foreground">Threads Found</p>
                          <p className="text-lg font-semibold">
                            {scan.threadsFound}
                          </p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Scan Type</p>
                          <p className="capitalize">{scan.scanType}</p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Started</p>
                          <p>
                            {new Date(scan.startedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {scan.completedAt && (
                          <div>
                            <p className="text-muted-foreground">Completed</p>
                            <p>
                              {new Date(scan.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {scan.status === 'running' && (
                        <div className="mt-4">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full w-1/3 animate-pulse" />
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Scan in progress...
                          </p>
                        </div>
                      )}
                    </div>

                    {scan.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // In a real app, this would start the scan
                          setScans(
                            scans.map((s) =>
                              s.id === scan.id ? { ...s, status: 'running' } : s
                            )
                          )
                        }}
                      >
                        Start
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
