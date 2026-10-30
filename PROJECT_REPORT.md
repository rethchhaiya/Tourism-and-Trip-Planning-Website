# Tour Trip Frontend — Project Report

**Repository:** `tour-trip-front-sun-2`  
**Report date:** 30 October 2026  
**Branch:** `develop`  
**Stack:** React 19 + Vite 8 + Tailwind CSS 4 (JavaScript/JSX, no TypeScript)

---

## Current implementation update (30 October 2026)

This update supersedes earlier statements in this report about role-only admin
access, the orphaned Tour list, test ignore rules, and local verification.

### Permission and dashboard model

Authorization is now role-and-permission based. `permissions.js` defines the
permission matrix, `roleAdapter.js` derives a user's effective permissions,
and `routeAccess.js` is the central policy used by both `RequirePermission`
and the Sidebar.

| Role | Sidebar and route access |
|---|---|
| Admin | Dashboard Overview, bookings, destinations, guides, tours, customers/users, settings, and all defined permissions |
| Tour Manager | Bookings, destinations, tours, settings, and the actions assigned to its booking/category/location/tour permissions |
| Tour Guide | View bookings, destinations, tours, and settings |
| Customer | View/cancel/store bookings as allowed; view destinations, guides, tours, categories, and settings |

`/dashboard` and `/sidebar` are authenticated dashboard entry routes. An admin
sees `DashboardOverview`; every other role is redirected to `/bookings` so the
dashboard shell remains usable without exposing overview metrics. `/overview`
and the Dashboard item in the sidebar are admin-only.

The existing `TourListPage` is no longer orphaned: it is available at
`/admin/tours` and requires `view_tours`. Its create/edit/delete controls
remain governed by their specific tour permissions.

### Tests and verification

The worktree contains authorization coverage in `permissions.test.js`,
`roleAdapter.test.js`, `RequirePermission.test.jsx`, `Sidebar.test.jsx`,
`AppRoutes.test.jsx`, and `adminButtons.test.jsx`. Test files are not excluded
by the current `.gitignore`, although several are uncommitted worktree files.

`npm run lint` currently completes with zero errors and one existing warning
in `CategoriesPage.jsx` (`set-state-in-effect`). `npm test` and `npm run build`
could not be re-run inside this sandbox because Vite config loading fails with
Windows `spawn EPERM`, and the Tailwind Windows native module cannot be loaded.
Run both commands in the normal local environment before committing.

### Current uncommitted authorization work

- `src/constants/permissions.js` and `src/routes/routeAccess.js`
- `src/components/layout/RequirePermission.jsx` and `DashboardEntry.jsx`
- `src/components/layout/Sidebar.jsx`, permission/sidebar tests, and route tests
- `src/routes/AppRoutes.jsx`, including `/admin/tours`
- Canonical public Header imports in Home and Destinations pages

## 1. Executive Summary

`tour-trip` is a single-page travel booking frontend with two main surfaces:

1. **Public site ("TripGo")** — marketing pages for tours, categories, destinations, experiences, about and contact.
2. **Admin console ("TravelAdmin")** — authenticated management screens for bookings, customers, destinations, guides, users, settings and dashboard metrics.

The app has a working authentication layer (login, registration, OTP verification, forgot/reset password, Google OAuth hand-off) and a shared HTTP client. Real backend integration currently exists for **authentication**, **tour catalog** and **categories**; most admin screens still render **hardcoded mock data** and have non-functional buttons/forms.

Verification at report time:

| Check | Result |
|---|---|
| `npm run build` | Passes (single JS bundle ~558 kB, Vite warns >500 kB) |
| `npm test` | 4 files / 23 tests pass |
| `npm run lint` | 0 errors, 4 warnings (`set-state-in-effect`) |

---

## 2. Technology Stack

| Area | Choice |
|---|---|
| Framework | React 19.2.8, React DOM 19.2.8 |
| Build tool | Vite 8.2.x with `@vitejs/plugin-react` |
| Styling | Tailwind CSS 4.3.3 via `@tailwindcss/vite` (CSS-first, no `tailwind.config.js`) |
| Routing | React Router DOM 7.18.3 (`BrowserRouter`, nested routes) |
| Icons | `lucide-react`, `lucide`, `react-icons`, Font Awesome packages |
| Testing | Vitest 5.0.5 + jsdom + Testing Library |
| Linting | oxlint 1.75 |
| Fonts | Inter (Google Fonts import in `src/index.css`) |

