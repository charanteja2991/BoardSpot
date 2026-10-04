# AdSpot Marketplace

Build a modern full-stack web application for a billboard advertising marketplace.

The platform connects two types of users:

1. Billboard Owners

2. Advertisers / Businesses

The core idea is:

Billboard owners can list their available billboard advertising spaces. Businesses can discover billboards, browse listings, view detailed information, inspect the surrounding location using Google Maps / Google Street View, check availability, and eventually book them.

IMPORTANT PRODUCT PRINCIPLE:

The platform should behave like a modern marketplace such as Amazon.

Users MUST NOT be forced to create an account or log in when they first visit the website.

The entire public browsing experience should be accessible without authentication.

Users should be able to:

* Visit the homepage

* Browse billboards

* Search billboards

* Filter billboards

* View billboard details

* View billboard photos

* View pricing

* View dimensions

* View availability

* View location

* Open Google Maps

* Open Google Street View

* Explore the billboard's surrounding area

WITHOUT creating an account.

Authentication should only be required when a user attempts an action that requires an account, such as:

* Requesting a booking

* Making a booking

* Saving/favoriting a billboard

* Contacting a billboard owner

* Managing their own listings

* Viewing their personal dashboard

If an unauthenticated user clicks an action that requires authentication, show a clean sign-in/sign-up prompt or redirect them to authentication while preserving their intended action.

For example:

User browses billboard

→ clicks "Request Booking"

→ authentication prompt appears

→ user signs in/signs up

→ user is returned to the billboard/booking flow

Do NOT interrupt the browsing experience with login screens.

---

TECHNICAL REQUIREMENTS:

* Use React + TypeScript.

* Use Tailwind CSS.

* Use a modern, clean, professional UI.

* Make the website responsive for desktop, tablet, and mobile.

* Use Supabase for the backend, database, authentication, and file storage.

* Use Google Maps for location visualization.

* Use Google Street View where available for billboard surroundings.

* Structure the application so it can be expanded later.

* Do not use fake data for functionality that should use the database.

* Separate public browsing functionality from authenticated functionality.

* Follow secure authentication and authorization practices.

* Use environment variables for API keys and secrets.

* Never expose secret API keys in client-side code.

---

USER TYPES:

1. BILLBOARD OWNER

Billboard Owners should be able to:

* Create an account

* Log in

* Create billboard listings

* Upload multiple billboard images

* Add billboard location

* Add exact latitude and longitude

* Add billboard dimensions

* Add billboard type

* Add pricing

* Add availability

* Edit listings

* Delete listings

* Publish/unpublish listings

* View booking requests

* Accept or reject booking requests

* View their billboard performance eventually

Owners should have their own dashboard.

---

2. ADVERTISER / BUSINESS

Advertisers should be able to:

* Browse billboards without logging in

* Search billboards without logging in

* Filter billboards without logging in

* View billboard details without logging in

* View billboard photos without logging in

* View pricing without logging in

* View dimensions without logging in

* View availability without logging in

* View location without logging in

* Open Google Maps without logging in

* Open Google Street View without logging in

Authentication should only be required when the advertiser wants to:

* Request a booking

* Book a billboard

* Save a billboard

* Contact an owner

* Access their dashboard

---

3. ADMIN

Create an admin dashboard that will eventually allow the platform administrator to:

* Manage users

* Manage billboard listings

* Manage booking requests

* Manage bookings

* Manage payments

* View platform statistics

* Approve/reject billboard listings

* Suspend users

* Manage reported listings

The admin functionality must be protected and inaccessible to normal users.

---

DATABASE:

Create a proper relational database structure for:

* profiles

* billboards

* billboard_images

* availability

* booking_requests

* bookings

* payments

* saved_billboards

Each billboard should contain appropriate fields for:

* Owner ID

* Title

* Description

* Address

* City

* State

* Country

* Latitude

* Longitude

* Billboard type

* Width

* Height

* Dimensions/unit

* Pricing

* Pricing period

* Availability status

* Visibility status

* Created date

* Updated date

The database should be designed so that maps and Street View can use the billboard's latitude and longitude.

---

SECURITY:

Use Supabase Row Level Security appropriately.

Requirements:

* Users should only be able to modify their own profile.

* Users should only be able to create and modify their own billboard listings.

* Users should only be able to delete their own billboard listings.

* Advertisers should only see their own saved billboards.

* Advertisers should only see their own booking requests.

* Advertisers should only see their own bookings.

