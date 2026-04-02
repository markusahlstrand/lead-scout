import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, LinkIcon, Toggle2 } from 'lucide-react'
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
import { sourcesApi, Source } from '@/lib/api'

interface SourcesProps {
  tenantId: string
}

export default function Sources({ tenantId }: SourcesProps) {
  const [sources, setSources] = useState<Source[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    platform: '',
    url: '',
    active: true,
  })

  useEffect(() => {
    const loadSources = async () => {
      try {
        const data = await sourcesApi.list(tenantId)
        setSources(data)
      } catch (error) {
        console.error('Failed to load sources:', error)
      } finally {
        setLoading(false)
      }
    }
    loadSources()
  }, [tenantId])

  const resetForm = () => {
    setFormData({
      name: '',
      platform: '',
      url: '',
      active: true,
    })
    setEditingId(null)
  }

  const handleOpenDialog = (source?: Source) => {
    if (source) {
      setFormData({
        name: source.name,
        platform: source.platform,
        url: source.url,
        active: source.active,
      })
      setEditingId(source.id)
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await sourcesApi.update(tenantId, editingId, formData)
        setSources(
          sources.map((s) => (s.id === editingId ? { ...s, ...formData } : s))
        )
      } else {
        const newSource = await sourcesApi.create(tenantId, {
          tenantId,
          ...formData,
        })
        setSources([...sources, newSource])
      }
      setShowDialog(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save source:', error)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await sourcesApi.update(tenantId, id, { active: !active })
      setSources(
        sources.map((s) => (s.id === id ? { ...s, active: !active } : s))
      )
    } catch (error) {
      console.error('Failed to toggle source:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await sourcesApi.delete(tenantId, id)
      setSources(sources.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Failed to delete source:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center text-muted-foreground">Loading sources...</div>
      </div>
    )
  }

  const activeSources = sources.filter((s) => s.active)
  const inactiveSources = sources.filter((s) => !s.active)

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {activeSources.length} active, {inactiveSources.length} inactive
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Source
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sources.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {activeSources.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {inactiveSources.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Sources */}
        {activeSources.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Active Sources</h3>
            <div className="space-y-3">
              {activeSources.map((source) => (
                <Card
                  key={source.id}
                  className="hover:border-accent transition-colors"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{source.name}</h3>
                          <Badge variant="green">{source.platform}</Badge>
                          <Badge variant="green">Active</Badge>
                        </div>

                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline text-sm flex items-center gap-2 mt-2"
                        >
                          <LinkIcon className="w-4 h-4" />
                          {source.url}
                        </a>

                        <p className="text-xs text-muted-foreground mt-2">
                          Added {new Date(source.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(source.id, source.active)}
                        >
                          <Toggle2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(source)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(source.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Inactive Sources */}
        {inactiveSources.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Inactive Sources</h3>
            <div className="space-y-3">
              {inactiveSources.map((source) => (
                <Card
                  key={source.id}
                  className="hover:border-accent transition-colors opacity-75"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{source.name}</h3>
                          <Badge variant="gray">{source.platform}</Badge>
                          <Badge variant="gray">Inactive</Badge>
                        </div>

                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline text-sm flex items-center gap-2 mt-2"
                        >
                          <LinkIcon className="w-4 h-4" />
                          {source.url}
                        </a>

                        <p className="text-xs text-muted-foreground mt-2">
                          Added {new Date(source.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(source.id, source.active)}
                        >
                          <Toggle2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(source)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(source.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {sources.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No sources configured yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first source to start scanning for leads
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Source Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Source' : 'Add New Source'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update source information'
                : 'Add a new web source to scan for leads'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Source Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tech Forum, Q&A Site"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Platform</label>
              <Select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                <option value="">Select platform</option>
                <option value="forum">Forum</option>
                <option value="qa">Q&A Site</option>
                <option value="blog">Blog</option>
                <option value="social">Social Media</option>
                <option value="news">News Site</option>
                <option value="other">Other</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">URL</label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://example.com"
                type="url"
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