Scripts (`package.json`):

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | oxlint |
| `npm test` | `vitest run` |

---

## 3. Architecture & Folder Structure

```
src/
  main.jsx                 App bootstrap: BrowserRouter + AuthProvider
  App.jsx                  Renders AppRoutes
  routes/AppRoutes.jsx     All route definitions and role guards
  context/                 AuthContext + useAuth hook
  services/                httpClient, authService, catalogService,
                           settingsService, roleAdapter
  utils/                   catalog helpers, currency formatting, devAuth
  hooks/                   useDebouncedValue
  data/                    Mock users
  components/
    Header.jsx, Footer.jsx, DestinationCTA.jsx, TravelInspiration.jsx
    common/                Shared Icons wrapper
    layout/                Sidebar (admin shell), RequireAuth, RequireRole,
                           Forbidden, ScrollToTop
    admin/                 Admin dashboard/customer/tour widgets
    booking/               Booking statistics and recent bookings widgets
    tour/                  Public tour sections, hero gallery, detail content
  pages/
    public/                Public marketing and catalog pages
    auth/                  Login, Register, OTP, Forgot/Reset password
    admin/                 Admin console screens
    customer/              Empty
public/images/             Local destination imagery
```

**Entry flow:** `index.html` → `src/main.jsx` → `AuthProvider` → `App` → `AppRoutes`.

---

## 4. Public Site Features

| Page / Component | Route | Data source | Summary |
|---|---|---|---|
| `HomePage.jsx` | `/`, `/home` | Static | Header, hero carousel, popular destinations, tour packages, promo banner, experience section, why-choose-us, footer |
| `ToursPage.jsx` | `/tours` | Static | Restored tour detail experience: gallery + tour detail content + highlights |
| `ToursCatalogPage.jsx` | `/tours/catalog` | **API** | Tour catalog with search, category filter, published-only filtering, pagination, skeletons, empty/error/retry states |
| `CategoriesPage.jsx` | `/categories` | **API** | Active categories, debounced search, loading/empty/error states |
| `DestinationsPage` (public) | `/destinations` | Static | Composite destination page: detail, top attractions, available tours, practical tips, CTA |
| `DestinationDetailPage.jsx` | `/destinations/mondulkiri` | Static | Hardcoded Mondulkiri detail page |
| `ExperienceDetail.jsx` | `/experience_detail` | Static | Cooking-class image collage; also embedded in Contact |
| `AboutPage.jsx` | `/about` | Static | About hero, travel inspiration, footer |
| `ContactPage.jsx` | `/contact` | Static | Experience section, Authentic Khmer block, contact form (no submit handler) |
| `PracticalSection.jsx` | `/practical_section` | Static | Practical travel tips + image gallery |
| `TopAttractions.jsx` | `/top_attraction` | Static | Three attraction cards |
| `TourPackages.jsx` | `/tourpackages` | Static | Three package cards; embedded on home |
| `AvailableTours.jsx` | `/available_tours` | Static | Four tour cards with `#available-tours` anchor |
| `HeroSection.jsx` | `/herosection` | Static | Image carousel with 5s autoplay and non-functional search |
| `TourLight.jsx` | `/tour-light` | Static | Six tour highlight cards |
| `ToursDetailContent.jsx` | `/detail-content` | Static | Hardcoded Angkor Wat detail with itinerary and reviews |

Shared public components: `Header` (TripGo nav, auth-aware account buttons), `Footer` (quick links, destinations, support, social), `DestinationCTA`, `TravelInspiration`, `ExperienceCard/Section`, `PromoBanner`, `WhyChooseUs`, `PopularDestinations`, `HighLightCompo`, `TourGallery`, `AuthenticKhmer`.

### Routing notes

- `/tours` now renders the restored static `ToursPage`; the API catalog moved to `/tours/catalog`.
- The header "Categories" link is currently commented out although `/categories` remains routed.
- No catch-all/404 route; unmatched URLs render nothing.
- Several section components are exposed as standalone preview routes without Header/Footer.
- Footer links such as `/destinations/siem-reap`, `/privacy` and `/terms` have no routes.

---

## 5. Admin Console Features

All admin routes are wrapped in `RequireAuth` + `RequireRole` (`admin`, `tour_manager`, `tour_guide`) and rendered inside the `Sidebar` shell.

