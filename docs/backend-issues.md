# Backend issues and requests (ETEC Tour API)

Last updated: 2026-11-03. Found through live API checks and the API document.
Status values: Open, Reported, Resolved. Never put tokens, passwords, or credentials in this file.

## Open issues

| # | Priority | Where | Problem | How to check | Frontend workaround | Status |
|---|---|---|---|---|---|---|
| 1 | High | POST /bookings | Returns 500: "ABA PayWay credentials missing in configuration" (ABAPaywayService.php, line 25). No booking can be completed. | Submit a booking as a customer | None. The payment page is built and tested against mocked data only. | Open |
| 2 | High | POST /bookings | A failed request may leave a pending booking with seats reserved. Please confirm failed bookings are rolled back. | Call GET /bookings after a 500 | The booking form warns the user that a booking may already exist. | Open |
| 3 | High | GET /tours/{id} | Draft tours are returned to guests without a token (IDs 3, 4 and 5 were drafts). Guests can find drafts by trying IDs. Should return 404 unless the caller is staff. | Call /tours/3 with no token | The public page shows "Tour not found" when the status is not published (client-side only). | Open |
| 4 | High | Server configuration | Debug mode looks enabled: error responses expose a model class name and a server file path. | Request a missing tour; make the booking call fail | The UI never shows raw backend messages. | Open |
| 5 | High | API document | The admin token is in plain text in the document, and tokens never expire until logout. Revoke it (call logout with that token), issue a new one, and keep tokens out of documents and chat. | Read the document | None. | Open |
| 6 | Medium | GET /tours | List items have no category_id or category object, so a category filter and category labels are impossible. | Read any item in the list | The category filter is hidden behind a constant flag. | Open |
| 7 | Medium | GET /tours | ?search is ignored (all tours are returned). ?category_id is unconfirmed. | /tours?search=Kyoto still returns every tour | Search runs client-side on the loaded page. | Open |
| 8 | Medium | Server | The API is HTTP only. Browsers block HTTP calls from a frontend hosted on HTTPS (mixed content). | Deploy the frontend on an HTTPS host | Works on localhost only; demo locally until HTTPS exists. | Open |
| 9 | Medium | /auth/reset-password-with-otp | The endpoint exists but is not in the API document. Its request and error fields are not documented. | Compare the document and the backend | Existing usage left unchanged. | Open |
| 10 | Low | Document | forgot-password and resend-otp list an Authorization header as required, but they are used by logged-out users. | Read the document | Called without a token. | Open |
| 11 | Low | Document versus live API | Name mismatches: reference key payment_method (document) vs payment_methods (live); tour create/update fields duration_days and duration_nights vs duration_day and duration_night in responses; participant_sex values are capitalised (Male) while the document says lowercase; user field verified_at vs email_verified_at in the document; GET /tours/{id} is documented as admin-only but is public. | Compare responses with the document | Mapper functions read the live names. Verify field names before building the admin tour form. | Open |
| 12 | Low | Response shapes | Inconsistent shapes: the tour list has no success field and uses meta and links; the booking list nests items in data.data; public tour images have no id; seed image URLs use example.com. | Compare list responses | Mappers and an image fallback. | Open |
| 13 | High | GET /tour-images, /storage | Every uploaded image 404s. The API returns `full_image_url` = `https://etec-tour.ranavattra.com/storage/TourImages/<file>.jpg`, but all uploaded files return 404. `/storage/TourImages/` returns 403, so the public symlink exists; the files are not in it. The seed stock URLs (magnific, istockphoto, ftcdn) return 200, so only uploads are affected. Uploads are recorded in the DB but not written to the public disk (default local disk, or a disk/path mismatch). | Upload an image, then request its `full_image_url` | None. `ImagePreview` tries every candidate and then shows a placeholder; it cannot render a 404. | Open |

## Missing endpoints (not in the document, so not built)

- Schedules: no list or management endpoints. Schedules only appear inside GET /tours/{id} as tourSchedule, which is undocumented.
- Destinations: no list or CRUD endpoints (needed for the destination dropdown in the admin tour form).
- Customers, users, and dashboard statistics.
- Admin creating another admin account.
- tourItinerary is returned by GET /tours/{id} but is not documented.

## Questions waiting for answers

- Do access tokens expire, and is there a refresh flow?
- What does the "type" field on a role (admin, user) mean?
- Does the "locations" permission mean destinations?
- Which role may manage tour images and inclusions? The permission table has no names for them (treated as admin only for now).

## Resolved

- User role: login and register now return user.roles (an array of { id, name, type }). The frontend supports several roles per account.
