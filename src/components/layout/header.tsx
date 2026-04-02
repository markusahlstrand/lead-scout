import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export interface HeaderProps {
  title: string
  subtitle?: string
  onSearch?: (query: string) => void
  searchPlaceholder?: string
}

export function Header({
  title,
  subtitle,
  onSearch,
  searchPlaceholder = 'Search...',
}: HeaderProps) {
  return (
    <header className="border-b border-border bg-card sticky top-0 z-40">
      <div className="px-8 py-6">
        <div className="flex items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>

          {onSearch && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