| Screen | Route(s) | Data | Notes |
|---|---|---|---|
| `DashboardOverview` | `/dashboard`, `/sidebar` | Static | Stat cards, revenue chart, booking stats, recent bookings |
| `RevenueOverview` | `/overview` | Static | Revenue chart rendered standalone in the shell |
| `BookingList` | `/bookings`, `/listbooking` | Inline mock | Stats, search, payment/status filters, row menu, static pagination |
| `Customers` | `/customers`, `/customer` | 3 mock customers | Stats, search, status filter, table, static pagination |
| `CreateCustomer` | `/createcustomer` | Static form | Multi-section form, no submit/API |
| `Destinations` (admin list) | `/table_destinations` | 3 inline records | Search/country/status filters, static pagination |
| `Destination` (admin form) | `/table_destinations` (current worktree) | Static form | Add/edit UI, local toggle, empty `handleSave` |
| `GuidesList` | `/guides` | 3 local guides | Local add/remove/search, static filters/pagination |
| `CreateGuide` | Orphaned | Static form | No submit/API |
| `PageListUser` | `/users` | 15 mock users (`src/data/users.js`) | Search/status filters, client-side pagination, computed stats |
| `CreateUsers` | `/create-user` | Local form state | Submit is a no-op; input binding bug on confirm password |
| `TourListPage` | Orphaned | 5 mock tours | Search/filter, `alert`/`confirm` placeholder actions |
| `CreateTour` | Orphaned | Static form | No submit/API |
| `SettingsPage` | `/settings` | Session + **API** | Change-password via `settingsService`; show/hide password; account card |

Admin shared components: customer filters/table/row/pagination/status badge, tour header/filter/table/row/pagination, dashboard stat card and revenue chart, booking statistics and recent bookings, and the `Sidebar` navigation shell.

Empty admin directories: `categories`, `reports`, `reviews`, `schedules`. `pages/customer` is empty.

---

## 6. Authentication & Authorization

### Flows

| Flow | Implementation |
|---|---|
| Login | `LoginPage` → `AuthContext.login` → `authService.login` |
| Register | POST `/auth/register`, then navigate to `/verify-otp` |
| Verify OTP | POST `/auth/verify-otp`; resend via `/auth/resend-otp` with 60s cooldown |
| Forgot password | POST `/auth/forgot-password`; email-not-found treated as success to avoid account enumeration |
| Reset password (OTP) | POST `/auth/reset-password-with-otp` (unauthenticated, `noAuthRedirect`) |
| Reset password (session) | POST `/auth/reset-password` with old password |
| Google OAuth | Browser navigates to `${base}/auth/google/redirect`; callback token absorbed from query string and scrubbed from URL |
| Logout | Clears local session, best-effort POST `/auth/logout` |

### Mock login fallback

When `VITE_API_BASE_URL` is empty, login falls back to a mock after 900 ms:

- Email: `admin@traveladmin.com`
- Password: `admin123`
- Token: `mock-session-token`, role `admin`

Only login has a mock fallback; registration, OTP and password reset require the API.

### Session storage

| Key | Storage | Purpose |
|---|---|---|
| `traveladmin.session` | localStorage | `{ token, user }` |
| `traveladmin.rememberedEmail` | localStorage | "Remember me" email |
| `traveladmin.pendingOtpEmail` | sessionStorage | Email awaiting OTP verification |

### Roles

`src/services/roleAdapter.js` defines:

- `admin`
- `tour_manager`
- `tour_guide`
- `customer`

Aliases (`administrator`, `manager`, `guide`) are normalized. Admin routes allow admin, tour manager and tour guide; customers are blocked with a 403 page. The Sidebar only renders admin navigation for `isAdmin`, so managers/guides can reach routes but see no menu.

Known limitation: role acquisition is a placeholder. `fetchCurrentUser` returns the stored session user; `GET /auth/me` is not implemented. TODO markers remain in `roleAdapter.js`, `AuthContext.jsx`, `AppRoutes.jsx` and `Sidebar.jsx`.

---

## 7. API Integration

### Configuration

- Base URL: `VITE_API_BASE_URL` (trailing slashes stripped).
- `.env.example` documents `http://localhost:8000/api`.
- A local `.env` is present and git-ignored.
- If the base URL is empty, `authService` uses the mock login.

