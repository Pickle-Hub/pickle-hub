# Pickle Hub 

Build a complete, production-ready premium pickleball court booking and management website called "Pickle Hub".

The website must have two completely different experiences:

1. CUSTOMER-FACING PREMIUM BOOKING WEBSITE
2. ADMIN MANAGEMENT DASHBOARD WITH AN EXCEL/GOOGLE-SHEET STYLE BOOKING VIEW

The design must be modern, premium, sporty and professional.

Use a premium purple + yellow/gold visual identity inspired by a high-end pickleball/sports club.

Do NOT create a basic generic dashboard.
The website should look like a professionally designed commercial sports booking platform.

==================================================
1. CUSTOMER WEBSITE
==================================================

Create the following pages:

- Home
- Book a Court
- My Activity
- Login
- Signup
- Profile
- Payment
- Booking Confirmation
- Contact/Location

--------------------------------------------------
HOME PAGE
--------------------------------------------------

Create a premium hero section containing:

- Pickle Hub branding
- Premium pickleball court imagery
- "Book Your Court. Play Your Game."
- Book Now CTA
- View Courts CTA

Show:

- Court availability
- Pricing
- Opening hours
- Number of courts
- Maximum players
- Facilities
- Location
- Contact information

Add premium animated sections for:

- Why Pickle Hub
- Our Courts
- Pricing
- How Booking Works
- Customer Reviews
- Location
- Contact

The website must be fully responsive.

Desktop:
Premium sports-club style layout.

Mobile:
Mobile-first booking experience with large touch-friendly controls.

==================================================
2. CUSTOMER AUTHENTICATION
==================================================

Customers must be able to:

- Sign up
- Login
- Logout
- Reset password
- View profile
- Update name
- Update phone number

Every booking must belong to the authenticated user.

Store:

- user_id
- full_name
- email
- phone_number

Prevent unauthenticated users from creating bookings.

==================================================
3. COURT BOOKING
==================================================

There are exactly TWO courts:

COURT 1
COURT 2

The booking page should display both courts.

Allow customers to select:

- Date
- Court
- Time slot

Opening hours:

5:00 AM – 12:00 AM

Use one-hour slots:
05:00 AM – 06:00 AM
06:00 AM – 07:00 AM
07:00 AM – 08:00 AM
08:00 AM – 09:00 AM
09:00 AM – 10:00 AM
10:00 AM – 11:00 AM
11:00 AM – 12:00 PM
12:00 PM – 01:00 PM
01:00 PM – 02:00 PM
02:00 PM – 03:00 PM
03:00 PM – 04:00 PM
04:00 PM – 05:00 PM
05:00 PM – 06:00 PM
06:00 PM – 07:00 PM
07:00 PM – 08:00 PM
08:00 PM – 09:00 PM
09:00 PM – 10:00 PM
10:00 PM – 11:00 PM
11:00 PM – 12:00 AM

Pricing:

DAY RATE:
₹600 per hour

EVENING RATE:
₹800 per hour

Day:
Before 5:00 PM

Evening:
5:00 PM onwards

Make pricing configurable from Admin Settings rather than hard-coded wherever possible.

==================================================
4. BOOKING STATUS
==================================================

Each slot must have one of these statuses:

AVAILABLE
BOOKED
BLOCKED
PENDING PAYMENT
CANCELLED

Use clear visual indicators.

AVAILABLE:
Green

BOOKED:
Red/orange

BLOCKED:
Grey

PENDING PAYMENT:
Yellow

CANCELLED:
Available again

A customer must NOT be able to book a slot that is already booked.

Use database-level protection against double booking.

Two different users must never be able to successfully book the same:

court + date + hour

combination.

==================================================
5. BOOKING CONFIRMATION
==================================================

When the customer selects:

Court
Date
Time

show a premium confirmation popup.

Display:

Court
Date
Time
Duration
Players
Amount

Then show:

"Confirm Booking"

After confirmation:

- Create booking in database
- Mark slot as BOOKED
- Show success message
- Show booking confirmation number
- Show booking details
- Add booking to My Activity

