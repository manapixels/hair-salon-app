# Add Admin Customer List Page

## User Review Required

> [!IMPORTANT]
> This plan involves installing a new dependency: `@tanstack/react-table` for `shadcn/ui` data table functionality.

## Proposed Changes

### Backend

#### [NEW] [route.ts](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/api/admin/customers/route.ts)

- Create a new API route to fetch customer data.
- Fetch users with `role = 'CUSTOMER'`.
- Join/aggregate with `appointments` to calculate:
  - `totalVisits`: Count of completed appointments.
  - `lastVisit`: Date of most recent completed appointment.
  - `nextAppointment`: Date of next upcoming appointment.
  - `mostChosenStylist`: Stylist ID/Name with most appointments.

### Frontend - Components

#### [NEW] [CustomerCard.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/admin/customers/CustomerCard.tsx)

- Create a card component to display customer details on mobile.
- Shows: Name, Email/Phone, Next Appt, Last Visit, Visit Count, Stylist preference.

#### [NEW] [data-table.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/ui/data-table.tsx)

- Create a reusable `DataTable` component using `@tanstack/react-table` and `shadcn/ui` table components.
- Support sorting and pagination.

#### [NEW] [columns.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/admin/customers/columns.tsx)

- Define columns for the customer table (Name, Contact, Stats, Actions).

#### [NEW] [CustomersTable.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/admin/customers/CustomersTable.tsx)

- Wrapper component that renders `DataTable` with customer data.

### Frontend - Pages

#### [NEW] [page.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/app/[locale]/admin/customers/page.tsx)

- Create the main page for Admin Customers.
- Fetch data from `/api/admin/customers`.
- Render `CustomersTable` (hidden on mobile) and list of `CustomerCard` (hidden on desktop).
- Add search and refresh functionality.

### Navigation

#### [MODIFY] [AdminNavigation.tsx](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/components/admin/AdminNavigation.tsx)

- Add "Customers" link to the navigation menu (new section or under Bookings).

### Localization

#### [MODIFY] [en.json](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/i18n/en.json)

- Add translation keys for `Admin.Customers`.

#### [MODIFY] [zh.json](file:///c:/Users/zheny/Downloads/Dev/hair-salon-app/src/i18n/zh.json)

- Add translation keys for `Admin.Customers`.

## Verification Plan

### Automated Tests

- None planned for this UI feature.

### Manual Verification

1.  **Install Dependencies**: Run `npm install @tanstack/react-table`.
2.  **Navigation**: Log in as Admin -> Verify "Customers" link appears in sidebar.
3.  **Desktop View**: Click "Customers" -> Verify table displays customers with correct stats (Visits, Last Visit, etc.).
4.  **Mobile View**: Resize window -> Verify table disappears and `CustomerCards` appear.
5.  **Search**: Type a customer name in search bar -> Verify list filters.
6.  **Data Check**: Compare displayed data with DB (or known appointment history) to ensure "Next Appointment" and "Favorite Stylist" logic is correct.
