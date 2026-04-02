# Lead Scout CRM - React Frontend

A professional, modern lead discovery CRM frontend built with Vite, React, TypeScript, Tailwind CSS, and shadcn-inspired components.

## Architecture Overview

### Directory Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx       # Left sidebar navigation with tenant switcher
│   │   └── header.tsx        # Top header with title and search bar
│   └── ui/
│       ├── button.tsx        # Reusable button component
│       ├── badge.tsx         # Status badges with color coding
│       ├── card.tsx          # Card wrapper components
│       ├── dialog.tsx        # Modal dialog component
│       ├── input.tsx         # Styled text input
│       ├── select.tsx        # Native select dropdown
│       └── textarea.tsx      # Multi-line text input
├── pages/
│   ├── Dashboard.tsx         # Main dashboard with stats and recent activity
│   ├── Threads.tsx          # Thread discovery list with filters and expand
│   ├── Companies.tsx        # Company management CRUD
│   ├── Leads.tsx            # Lead management with table view
│   ├── Responses.tsx        # Response composition and management
│   ├── Knowledge.tsx        # Knowledge base with category tabs
│   ├── Sources.tsx          # Scan source management
│   └── Scans.tsx            # Scan history and quick scan interface
├── hooks/
│   └── useApi.ts            # React hooks for API calls (useApi, useApiList, useMutation)
├── lib/
│   ├── api.ts               # API client with tenant-aware endpoints
│   └── utils.ts             # Utility functions (cn helper)
├── App.tsx                   # Main app with routing
├── main.tsx                  # React entry point
└── globals.css              # Tailwind config and CSS variables
```

## Design System

### Color Palette (Dark Theme)

```
Background: hsl(222 84% 5%) - Very dark navy
Card:       hsl(222 84% 8%) - Dark navy
Foreground: hsl(210 40% 96%) - Off-white
Accent:     hsl(217 91% 60%) - Bright blue
Muted:      hsl(217 33% 17%) - Dark slate
Border:     hsl(217 33% 17%) - Dark slate
```

### Status Badge Colors

- **new**: Blue (hsl(217 91% 60%))
- **reviewed**: Yellow (hsl(45 93% 47%))
- **responded**: Green (hsl(142 71% 45%))
- **dismissed**: Gray (hsl(217 33% 17%))

### Component Variants

**Button**: default, destructive, outline, secondary, ghost, link
**Badge**: default, blue, yellow, green, red, gray, destructive, success, warning

## Key Features

### 1. Multi-Tenant Support
- Tenant switcher in sidebar (Sesamy / AuthHero)
- All API calls include tenantId parameter
- Tenant context passed to all pages

### 2. Responsive Layout
- Sticky header with search
- Collapsible sidebar navigation
- Grid-based responsive layouts
- Mobile-friendly table views

### 3. Data Management

#### Threads Page
- List with filters (status, platform, date range)
- Expandable rows showing full content
- Inline status updates
- Relevance score visualization
- Pagination support

#### Companies Page
- CRUD operations
- Form dialog for add/edit
- Status filtering and search
- Company details display
- Notes management

#### Leads Page
- Table view with sortable columns
- Email mailto links
- Company association
- Bulk actions ready
- Status management

#### Responses Page
- Draft/sent status management
- Compose interface
- Thread association
- Send functionality
- Draft editing

#### Knowledge Base
- Category tabs with filtering
- Card grid layout
- Article management
- Full CRUD support
- Dynamic category creation

#### Sources Page
- Active/inactive toggle
- Platform categorization
- URL management
- Quick scan triggers
- Visual status indicators

#### Scans Page
- Historical scan view
- Status filtering
- Threads found metrics
- Quick scan buttons
- Progress indicators for running scans

### 4. Dashboard Features
- Key metrics (threads, companies, leads, response rate)
- Weekly activity chart (Recharts)
- Recent threads list
- Quick action buttons
- Statistics cards with trending data

## API Integration

### API Client (`src/lib/api.ts`)

All endpoints follow the pattern:
```
GET/POST/PUT/DELETE /api/tenants/{tenantId}/{resource}
```

#### Available APIs

```typescript
// Threads
threadsApi.list(tenantId, filters)
threadsApi.get(tenantId, threadId)
threadsApi.update(tenantId, threadId, data)