Do NOT mark a booking as booked merely because a slot was selected.

The slot should become BOOKED only after the booking is successfully confirmed.

==================================================
6. PAYMENT SYSTEM
==================================================

Implement a QR-code based payment system and a pay-at-venue option too.

IMPORTANT:

Do NOT use Razorpay or any payment gateway for this version.

Admin must be able to upload/configure the official Pickle Hub payment QR code.

The QR code should be displayed inside the payment screen.

Customer payment flow:

Select slot
↓
Confirm booking
↓
Payment screen
↓
Display Pickle Hub UPI QR
↓
Customer scans QR
↓
Customer completes payment
↓
Customer enters payment reference / UTR number
↓
Customer optionally uploads payment screenshot
↓
Submit payment proof
↓
Payment status = PENDING VERIFICATION
↓
Admin verifies payment
↓
Payment status = PAID

The payment screen should show:

- Amount
- UPI QR code
- UPI ID
- "Scan & Pay"
- Copy UPI ID button
- Download QR button
- Payment reference/UTR field
- Upload payment screenshot
- Submit Payment button

On mobile:

Provide an easy way to save/download the QR.

If an official UPI deep link is configured by the admin, also provide:

"Pay using UPI App"

Do NOT automatically mark payment as PAID merely because the customer submits a UTR.

Only admin verification can mark the payment as PAID.

Payment statuses:

PENDING
PAID
REJECTED
REFUNDED

==================================================
7. MY ACTIVITY
==================================================

Create a premium "My Activity" page.

Show:

Upcoming Bookings
Past Bookings
Cancelled Bookings

Each booking card should contain:

Booking ID
Court
Date
Time
Amount
Booking Status
Payment Status

Actions:

- View Details
- Cancel Booking
- Download Receipt

Receipt should contain:

Pickle Hub
Booking ID
Customer Name
Court
Date
Time
Amount
Payment Status
Booking Status

Make the receipt printable/downloadable.

==================================================
8. ADMIN LOGIN
==================================================

Create a secure Admin Login.

Only authorized admin users can access:

/admin

Do not expose admin functions to normal customers.

==================================================
9. ADMIN DASHBOARD
==================================================

Create a premium admin dashboard.

Dashboard cards:

Today's Bookings
Today's Revenue
Available Slots
Booked Slots
Pending Payments
Total Customers

Add date filtering.

Add:

Today
Tomorrow
This Week
This Month
Custom Date

==================================================
10. MOST IMPORTANT:
EXCEL / GOOGLE SHEET STYLE BOOKING MANAGEMENT
==================================================

The main admin booking screen must closely resemble the Excel/Google Sheet format provided.

Create a page:

Admin → Weekly Transactions

The layout should be an editable spreadsheet-style table.

Display ONE WEEK at a time.

Provide tabs:

Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday

Also provide:

Previous Week
Current Week
Next Week
Date Picker

==================================================
11. EXACT TWO-COURT TABLE STRUCTURE
==================================================

Display Court 1 and Court 2 side-by-side.

COURT 1 SECTION:

Column A:
Court 1 Slot

Column B:
Status (Court 1)

Column C:
Booked By C1

Column D:
Phone Number

Column E:
Amount

Column F:
WhatsApp Link (Court 1)

Column G:
Payment Reminder

Column H:
Review Request

COURT 2 SECTION:

Column I:
Court 2 Slot

Column J:
Status (Court 2)

Column K:
Booked By C2

Column L:
Phone Number

Column M:
Amount

Column N:
WhatsApp Link (Court 2)

Column O:
Payment Reminder

Column P:
Review Request

At the top display:

Date
Collected
Pending
Slots Taken
Occupancy Rate

Example:

Date: 31/08/2026
Collected: ₹1800
Pending: ₹0
Slots Taken: 3
Occupancy Rate: 7.89%

These values must be automatically calculated from database records.

==================================================
12. SPREADSHEET APPEARANCE
==================================================

The admin weekly transaction table should visually resemble the provided spreadsheet.

Use:

