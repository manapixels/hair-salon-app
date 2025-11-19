# Signature Trims Design System

**Complete Radix UI + CSS Variables Migration Guide**

---

## 📚 Component Library

All UI components are in `/src/components/ui/` and use Radix CSS variables for consistency.

### Import Pattern

```tsx
import { Button, Card, Modal, Input, Badge } from '@/components/ui';
```

---

## 🎨 Core Components

### Button

**Variants:** `solid` (default), `soft`, `outline`, `ghost`, `danger`
**Sizes:** `sm`, `md` (default), `lg`
**Features:** Built-in loading state, accessibility, Radix variables

```tsx
import { Button } from '@/components/ui';

// Primary action
<Button variant="solid" size="md">
  Book Appointment
</Button>

// Loading state
<Button loading loadingText="Saving...">
  Save Changes
</Button>

// Danger action
<Button variant="danger" onClick={handleDelete}>
  Cancel Appointment
</Button>

// Full width
<Button fullWidth>
  Continue
</Button>
```

### IconButton

Icon-only button with variants and loading states.

```tsx
import { IconButton } from '@/components/ui';
import { Settings, Trash2 } from '@/lib/icons';

<IconButton
  variant="ghost"
  size="md"
  icon={<Settings />}
  aria-label="Open settings"
/>

<IconButton
  variant="danger"
  icon={<Trash2 />}
  aria-label="Delete item"
  onClick={handleDelete}
/>
```

---

### Card

**Variants:** `default`, `interactive` (clickable), `outline`
**Features:** Selected state, disabled state, optional checkmark

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';

// Simple card
<Card>
  <CardTitle>Haircut</CardTitle>
  <CardContent>
    <p>Professional haircut with styling</p>
  </CardContent>
</Card>

// Interactive/selectable card
<Card
  variant="interactive"
  selected={selectedService === 'haircut'}
  showCheckmark
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
  <CardFooter>
    <Button size="sm" variant="soft">Edit</Button>
    <Button size="sm" variant="outline">Cancel</Button>
  </CardFooter>
</Card>
```

---

### Modal (Dialog)

Radix Dialog wrapper with consistent styling.

```tsx
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui';

const [open, setOpen] = useState(false);

<Modal open={open} onOpenChange={setOpen}>
  <ModalContent size="md" showClose>
    <ModalHeader>
      <ModalTitle>Confirm Cancellation</ModalTitle>
      <ModalDescription>Are you sure you want to cancel this appointment?</ModalDescription>
    </ModalHeader>

    <ModalBody>
      <p>This action cannot be undone.</p>
    </ModalBody>

    <ModalFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Keep Appointment
      </Button>
      <Button variant="danger" onClick={handleCancel}>
        Cancel Appointment
      </Button>
    </ModalFooter>
  </ModalContent>
</Modal>;
```

**Sizes:** `sm`, `md` (default), `lg`, `xl`, `full`

---

### Form Fields

**Components:** `Input`, `Textarea`, `Select`
**Features:** Label, error state, helper text, required indicator

```tsx
import { Input, Textarea, Select } from '@/components/ui';

// Text input
<Input
  label="Full Name"
  placeholder="Enter your name"
  error={errors.name}
  helperText="As it appears on your ID"
  required
/>

// Textarea
<Textarea
  label="Special Requests"
  placeholder="Any specific requirements..."
  rows={4}
/>

// Select
<Select
  label="Preferred Stylist"
  options={[
    { value: '', label: 'Any Available' },
    { value: '1', label: 'Sarah Johnson' },
    { value: '2', label: 'Mike Chen' },
  ]}
/>
```

---

### Badge

**Variants:** `default`, `accent`, `success`, `warning`, `danger`, `info`
**Sizes:** `sm`, `md` (default), `lg`
**Features:** Optional dot indicator

```tsx
import { Badge } from '@/components/ui';

// Status badges
<Badge variant="success" dot>Confirmed</Badge>
<Badge variant="warning" dot>Pending</Badge>
<Badge variant="danger" dot>Cancelled</Badge>

