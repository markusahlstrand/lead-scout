import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { leadsApi, Lead, engagementEventsApi, EngagementEvent } from '@/lib/api'

interface AnalyticsProps {
  tenantId: string
}

export default function Analytics({ tenantId }: AnalyticsProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [engagementEvents, setEngagementEvents] = useState<EngagementEvent[]>([])
  const [dateRange, setDateRange] = useState<'7' | '30' | '90'>('30')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsData, eventsData] = await Promise.all([
          leadsApi.list(tenantId),
          engagementEventsApi.list(tenantId),
        ])
        setLeads(leadsData)
        setEngagementEvents(eventsData)
      } catch (error) {
        console.error('Failed to load analytics data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tenantId])

  const getLeadsByType = () => {
    const counts: Record<string, number> = {
      community: 0,
      prospect: 0,
      company: 0,
      engaged: 0,
    }
    leads.forEach((lead) => {
      counts[lead.leadType]++
    })
    return counts
  }

  const getLeadsByStatus = () => {
    const counts: Record<string, number> = {
      new: 0,
      contacted: 0,
      interested: 0,
      qualified: 0,
      dismissed: 0,
    }
    leads.forEach((lead) => {
      counts[lead.status]++
    })
    return counts
  }

  const getTopEngagers = () => {
    const engagerMap: Record<string, { count: number; platform?: string }> = {}
    engagementEvents.forEach((event) => {
      if (!engagerMap[event.actor]) {
        engagerMap[event.actor] = { count: 0, platform: event.actorPlatform }
      }
      engagerMap[event.actor].count++
    })

    return Object.entries(engagerMap)
      .map(([actor, data]) => ({ actor, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  const getFunnelData = () => {
    const community = leads.filter((l) => l.leadType === 'community').length
    const prospects = leads.filter((l) => l.leadType === 'prospect').length
    const contacted = leads.filter((l) => l.status === 'contacted').length
    const converted = leads.filter((l) => l.status === 'qualified').length

    return { community, prospects, contacted, converted }
  }

  const getEngagementStats = () => {
    const stats = {
      totalEvents: engagementEvents.length,
      byType: {
        star: 0,
        comment: 0,
        share: 0,
        follow: 0,
      },
    }

    engagementEvents.forEach((event) => {
      if (event.eventType in stats.byType) {
        stats.byType[event.eventType as keyof typeof stats.byType]++
      }
    })

    return stats
  }

  const topEngagers = getTopEngagers()
  const leadsByType = getLeadsByType()
  const leadsByStatus = getLeadsByStatus()
  const funnelData = getFunnelData()
  const engagementStats = getEngagementStats()

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  const totalCommunityLeads = leadsByType.community + leadsByType.prospect
  const conversionRate =
    totalCommunityLeads > 0
      ? Math.round((funnelData.converted / totalCommunityLeads) * 100)
      : 0

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-6">
        {/* Header with Date Range */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Analytics Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-muted-foreground">
              Date Range:
            </label>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7' | '30' | '90')}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{leads.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Engagement Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {engagementStats.totalEvents}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {conversionRate}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {funnelData.converted} of {totalCommunityLeads} converted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Qualified Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {funnelData.converted}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lead Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  stage: 'Community Leads',
                  value: funnelData.community,
                  color: 'bg-purple-500',
                },
                {
                  stage: 'Prospects',
                  value: funnelData.prospects,
                  color: 'bg-orange-500',
                },
                {
                  stage: 'Contacted',
                  value: funnelData.contacted,
                  color: 'bg-yellow-500',
                },
                {
                  stage: 'Converted',
                  value: funnelData.converted,
                  color: 'bg-green-500',
                },
              ].map((stage) => {
                const maxValue = Math.max(
                  funnelData.community,
                  funnelData.prospects,
                  funnelData.contacted,
                  funnelData.converted
                )
                const percentage =
                  maxValue > 0 ? (stage.value / maxValue) * 100 : 0

                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{stage.stage}</span>
                      <span className="text-sm font-semibold">{stage.value}</span>
                    </div>
                    <div className="w-full bg-muted rounded-md h-6 overflow-hidden">
                      <div
                        className={`h-full ${stage.color} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Type and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Leads by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { type: 'Community', value: leadsByType.community, color: 'bg-purple-500' },
                  { type: 'Prospect', value: leadsByType.prospect, color: 'bg-orange-500' },
                  { type: 'Company', value: leadsByType.company, color: 'bg-blue-500' },
                  { type: 'Engaged', value: leadsByType.engaged, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.type}</span>
                    </div>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Leads by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Leads by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { status: 'New', value: leadsByStatus.new, variant: 'blue' as const },
                  { status: 'Contacted', value: leadsByStatus.contacted, variant: 'yellow' as const },
                  { status: 'Interested', value: leadsByStatus.interested, variant: 'warning' as const },
                  { status: 'Qualified', value: leadsByStatus.qualified, variant: 'green' as const },
                  { status: 'Dismissed', value: leadsByStatus.dismissed, variant: 'gray' as const },
                ].map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.variant} className="text-xs">
                        {item.status}
                      </Badge>
                    </div>
                    <span className="font-semibold">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engagement Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { type: 'Stars', count: engagementStats.byType.star },
                { type: 'Comments', count: engagementStats.byType.comment },
                { type: 'Shares', count: engagementStats.byType.share },
                { type: 'Follows', count: engagementStats.byType.follow },
              ].map((item) => (
                <div
                  key={item.type}
                  className="border border-border rounded-lg p-4 text-center"
                >
                  <div className="text-2xl font-bold text-accent mb-2">
                    {item.count}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.type}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Engagers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Engagers</CardTitle>
          </CardHeader>
          <CardContent>
            {topEngagers.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No engagement events yet
              </p>
            ) : (
              <div className="space-y-3">
                {topEngagers.map((engager, index) => (
                  <div
                    key={engager.actor}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{engager.actor}</p>
                        {engager.platform && (
                          <p className="text-xs text-muted-foreground">
                            {engager.platform}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="blue">{engager.count} events</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
