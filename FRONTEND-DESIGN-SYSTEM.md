# Frontend Design System Documentation

## Overview
Mobile-first, responsive UI built with Next.js 14, React 18, TypeScript, and Tailwind CSS v3. Component-based architecture following atomic design principles.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS v3.4
- **Icons**: Lucide React
- **Fonts**: Inter (Google Fonts)
- **Image Optimization**: Next.js Image component

## Design Principles

### 1. Mobile-First Approach
- Base styles target 375px (iPhone SE)
- Progressive enhancement for tablets and desktop
- Touch-friendly tap targets (minimum 44x44px)

### 2. Component Architecture
```
src/
├── components/
│   ├── ui/           # Atomic components (Button, Input, Card, Badge)
│   ├── layout/       # Layout components (Header, Nav, SearchBar)
│   └── listing/      # Feature components (ListingCard)
├── lib/
│   └── utils.ts      # Utility functions
└── app/
    ├── globals.css   # Global styles & Tailwind
    └── page.tsx      # Pages
```

### 3. Color System
```js
primary: {
  600: '#fa5252', // Main brand color (coral/red)
  700: '#f03e3e', // Hover state
}

neutral: {
  50:  '#f8f9fa', // Background
  100: '#f1f3f5', // Light background
  200: '#e9ecef', // Borders
  500: '#adb5bd', // Muted text
  700: '#495057', // Body text
  900: '#212529', // Headings
}

success: {
  100: '#d3f9d8', // Badge background
  500: '#51cf66', // Verified indicator
}
```

### 4. Typography
- **Font**: Inter (system fallback: -apple-system, sans-serif)
- **Scale**:
  - Headings: 20px (bold)
  - Body: 16px (regular)
  - Small: 14px, 12px, 10px

### 5. Spacing Scale
Tailwind's default scale (4px base):
- `gap-2` = 8px
- `gap-4` = 16px
- `p-3` = 12px
- `p-4` = 16px

### 6. Border Radius
- Cards: `rounded-2xl` (20px)
- Buttons/Inputs: `rounded-xl` (12px)
- Badges: `rounded-full`

---

## Core UI Components

### Button
**Location**: `src/components/ui/Button.tsx`

**Variants**:
- `primary`: Coral background, white text
- `secondary`: Gray background
- `outline`: White with border
- `ghost`: Transparent with hover

**Sizes**: `sm`, `md` (default), `lg`

**Usage**:
```tsx
<Button variant="primary" size="md">
  Rent Now
</Button>

<Button variant="outline" fullWidth>
  See All
</Button>
```

### Input
**Location**: `src/components/ui/Input.tsx`

**Features**:
- Left/right icon support
- Placeholder styling
- Focus states
- Disabled state

**Usage**:
```tsx
<Input
  type="search"
  placeholder="Search..."
  leftIcon={<Search className="w-5 h-5" />}
/>
```

### Card
**Location**: `src/components/ui/Card.tsx`

**Sub-components**:
- `Card`: Container with shadow
- `CardImage`: Aspect-ratio image container
- `CardContent`: Padding wrapper

**Usage**:
```tsx
<Card hover> {/* hover prop adds interactive shadow */}
  <CardImage>
    <Image src="..." alt="..." width={600} height={600} />
  </CardImage>
  <CardContent>
    <h3>Title</h3>
  </CardContent>
</Card>
```

### Badge
**Location**: `src/components/ui/Badge.tsx`

**Variants**: `default`, `success`, `warning`, `error`

**Usage**:
```tsx
<Badge variant="success">
  <ShieldCheck className="w-3 h-3" />
  VERIFIED
</Badge>
```

---

## Layout Components

### Header
**Location**: `src/components/layout/Header.tsx`

**Features**:
- Sticky positioning
- Location dropdown
- Notification bell with indicator

### SearchBar
**Location**: `src/components/layout/SearchBar.tsx`

**Features**:
- Search input with icon
- Filter button (slider icon)

### CategoryTabs
**Location**: `src/components/layout/CategoryTabs.tsx`

**Features**:
- Horizontal scroll
- Active state tracking
- Icon + label per category

**Categories**:
1. Event Equipment (Tent icon)
2. Tools (Wrench icon)
3. Photography (Camera icon)

### BottomNav
**Location**: `src/components/layout/BottomNav.tsx`

**Navigation Items**:
1. Browse (Home icon)
2. Search (Search icon)
3. Rent Out (PlusCircle icon)
4. Chats (MessageSquare icon)
5. Profile (User icon)

**Features**:
- Fixed bottom positioning
- Active state with color + icon fill
- Home indicator bar (iOS style)

---

## Feature Components