### Endpoints referenced

| Method | Endpoint | Used by |
|---|---|---|
| POST | `/auth/login` | `authService.login` |
| POST | `/auth/register` | `authService.register` |
| POST | `/auth/verify-otp` | `authService.verifyOtp` |
| POST | `/auth/resend-otp` | `authService.resendOtp` |
| POST | `/auth/forgot-password` | `authService.forgotPassword` |
| POST | `/auth/reset-password-with-otp` | `authService.resetPassword` |
| POST | `/auth/reset-password` | `authService.resetPassword`, `settingsService.resetPassword` |
| POST | `/auth/logout` | `authService.logout` |
| GET | `/auth/google/redirect` | Browser navigation |
| GET | `/tours?page&search&category_id` | `catalogService.fetchTours` |
| GET | `/categories` | `catalogService.fetchCategories` |
| GET | `/auth/me` | TODO only, not implemented |

### Shared HTTP client (`src/services/httpClient.js`)

- Adds `Accept: application/json` and JSON content type.
- Adds `Authorization: Bearer <token>` from the stored session.
- Skips JSON content type for `FormData`.
- Unwraps `{ success, message, data }` envelopes.
- Normalizes errors into `ApiError(message, { status, errors })`.
- Handles `204`, invalid JSON, network failures and `success: false`.
- On `401`: clears the session and redirects to `/login` unless `noAuthRedirect` is set.
- No timeout, retry, cancellation or credentials configuration.

`settingsService.js` duplicates the reset-password call with raw `fetch`, bypassing the shared client and its 401 handling.

---

## 8. Data: Real API vs Mock

### Real API

- Tour catalog (`/tours`)
- Categories (`/categories`)
- Authentication and password reset endpoints

### Mock / static

- `src/data/users.js` — 15 admin users.
- `src/components/admin/customers/customersData.js` — 3 customers.
- Inline arrays for bookings, destinations, guides, tours, dashboard metrics, revenue, recent bookings.
- Marketing content: destinations, packages, available tours, attractions, practical tips, experiences, inspiration articles, testimonials, hero images.
- Tour detail content, gallery fallbacks and highlight cards.

### Image sources

- Local: `public/images/*` and `src/assets/images/*`.
- Remote: hardcoded Unsplash, Pinterest and TripAdvisor URLs.

No booking, payment, review, guide, destination or user CRUD is wired to the backend yet.

---

## 9. Testing & Quality

### Test coverage

| Test file | Coverage |
|---|---|
| `src/services/httpClient.test.js` | Auth headers, FormData, 204, JSON parsing, error normalization, 401 redirect, `noAuthRedirect` |
| `src/services/googleAuth.test.jsx` | AuthProvider absorbs Google callback token and scrubs URL |
| `src/pages/auth/googleAuth.test.jsx` | Google button href and visibility |
| `src/pages/public/catalog.test.jsx` | Catalog filtering, debounce, pagination, empty/error/retry; categories filtering/errors |

**Important:** `.gitignore` contains `*.test.*`, so only `httpClient.test.js` is tracked by Git. The other three test files exist locally but would not be committed. Earlier `RouteGuards.test.jsx` and `roleAdapter.test.js` were deleted in commit `d065b7f`.

### Lint

- 0 errors.
- 4 warnings for synchronous `setState` inside effects in `CategoriesPage.jsx` and `ToursCatalogPage.jsx`.

### Build

- Build succeeds.
- Main JS bundle ~558 kB (Vite warns over 500 kB); no code splitting configured.

---

## 10. Current Working Tree (uncommitted)

At report time, `develop` has local changes not yet committed:

| File | Change |
|---|---|
| `src/routes/AppRoutes.jsx` | `/tours` → restored `ToursPage`; catalog moved to `/tours/catalog`; destination import points to `DestinationsPublicPage`; admin destination routes adjusted |
| `src/pages/public/ToursPage.jsx` | Restored tour page (gallery + detail + highlights), now routed at `/tours` |
| `src/pages/public/DestinationsPage.jsx` | Deleted |
| `src/pages/public/DestinationsPublicPage.jsx` | Added (new public destinations page) |
| `src/components/header.jsx` | "Categories" nav item commented out |
| `src/components/layout/sidebar.jsx` | Destination active-path list reduced to `/` and `/table_destinations` |

