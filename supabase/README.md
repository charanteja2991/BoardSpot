\# BILLBOARD - Supabase Backend



This folder contains the database structure, security policies, and seed data for the BILLBOARD project.



\## Files



\### schema.sql

Contains the main database tables and indexes.



\### security.sql

Contains Row Level Security (RLS) policies and database security rules.



\### seed\_billboards.sql

Contains the initial Hyderabad billboard data used for development and testing.



\## Main Tables



\- profiles

\- billboards

\- billboard\_images

\- booking\_requests



\## Storage



The project uses a Supabase Storage bucket:



billboard-images



This bucket is used for billboard images.



\## User Roles



The application supports two main roles:



\- advertiser

\- owner



\### Advertiser

Advertisers can:

\- Browse published billboards

\- View billboard information

\- Send booking requests

\- Manage their own booking requests



\### Owner

Owners can:

\- Add billboards

\- Update their billboards

\- Delete their billboards

\- Upload billboard images

\- View booking requests for their billboards

\- Accept or reject booking requests



\## Database



Database technology:



Supabase PostgreSQL



Authentication:



Supabase Auth



Storage:



Supabase Storage



\## Important



No payment functionality is stored in this database.



Payment integration is handled separately by the application.

