# Panorama — A Trusted Marketplace for Outdoor Advertising

> Find, book and review billboard space in Hyderabad without brokers, guesswork or fake listings.

**Demo video:** `https://drive.google.com/file/d/1mJaJNqli15_XCc0yCRnrT9axpUwPI2O0/view?usp=drive_link` · **Live app:** `https://panorama-sand.vercel.app/` · **Team:** `ECHO SOLDIER`

---

## 1. The problem

Outdoor advertising in India is still largely booked through brokers, phone calls and WhatsApp. Our survey of 12 owners, past bookers and would-be advertisers (section 2) points to three problems:

- **Trust.** Scams, fake locations, fake bookings and missing proof of ownership were the biggest problem in **5 of the 8** usable written answers, and the most common theme by far.
- **Wasted inventory and slow money.** **8 of 12** reported boards empty for 1+ months and **6 of 12** reported late payment in the last year. 4 of 12 had a no-show and 3 of 12 a double booking.
- **A booking process people avoid.** **5 of 12** have never booked a billboard because it is "too hard", and the hardest parts were location uncertainty (5), finding options (4), no photos or proof (4) and slow replies (4).

## 2. User research

We surveyed **12 people, 10 of them in Hyderabad** (one in Pune, one unspecified): **3** who own or manage boards, **3** who have paid for outdoor advertising, **5** who want to advertise but haven't yet, and 1 "none of these". Raw responses are not published because they include contact details.

### What we found

| Finding | Evidence (of 12) |
|---|---|
| Trust is the core barrier | 5 of 8 usable written answers named scams, fake locations, fake bookings or missing proof of ownership |
| Reviews are the top trust signal | **Reviews 7**, map location 6, verified owner 5, proof of display 5, real photos 4, secure payment 4 |
| Empty boards and late payment are common | Empty 1+ months: 8. Late payment: 6. No-show: 4. Double booking: 3. Dispute: 2 |
| Booking is hard enough to put people off | 5 said they haven't booked because it is "too hard"; 2 abandoned a booking; the median booking takes about a week |
| Location certainty is the top booking pain | Location uncertainty 5, finding options 4, no photos or proof 4, slow replies 4, paperwork 3, unclear prices 3 |
| Location is what people choose on | Location 8, traffic and audience 5, size and visibility 5, owner reputation 4, price 3, availability dates 3 |
| Price negotiation is the top-rated problem | Average 3.5 / 5 (7 rated 4+), then finding customers 3.2, getting paid 2.6, managing dates 2.4, proving the ad ran 2.1 |
| Strong appetite to book online, more cautious on listing | Likelihood to book online 3.9 / 5 (9 rated 4+); to list a board 3.3 / 5 (6 rated 4+) |
| "Too complicated" is the biggest adoption risk | Too complicated 7, commission fees 6, losing price control 5, fake requests 4 |
| Commission expectations are low | 7 of 11 said under 5 percent is fair; 4 said 5 to 10 percent |
| Operations are informal | Customers come via phone or WhatsApp (6), social media (5), repeat clients (4), brokers (3). Availability lives in spreadsheets (5), software (4), paper or memory (2) |
| Budgets are small | 6 of 12 spend 100 to 500 USD per campaign, 4 spend under 100 USD, 2 spend 500 to 2000 USD |

### In their words

- *"No certain proof of ownership, fake locations."*
- *"Scams."* (three separate respondents, one writing *"possible scams"*)
- *"Fake bookings and less payment."*
- *"Improper communication leading to misunderstanding and waste of time."*

### How the research shaped the product

| What we heard | What we built or decided |
|---|---|
| Reviews are the top trust signal (7 of 12) | **Verified-booking reviews**: only an advertiser whose booking was accepted and has finished can review |
| Location uncertainty and missing photos | Map-pinned listings, an image gallery, a Street View link, and a "did the location match the listing?" check in every review |
| Scams and fake locations | Reviews tie reputation to real, finished bookings; **document-based verification is our next priority** (section 10) |
| Double booking (3 of 12) | Overlapping accepted bookings are **blocked by the database** |
| Fear of losing price control (5) | **Owners set their own price and accept or reject every request**; the platform never sets or negotiates prices |
| "Too complicated" (7) | A 5-step listing wizard and a short request form, with no paperwork inside the app |
| Slow replies (4) | One request inbox with accept / reject instead of calls and WhatsApp chains, plus a "did the owner respond promptly?" check in reviews |