// Companies
companiesApi.list(tenantId, filters)
companiesApi.create(tenantId, data)
companiesApi.update(tenantId, companyId, data)
companiesApi.delete(tenantId, companyId)

// Leads
leadsApi.list(tenantId, filters)
leadsApi.create(tenantId, data)
leadsApi.update(tenantId, leadId, data)

// Responses
responsesApi.list(tenantId, filters)
responsesApi.create(tenantId, data)
responsesApi.send(tenantId, responseId)

// Knowledge
knowledgeApi.list(tenantId, category)
knowledgeApi.create(tenantId, data)
knowledgeApi.update(tenantId, knowledgeId, data)

// Scans
scansApi.list(tenantId, filters)
scansApi.create(tenantId, data)

// Sources
sourcesApi.list(tenantId)
sourcesApi.create(tenantId, data)
sourcesApi.update(tenantId, sourceId, data)

// Stats
statsApi.get(tenantId)
```

### Custom Hooks (`src/hooks/useApi.ts`)

```typescript
// Simple API call with loading/error states
const { data, loading, error, refetch } = useApi(apiFn, tenantId)

// List with filtering support
const { data, filters, setFilters, refetch } = useApiList(apiFn, tenantId, initialFilters)

// Mutations (POST/PUT/DELETE)
const [mutate, { loading, error, data }] = useMutation(apiFn)
```

## Styling Approach

### Tailwind + CSS Variables

The app uses Tailwind CSS with CSS custom properties for theming:

```css
:root {
  --background: 222 84% 5%;
  --accent: 217 91% 60%;
  /* ... */
}
```

This allows:
- Easy dark theme switching
- Consistent color usage across components
- HSL values for fine-grained color control

### Component Styling

Components use:
- **CVA** (class-variance-authority) for variant-based styling
- **clsx** + **tailwind-merge** for className composition
- Custom `cn()` helper for merging classes safely

```typescript
const buttonVariants = cva('base classes', {
  variants: {
    variant: {
      default: 'bg-accent text-accent-foreground',
      outline: 'border border-input bg-background',
    },
  },
})
```

## Development

### Setup

```bash
npm install
npm run dev
```

### Build

```bash
npm run build
```

### Type Checking

```bash
npx tsc --noEmit
```

## Dependencies

### Core
- **react** 18.3 - UI library
- **react-dom** 18.3 - DOM rendering
- **react-router-dom** 6.23 - Routing

### UI/Styling
- **tailwindcss** 3.4 - Utility CSS
- **lucide-react** 0.400 - Icon library
- **class-variance-authority** 0.7 - Component variants
- **clsx** 2.1 - Class composition
- **tailwind-merge** 2.3 - Merge Tailwind classes

### Data Visualization
- **recharts** 2.10 - React charting library

### Utilities
- **date-fns** 3.6 - Date formatting and manipulation

## Component Examples

### Button Usage

```typescript
<Button variant="default" size="lg">
  Save Changes
</Button>

<Button variant="outline">
  Cancel
</Button>

<Button variant="destructive" size="sm">
  Delete
</Button>
```

### Badge Status

```typescript
<Badge variant="blue">new</Badge>
<Badge variant="green">responded</Badge>
<Badge variant="yellow">reviewed</Badge>
<Badge variant="gray">dismissed</Badge>
```

### Card Layout

```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

### Dialog/Modal

```typescript
const dialogRef = useRef<HTMLDialogElement>(null)

<Button onClick={() => dialogRef.current?.showModal()}>
  Open
</Button>

<Dialog ref={dialogRef} open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Performance Considerations

1. **Code Splitting**: React Router automatically splits pages
2. **Lazy Loading**: Pages imported as dynamic chunks
3. **Memoization**: useCallback hooks in API layer
4. **Pagination**: Implemented in Threads list
5. **Filtering**: Client-side filtering for better UX

## Future Enhancements

- Real-time updates with WebSockets
- Advanced search/filter UI
- Bulk operations
- Data export (CSV, PDF)
- User preferences/settings
- Activity logging
- Notification system
- Analytics dashboard
- Team collaboration features

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Notes

- All API calls assume `/api/` base path
- Vite proxy configured for development (see vite.config.ts)
- Dark theme is the only supported theme
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
