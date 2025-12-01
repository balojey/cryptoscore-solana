# Design Document

## Overview

The Header redesign focuses on creating a cleaner, more focused navigation experience by reducing visual clutter and relocating features to more contextually appropriate locations. The redesigned header will contain only essential navigation (Markets, Terminal, Dashboard) and utility controls (Currency, Theme, Wallet), while removing redundant elements like the Home link (logo serves this purpose), Leaderboard link (moved to Terminal), and SearchBar (moved to Markets page).

## Architecture

### Component Structure

```
Header (app/src/components/layout/Header.tsx)
├── Logo Section (left)
│   └── Logo Link (navigates to "/")
├── Navigation Section (center/left-center)
│   ├── Markets Link
│   ├── Terminal Link
│   └── Dashboard Link
└── Utility Controls Section (right)
    ├── CurrencySelector
    ├── ThemeSwitcher
    └── Connect (Wallet)
    └── Mobile Menu (hamburger icon)
        ├── Navigation Links
        ├── Currency Section
        ├── Theme Section
        └── Connect Button
```

### Layout Strategy

**Desktop (md breakpoint and above):**
- Logo on the left
- Navigation links in the center-left area
- Utility controls on the right
- No mobile menu visible

**Mobile (below md breakpoint):**
- Logo on the left
- Hamburger menu icon on the right
- All navigation and controls in dropdown menu

## Components and Interfaces

### Header Component

**File:** `app/src/components/layout/Header.tsx`

**Props:** None (uses React Router hooks internally)

**State:**
- Remove `showSearch` state (no longer needed)

**Hooks:**
- `useLocation()` - Track current route for active state styling
- `useTheme()` - Access theme context for mobile menu theme selector

**Key Changes:**
1. Remove all SearchBar-related code and imports
2. Remove Home link from navigation
3. Remove Leaderboard link from navigation
4. Remove `isMarketsPage` conditional logic
5. Simplify navigation to three links: Markets, Terminal, Dashboard
6. Keep utility controls unchanged
7. Update mobile menu to match desktop navigation
8. Remove mobile search toggle functionality

### Navigation Links

**Desktop Navigation:**
```tsx
<div className="hidden md:flex items-center gap-3">
  <Button variant="outline" size="sm" asChild>
    <Link to="/markets">
      <span className="icon-[mdi--chart-box-outline] w-4 h-4" />
      <span>Markets</span>
    </Link>
  </Button>
  
  <Button variant="outline" size="sm" asChild>
    <Link to="/terminal">
      <span className="icon-[mdi--monitor-dashboard] w-4 h-4" />
      <span>Terminal</span>
    </Link>
  </Button>
  
  <Button variant="outline" size="sm" asChild>
    <Link to="/dashboard">
      <span className="icon-[mdi--view-dashboard-outline] w-4 h-4" />
      <span>Dashboard</span>
    </Link>
  </Button>
</div>
```

**Active State Logic:**
- Markets: `location.pathname === '/markets' || location.pathname.startsWith('/markets/')`
- Terminal: `location.pathname === '/terminal'`
- Dashboard: `location.pathname === '/dashboard'`

**Active Styling:**
```tsx
style={{
  background: isActive ? 'var(--accent-cyan)' : undefined,
  color: isActive ? 'var(--text-inverse)' : undefined,
  borderColor: isActive ? 'var(--accent-cyan)' : undefined,
}}
```

### Mobile Menu

**Structure:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <Button variant="outline" size="icon">
      <Menu className="w-5 h-5" />
    </Button>
  </DropdownMenuTrigger>
  
  <DropdownMenuContent align="end" className="w-56">
    {/* Navigation Links */}
    <DropdownMenuItem asChild>
      <Link to="/markets">Markets</Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link to="/terminal">Terminal</Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link to="/dashboard">Dashboard</Link>
    </DropdownMenuItem>
    
    <DropdownMenuSeparator />
    
    {/* Currency Section */}
    <div className="px-2 py-2">
      <div className="text-xs font-medium mb-2">Currency</div>
      <CurrencySelector />
    </div>
    
    <DropdownMenuSeparator />
    
    {/* Theme Section */}
    <div className="px-2 py-2">
      <div className="text-xs font-medium mb-2">Theme</div>
      {/* Theme options */}
    </div>
    
    <DropdownMenuSeparator />
    
    {/* Wallet Connection */}
    <div className="px-2 py-2">
      <Connect />
    </div>
  </DropdownMenuContent>
