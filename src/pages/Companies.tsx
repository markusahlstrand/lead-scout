import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, ChevronDown } from 'lucide-react'
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
import { companiesApi, Company } from '@/lib/api'
import { cn } from '@/lib/utils'

interface CompaniesProps {
  tenantId: string
}

export default function Companies({ tenantId }: CompaniesProps) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    industry: '',
    size: '',
    status: 'new' as const,
    notes: '',
  })

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const data = await companiesApi.list(tenantId)
        setCompanies(data)
      } catch (error) {
        console.error('Failed to load companies:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCompanies()
  }, [tenantId])

  useEffect(() => {
    let filtered = companies

    if (searchTerm) {
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.website?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.industry?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === statusFilter)
    }

    setFilteredCompanies(filtered)
  }, [companies, searchTerm, statusFilter])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
        return 'blue'
      case 'engaged':
        return 'yellow'
      case 'customer':
        return 'green'
      case 'dismissed':
        return 'gray'
      default:
        return 'default'
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      industry: '',
      size: '',
      status: 'new',
      notes: '',
    })
    setEditingId(null)
  }

  const handleOpenDialog = (company?: Company) => {
    if (company) {
      setFormData({
        name: company.name,
        website: company.website || '',
        industry: company.industry || '',
        size: company.size || '',
        status: company.status,
        notes: company.notes || '',
      })
      setEditingId(company.id)
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await companiesApi.update(tenantId, editingId, formData)
        setCompanies(
          companies.map((c) => (c.id === editingId ? { ...c, ...formData } : c))
        )
      } else {
        const newCompany = await companiesApi.create(tenantId, {
          tenantId,
          ...formData,
        })
        setCompanies([...companies, newCompany])
      }
      setShowDialog(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save company:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await companiesApi.delete(tenantId, id)
      setCompanies(companies.filter((c) => c.id !== id))
    } catch (error) {
      console.error('Failed to delete company:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center text-muted-foreground">Loading companies...</div>
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
              {filteredCompanies.length} companies
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Company
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Search
              </label>
              <Input
                placeholder="Search by name or website..."
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
                <option value="engaged">Engaged</option>
                <option value="customer">Customer</option>
                <option value="dismissed">Dismissed</option>
              </Select>
            </div>
          </div>
        </div>

        {/* Companies List */}
        <div className="space-y-3">
          {filteredCompanies.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No companies found</p>
              </CardContent>
            </Card>
          ) : (
            filteredCompanies.map((company) => (
              <Card
                key={company.id}
                className="hover:border-accent transition-colors"
                onClick={() =>
                  setExpandedId(expandedId === company.id ? null : company.id)
                }
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{company.name}</h3>
                        <Badge variant={getStatusBadgeVariant(company.status)}>
                          {company.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {company.website && (
                          <div>
                            <p className="text-muted-foreground">Website</p>
                            <a
                              href={company.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-accent hover:underline truncate"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {company.website}
                            </a>
                          </div>
                        )}
                        {company.industry && (
                          <div>
                            <p className="text-muted-foreground">Industry</p>
                            <p>{company.industry}</p>
                          </div>
                        )}
                        {company.size && (
                          <div>
                            <p className="text-muted-foreground">Size</p>
                            <p>{company.size}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Added</p>
                          <p>{new Date(company.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDialog(company)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(company.id)
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      <ChevronDown
                        className={cn(
                          'w-5 h-5 text-muted-foreground transition-transform',
                          expandedId === company.id && 'rotate-180'
                        )}
                      />
                    </div>
                  </div>

                  {expandedId === company.id && company.notes && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h4 className="text-sm font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{company.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Company Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Company' : 'Add New Company'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update company information'
                : 'Add a new company to your database'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Acme Inc"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Industry</label>
                <Input
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="Technology"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Company Size</label>
                <Select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </Select>
              </div>
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
                <option value="engaged">Engaged</option>
                <option value="customer">Customer</option>
                <option value="dismissed">Dismissed</option>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add notes about this company..."
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