// Info badges
<Badge variant="accent">Featured</Badge>
<Badge variant="info" size="sm">New</Badge>
```

---

## 🎨 CSS Variable System

### Color Scales

Radix provides 12-step color scales for each color. Use these instead of arbitrary values.

**Accent (Brand Color - Gold)**

- `var(--accent-1)` to `var(--accent-12)` - Light to dark
- `var(--accent-9)` - Primary accent (buttons, links)
- `var(--accent-3)` - Soft backgrounds
- `var(--accent-contrast)` - Auto text color on accent

**Grayscale**

- `var(--gray-1)` to `var(--gray-12)` - Light to dark
- `var(--gray-12)` - Primary text
- `var(--gray-11)` - Secondary text
- `var(--gray-6)` - Borders
- `var(--gray-3)` - Subtle backgrounds

**Semantic Colors**

- `var(--green-N)` - Success states
- `var(--red-N)` - Errors/danger
- `var(--orange-N)` - Warnings
- `var(--blue-N)` - Info

### Spacing Scale

Use Radix spacing instead of Tailwind numbers:

```tsx
// ❌ OLD: Tailwind spacing
<div className="p-4 gap-6 mb-8">

// ✅ NEW: Radix spacing
<div className="p-[var(--space-4)] gap-[var(--space-6)] mb-[var(--space-8)]">
```

**Scale:** `var(--space-1)` through `var(--space-12)`

- `--space-1` = 4px
- `--space-2` = 8px
- `--space-3` = 12px
- `--space-4` = 16px
- `--space-5` = 20px
- `--space-6` = 24px
- `--space-8` = 32px
- `--space-10` = 40px
- `--space-12` = 48px

### Border Radius

```tsx
// ❌ OLD
<div className="rounded-lg">

// ✅ NEW
<div className="rounded-[var(--radius-3)]">
```

**Scale:** `var(--radius-1)` through `var(--radius-6)`

### Font Sizes

```tsx
// ❌ OLD
<p className="text-sm">

// ✅ NEW
<p className="text-[length:var(--font-size-2)]">
```

**Scale:** `var(--font-size-1)` through `var(--font-size-9)`

---

## 🎯 Migration Helpers

We've added utility classes to `/src/app/globals.css` for easier migration:

### Background Colors

```tsx
.bg-accent           // var(--accent-9) with white text
.bg-accent-soft      // var(--accent-3) - subtle background
.bg-surface          // var(--color-surface) - card backgrounds
.bg-panel            // var(--color-panel) - panel backgrounds

.bg-success          // Green background
.bg-success-soft     // Soft green background
.bg-warning          // Orange background
.bg-danger           // Red background
.bg-info             // Blue background
```

### Text Colors

```tsx
.text-accent         // var(--accent-11)
.text-success        // var(--green-11)
.text-warning        // var(--orange-11)
.text-danger         // var(--red-11)
.text-info           // var(--blue-11)
```

### Borders

```tsx
.border-accent       // var(--accent-8)
.border-success      // var(--green-6)
.border-danger       // var(--red-6)
```

---

## 🔀 Icon System Migration

### New Icon Library: Lucide React + Radix Icons

```tsx
// ❌ OLD: FontAwesome
import { faCalendar, faUser, faWhatsapp } from '@fortawesome/free-solid-svg-icons';
<FontAwesomeIcon icon={faCalendar} />

// ✅ NEW: Lucide + Custom Icons
import { Calendar, User, WhatsAppIcon } from '@/lib/icons';
<Calendar className="w-5 h-5" />
<User className="w-5 h-5 text-[var(--gray-11)]" />
<WhatsAppIcon className="w-5 h-5 text-[#25D366]" />
```

### Available Icons

**Common UI Icons:**

- `Calendar`, `Clock`, `User`, `Users`, `Bell`
- `Check`, `X`, `Plus`, `Minus`, `Edit`, `Delete`, `Save`
- `Search`, `Filter`, `Settings`, `Menu`
- `ChevronDown`, `ChevronLeft`, `ChevronRight`, `ChevronUp`
- `AlertCircle`, `CheckCircle`, `XCircle`, `Info`, `AlertTriangle`

**Business Icons:**

- `Scissors`, `Sparkles`, `Star`, `DollarSign`

**Communication:**

- `Mail`, `Phone`, `MessageCircle`
- `WhatsAppIcon` (custom), `TelegramIcon` (custom)

**See `/src/lib/icons.tsx` for full list and migration map**

---

## 📋 Migration Checklist

### For Each Component:

- [ ] Replace `<button>` with `<Button>` from `@/components/ui`
- [ ] Replace card divs with `<Card>` components
- [ ] Replace dialogs with `<Modal>` components
- [ ] Replace form inputs with `<Input>`, `<Textarea>`, `<Select>`
- [ ] Replace status indicators with `<Badge>`
- [ ] Replace FontAwesome icons with Lucide icons
- [ ] Update colors: `bg-gray-50` → `bg-[var(--gray-2)]`
- [ ] Update spacing: `p-4` → `p-[var(--space-4)]`
- [ ] Update text: `text-sm` → `text-[length:var(--font-size-2)]`
- [ ] Update borders: `rounded-lg` → `rounded-[var(--radius-3)]`

---

## 🎬 Animation with Framer Motion

Framer Motion is already installed. Use it for page transitions and micro-interactions:

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

**Respect reduced motion:**

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
>
```

