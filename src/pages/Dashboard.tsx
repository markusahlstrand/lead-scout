import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ArrowUpRight, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { statsApi, threadsApi } from '@/lib/api'
import type { Stats, Thread } from '@/lib/api'

interface DashboardProps {
  tenantId: string
}

export default function Dashboard({ tenantId }: DashboardProps) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentThreads, setRecentThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, threadsData] = await Promise.all([
          statsApi.get(tenantId),
          threadsApi.list(tenantId, { limit: 10 }),
        ])
        setStats(statsData)
        setRecentThreads(threadsData.slice(0, 10))
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tenantId])

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

  const chartData = [
    { name: 'Mon', threads: 12, responses: 8 },
    { name: 'Tue', threads: 19, responses: 14 },
    { name: 'Wed', threads: 15, responses: 10 },
    { name: 'Thu', threads: 22, responses: 18 },
    { name: 'Fri', threads: 28, responses: 22 },
    { name: 'Sat', threads: 8, responses: 6 },
    { name: 'Sun', threads: 5, responses: 3 },
  ]

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-8 space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Threads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalThreads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="w-3 h-3 inline mr-1" />
              {stats?.threadsThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompanies || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <ArrowUpRight className="w-3 h-3 inline mr-1" />
              {stats?.companiesThisWeek || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Qualified contacts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((stats?.responseRate || 0) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Threads with responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
          <CardDescription>Threads discovered and responses sent</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
              <XAxis dataKey="name" stroke="hsl(215 14% 60%)" />
              <YAxis stroke="hsl(215 14% 60%)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 84% 8%)',
                  border: '1px solid hsl(217 33% 17%)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(210 40% 96%)' }}
              />
              <Bar dataKey="threads" fill="hsl(217 91% 60%)" name="Threads" />
              <Bar dataKey="responses" fill="hsl(142 71% 45%)" name="Responses" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Threads */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Threads</CardTitle>
              <CardDescription>Last 10 discovered threads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentThreads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No threads yet</p>
                ) : (
                  recentThreads.map((thread) => (
                    <div
                      key={thread.id}
                      className="p-3 rounded-md border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium line-clamp-1">
                            {thread.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {thread.platform}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(thread.status)}>
                          {thread.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex-1 mr-3">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{
                                width: `${Math.max(
                                  thread.relevanceScore * 100,
                                  10
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(thread.relevanceScore * 100)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="default" size="sm" className="w-full justify-start">
                <Zap className="w-4 h-4 mr-2" />
                Start New Scan
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Add Source
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Import Leads
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Export Data
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Set up multiple sources to discover more high-quality leads.
              </p>
              <p>
                Use knowledge base to manage response templates and company info.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
