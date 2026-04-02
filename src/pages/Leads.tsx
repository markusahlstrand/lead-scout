import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Mail, ExternalLink, Circle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
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
import { leadsApi, companiesApi, Lead, Company } from '@/lib/api'

interface LeadsProps {
  tenantId: string
}

const LEAD_TYPES = [
  { value: 'community', label: 'Community', color: 'bg-purple-500' },
  { value: 'prospect', label: 'Prospects', color: 'bg-orange-500' },
  { value: 'company', label: 'Companies', color: 'bg-blue-500' },
  { value: 'engaged', label: 'Engaged', color: 'bg-green-500' },
]

export default function Leads({ tenantId }: LeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [leadTypeFilter, setLeadTypeFilter] = useState('all')
  const [signalStrengthFilter, setSignalStrengthFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    handle: '',
    companyId: '',
    status: 'new' as const,
    leadType: 'prospect' as const,
    signal: '',
    signalStrength: 'cold' as const,
    sourceUrl: '',
    relevanceScore: 50,
    platform: '',
    notes: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsData, companiesData] = await Promise.all([
          leadsApi.list(tenantId),
          companiesApi.list(tenantId),
        ])
        setLeads(leadsData)
        setCompanies(companiesData)
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [tenantId])

  useEffect(() => {
    let filtered = leads

    if (searchTerm) {
      filtered = filtered.filter(
        (l) =>
          l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          l.handle?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (leadTypeFilter !== 'all') {
      filtered = filtered.filter((l) => l.leadType === leadTypeFilter)
    }

    if (signalStrengthFilter !== 'all') {
      filtered = filtered.filter((l) => l.signalStrength === signalStrengthFilter)
    }

    if (platformFilter !== 'all') {
      filtered = filtered.filter((l) => l.platform === platformFilter)
    }

    setFilteredLeads(filtered)
  }, [leads, searchTerm, leadTypeFilter, signalStrengthFilter, platformFilter])

  const getLeadTypeBadgeColor = (type: string) => {
    const leadType = LEAD_TYPES.find((t) => t.value === type)
    return leadType?.color || 'bg-gray-500'
  }

  const getSignalDotColor = (strength: string) => {
    switch (strength) {
      case 'hot':
        return 'bg-red-500'
      case 'warm':
        return 'bg-yellow-500'
      case 'cold':
        return 'bg-gray-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'blue'
      case 'contacted':
        return 'yellow'
      case 'engaged':
        return 'green'
      case 'converted':
        return 'green'
      case 'inactive':
        return 'gray'
      default:
        return 'default'
    }
  }

  const getCompanyName = (companyId: string) => {
    return companies.find((c) => c.id === companyId)?.name || 'Unknown'
  }

  const allPlatforms = Array.from(new Set(leads.map((l) => l.platform).filter(Boolean)))

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: '',
      handle: '',
      companyId: '',
      status: 'new',
      leadType: 'prospect',
      signal: '',
      signalStrength: 'cold',
      sourceUrl: '',
      relevanceScore: 50,
      platform: '',
      notes: '',
    })
    setEditingId(null)
  }

  const handleOpenDialog = (lead?: Lead) => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email || '',
        role: lead.role || '',
        handle: lead.handle || '',
        companyId: lead.companyId || '',
        status: lead.status as any,
        leadType: lead.leadType as any,
        signal: lead.signal || '',
        signalStrength: lead.signalStrength as any,
        sourceUrl: lead.sourceUrl || '',
        relevanceScore: lead.relevanceScore || 50,
        platform: lead.platform || '',
        notes: lead.notes || '',
      })
      setEditingId(lead.id)
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await leadsApi.update(tenantId, editingId, formData)
        setLeads(leads.map((l) => (l.id === editingId ? { ...l, ...formData } : l)))
      } else {
        const newLead = await leadsApi.create(tenantId, {
          tenantId,
          ...formData,
        })
        setLeads([...leads, newLead])
      }
      setShowDialog(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save lead:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await leadsApi.delete(tenantId, id)
      setLeads(leads.filter((l) => l.id !== id))
    } catch (error) {
      console.error('Failed to delete lead:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center text-muted-foreground">Loading leads...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {filteredLeads.length} leads
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Lead
          </Button>
        </div>

        {/* Lead Type Tabs */}
        <div className="flex gap-2 border-b border-border pb-4 overflow-x-auto">
          <button
            onClick={() => setLeadTypeFilter('all')}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              leadTypeFilter === 'all'
                ? 'border-b-2 border-accent text-accent'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {LEAD_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setLeadTypeFilter(type.value)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                leadTypeFilter === type.value
                  ? 'border-b-2 border-accent text-accent'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${type.color}`} />
              {type.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Search
              </label>
              <Input
                placeholder="Search by name, email, handle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Signal Strength
              </label>
              <Select
                value={signalStrengthFilter}
                onChange={(e) => setSignalStrengthFilter(e.target.value)}
              >
                <option value="all">All Signals</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
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
                {allPlatforms.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Leads Grid */}
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No leads found matching filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="hover:border-accent transition-colors">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header with Type Badge and Signal */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-base">{lead.name}</h4>
                        {lead.handle && (
                          <p className="text-sm text-muted-foreground">@{lead.handle}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getSignalDotColor(lead.signalStrength)}`} />
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 flex-wrap">
                      <Badge
                        className={`text-white ${getLeadTypeBadgeColor(lead.leadType)}`}
                      >
                        {LEAD_TYPES.find((t) => t.value === lead.leadType)?.label}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(lead.status)}>
                        {lead.status}
                      </Badge>
                      {lead.signal && (
                        <Badge variant="gray" className="text-xs">
                          {lead.signal}
                        </Badge>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      {lead.email && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Email:</span>
                          <a
                            href={`mailto:${lead.email}`}
                            className="text-accent hover:underline text-xs truncate"
                          >
                            {lead.email}
                          </a>
                        </div>
                      )}
                      {lead.role && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Role:</span>
                          <span className="text-xs">{lead.role}</span>
                        </div>
                      )}
                      {lead.platform && (
                        <div className="flex justify-between items-start">
                          <span className="text-muted-foreground">Platform:</span>
                          <span className="text-xs">{lead.platform}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground">Relevance:</span>
                        <span className="text-xs font-semibold">
                          {lead.relevanceScore}%
                        </span>
                      </div>
                    </div>

                    {/* Source URL */}
                    {lead.sourceUrl && (
                      <a
                        href={lead.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline text-xs truncate block flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        {lead.sourceUrl}
                      </a>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleOpenDialog(lead)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDelete(lead.id)}
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
        )}
      </div>

      {/* Add/Edit Lead Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update lead information' : 'Add a new lead to your database'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Handle</label>
                <Input
                  value={formData.handle}
                  onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                  placeholder="@johndoe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Role</label>
                <Input
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="CTO"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Lead Type</label>
                <Select
                  value={formData.leadType}
                  onChange={(e) =>
                    setFormData({ ...formData, leadType: e.target.value as any })
                  }
                >
                  {LEAD_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Signal Strength</label>
                <Select
                  value={formData.signalStrength}
                  onChange={(e) =>
                    setFormData({ ...formData, signalStrength: e.target.value as any })
                  }
                >
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Signal Text</label>
                <Input
                  value={formData.signal}
                  onChange={(e) => setFormData({ ...formData, signal: e.target.value })}
                  placeholder="e.g., Mentioned our product"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Platform</label>
                <Input
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  placeholder="e.g., Twitter, LinkedIn"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Source URL</label>
              <Input
                type="url"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Relevance Score ({formData.relevanceScore}%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.relevanceScore}
                onChange={(e) =>
                  setFormData({ ...formData, relevanceScore: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Company</label>
              <Select
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interested">Interested</option>
                <option value="qualified">Qualified</option>
                <option value="dismissed">Dismissed</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes about this lead..."
                className="w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                rows={3}
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