* Owners should only see booking requests related to their own billboards.

* Owners should only manage bookings for their own billboards.

* Admin functionality must be restricted to authorized administrators.

* Public users should only have read access to billboards that are published and publicly visible.

* Never expose private user information to unauthenticated visitors.

---

PUBLIC BROWSING EXPERIENCE:

The public browsing experience is extremely important.

A visitor should be able to arrive at the homepage and immediately explore the marketplace.

Do NOT show a mandatory login/signup screen.

The flow should be:

Homepage

→ Browse Billboards

→ Search / Filter

→ Billboard Card

→ Billboard Details

→ Explore Location

→ Street View

→ Decide to Book

→ Authentication required

The experience should feel similar to Amazon:

Browse first.

Authenticate only when necessary.

---

PAGES:

PUBLIC:

* Home

* Browse Billboards

* Billboard Details

* About

* Contact

AUTHENTICATION:

* Sign Up

* Login

* Forgot Password

* Authentication modal/prompt when a protected action is attempted

OWNER:

* Owner Dashboard

* My Billboards

* Add Billboard

* Edit Billboard

* Booking Requests

* Profile

ADVERTISER:

* Advertiser Dashboard

* Saved Billboards

* My Booking Requests

* My Bookings

* Profile

ADMIN:

* Admin Dashboard

* Users

* Billboards

* Bookings

* Payments

* Reports / Moderation

---

BILLBOARD DISCOVERY:

Create a professional marketplace-style billboard discovery page.

Users should be able to search and filter by:

* City

* Area

* Price range

* Billboard type

* Billboard dimensions

* Availability

* Advertising format

* Location

Billboard cards should display:

* High-quality billboard image

* Billboard title

* Location

* Dimensions

* Billboard type

* Price

* Availability

* "View Details" button

Do NOT require authentication to browse or use filters.

---

BILLBOARD DETAILS PAGE:

Create a detailed billboard page.

Include:

* Large image gallery

* Billboard title

* Location

* Price

* Dimensions

* Billboard type

* Description

* Availability

* Map location

* Owner information where appropriate

* "Request Booking" CTA

* "Save Billboard" button

* "View on Google Maps" button

* "See Street View" button

The page should feel like a premium property/product listing page.

---

GOOGLE MAPS:

Integrate Google Maps into billboard details.

Each billboard should have latitude and longitude stored in the database.

Display the billboard location on a map.

Provide a button:

"View on Google Maps"

Clicking this should open the billboard's location in Google Maps.

Do not require authentication to view the map.

---

GOOGLE STREET VIEW:

This is an important feature of the advertiser experience.

Each billboard listing should have a secondary button:

"See Street View"

When clicked, allow the advertiser to inspect the billboard's surrounding environment using Google Street View where Street View imagery is available.

The Street View experience should allow the advertiser to:

* Look around the area

* Rotate the view

* Explore the surroundings

* Understand the road and nearby environment

* Get a better sense of the billboard's visibility and surroundings

Use the billboard's stored latitude and longitude to initialize the Street View experience.

Street View should NOT replace the normal billboard photos.

Instead:

Billboard photos

+

Map

+

"See Street View"

should work together.

If Street View imagery is unavailable for a particular billboard location, gracefully display a message such as:

"Street View is not available for this location."

Do not break the rest of the billboard page.

Do not require authentication to use Street View.

---

HOME PAGE DESIGN:

Create a premium marketplace-style homepage.

Hero section:

"Find the perfect billboard for your next campaign."

Subtitle:

"Discover advertising spaces in high-visibility locations and connect directly with billboard owners."

Primary CTA:

"Browse Billboards"

Secondary CTA:

"List Your Billboard"

Include:

* Prominent billboard search bar

* Featured billboards

* Popular locations

* How it works

* Benefits for advertisers

* Benefits for billboard owners

* Call-to-action section

* Professional footer

The search bar should allow users to start searching immediately without logging in.

---

DESIGN STYLE:

Create a premium B2B marketplace.

The design should feel like a legitimate startup product rather than a college project.

Design characteristics:

* Modern

* Professional

* Clean typography

* Lots of whitespace

* High-quality billboard imagery

* Premium cards

* Strong visual hierarchy

* Subtle animations

* Responsive layouts

* Intuitive navigation

* Clear CTAs

* Professional dashboard interfaces

Avoid:

* Generic AI-generated website appearance

* Excessive gradients

* Excessive animations

* Cluttered layouts

* Huge unnecessary text

* Login-first experience

