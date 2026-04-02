import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import Dashboard from '@/pages/Dashboard'
import Threads from '@/pages/Threads'
import Companies from '@/pages/Companies'
import Leads from '@/pages/Leads'
import Analytics from '@/pages/Analytics'
import Responses from '@/pages/Responses'
import Knowledge from '@/pages/Knowledge'
import Sources from '@/pages/Sources'
import MediaAssets from '@/pages/MediaAssets'
import Scans from '@/pages/Scans'

type Tenant = 'sesamy' | 'authhero'

export default function App() {
  const [tenant, setTenant] = useState<Tenant>('sesamy')

  const getTenantId = () => {
    return tenant === 'sesamy' ? 'sesamy' : 'authhero'
  }

  return (
    <Router>
      <div className="flex h-screen bg-background text-foreground overflow-hidden">
        <Sidebar tenant={tenant} onTenantChange={setTenant} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/dashboard"
              element={
                <>
                  <Header title="Dashboard" />
                  <Dashboard tenantId={getTenantId()} />
                </>
              }
            />
            <Route
              path="/threads"
              element={
                <>
                  <Header
                    title="Threads"
                    subtitle="Discover and manage threads from web scanning"
                  />
                  <Threads tenantId={getTenantId()} />
                </>
              }
            />
            <Route
              path="/companies"
              element={
                <>
                  <Header
                    title="Companies"
                    subtitle="Manage discovered companies"
                  />
                  <Companies tenantId={getTenantId()} />
                </>
              }
            />
            <Route
              path="/leads"
              element={
                <>
                  <Header title="Leads" subtitle="Manage discovered leads" />
                  <Leads tenantId={getTenantId()} />
                </>
              }
            />
            <Route
              path="/analytics"
              element={
                <>
                  <Header
                    title="Analytics"
                    subtitle="View metrics and insights"
                  />
                  <Analytics tenantId={getTenantId()} />
                </>
              }
            />
            <Route
              path="/responses"
              element={
                <>
                  <Header
                    title="Responses"
                    subtitle="Manage your responses to threads"
                  />
                  <Responses tenantId={getTenantId()} />
                </>
              }
            />
            <Route
              path="/knowledge"
              element={
                <>
                  <Header
                    title="Knowledge Base"
                    subtitle="Manage knowledge and resources"
                  />
                  <Knowledge tenantId={getTenantId()} />
                </>
              }
            />
            <Route
              path="/sources"
              element={
                <>
                  <Header
                    title="Sources"
                    subtitle="Manage scanning sources"
                  />
                  <Sources tenantId={getTenantId()} />
                </>
              }
            />
            <Route
              path="/media-assets"
              element={
                <>
                  <Header
                    title="Media Assets"
                    subtitle="Track owned media channels and accounts"
                  />
                  <MediaAssets tenantId={getTenantId()} />
                </>
              }
            />
            <Route
              path="/scans"
              element={
                <>
                  <Header title="Scans" subtitle="View scan history and status" />
                  <Scans tenantId={getTenantId()} />
                </>
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  )
}