</DropdownMenu>
```

### Logo Component

**No changes required** - Logo already functions as home link

**Existing behavior to maintain:**
- Clickable link to "/"
- Hover glow effect
- SVG icon + "CryptoScore" text
- Responsive sizing (text-xl on mobile, text-2xl on desktop)

## Data Models

### Route Matching

```typescript
interface RouteState {
  isMarketsActive: boolean
  isTerminalActive: boolean
  isDashboardActive: boolean
}

// Derived from useLocation()
const routeState: RouteState = {
  isMarketsActive: location.pathname === '/markets' || location.pathname.startsWith('/markets/'),
  isTerminalActive: location.pathname === '/terminal',
  isDashboardActive: location.pathname === '/dashboard',
}
```

## Integration Points

### Markets Page Integration

**File:** `app/src/components/market/Markets.tsx`

**Change:** Add SearchBar component at the top of the Markets component

**Implementation:**
```tsx
import SearchBar from '../SearchBar'

export function Markets() {
  const [searchQuery, setSearchQuery] = useState('')
  
  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="max-w-2xl">
        <SearchBar 
          placeholder="Search markets by team, competition..." 
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>
      
      {/* Existing Filters */}
      <div className="space-y-4">
        {/* ... existing filter code ... */}
      </div>
      
      {/* Existing Content */}
      {/* ... */}
    </div>
  )
}
```

**Note:** SearchBar component may need to be updated to accept `value` and `onChange` props if it doesn't already support controlled component pattern.

### Terminal Page Integration

**File:** `app/src/pages/TradingTerminal.tsx` (or similar)

**Change:** Add Leaderboard link/button within the Terminal page

**Suggested placement options:**
1. **Tab navigation** - Add "Leaderboard" as a tab alongside other terminal views
2. **Quick action button** - Add a prominent button in the terminal header/toolbar
3. **Sidebar link** - If terminal has a sidebar, add leaderboard link there

**Example implementation (tab approach):**
```tsx
<div className="flex gap-2 border-b">
  <TabButton active={view === 'overview'} onClick={() => setView('overview')}>
    Overview
  </TabButton>
  <TabButton active={view === 'markets'} onClick={() => setView('markets')}>
    Markets
  </TabButton>
  <TabButton active={view === 'leaderboard'} onClick={() => setView('leaderboard')}>
    <span className="icon-[mdi--trophy] w-4 h-4" />
    Leaderboard
  </TabButton>
</div>
```

### Connect Component

**File:** `app/src/components/Connect.tsx`

**Change:** Remove network badge display from Connect component

**Current code to remove:**
```tsx
{/* Network indicator */}
<div className={`px-2 py-1 rounded-md text-xs font-medium border ${networkColors[network as keyof typeof networkColors]}`}>
  {network.toUpperCase()}
</div>
```

**Rationale:** Network indicator adds visual clutter and is not essential for primary navigation. Users typically know which network they're on from context, and this information can be displayed elsewhere if needed (e.g., in settings or footer).

## Styling and Theming

### Header Container

```css
.header {
  position: sticky;
  top: 0;
  z-index: 50;
  width: 100%;
  backdrop-filter: blur(8px);
  background: var(--bg-overlay);
  border-bottom: 1px solid var(--border-default);
  box-shadow: var(--shadow-lg);
}
```

### Navigation Button States

**Default:**
```css
{
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
}
```

**Hover:**
```css
{
  background: var(--bg-hover);
  color: var(--text-primary);
}
```

**Active:**
```css
{
  background: var(--accent-cyan);
  color: var(--text-inverse);
  border-color: var(--accent-cyan);
}
```

### Responsive Breakpoints

- **Mobile:** < 768px (md breakpoint)
  - Show hamburger menu
  - Hide desktop navigation
  - Logo + menu icon only

- **Desktop:** >= 768px
  - Show full navigation
  - Hide hamburger menu
  - Logo + navigation + utilities

### Spacing and Layout

**Header height:** 80px (h-20)

**Container padding:**
- Mobile: px-4
- Tablet: px-6 (sm:px-6)
- Desktop: px-8 (lg:px-8)

**Navigation gap:** 12px (gap-3)

**Max width:** 1536px (max-w-screen-2xl)

## Accessibility

### Keyboard Navigation

- All navigation links must be keyboard accessible
- Tab order: Logo → Markets → Terminal → Dashboard → Currency → Theme → Wallet → Mobile Menu
- Mobile menu items must be keyboard navigable when open

### ARIA Labels

```tsx
<Button aria-label="Open menu">
  <Menu />