The public marketplace should feel visually similar in quality and usability to established marketplaces.

---

AUTHENTICATION UX:

Authentication should be contextual.

DO NOT show:

"Please log in to continue browsing."

Instead:

Allow the user to browse freely.

When a user clicks:

"Request Booking"

show a polished authentication prompt:

"Create an account to request this billboard"

Options:

* Continue with Google

* Continue with Email

After successful authentication, return the user to the action they originally attempted.

Similarly, if an unauthenticated visitor clicks "Save Billboard":

"Sign in to save this billboard."

The visitor should not lose their current page or browsing context.

---

OWNER BILLBOARD CREATION:

Create a multi-step billboard listing form.

Step 1:

Basic information

* Billboard title

* Description

* Billboard type

Step 2:

Location

* Address

* City

* State

* Country

* Latitude

* Longitude

Allow the owner to select the location using a map.

Step 3:

Dimensions

* Width

* Height

* Unit

Step 4:

Pricing

* Price

* Pricing period

Step 5:

Photos

* Upload multiple billboard photos

* Store images using Supabase Storage

Step 6:

Availability

* Available dates

* Unavailable dates

Step 7:

Review and Publish

Owners should be able to preview their billboard listing before publishing.

---

BOOKING FLOW:

For V1, implement a booking-request workflow.

Advertiser:

Browse

→ View Billboard

→ Select desired dates

→ Request Booking

→ Authentication if necessary

→ Submit Request

Owner:

Owner Dashboard

→ Booking Requests

→ View Request

→ Accept / Reject

Advertiser:

Advertiser Dashboard

→ View Request Status

Statuses should include:

* Pending

* Accepted

* Rejected

* Cancelled

Design the database so actual online payments can be added later.

---

SAVED BILLBOARDS:

Allow authenticated advertisers to save/favorite billboards.

On the public billboard card and billboard details page, provide:

♡ Save

If an unauthenticated user clicks Save:

Ask them to sign in.

After authentication, preserve the intended action.

---

ADMIN:

Create an admin dashboard with:

* Total users

* Total billboard listings

* Active listings

* Pending listings

* Total bookings

* Pending booking requests

* Revenue placeholder for future payment system

Include tables for:

Users

Billboards

Booking Requests

Bookings

Payments

The admin dashboard should be visually consistent with the rest of the platform.

---

IMPORTANT ARCHITECTURE:

Build the application modularly.

Separate:

* Public marketplace

* Authentication

* Advertiser functionality

* Owner functionality

* Admin functionality

Use reusable components.

Keep business logic separate from UI components where practical.

Do not create one giant component.

Create reusable components such as:

* BillboardCard

* BillboardGallery

* SearchBar

* FilterPanel

* MapView

* StreetViewButton

* AvailabilityCalendar

* BookingModal

* AuthModal

* Navbar

* Footer

* DashboardSidebar

---

FUTURE-READY ARCHITECTURE:

Do NOT implement all of these yet, but structure the application so they can be added later:

* Online payments

* Platform commissions

* Automatic booking

* Google Maps advanced functionality

* Reviews and ratings

* Owner/advertiser messaging

* Notifications

* Email notifications

* SMS notifications

* Billboard analytics

* Advertising campaign analytics

* Traffic/visibility data

* AI billboard recommendations

* AI-powered billboard search

* Dynamic pricing

* Business advertising campaign management

Potential future AI feature:

Allow an advertiser to enter:

"Find me billboards in Hyderabad near high-traffic roads under ₹50,000/month."

The platform could eventually use AI to recommend suitable billboard listings.

Do not implement this AI feature in the initial version, but keep the architecture flexible enough to support it later.

---

IMPORTANT DEVELOPMENT INSTRUCTION:

Build this application incrementally.

FIRST:

1. Establish the database schema and relationships.

2. Configure Supabase.

3. Configure authentication.

4. Establish Row Level Security.

5. Build the public marketplace.

6. Build billboard listings.

7. Build billboard details.

8. Implement Google Maps.

9. Implement Google Street View.

10. Build advertiser and owner dashboards.

11. Build booking requests.

Do not implement payments yet.

Do not use fake database functionality.

Where real integrations are required, clearly identify any API keys or configuration values that I need to provide.

After completing each major section, verify that the existing functionality still works before modifying unrelated parts of the application.

The final result should feel like a real, production-quality B2B billboard marketplace, not a simple website template.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dc72f42a-a816-4081-bad2-4c71c9b61093).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