---

## ♿ Accessibility Requirements

All components must include:

1. **ARIA Labels** on icon-only buttons
2. **Focus States** - `focus-visible:ring-2 focus-visible:ring-[var(--accent-8)]`
3. **Keyboard Navigation** - Tab, Enter, Escape support
4. **Screen Reader Announcements** - `aria-live`, `role="status"`
5. **Color Contrast** - Min 4.5:1 for text
6. **Loading States** - `aria-busy` during async operations

---

## 🚀 Quick Start Examples

### Booking Card (Service Selection)

```tsx
import { Card, CardTitle, CardContent, Badge } from '@/components/ui';
import { Scissors } from '@/lib/icons';

<Card variant="interactive" selected={selected} showCheckmark onClick={handleSelect}>
  <div className="flex items-start gap-[var(--space-3)]">
    <div className="p-[var(--space-2)] bg-[var(--accent-3)] rounded-[var(--radius-2)]">
      <Scissors className="w-5 h-5 text-[var(--accent-11)]" />
    </div>
    <div className="flex-1">
      <CardTitle>Haircut & Style</CardTitle>
      <CardContent>
        <p className="text-[length:var(--font-size-2)] text-[var(--gray-11)]">
          Professional cut with styling
        </p>
        <div className="flex items-center gap-[var(--space-2)] mt-[var(--space-2)]">
          <Badge size="sm" variant="accent">
            45 min
          </Badge>
          <span className="text-[length:var(--font-size-3)] font-semibold">$45</span>
        </div>
      </CardContent>
    </div>
  </div>
</Card>;
```

### Appointment Status Badge

```tsx
import { Badge } from '@/components/ui';

const statusMap = {
  CONFIRMED: (
    <Badge variant="success" dot>
      Confirmed
    </Badge>
  ),
  PENDING: (
    <Badge variant="warning" dot>
      Pending
    </Badge>
  ),
  CANCELLED: (
    <Badge variant="danger" dot>
      Cancelled
    </Badge>
  ),
  COMPLETED: <Badge variant="info">Completed</Badge>,
};

{
  statusMap[appointment.status];
}
```

### Form with Validation

```tsx
import { Input, Button } from '@/components/ui';
import { useState } from 'react';

const [form, setForm] = useState({ name: '', email: '' });
const [errors, setErrors] = useState({});
const [loading, setLoading] = useState(false);

<form onSubmit={handleSubmit}>
  <Input
    label="Full Name"
    value={form.name}
    onChange={e => setForm({ ...form, name: e.target.value })}
    error={errors.name}
    required
  />

  <Input
    type="email"
    label="Email Address"
    value={form.email}
    onChange={e => setForm({ ...form, email: e.target.value })}
    error={errors.email}
    helperText="We'll send confirmation to this email"
    required
  />

  <Button type="submit" fullWidth loading={loading}>
    Create Account
  </Button>
</form>;
```

---

## 📖 Further Reading

- [Radix Themes Documentation](https://radix-ui.com/themes/docs)
- [Lucide Icons](https://lucide.dev/icons/)
- [Framer Motion](https://www.framer.com/motion/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated:** 2025-11-15
**Version:** 1.0.0
**Migration Status:** Foundation Complete - Component Migration In Progress