</Button>

<Link to="/markets" aria-current={isMarketsActive ? 'page' : undefined}>
  Markets
</Link>
```

### Screen Reader Support

- Logo link should have descriptive text (already has "CryptoScore")
- Active navigation items should indicate current page
- Mobile menu should announce open/closed state
- Icon-only buttons need aria-labels

## Performance Considerations

### Code Splitting

No changes needed - Header is part of main layout bundle

### Re-render Optimization

- Use `useLocation()` hook efficiently
- Memoize active state calculations if needed
- Avoid unnecessary re-renders of utility components

### Bundle Size Impact

**Reductions:**
- Remove SearchBar import and rendering logic
- Remove unused state management
- Simplify conditional rendering

**Expected impact:** ~5-10% reduction in Header component size

## Testing Strategy

### Unit Tests

**Test file:** `app/src/components/layout/__tests__/Header.test.tsx`

**Test cases:**
1. Renders logo with link to home
2. Renders three navigation links (Markets, Terminal, Dashboard)
3. Does not render Home link
4. Does not render Leaderboard link
5. Does not render SearchBar
6. Applies active styling to current route
7. Renders utility controls (Currency, Theme, Wallet)
8. Renders mobile menu on small screens
9. Mobile menu contains correct navigation items
10. Mobile menu does not contain Home or Leaderboard links

### Integration Tests

**Test scenarios:**
1. Navigation between routes updates active states correctly
2. Logo click navigates to home page
3. Mobile menu opens and closes properly
4. Theme switcher works in mobile menu
5. Currency selector works in mobile menu
6. Wallet connection works from header

### Visual Regression Tests

**Screenshots to capture:**
1. Desktop header - default state
2. Desktop header - Markets active
3. Desktop header - Terminal active
4. Desktop header - Dashboard active
5. Mobile header - menu closed
6. Mobile header - menu open
7. Different themes applied

### Manual Testing Checklist

- [ ] Logo hover effect works
- [ ] Logo click navigates to home
- [ ] All navigation links work
- [ ] Active state styling correct
- [ ] Utility controls functional
- [ ] Mobile menu opens/closes
- [ ] Mobile menu navigation works
- [ ] Responsive layout at all breakpoints
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly
- [ ] No console errors
- [ ] No layout shifts

## Migration Notes

### Breaking Changes

None - This is a UI-only change that doesn't affect APIs or data structures

### Deprecations

- SearchBar in header (moved to Markets page)
- Home navigation link (logo serves this purpose)
- Leaderboard navigation link (moved to Terminal page)
- Network badge in Connect component

### Rollback Plan

If issues arise, the original Header.tsx can be restored from version control. No database or API changes are involved.

## Future Enhancements

### Potential Improvements

1. **Breadcrumb navigation** - Add breadcrumbs for nested routes (e.g., Markets > Market Detail)
2. **Notifications bell** - Add notification icon for user alerts
3. **User profile dropdown** - Add user avatar/menu when wallet connected
4. **Quick actions** - Add frequently used actions to header
5. **Search everywhere** - Global search that works across all pages (not just markets)

### Scalability Considerations

- Navigation structure supports up to 5-6 links before becoming cluttered
- Consider dropdown menus for grouped navigation if more sections added
- Utility controls area can accommodate 1-2 more items before overflow