- Frozen header
- Frozen first column
- Grid borders
- Compact rows
- Excel-like cells
- Horizontal scrolling
- Vertical scrolling
- Sticky headers
- Sortable columns
- Filters
- Search
- Date filtering

Status colors:

AVAILABLE = light green
BOOKED AND PAID = green
BOOKED / PAYMENT PENDING = yellow
BLOCKED = grey/red
CANCELLED = neutral

Do not rely only on colors.

Also display text labels.

==================================================
13. ADMIN EDITING
==================================================

Admin should be able to edit/manage booking information from the spreadsheet interface.

Allow:

- Block a slot
- Unblock a slot
- Manually create booking
- Cancel booking
- Change payment status
- Verify payment
- Reject payment
- Edit customer phone number
- Add notes
- View booking details

Do NOT allow admin editing to bypass database validation.

==================================================
14. WHATSAPP INTEGRATION
==================================================

For every booked customer, create a WhatsApp button.

The button should open WhatsApp with a pre-filled message.

Example:

"Hi [Customer Name],
Your Pickle Hub booking is confirmed.

Court: Court 1
Date: 31/08/2026
Time: 06:00 AM - 07:00 AM
Amount: ₹600

Thank you for choosing Pickle Hub!"

The phone number must be automatically taken from the booking/customer record.

==================================================
15. PAYMENT REMINDER
==================================================

Add a "Send Payment Reminder" button.

For unpaid/pending payments:

Open WhatsApp with a pre-filled payment reminder.

Example:

"Hi [Customer Name],
This is a reminder regarding your Pickle Hub booking.

Court: Court 1
Date: [date]
Time: [time]
Amount Pending: ₹600

Please complete the payment."

Only show this action when payment is pending.

==================================================
16. REVIEW REQUEST
==================================================

After the booking date/time has passed, allow admin to send:

"Send Review Request"

Create a WhatsApp message requesting a customer review.

==================================================
17. BULK ACTIONS
==================================================

Add:

Send all available courts on WhatsApp

Send payment reminders

Send review requests

Export weekly transactions

Export daily transactions

Export monthly transactions

==================================================
18. EXCEL EXPORT
==================================================

Admin must be able to export the current table.

Export formats:

CSV
Excel-compatible CSV

The exported structure must match the admin spreadsheet:

Date
Court 1 Slot
Status
Booked By
Phone Number
Amount
WhatsApp Link
Payment Reminder
Review Request
Court 2 Slot
Status
Booked By
Phone Number
Amount
WhatsApp Link
Payment Reminder
Review Request

Do not require manual copying into Excel.

==================================================
19. ADMIN PAYMENT SETTINGS
==================================================

Create:

Admin → Payment Settings

Admin can configure:

UPI ID
UPI Name
QR Code Image
Payment Instructions

Allow admin to upload/change the QR code.

Example:

UPI ID:
picklehub@upi

QR:
[UPLOAD QR]

Payment Instructions:
"Scan the QR code and pay the exact booking amount."

The customer payment page automatically uses the latest configured QR.

==================================================
20. ADMIN COURT SETTINGS
==================================================

Admin → Court Settings

Allow admin to configure:

Court Name
Court Surface
Opening Time
Closing Time
Day Rate
Evening Rate
Maximum Players

Default:

Court 1
Court 2

Day Rate:
₹600

Evening Rate:
₹800

==================================================
21. BLOCKING SYSTEM
==================================================

Admin can block:

Individual slot
Multiple slots
Entire day
Specific court
Both courts

Examples:

Court 1
31/08/2026
06:00 AM - 07:00 AM
BLOCKED

or:

Both Courts
01/09/2026
FULL DAY CLOSED

Blocked slots must immediately disappear from customer availability.

==================================================
22. REAL-TIME AVAILABILITY
==================================================

Use real-time database updates.

If User A books Court 1 from 6–7 AM:

User B viewing the same date must immediately see:

BOOKED

Prevent stale availability.

Use database constraints / transactions / RPC functions where appropriate to prevent race conditions.

==================================================
23. DATABASE
==================================================

Use Supabase.

Create/maintain appropriate tables:

