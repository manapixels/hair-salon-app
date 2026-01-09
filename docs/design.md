# Design System

shadcn/ui + Tailwind CSS. Components in `/src/components/ui/`.

---

## Import Pattern

```tsx
import { Button, Card, Dialog, Input, Badge } from '@/components/ui';
```

---

## Core Components

**Button**: Variants `default`, `secondary`, `outline`, `ghost`, `destructive`. Sizes `sm`, `default`, `lg`.

**Card**: `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`

**Dialog**: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`

**Form**: `Input`, `Textarea`, `Select`, `Label`

**Badge**: Variants `default`, `secondary`, `destructive`, `outline`

---

## Colors

CSS variables in `globals.css`:

- `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--destructive`, `--border`

Custom: `base.primary` (#7A6400 Gold), `base.light` (#F5F1E8)

---

## Icons

Lucide React: `import { Calendar, User, Settings } from 'lucide-react'`

Common: `Calendar`, `Clock`, `User`, `Check`, `X`, `Plus`, `Edit`, `Trash2`, `Loader2`, `ChevronDown`

---

## Animation

Framer Motion for transitions:

```tsx
<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
```

---

## Patterns

**Selected card**:

```tsx
className={cn("cursor-pointer", selected && "ring-2 ring-primary")}
```

**Status badges**:

```tsx
<Badge className="bg-green-500">Confirmed</Badge>
<Badge variant="destructive">Cancelled</Badge>
```

**Loading button**:

```tsx
<Button disabled={loading}>
  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  Save
</Button>
```

---

## Accessibility

- ARIA labels on icon-only buttons
- `focus-visible:ring-2`
- Keyboard navigation (Tab, Enter, Escape)
- Color contrast min 4.5:1
