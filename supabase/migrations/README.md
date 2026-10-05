# Database migrations

Run in the Supabase SQL editor, in this order. Each file is safe to re-run.

| # | File | What it does |
|---|---|---|
| 1 | `schema.sql` | Tables: profiles, billboards, billboard_images, booking_requests |
| 2 | `security.sql` | Row Level Security policies and indexes |
| 3 | `security_fixes.sql` | Booking state machine, owner-spoofing fix, overlap protection, hides owner phone numbers, blocks role self-escalation |
| 4 | `reviews.sql` | Verified-booking reviews, moderators (`admins` + `is_admin()`), public views, review rules |
| 5 | `seed_billboards.sql` | *Optional.* Demo Hyderabad listings |

Also see `../storage_policies_optional.sql` (only if image uploads fail).

To become a moderator, see section 0 of `reviews.sql`.