## 3. Who it's for

| User | Goal | What Panorama gives them |
|---|---|---|
| **Advertiser** | Find affordable, suitable space fast | Map + filter search, clear size/lighting/price/availability, direct booking request, ratings from real past bookings |
| **Billboard owner** | Fill inventory without a broker | Listing wizard, request inbox with accept/reject, a public reputation built from verified bookings, one public reply per review |
| **Moderator (admin)** | Keep reviews honest | A moderation page to hide abusive or spam reviews, always with a written reason |

## 4. Our solution

Panorama is a two-sided marketplace where **reputation comes from real bookings, not claims**.

1. **Owners list a billboard** through a 5-step wizard (details, size, lighting, price, map location, images) and publish it.
2. **Advertisers browse** published listings on a map with filters, then **send a booking request** for specific dates.
3. **Owners accept or reject** requests. Double-booking is blocked by the database itself.
4. **After the campaign ends, the advertiser leaves a review.** It shows a "Verified booking" label, because only an accepted, finished booking can be reviewed.
5. **The owner can reply once, publicly.** Moderators can hide a review only with a written reason.

### What makes it different

- **Verified-booking reviews with structured checks.** Beyond stars, each review answers the three things advertisers told us hurt most: did the location match the listing, were the photos accurate, did the owner respond promptly. Listings show these as percentages.
- **Reviews can't be gamed from either side.** One review per advertiser per billboard; the server (not the browser) decides who is reviewing what; reviews can't be edited or deleted; an owner can't cancel a finished booking to dodge a review; averages appear only from 3 reviews.
- **Booking integrity enforced server-side.** Status changes follow a strict state machine, owner and status are set by the server, and overlapping accepted bookings are rejected.
- **Humans decide, with accountability.** Moderators hide, never delete; a reason is mandatory; a moderator can't moderate reviews of their own listing.

## 5. Features

**Marketplace**
- Browse with search, filters (type, price, lighting, location) and a TomTom map view
- Billboard detail page with gallery, dimensions, lighting, pricing period, availability window, map and a Google Street View link
- Booking request form validated against the owner's availability window
- Saved billboards (stored in the browser)

**Owners**
- Create / edit / unpublish listings, image upload
- Request inbox with accept / reject / cancel
- Reviews on their billboards with a one-time public reply

**Reviews and moderation**
- Rating badge on every listing card; summary with check percentages on the listing page
- "Leave a review" on finished, accepted bookings
- Moderation page at `/admin/reviews` (hide / restore with a reason)

## 6. Architecture

```
React 19 + Vite + TanStack Router / Query + Tailwind + shadcn/ui
              │
              ▼
   Supabase (Auth · Postgres · Storage · RLS)
              │
   ├─ profiles, billboards, billboard_images, booking_requests
   ├─ reviews, admins
   ├─ Triggers: booking state machine, overlap exclusion constraint,
   │            review eligibility / immutability / moderation rules,
   │            no cancelling a finished booking
   └─ Views: public_reviews, billboard_review_stats, owner_review_stats

TomTom Maps SDK → maps and location picker
```

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vite, React, TanStack Router/Query | Fast, type-safe routing and caching |
| UI | Tailwind + shadcn/ui (Radix) | Accessible primitives |
| Backend | Supabase | Auth, Postgres and storage with row-level security |
| Maps | TomTom Maps SDK | Interactive map and location picking |

## 7. Security, privacy and responsible design

- **Row Level Security** on every table; the `admins` table has no client access at all.
- **Triggers enforce rules RLS can't:** column immutability, valid status transitions, no self-booking, review eligibility.
- **Reviewer privacy.** The public sees first name plus last initial only, through a view that never exposes the reviewer's id, phone or email.
- **Moderation accountability.** Hiding needs a written reason, who hid it and when are recorded, and nothing is ever deleted.
- **Roles can't be self-escalated** (fixed in `security_fixes.sql`).

## 8. Run it locally

