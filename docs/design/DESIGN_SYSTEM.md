# Signature Trims Design System

**shadcn/ui + Tailwind CSS Design System**

---

## 📚 Component Library

All UI components are in `/src/components/ui/` and use shadcn/ui with Tailwind CSS for styling.

### Import Pattern

```tsx
import { Button, Card, Dialog, Input, Badge } from '@/components/ui';
```

---

## 🎨 Core Components

### Button

**Variants:** `default`, `secondary`, `outline`, `ghost`, `destructive`
**Sizes:** `sm`, `default`, `lg`
**Features:** Built-in loading state, accessibility, full Tailwind styling

```tsx
import { Button } from '@/components/ui/button';

// Primary action
<Button variant="default" size="default">
  Book Appointment
</Button>

// Loading state (manual implementation)
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Save Changes
</Button>

// Destructive action
<Button variant="destructive" onClick={handleDelete}>
  Cancel Appointment
</Button>

// Full width
<Button className="w-full">
  Continue
</Button>
```

---

### Card

shadcn/ui Card component with Tailwind styling.

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';

// Simple card
<Card>
  <CardHeader>
    <CardTitle>Haircut</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Professional haircut with styling</p>
  </CardContent>
</Card>

// Interactive/selectable card (custom styling)
<Card
  className={cn(
    "cursor-pointer transition-all hover:shadow-md",
    selected && "ring-2 ring-accent border-accent"
  )}
  onClick={() => setSelectedService('haircut')}
>
  <CardHeader>
    <CardTitle>Haircut</CardTitle>
    <Badge>$45</Badge>
  </CardHeader>
  <CardContent>
    <p>Duration: 45 minutes</p>
  </CardContent>
</Card>

// With footer actions
<Card>
  <CardHeader>
    <CardTitle>Appointment #1234</CardTitle>
  </CardHeader>
  <CardContent>
    <p>18 Oct 2025 at 2pm</p>
  </CardContent>
  <CardFooter className="gap-2">
    <Button size="sm" variant="secondary">Edit</Button>
    <Button size="sm" variant="outline">Cancel</Button>
  </CardFooter>
</Card>
```

---

### Dialog (Modal)

shadcn/ui Dialog component with consistent styling.

```tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Cancellation</DialogTitle>
      <DialogDescription>Are you sure you want to cancel this appointment?</DialogDescription>
    </DialogHeader>

    <div className="py-4">
      <p>This action cannot be undone.</p>
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Keep Appointment
      </Button>
      <Button variant="destructive" onClick={handleCancel}>
        Cancel Appointment
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

---

### Form Fields

**Components:** `Input`, `Textarea`, `Select` (shadcn/ui)
**Features:** Built-in styling, error states, accessibility

```tsx
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// Text input
<div className="space-y-2">
  <Label htmlFor="name">Full Name</Label>
  <Input
    id="name"
    placeholder="Enter your name"
    className={errors.name && "border-destructive"}
  />
  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
</div>

// Textarea
<div className="space-y-2">
  <Label htmlFor="requests">Special Requests</Label>
  <Textarea
    id="requests"
    placeholder="Any specific requirements..."
    rows={4}
  />
</div>

// Select
<div className="space-y-2">
  <Label>Preferred Stylist</Label>
  <Select value={stylist} onValueChange={setStylist}>
    <SelectTrigger>
      <SelectValue placeholder="Any Available" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="any">Any Available</SelectItem>
      <SelectItem value="1">Sarah Johnson</SelectItem>
      <SelectItem value="2">Mike Chen</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

### Badge

**Variants:** `default`, `secondary`, `destructive`, `outline`
**Custom variants:** `success`, `warning`, `info` (via className)

```tsx
import { Badge } from '@/components/ui/badge';

// Status badges (custom styling)
<Badge className="bg-green-500 hover:bg-green-600">Confirmed</Badge>
<Badge className="bg-orange-500 hover:bg-orange-600">Pending</Badge>
<Badge variant="destructive">Cancelled</Badge>