profiles
courts
bookings
blocked_slots
slot_locks
payment_settings
payment_proofs
admin_settings

Bookings should contain at minimum:

id
user_id
court_id
booking_date
slot_hour
players
amount
status
payment_status
payment_method
payment_reference
payment_screenshot
created_at
updated_at

Use foreign keys.

Use indexes for:

court_id
booking_date
slot_hour
user_id
status
payment_status

Create a unique constraint preventing duplicate active bookings for:

court_id + booking_date + slot_hour

Implement proper Row Level Security.

Customers can:

- View their own bookings
- Create their own bookings
- Cancel their own bookings

Customers must NOT:

- View another customer's private information
- Change payment status to PAID
- Access admin data
- Modify another user's booking

Admins can manage everything required by the admin dashboard.

==================================================
24. MOBILE ADMIN EXPERIENCE
==================================================

The spreadsheet should remain usable on mobile.

On mobile:

- Horizontal swipe for spreadsheet
- Sticky first column
- Sticky header
- Compact cells
- Search/filter
- Quick booking actions

Do not squeeze 16 columns into tiny unreadable cards.

==================================================
25. DASHBOARD DESIGN
==================================================

Use a premium:

Purple
Yellow/Gold
White
Dark charcoal

design system.

Use:

- Glassmorphism where appropriate
- Soft shadows
- Rounded cards
- Premium typography
- Smooth transitions
- Subtle animations
- Modern icons

Avoid excessive animations.

The UI must feel like a premium sports club rather than a generic SaaS dashboard.

==================================================
26. CUSTOMER BOOKING UX
==================================================

The booking process must be extremely simple:

Choose Date
↓
Choose Court
↓
Choose Slot
↓
View Price
↓
Confirm Booking
↓
Payment / Payment Proof
↓
Booking Confirmation
↓
My Activity

Show a clear progress indicator.

==================================================
27. BOOKING RECEIPT
==================================================

Create a professional Pickle Hub receipt.

Include:

PICKLE HUB

Booking Receipt

Booking ID
Customer Name
Phone
Court
Date
Time
Players
Amount
Payment Status
Booking Status

Add:

"Thank you for choosing Pickle Hub!"

Allow:

Download Receipt
Print Receipt

==================================================
28. SEARCH
==================================================

Admin can search by:

Customer name
Phone number
Booking ID
Date
Court

==================================================
29. REPORTS
==================================================

Create:

Daily Report
Weekly Report
Monthly Report

Show:

Total Bookings
Paid Bookings
Pending Payments
Cancelled Bookings
Revenue
Occupancy Rate
Court-wise bookings

Show Court 1 vs Court 2 performance.

==================================================
30. SECURITY
==================================================

Follow secure Supabase practices.

Never expose:

SUPABASE_SERVICE_ROLE_KEY

in frontend code.

Never expose private admin credentials.

All admin operations must be protected.

Validate all booking operations on the server/database.

Do not trust frontend payment status.

==================================================
31. PERFORMANCE
==================================================

The website must:

- Load quickly
- Work on mobile
- Work on desktop
- Use lazy loading where useful
- Avoid unnecessary database queries
- Cache availability appropriately
- Refresh availability after booking/cancellation

==================================================
32. FINAL IMPORTANT REQUIREMENT
==================================================

DO NOT remove or break existing Pickle Hub functionality.

If an existing Pickle Hub Supabase project/database already exists:

- Reuse the existing tables where possible
- Reuse existing authentication
- Reuse existing booking RPC functions where appropriate
- Preserve existing customer accounts
- Preserve existing booking history

Before modifying an existing table, inspect its current structure.

Do not blindly create duplicate tables.

The final website should be a complete production-ready Pickle Hub court booking and management system.

CUSTOMER:
Premium sports booking website.

ADMIN:
Excel/Google-Sheet-style weekly transaction management system.

PAYMENT:
UPI QR based payment with payment proof and admin verification.

DATABASE:
Supabase.

Make all important pricing, QR, courts, opening hours and payment settings configurable from Admin.Build a premium website

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9e012d5e-b4b3-42f5-b6d3-8dab80ec105e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitLab and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