### Prerequisites
Node 18+, a Supabase project, and a TomTom developer key (Maps SDK for Web enabled).

### Steps
```bash
npm install
cp .env.example .env      # then fill in the three values below
npm run dev
```

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_TOMTOM_API_KEY=...
```

### Database setup
Run these in the Supabase SQL editor, **in this order**:

1. `supabase/migrations/schema.sql`
2. `supabase/migrations/security.sql`
3. `supabase/migrations/security_fixes.sql`
4. `supabase/migrations/reviews.sql`
5. `supabase/migrations/seed_billboards.sql` *(optional demo listings)*

Then:
- Create the public storage bucket **`billboard-images`**. If uploads fail with a policy error, run `supabase/storage_policies_optional.sql`.
- Make yourself a moderator once: see **section 0 of `reviews.sql`**.
- Email/password sign-in works out of the box. Google sign-in needs the Google provider enabled in Supabase Auth.

### Try the full flow (about 5 minutes)
1. Sign up as an **owner**, create a billboard and publish it.
2. Sign up as an **advertiser** → `/browse` → open the listing → send a booking request.
3. Back as the owner → accept it. Try booking overlapping dates to see the block.
4. In the SQL editor, move that booking into the past so it counts as finished:
   `UPDATE booking_requests SET start_date = current_date - 30, end_date = current_date - 2 WHERE id = '<booking id>';`
5. As the advertiser → `/my-requests` → **Leave a review**. Open the listing to see it with a "Verified booking" label.
6. As the owner → `/dashboard` → reply to the review.
7. As a moderator → `/admin/reviews` → hide it with a reason. It disappears from the listing.


## 9. Notes on the data model

- Billboard types: static, digital, mobile, poster. Pricing periods: day, week, month. Lighting: none, front-lit, back-lit.
- Sizes are in feet.
- Availability comes from `available_from` / `available_to`; booking dates are checked against that window.
- A booking counts as finished when its `end_date` is before today (database date, UTC); there is no separate "completed" status.
- Saved billboards are stored in `localStorage` (no table yet).
- No signup trigger creates profiles; the app creates the profile row (name and role) on first sign-in.

## 10. Future development

Prioritised by what the survey asked for. Verification is next, because fake locations and ownership were the top written complaint.

### Verification (planned next, not in this build)
- [ ] **Document-based owner verification** with an admin review queue and mandatory rejection reasons
- [ ] **Publish gate**: only verified owners can publish; revoking verification automatically unpublishes their listings
- [ ] **Verified badge** on owners and, optionally, advertisers
- [ ] **AI-assisted document pre-check** that flags unclear, expired or mismatched documents (**a human always makes the final decision**)
- [ ] **SMS verification** for contact phone numbers
- [ ] **Site-ownership proof**: match the listing's location to the owner's documents
- [ ] **Appeals flow**, periodic re-verification, and a data-retention schedule for uploaded documents

### Reviews (core built; next steps)
- [ ] **Advertiser ratings by owners**, revealed together with the owner's review to avoid retaliation
- [ ] A "report this review" button for owners and a **moderation appeals** path
- [ ] Photos on reviews

### Other
- [ ] **Traffic and audience estimates** per site (5 of 12 choose boards on this)
- [ ] **Proof-of-display** photo upload after a booking starts (5 of 12)
- [ ] **Secure payment** and a transparent commission under 5 percent (7 of 11 expect this)
- [ ] Sync saved billboards to the database
- [ ] Automated tests for the booking state machine and review rules

## 11. Project structure

```
src/
  routes/        # pages (browse, billboard detail, dashboard, my-requests, admin/reviews)
  components/    # marketplace, owner wizard, auth, reviews, ui (shadcn)
  lib/           # queries, reviews, domain types, auth, TomTom helpers
supabase/
  migrations/    # schema, security, security_fixes, reviews, seed
```

## 12. Team and acknowledgements

Charan Teja Kodi - Frontend/UI ;
Om Prakash Dubey - Reseach and development ;
Prithvi Raj Bandi - Backend/Database ;

Built with React, Supabase, TomTom Maps SDK, shadcn/ui and TanStack. Maps note: TomTom has no Street View, so the "Street View" link opens Google Street View at the same coordinates in a new tab (no key needed).
