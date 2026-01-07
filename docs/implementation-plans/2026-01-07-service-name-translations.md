# Service Name Translations via i18n

## Goal

Translate service names and descriptions displayed on `/prices` page from database values using i18n JSON files, without modifying the database schema.

## Approach

Extend the existing `serviceNames` pattern in `common.json` (or create a new `serviceItems` section in `services.json`) to include:

1. All individual service names (keyed by a slug/identifier)
2. Category-level names (already partially done)

Then update the `prices/page.tsx` to look up translations by service ID or slug.

---

## Proposed Changes

### 1. Add Service Translation Keys

#### [MODIFY] [services.json](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/i18n/en/services.json)

Add a `ServiceItems` section with all service names keyed by a normalized identifier:

```json
{
  "ServiceItems": {
    "womens-haircut": "Women's Haircut",
    "mens-haircut": "Men's Haircut",
    "kids-haircut-boys": "Kids' Haircut (Boys)",
    "kids-haircut-girls": "Kids' Haircut (Girls)",
    "wash-blow-dry": "Wash & Blow Dry",
    "full-head-colouring-men": "Men's Full Head Colouring",
    "full-head-colouring-women": "Women's Full Head Colouring",
    "root-touch-up": "Root Touch-Up",
    "highlight": "Highlight",
    "premium-highlighting": "Premium Highlighting",
    "bleaching-service": "Bleaching Service",
    "ammonia-free-upgrade": "Ammonia-Free Upgrade",
    "hair-rebonding": "Hair Rebonding",
    "root-rebonding": "Root Rebonding",
    "fringe-rebonding": "Fringe Rebonding",
    "premium-formula-upgrade": "Premium Formula Upgrade",
    "scalp-treatment": "Scalp Treatment",
    "scalp-therapy": "Scalp Therapy",
    "treatment-ampoule-boost": "Treatment Ampoule Boost",
    "essential-hair-treatment": "Essential Hair Treatment",
    "shiseido-treatment": "Shiseido Treatment",
    "mucota-treatment": "Mucota Treatment",
    "k-gloss-keratin": "K-Gloss Keratin Treatment",
    "tiboli-keratin": "Tiboli Keratin Treatment",
    "classic-perm": "Classic Perm",
    "digital-perm": "Digital Perm",
    "iron-root-perm": "Iron Root Perm",
    "fringe-perm": "Fringe Perm",
    "down-perm": "Down Perm"
  }
}
```

#### [MODIFY] [services.json](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/i18n/zh/services.json)

Add corresponding Chinese translations.

---

### 2. Create Helper Function for Service Name Lookup

#### [NEW] [getTranslatedServiceName.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/lib/i18n/getTranslatedServiceName.ts)

A simple function that:

1. Takes a service name (from DB) and converts it to a slug key
2. Looks up the translation, falling back to the original name if not found

---

### 3. Update Pricing Page

#### [MODIFY] [page.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/[locale]/prices/page.tsx)

Use the translation lookup for:

- `service.name` → `t('ServiceItems.slug')` with fallback
- `category.title` → existing `serviceNames` pattern

---

## Key Design Decisions

1. **Key format**: Use slugified service names (e.g., "Women's Haircut" → `womens-haircut`)
2. **Fallback**: If translation key doesn't exist, display original DB value
3. **Descriptions**: Start with names only; descriptions can be added later if needed
4. **Location**: Add to `services.json` since it's service-related content

---

## Verification Plan

### Manual Verification

1. Navigate to http://localhost:3000/en/prices - verify English names display correctly
2. Navigate to http://localhost:3000/zh/prices - verify Chinese translations appear
3. Check that missing translation keys fallback gracefully to English

---

## Note

Service descriptions can be added later using the same pattern if needed, but starting with just names keeps the initial implementation simple.
