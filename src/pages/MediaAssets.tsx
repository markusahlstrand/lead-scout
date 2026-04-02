import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Globe, Instagram, Twitter, Youtube, Linkedin, ChevronDown, ChevronUp, Star, MessageCircle, Share2 as ShareIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { mediaAssetsApi, MediaAsset, engagementEventsApi, EngagementEvent, leadsApi } from '@/lib/api'

interface MediaAssetsProps {
  tenantId: string
}

const PLATFORMS = [
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'website', label: 'Website', icon: Globe },
  { value: 'other', label: 'Other', icon: Globe },
]

const EVENT_ICONS = {
  star: Star,
  comment: MessageCircle,
  share: ShareIcon,
  follow: Users,
}

export default function MediaAssets({ tenantId }: MediaAssetsProps) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  const [engagementMap, setEngagementMap] = useState<Record<string, EngagementEvent[]>>({})
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterPlatform, setFilterPlatform] = useState<string>('')
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set())

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    handle: '',
    platform: '',
    url: '',
    followerCount: 0,
    assetType: 'account',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const assetsData = await mediaAssetsApi.list(tenantId)
        setAssets(assetsData)

        // Load engagement events for each asset
        const engagementData: Record<string, EngagementEvent[]> = {}
        for (const asset of assetsData) {
          try {
            const events = await engagementEventsApi.getRecent(tenantId, asset.id, 5)
            engagementData[asset.id] = events
          } catch (error) {
            console.warn(`Failed to load engagement for asset ${asset.id}:`, error)
            engagementData[asset.id] = []
          }
        }
        setEngagementMap(engagementData)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tenantId])

  const resetForm = () => {
    setFormData({
      name: '',
      handle: '',
      platform: '',
      url: '',
      followerCount: 0,
      assetType: 'account',
    })
    setEditingId(null)
  }

  const handleOpenDialog = (asset?: MediaAsset) => {
    if (asset) {
      setFormData({
        name: asset.name,
        handle: asset.handle,
        platform: asset.platform,
        url: asset.url,
        followerCount: asset.followerCount,
        assetType: asset.assetType,
      })
      setEditingId(asset.id)
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await mediaAssetsApi.update(tenantId, editingId, formData)
        setAssets(
          assets.map((a) => (a.id === editingId ? { ...a, ...formData } : a))
        )
      } else {
        const newAsset = await mediaAssetsApi.create(tenantId, {
          tenantId,
          ...formData,
        })
        setAssets([...assets, newAsset])
      }
      setShowDialog(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save media asset:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await mediaAssetsApi.delete(tenantId, id)
      setAssets(assets.filter((a) => a.id !== id))
    } catch (error) {
      console.error('Failed to delete media asset:', error)
    }
  }

  const handleConvertToLead = async (eventId: string) => {
    try {
      await engagementEventsApi.convertToLead(tenantId, eventId)
      alert('Successfully converted engagement to lead!')
    } catch (error) {
      console.error('Failed to convert to lead:', error)
    }
  }

  const toggleExpanded = (assetId: string) => {
    const newExpanded = new Set(expandedAssets)
    if (newExpanded.has(assetId)) {
      newExpanded.delete(assetId)
    } else {
      newExpanded.add(assetId)
    }
    setExpandedAssets(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center text-muted-foreground">Loading media assets...</div>
      </div>
    )
  }

  const filteredAssets = filterPlatform
    ? assets.filter((a) => a.platform === filterPlatform)
    : assets

  const getPlatformIcon = (platform: string) => {
    const platformObj = PLATFORMS.find((p) => p.value === platform)
    return platformObj?.icon || Globe
  }

  const totalFollowers = assets.reduce((sum, asset) => sum + asset.followerCount, 0)
  const totalEngagementThisWeek = Object.values(engagementMap).reduce(
    (sum, events) => sum + events.length,
    0
  )

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {assets.length} media assets tracked
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Media Asset
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Assets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assets.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Followers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {totalFollowers.toLocaleString()}
              </div>
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
                {totalEngagementThisWeek}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platforms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(assets.map((a) => a.platform)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Filter by platform:</label>
          <Select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
            <option value="">All Platforms</option>
            {PLATFORMS.map((platform) => (
              <option key={platform.value} value={platform.value}>
                {platform.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Media Assets by Platform */}
        {filteredAssets.length > 0 ? (
          <div className="space-y-6">
            {PLATFORMS.map((platformDef) => {
              const platformAssets = filteredAssets.filter(
                (a) => a.platform === platformDef.value
              )
              if (platformAssets.length === 0) return null

              const PlatformIcon = platformDef.icon

              return (
                <div key={platformDef.value}>
                  <div className="flex items-center gap-3 mb-4">
                    <PlatformIcon className="w-5 h-5 text-accent" />
                    <h3 className="text-lg font-semibold">{platformDef.label}</h3>
                    <Badge variant="green">{platformAssets.length}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {platformAssets.map((asset) => (
                      <Card key={asset.id} className="hover:border-accent transition-colors">
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Asset Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-base">{asset.name}</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  @{asset.handle}
                                </p>
                              </div>
                              <Badge variant="green" className="text-xs">
                                {asset.assetType}
                              </Badge>
                            </div>

                            {/* Stats */}
                            <div className="space-y-2 bg-muted/50 rounded-md p-3">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Followers</span>
                                <span className="font-semibold text-sm">
                                  {asset.followerCount.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Last Checked</span>
                                <span className="text-xs">
                                  {new Date(asset.lastChecked).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* URL */}
                            {asset.url && (
                              <a
                                href={asset.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline text-xs truncate block"
                                title={asset.url}
                              >
                                {asset.url}
                              </a>
                            )}

                            {/* Engagement Section */}
                            {engagementMap[asset.id]?.length > 0 && (
                              <div className="border-t border-border pt-3">
                                <button
                                  onClick={() => toggleExpanded(asset.id)}
                                  className="w-full flex items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground mb-2"
                                >
                                  <span>Recent Engagement ({engagementMap[asset.id].length})</span>
                                  {expandedAssets.has(asset.id) ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>

                                {expandedAssets.has(asset.id) && (
                                  <div className="space-y-2 bg-muted/30 rounded p-2">
                                    {engagementMap[asset.id].slice(0, 5).map((event) => {
                                      const EventIcon = EVENT_ICONS[event.eventType as keyof typeof EVENT_ICONS] || MessageCircle
                                      return (
                                        <div
                                          key={event.id}
                                          className="text-xs space-y-1 pb-2 border-b border-border last:border-0 last:pb-0"
                                        >
                                          <div className="flex items-center gap-2">
                                            <EventIcon className="w-3 h-3 text-accent flex-shrink-0" />
                                            <span className="font-medium">{event.actor}</span>
                                            <span className="text-muted-foreground">
                                              {event.eventType}
                                            </span>
                                          </div>
                                          {event.content && (
                                            <p className="text-muted-foreground line-clamp-2">
                                              {event.content}
                                            </p>
                                          )}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="w-full h-6 text-xs mt-1"
                                            onClick={() => handleConvertToLead(event.id)}
                                          >
                                            Convert to Lead
                                          </Button>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Metadata */}
                            <p className="text-xs text-muted-foreground">
                              Added {new Date(asset.createdAt).toLocaleDateString()}
                            </p>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-2 border-t border-border">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleOpenDialog(asset)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleDelete(asset.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-1 text-destructive" />
                                Delete
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {filterPlatform
                  ? `No media assets on ${PLATFORMS.find((p) => p.value === filterPlatform)?.label}`
                  : 'No media assets configured yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first media asset to start tracking
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Media Asset Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Media Asset' : 'Add New Media Asset'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update media asset information'
                : 'Add a new social media or web asset to track'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Asset Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Company Twitter Account"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Handle/Username</label>
              <Input
                value={formData.handle}
                onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                placeholder="e.g., @company or /company"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Platform</label>
              <Select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                <option value="">Select platform</option>
                {PLATFORMS.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Asset Type</label>
              <Select
                value={formData.assetType}
                onChange={(e) => setFormData({ ...formData, assetType: e.target.value })}
              >
                <option value="account">Account</option>
                <option value="channel">Channel</option>
                <option value="page">Page</option>
                <option value="community">Community</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">URL</label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://twitter.com/company"
                type="url"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Follower Count</label>
              <Input
                value={formData.followerCount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    followerCount: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                type="number"
                min="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editingId ? 'Update' : 'Add'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { Users } from 'lucide-react'
