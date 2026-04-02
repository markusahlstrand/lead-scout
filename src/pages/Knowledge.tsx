import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { knowledgeApi, Knowledge } from '@/lib/api'

interface KnowledgeProps {
  tenantId: string
}

export default function KnowledgeBase({ tenantId }: KnowledgeProps) {
  const [items, setItems] = useState<Knowledge[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    content: '',
  })

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await knowledgeApi.list(tenantId)
        setItems(data)
      } catch (error) {
        console.error('Failed to load knowledge items:', error)
      } finally {
        setLoading(false)
      }
    }
    loadItems()
  }, [tenantId])

  const categories = [...new Set(items.map((i) => i.category))].sort()
  const filteredItems =
    selectedCategory === 'all'
      ? items
      : items.filter((i) => i.category === selectedCategory)

  const resetForm = () => {
    setFormData({
      category: '',
      title: '',
      content: '',
    })
    setEditingId(null)
  }

  const handleOpenDialog = (item?: Knowledge) => {
    if (item) {
      setFormData({
        category: item.category,
        title: item.title,
        content: item.content,
      })
      setEditingId(item.id)
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await knowledgeApi.update(tenantId, editingId, formData)
        setItems(items.map((i) => (i.id === editingId ? { ...i, ...formData } : i)))
      } else {
        const newItem = await knowledgeApi.create(tenantId, {
          tenantId,
          ...formData,
        })
        setItems([...items, newItem])
      }
      setShowDialog(false)
      resetForm()
    } catch (error) {
      console.error('Failed to save knowledge item:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await knowledgeApi.delete(tenantId, id)
      setItems(items.filter((i) => i.id !== id))
    } catch (error) {
      console.error('Failed to delete item:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto p-8">
        <div className="text-center text-muted-foreground">Loading knowledge base...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} articles
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="w-4 h-4 mr-2" />
            Add Article
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-accent text-accent-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No articles in this category</p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card
                key={item.id}
                className="hover:border-accent transition-colors flex flex-col"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2">
                        {item.title}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.category}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {item.content}
                  </p>
                </CardContent>

                <div className="p-6 pt-0">
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(item.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Article Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Article' : 'Add New Article'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update your knowledge base article'
                : 'Add a new article to your knowledge base'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Features, Integration, Troubleshooting"
                  list="categories"
                />
                <datalist id="categories">
                  {categories.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Article title"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Write your article content here..."
                rows={10}
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