// Info badges
<Badge>Featured</Badge>
<Badge variant="outline">New</Badge>
```

---

## 🎨 Color System

### shadcn/ui CSS Variables

The app uses HSL-based CSS variables defined in `globals.css`:

**Core Colors:**

- `--background` - Page background
- `--foreground` - Primary text
- `--card` - Card backgrounds
- `--card-foreground` - Text on cards
- `--popover` - Popover backgrounds
- `--primary` - Primary brand color
- `--secondary` - Secondary UI elements
- `--muted` - Muted backgrounds
- `--muted-foreground` - Secondary text
- `--accent` - Accent/highlight color
- `--accent-foreground` - Text on accent
- `--destructive` - Error/danger color
- `--border` - Border color
- `--input` - Input border color
- `--ring` - Focus ring color

**Custom Colors:**

- `base.primary` - #7A6400 (Gold)
- `base.light` - #F5F1E8 (Light gold)

### Using Colors

```tsx
// Background colors
<div className="bg-background">Page background</div>
<div className="bg-card">Card background</div>
<div className="bg-muted">Muted background</div>
<div className="bg-accent">Accent background</div>
<div className="bg-destructive">Error background</div>

// Text colors
<p className="text-foreground">Primary text</p>
<p className="text-muted-foreground">Secondary text</p>
<p className="text-accent-foreground">Accent text</p>
<p className="text-destructive">Error text</p>

// Borders
<div className="border border-border">Default border</div>
<div className="border border-accent">Accent border</div>

// Opacity modifiers
<div className="bg-accent/10">10% opacity accent</div>
<div className="bg-accent/20">20% opacity accent</div>
```

---

## 📏 Spacing & Sizing

Use Tailwind's spacing scale:

```tsx
// Padding
<div className="p-4">Padding 1rem (16px)</div>
<div className="px-6 py-3">Padding x: 1.5rem, y: 0.75rem</div>

// Margin
<div className="mt-8 mb-4">Margin top 2rem, bottom 1rem</div>

// Gap
<div className="flex gap-2">Gap 0.5rem</div>
<div className="grid gap-4">Gap 1rem</div>

// Space between
<div className="flex flex-col space-y-4">Vertical spacing</div>
<div className="flex space-x-3">Horizontal spacing</div>
```

**Common spacing values:**

- `0.5` = 0.125rem (2px)
- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `3` = 0.75rem (12px)
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)

---

## 🔤 Typography

Use Tailwind text utilities:

```tsx
// Font sizes
<p className="text-xs">Extra small (0.75rem)</p>
<p className="text-sm">Small (0.875rem)</p>
<p className="text-base">Base (1rem)</p>
<p className="text-lg">Large (1.125rem)</p>
<p className="text-xl">Extra large (1.25rem)</p>
<p className="text-2xl">2XL (1.5rem)</p>

// Font weights
<p className="font-normal">Normal (400)</p>
<p className="font-medium">Medium (500)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-bold">Bold (700)</p>

// Line height
<p className="leading-tight">Tight line height</p>
<p className="leading-normal">Normal line height</p>
<p className="leading-relaxed">Relaxed line height</p>
```

---

## 🎯 Border Radius

Use Tailwind border radius utilities:

```tsx
<div className="rounded-sm">Small radius (0.125rem)</div>
<div className="rounded-md">Medium radius (0.375rem)</div>
<div className="rounded-lg">Large radius (0.5rem)</div>
<div className="rounded-xl">Extra large radius (0.75rem)</div>
<div className="rounded-full">Full radius (9999px)</div>
```

---

## 🔀 Icon System

### Lucide React Icons

```tsx
// ✅ Current: Lucide React
import { Calendar, User, Settings, Check, X, Plus } from 'lucide-react';

<Calendar className="w-5 h-5" />
<User className="w-5 h-5 text-muted-foreground" />
<Settings className="w-4 h-4" />
```

### Available Icons

**Common UI Icons:**

- `Calendar`, `Clock`, `User`, `Users`, `Bell`
- `Check`, `X`, `Plus`, `Minus`, `Edit`, `Trash2`, `Save`
- `Search`, `Filter`, `Settings`, `Menu`
- `ChevronDown`, `ChevronLeft`, `ChevronRight`, `ChevronUp`
- `AlertCircle`, `CheckCircle`, `XCircle`, `Info`, `AlertTriangle`

**Business Icons:**

- `Scissors`, `Sparkles`, `Star`, `DollarSign`

**Communication:**

- `Mail`, `Phone`, `MessageCircle`
- `Loader2` (for loading states)

**See [Lucide Icons](https://lucide.dev/icons/) for full list**

---

## 🎬 Animation with Framer Motion

Framer Motion is installed for page transitions and micro-interactions:

```tsx
import { motion } from 'framer-motion';