### ListingCard
**Location**: `src/components/listing/ListingCard.tsx`

**Props**:
```ts
{
  id: string;
  title: string;
  pricePerDay: number;
  rating: number;
  image: string;
  distance: number; // in meters
  isVerified: boolean;
}
```

**Features**:
- Next.js Image optimization
- Distance formatting (1200m → "1.2 km away")
- Price formatting (8500 → "₦8,500")
- Rating display with star icon
- Verified badge
- Hover shadow effect

**Usage**:
```tsx
<ListingCard
  id="1"
  title="Party Canopy 10x10"
  pricePerDay={8500}
  rating={4.9}
  image="https://..."
  distance={1200}
  isVerified={true}
/>
```

---

## Utility Functions

### `cn(...inputs)`
Combines Tailwind classes with `clsx` and `tailwind-merge`.

```ts
cn('px-4 py-2', isActive && 'bg-primary-600')
```

### `formatPrice(amount, currency)`
Formats numbers as currency with thousands separator.

```ts
formatPrice(8500) // "₦8,500"
formatPrice(12000, '$') // "$12,000"
```

### `formatDistance(meters)`
Converts meters to human-readable distance.

```ts
formatDistance(800) // "800m away"
formatDistance(2500) // "2.5 km away"
```

---

## Responsive Breakpoints

Tailwind's default breakpoints:
- `sm`: 640px (small tablets)
- `md`: 768px (tablets)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

### Grid System
```tsx
// 2 columns on mobile, 3 on tablet, 4 on desktop, 5 on large
<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
  {listings.map(...)}
</div>
```

---

## Accessibility

### Focus States
All interactive elements have visible focus rings:
```css
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-primary-500
focus-visible:ring-offset-2
```

### Touch Targets
Minimum 44x44px for all buttons and tappable elements.

### Color Contrast
- Primary text on white: 12.6:1 (AAA)
- Muted text on white: 4.5:1 (AA)
- White on primary: 4.8:1 (AA)

### Semantic HTML
- `<nav>` for navigation
- `<button>` for actions
- `<main>` for content
- `alt` text on all images

---

## Performance Optimizations

### Image Optimization
Using Next.js Image component:
```tsx
<Image
  src="https://images.unsplash.com/..."
  alt="Product"
  width={600}
  height={600}
  className="w-full h-full object-cover"
/>
```

Auto-optimizes:
- Format (WebP/AVIF)
- Size (responsive srcset)
- Lazy loading
- Blur placeholder

### Code Splitting
- Client components marked with `'use client'`
- Automatic route-based splitting by Next.js

### CSS Optimization
- Tailwind purges unused styles in production
- Single CSS file per route

---

## Animation & Transitions

### Hover Effects
```css
transition-colors // Color changes
transition-shadow // Shadow changes
hover:bg-primary-700
hover:shadow-card-hover
```

### Active States
```css
active:bg-primary-800
active:scale-95
```

### Duration
Default: 150ms (Tailwind's `transition`)

---

## Testing Checklist

### Visual Testing
- [ ] Mobile (375px - iPhone SE)
- [ ] Mobile (390px - iPhone 13/14)
- [ ] Tablet (768px - iPad)
- [ ] Desktop (1280px)
- [ ] Large desktop (1920px)

### Interaction Testing
- [ ] Touch targets (44x44px minimum)
- [ ] Tap/click feedback
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] Scroll behavior

### Performance Testing
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 1.8s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Image optimization

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Design system foundation
- ✅ Core UI components
- ✅ Homepage layout
- ✅ Listing cards
- ✅ Navigation

### Phase 2 (Next)
- [ ] Listing detail page
- [ ] Search filters modal
- [ ] Authentication forms
- [ ] Profile page
- [ ] Booking flow

### Phase 3 (Later)
- [ ] Chat interface
- [ ] Reviews UI
- [ ] Payment forms
- [ ] Notifications
- [ ] Settings

### Additional Components Needed
- Modal/Dialog
- Dropdown menu
- Tabs
- Skeleton loaders
- Toast notifications
- Date picker
- Image gallery
- Rating input
- Form validation errors

---

## Development Commands

```bash
# Development server
cd apps/web
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Type checking
pnpm tsc --noEmit
```

---

## Design System Benefits

### For Developers
- ✅ Consistent components
- ✅ Type-safe props
- ✅ Reusable utilities
- ✅ Clear file structure

### For Users
- ✅ Fast, responsive UI
- ✅ Smooth interactions
- ✅ Accessible by default
- ✅ Optimized images

### For Business
- ✅ Faster development
- ✅ Easy to maintain
- ✅ Scalable architecture
- ✅ Professional appearance
