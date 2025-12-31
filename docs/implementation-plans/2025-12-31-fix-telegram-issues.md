# Fix Telegram Login and Webhook Issues

Two issues identified from user report and logs:

1. **New users with large Telegram IDs can't use `/start`** - The `telegramId` column is `integer` (32-bit, max 2,147,483,647), but Telegram IDs like `7425885126` exceed this.

2. **Telegram login doesn't open Telegram app on iPhone** - iOS Universal Links (t.me) can be inconsistent. The native `tg://` scheme is more reliable.

---

## Proposed Changes

### Database Schema

#### [MODIFY] schema.ts

Change `telegramId` from `integer` to `bigint`:

```diff
-    telegramId: integer('telegramId').unique(),
+    telegramId: bigint('telegramId', { mode: 'number' }).unique(),
```

> Using `mode: 'number'` since JavaScript `Number` can safely represent integers up to 2^53, which covers Telegram's ID range.

---

### iOS Deep Link Fix

#### [MODIFY] TelegramLoginWidget.tsx

Add iOS detection and use `tg://` scheme as primary with `t.me` fallback:

```typescript
// Detect iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

if (isIOS) {
  // iOS: try native scheme first for reliable app opening
  const tgNativeLink = `tg://resolve?domain=${botUsername}&start=${startParam}`;
  window.location.href = tgNativeLink;

  // Fallback to t.me if app not installed (after short delay)
  setTimeout(() => {
    window.open(`https://t.me/${botUsername}?start=${startParam}`, '_blank');
  }, 2000);
} else {
  // Non-iOS: use Universal Link
  window.open(`https://t.me/${botUsername}?start=${startParam}`, '_blank');
}
```

---

## Verification

1. Run type check after schema change
2. Manual test on iPhone to verify Telegram app opens