// Staggered card reveal
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, delay: index * 0.1 }}
>
  <Card>{...}</Card>
</motion.div>

// Button press effect
<motion.div whileTap={{ scale: 0.98 }}>
  <Button>Click Me</Button>
</motion.div>

// Smooth layout changes
<motion.div layout>
  {items.map(item => <Card key={item.id} {...item} />)}
</motion.div>
```

---

## ♿ Accessibility Requirements

All components must include:

1. **ARIA Labels** on icon-only buttons
2. **Focus States** - `focus-visible:ring-2 focus-visible:ring-accent`
3. **Keyboard Navigation** - Tab, Enter, Escape support
4. **Screen Reader Announcements** - `aria-live`, `role="status"`
5. **Color Contrast** - Min 4.5:1 for text
6. **Loading States** - `aria-busy` during async operations

---

## 🚀 Quick Start Examples

### Booking Card (Service Selection)

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

<Card
  className={cn(
    'cursor-pointer transition-all hover:shadow-md',
    selected && 'ring-2 ring-accent border-accent',
  )}
  onClick={handleSelect}
>
  <div className="flex items-start gap-3">
    <div className="p-2 bg-accent/10 rounded-md">
      <Scissors className="w-5 h-5 text-accent-foreground" />
    </div>
    <div className="flex-1">
      <CardTitle>Haircut & Style</CardTitle>
      <CardContent className="p-0 mt-2">
        <p className="text-sm text-muted-foreground">Professional cut with styling</p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-xs">
            45 min
          </Badge>
          <span className="text-base font-semibold">$45</span>
        </div>
      </CardContent>
    </div>
  </div>
</Card>;
```

### Appointment Status Badge

```tsx
import { Badge } from '@/components/ui/badge';

const statusMap = {
  CONFIRMED: <Badge className="bg-green-500 hover:bg-green-600">Confirmed</Badge>,
  PENDING: <Badge className="bg-orange-500 hover:bg-orange-600">Pending</Badge>,
  CANCELLED: <Badge variant="destructive">Cancelled</Badge>,
  COMPLETED: <Badge variant="outline">Completed</Badge>,
};

{
  statusMap[appointment.status];
}
```

### Form with Validation

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const [form, setForm] = useState({ name: '', email: '' });
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);

<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="name">Full Name</Label>
    <Input
      id="name"
      value={form.name}
      onChange={e => setForm({ ...form, name: e.target.value })}
      className={errors.name && 'border-destructive'}
      required
    />
    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
  </div>

  <div className="space-y-2">
    <Label htmlFor="email">Email Address</Label>
    <Input
      id="email"
      type="email"
      value={form.email}
      onChange={e => setForm({ ...form, email: e.target.value })}
      className={errors.email && 'border-destructive'}
      required
    />
    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
    <p className="text-xs text-muted-foreground">We'll send confirmation to this email</p>
  </div>

  <Button type="submit" className="w-full" disabled={loading}>
    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
    Create Account
  </Button>
</form>;
```

---

## 🌓 Theme Management

The app uses `next-themes` for dark mode support:

```tsx
import { useTheme } from 'next-themes';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button variant="outline" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </Button>
  );
}
```

---

## 📖 Further Reading

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/icons/)
- [Framer Motion](https://www.framer.com/motion/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 🔄 Migration History

**Previous:** Radix UI Themes
**Current:** shadcn/ui + Tailwind CSS
**Migration Date:** December 2025
**Status:** ✅ Complete

### Key Changes:

- ✅ Replaced all Radix UI Themes components with shadcn/ui
- ✅ Migrated from Radix CSS variables to Tailwind utilities
- ✅ Implemented `next-themes` for theme management
- ✅ Standardized on Tailwind spacing/sizing/colors
- ✅ Maintained Lucide React icons
- ✅ Preserved accessibility features

---

**Last Updated:** 2025-12-03
**Version:** 2.0.0
**Migration Status:** ✅ Complete - shadcn/ui + Tailwind CSS