These are work-in-progress changes and are not part of the last commit (`d065b7f Fixed folder structure`).

---

## 11. Recent Git History

| Commit | Theme |
|---|---|
| `d065b7f` | Fixed folder structure — large rename/refactor, auth pages added, tests removed, `.gitignore` changed |
| `6333220` | feat: require role — role adapter, guards, auth context, HTTP client tests |
| `631a8ed` | More Travel Inspiration — public content |
| `2091ca4` | Update UI public site |
| `1e4b926` | Merge public site |
| `b06948a` | Update sidebar UI |

Earlier history is merge-heavy: sidebar fixes, experience page, destination hero, practical section, food/authentic section and tour highlight section. Many feature branches remain local (`main`, `reset_password`, `fetch_API_Login_Register`, `feature/dashboard-ui`, `user_profile`, `update_public_page`, `fix/sidebar-bug`, hero/section branches).

---

## 12. Known Issues & Limitations

### Routing / UI

- No catch-all/404 route or error boundary.
- Header "Categories" link disabled while the page remains routed.
- `/tours/catalog` is not linked from navigation.
- Only one destination detail slug exists (`/destinations/mondulkiri`); other footer destination links are dead.
- Several pages are section previews without Header/Footer.
- Admin route aliases duplicate screens (`/bookings` + `/listbooking`, `/customers` + `/customer`, `/dashboard` + `/sidebar`).
- Orphaned admin pages: `CreateGuide`, `CreateTour`, `TourListPage`.
- Many controls are inert: contact form, newsletter, header search, add/export/new buttons, row actions, some filters.

### Auth / security

- Session hydration trusts stored user/role; no `GET /auth/me` validation.
- Google callback accepts a token from the query string without server verification.
- Registration sends plaintext passwords under `password_hash` / `password_hash_confirmation` field names.
- Duplicate reset-password implementations (`authService` vs `settingsService`) with different behavior.
- No token expiry handling beyond the 401 redirect; no CSRF/credentials configuration.
- Customer role from Google is blocked from admin routes.

### Code quality

- `CreateUsers`: submit is a no-op, inputs lack `name` attributes, confirm-password is bound to `formData.name`.
- `BookingList`: duplicate mock booking ID `#BKG-8892`.
- Customers pagination claims 1,284 records but shows 3.
- `ToursDetailContent` contains Lorem ipsum and `class` instead of `className` in some SVG elements.
- `PracticalSection` uses an undefined `font-heading` utility.
- `index.html` title still reads "TravelAdmin | Management System".
- Mixed icon libraries and duplicate `lucide` / `lucide-react` dependencies.
- Case-only filename mismatches in Git (`header.jsx` vs `Header.jsx`, `sidebar.jsx` vs `Sidebar.jsx`, etc.) work on Windows but can break Linux/macOS builds.

### Repo hygiene

- `*.test.*` in `.gitignore` silently excludes most tests.
- Role-guard and role-adapter tests were deleted.
- No CI configuration.
- No environment validation at startup.

---

## 13. Recommended Next Steps

1. **Remove `*.test.*` from `.gitignore`** and commit the existing test files.
2. **Finalize the role contract** (`TODO(role-source)` / `TODO(role-matrix)`): implement `GET /auth/me` or include roles in the login response; align Sidebar visibility with route permissions.
3. **Wire admin CRUD to the API** for bookings, customers, destinations, guides, users and tours.
4. **Consolidate services**: make `settingsService` use `httpClient`; remove duplicate reset-password logic.
5. **Fix navigation**: add a 404 route, link `/tours/catalog` in the header, and resolve dead footer links.
6. **Add missing tests** for login/register/OTP/reset forms, role guards and catalog helpers.
7. **Address case-sensitive filenames** in Git to keep builds reproducible across platforms.
8. **Reduce bundle size** with route-level code splitting.
9. **Clean up placeholder content** (Lorem ipsum, inert buttons, mock pagination counts).
10. **Align branding/metadata** (`index.html` title, app name consistency).

---

## 14. Summary

The project has a solid React/Vite foundation, a clean routing structure, a reusable HTTP client, and a working auth/role layer. The public catalog and categories are already API-driven, and the tour page has been restored at `/tours`. The largest remaining gap is the admin console: most screens are UI prototypes backed by static data, so the next major milestone is connecting them to the backend and finalizing the role/permission contract.
