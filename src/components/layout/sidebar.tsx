import React, { useState } from 'react'
import { Link, useLocation } from 'react-router'
import {
  LayoutDashboard,
  MessageSquare,
  Building2,
  Users,
  BarChart3,
  MessageCircle,
  BookOpen,
  LinkIcon,
  Share2,
  Radio,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface SidebarProps {
  tenant: 'sesamy' | 'authhero'
  onTenantChange: (tenant: 'sesamy' | 'authhero') => void
}

export function Sidebar({ tenant, onTenantChange }: SidebarProps) {
  const location = useLocation()
  const [isTenantOpen, setIsTenantOpen] = useState(false)

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Threads',
      href: '/threads',
      icon: MessageSquare,
    },
    {
      label: 'Companies',
      href: '/companies',
      icon: Building2,
    },
    {
      label: 'Leads',
      href: '/leads',
      icon: Users,
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: BarChart3,
    },
    {
      label: 'Responses',
      href: '/responses',
      icon: MessageCircle,
    },
    {
      label: 'Knowledge',
      href: '/knowledge',
      icon: BookOpen,
    },
    {
      label: 'Sources',
      href: '/sources',
      icon: LinkIcon,
    },
    {
      label: 'Media Assets',
      href: '/media-assets',
      icon: Share2,
    },
    {
      label: 'Scans',
      href: '/scans',
      icon: Radio,
    },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="w-64 border-r border-border bg-card min-h-screen flex flex-col">
      {/* Tenant Switcher */}
      <div className="p-6 border-b border-border">
        <div className="relative">
          <button
            onClick={() => setIsTenantOpen(!isTenantOpen)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted transition-colors"
          >
            <div className="flex flex-col text-left">
              <span className="text-xs text-muted-foreground">Product</span>
              <span className="text-sm font-semibold capitalize">
                {tenant}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {isTenantOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-muted rounded-md shadow-lg border border-border z-50">
              <button
                onClick={() => {
                  onTenantChange('sesamy')
                  setIsTenantOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors rounded-t-md',
                  tenant === 'sesamy' && 'bg-accent text-accent-foreground'
                )}
              >
                Sesamy
              </button>
              <button
                onClick={() => {
                  onTenantChange('authhero')
                  setIsTenantOpen(false)
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors rounded-b-md',
                  tenant === 'authhero' && 'bg-accent text-accent-foreground'
                )}
              >
                AuthHero
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-muted'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-border space-y-2">
        <Badge variant="gray" className="w-full justify-center">
          v1.0.0
        </Badge>
        <p className="text-xs text-muted-foreground text-center">
          Lead Scout CRM
        </p>
      </div>
    </div>
  )
}
