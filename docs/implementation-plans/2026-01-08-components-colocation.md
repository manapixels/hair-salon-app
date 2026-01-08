# Co-located `_components` Architecture Plan

## Naming Convention

| Pattern             | Rule                                | Example                                   |
| ------------------- | ----------------------------------- | ----------------------------------------- |
| ❌ `*Page.tsx`      | Remove - `_components` aren't pages | `SpecialClosuresPage` → `SpecialClosures` |
| ❌ `*Client.tsx`    | Remove - folder implies client      | `AppointmentsClient` → `AppointmentsList` |
| ✅ `*Settings.tsx`  | Keep - describes purpose            | `DepositSettings`                         |
| ✅ `*Dashboard.tsx` | Keep - describes UI type            | `AdminDashboard`                          |
| ✅ `*Manager.tsx`   | Keep - CRUD management              | `StylistManagement`                       |

---

## Migration Table

### Admin Core

| From                                                | To                                          | New Name                     |
| --------------------------------------------------- | ------------------------------------------- | ---------------------------- |
| `components/admin/AdminDashboardHome.tsx`           | `app/.../admin/_components/`                | `AdminDashboard.tsx`         |
| `app/.../admin/appointments/AppointmentsClient.tsx` | `app/.../admin/appointments/_components/`   | `AppointmentsList.tsx`       |
| `components/team/StylistManagement.tsx`             | `app/.../admin/stylists/_components/`       | `StylistManagement.tsx` ✓    |
| `app/.../admin/customers/CustomersClient.tsx`       | `app/.../admin/customers/_components/`      | `CustomersList.tsx`          |
| `components/admin/ChatDashboard.tsx`                | `app/.../admin/chat/_components/`           | `ChatDashboard.tsx` ✓        |
| `components/admin/KnowledgeBaseManager.tsx`         | `app/.../admin/knowledge-base/_components/` | `KnowledgeBaseManager.tsx` ✓ |

### Admin Availability

| From                          | To                                   | New Name                   |
| ----------------------------- | ------------------------------------ | -------------------------- |
| `StylistAvailabilityPage.tsx` | `availability/stylists/_components/` | `StylistAvailability.tsx`  |
| `StylistAvailability.tsx`     | Same folder                          | `AvailabilityCalendar.tsx` |
| `BusinessHoursPage.tsx`       | `availability/hours/_components/`    | `BusinessHours.tsx`        |
| `ScheduleSettings.tsx`        | Same folder                          | `WeeklySchedule.tsx`       |
| `SpecialClosuresPage.tsx`     | `availability/closures/_components/` | `SpecialClosures.tsx`      |
| `ClosuresSettings.tsx`        | Same folder                          | `ClosuresManager.tsx`      |

### Admin Settings

| From                       | To                               | New Name                |
| -------------------------- | -------------------------------- | ----------------------- |
| `BusinessSettingsPage.tsx` | `settings/business/_components/` | `BusinessInfo.tsx`      |
| `BusinessSettings.tsx`     | Same folder                      | `BusinessForm.tsx`      |
| `ServicesSettings.tsx`     | `settings/services/_components/` | `ServicesManager.tsx`   |
| `DepositSettings.tsx`      | `settings/deposits/_components/` | `DepositSettings.tsx` ✓ |
| `SocialLinksSettings.tsx`  | `settings/social/_components/`   | `SocialLinks.tsx`       |

### User Routes

| From                                     | To                              | New Name                  |
| ---------------------------------------- | ------------------------------- | ------------------------- |
| `components/views/CustomerDashboard.tsx` | `app/.../customer/_components/` | `CustomerDashboard.tsx` ✓ |

---

## Delete After Migration

| File                      | Reason                           |
| ------------------------- | -------------------------------- |
| `StylistsClient.tsx`      | Merged into StylistManagement    |
| `ChatClient.tsx`          | Redundant wrapper                |
| `KnowledgeBaseClient.tsx` | Redundant wrapper                |
| `MyProfileClient.tsx`     | Import StylistDashboard directly |

---

## Keep in /components (Shared)

- `views/StylistDashboard.tsx` - used by 2 routes
- `admin/AdminLayout.tsx`, `AdminSidebar.tsx`
- `admin/appointments/CalendarGridView.tsx`
- `team/TeamCard.tsx`

---

## Summary

- **~20 files** moved to `_components` folders
- **4 files** deleted (redundant wrappers)
- **13 new** `_components` folders created
- Consistent naming: descriptive purpose, no Page/Client suffixes
