# Competitor Exploration Screenshots — Notes

## PrintLife Screenshots

### printlife-01-dashboard.png

**PrintLife Dashboard** — Shows the main production view with 4 hardcoded production lanes: Design, P.O., Production, Shipping. Each lane shows a count. The dashboard is flat/list-based — no board/kanban view. Left sidebar has: Dashboard, Quotes, Invoices, Purchase Orders, Todo, Receivables, Clients, Staff, Product, Reports, Matrix Settings. Top nav has New Quote button.

### printlife-02-new-quote-step1.png

**PrintLife New Quote Wizard — Step 1 (Add Items)** — SanMar product catalog integration. Shows searchable product list with brand names (Gildan, Hanes, Port & Company, etc.), style numbers, and product images. This is the first of a strict 5-step sequential wizard: Add Items → Select QTY → Add Art → [Select Finishing] → Project Overview.

### printlife-03-product-detail-modal.png

**PrintLife Product Detail Modal** — Gildan 5000 Heavy Cotton Tee detail view. Shows product image, brand, style#, fabric specs, available colors as swatches. User selects color here before proceeding to quantity step.

### printlife-04-qty-table.png

**PrintLife Step 2 — Color Swatches** — Shows all available color swatches for the selected product (Gildan 5000). Black is selected. This is the top portion of the quantity entry step.

### printlife-05-qty-table-bottom.png

**PrintLife Step 2 — Size/Qty/Pricing Table** — The core quantity entry interface. Columns: Size, Stock (live inventory from SanMar), Qty (editable), Blank Item Cost (wholesale), Impression Cost, Total. Shows auto-markup pricing via configured "S&S Percentage Mark Up" matrix. Project total updates live at bottom. Entered: S=10, L=25, 2XL=5.

### printlife-06-add-art-locations.png

**PrintLife Step 3 — Print Location Selection** — 4 print locations: Front, Back, Left Sleeve, Right Sleeve. Each has an "Add" button. This is where you define which locations get printed. Must add at least one print spec before proceeding.

### printlife-07-front-print-spec.png

**PrintLife Front Print Spec Form** — Detailed per-location print specification. Fields: Decoration Method dropdown, Pricing Matrix dropdown, Color Swatch (ink colors), Width slider, Distance from collar slider, Placement (left/center/right), Notes text area, Ink Change checkbox, Names/Numbers checkbox. The ink color picker was broken during testing — colors wouldn't persist after Apply Colors (UX bug).

---

## Printavo Screenshots

### printavo-01-login-page.png

**Printavo Login Page** — Simple login form with Email/Password fields, "Yes, remember me" checkbox, Sign Up / Forgot password links, and green Login button. Shows "Happy Wednesday!" greeting. Clean, minimal design.

### printavo-02-calendar-monthly.png

**Printavo Calendar — Monthly View (Default Landing Page)** — The default page after login. Shows February 2026 monthly calendar grid. Left sidebar navigation with sections: GENERAL (Getting Started, Calendar, Quotes, Invoices, Customers, Manage Goods), EXTRAS (Messages, Tasks, Inquiries), FINANCIALS (Payments, Expenses, Analytics, Deposits). Top bar has global search, +Customer, +Quote buttons, notifications bell, user avatar. Two sample orders visible on Wed 2/11: "#1 Company Tees - SP + EMB" and "#2 SP + Promo" both for John Doe, Acme Production Inc, both in QUOTE status. Color-coded status badges on calendar entries. "7 trial days left - Upgrade" banner at bottom of sidebar.

### printavo-03-calendar-weekly.png

**Printavo Calendar — Weekly View** — Feb 8-14, 2026. Time-slotted hourly grid (12am-11pm). Same two orders visible as blocks on Wed 2/11 at ~8am. Shows "all-day" row at top. Task reminder visible on Fri 2/13. Weekly view gives more granular time visibility than monthly but orders don't seem to have specific times — they show at start of day.

### printavo-04-calendar-daily.png

**Printavo Calendar — Daily View** — February 12, 2026 (Thursday). Empty time-slotted grid for a single day. Shows hourly slots from 12am to 11pm. No orders on this day. Good for seeing daily production schedule when populated.

### printavo-05-order-preview-popup.png

**Printavo Order Preview Popup** — Appears when clicking an order on the calendar. Shows: Order #1, Name "Company Tees - SP + EMB", Customer "John Doe, Acme Production Inc", **dual dates** (Production Due Date: Feb 11, Customer Due Date: Feb 11), Total Quantity: 83, Total: $918.12, onboarding task checkbox, green "View" button and "QUOTE" status dropdown. Key insight: Printavo has BOTH a "Production Due Date" and a "Customer Due Date" — the dual-date concept is important for managing internal vs external deadlines.

### printavo-06-order-detail-top.png

**Printavo Order Detail — Top Section** — Shows the full order view header. Sub-navigation tabs: Edit, Overview, Payments/Expenses, Messages, Tasks (1). Status badge "QUOTE" with dropdown + "More Actions" menu. Production Notes section at top (internal-only, rich text with formatting). Attached production files: car-wrap-file.ai, vectorized-file.ai, digitized-file.dst. Quote header with shop info and key metadata table: Delivery Method, Created, Production Due Date, Customer Due Date, Invoice Date, Payment Due Date, Total ($918.12), Amount Outstanding ($918.12).

### printavo-06-order-detail-full.png

**Printavo Order Detail — Full Page** — Complete order view showing everything. Key sections:

1. **Production Notes** — Internal-only rich text with attached AI/DST files
2. **Quote Header** — Shop info, dual dates, financial summary
3. **Customer Info** — Billing address, Shipping address, Customer-facing notes
4. **Line Items Table** — Category (Screen Printing/Embroidery), Item#, Color, Description, Size breakdown (S/M/L/XL/2XL/3XL), Quantity, Items, Price, Total. Multiple line item groups supported.
5. **Imprints** — Per-group print specifications: "Imprint 1: Screen Printing Example, 2 color, Front print, Pantone 284 C" with attached artwork (PDFs, PNGs). "Imprint 2: Back print" with separate artwork.
6. **Second Line Item Group** — Embroidery section: Gildan 2000 White, Embroidery Matrix, 8001-9000 Stitches
7. **Fees Table** — Shipping Estimate: $40.00
8. **Financial Summary** — Total Qty: 83, Item Total: $878.12, Fees: $40.00, Sub Total: $918.12, Tax: $0.00, Total Due: $918.12, Paid: $0.00, Outstanding: $918.12

### printavo-07-quotes-list.png

**Printavo Quotes List** — Pipeline view showing: Total Opportunity ($2,184.98) → QUOTE stage ($2,184.98, 2 quotes) → QUOTE APPROVAL SENT stage ($0.00, 0 quotes). Arrow/chevron between stages visualizes the pipeline flow. Below is a sortable table with columns: ID, Customer, Customer Due Date, Total, Owner, Status. Search bar at top. Each status shows as a colored badge. Filters button available.

### printavo-08-invoices-list.png

**Printavo Invoices List** — Aging pipeline view: Total Past Due ($0) → Current ($0.00) → 1-30 Days Past Due ($0.00) → 31-60 Days ($0.00) → 61-90 Days ($0.00) → 90+ Days ($0.00). Each bucket shows count of invoices. Color-coded underlines (green for current, yellow for 1-30, orange for 31-60, red for older). Empty state message: "Sorry, there are no results". This is the receivables/AR view, separate from production tracking.

### printavo-09-tasks-list.png

**Printavo Tasks List** — Flat checklist view of all tasks across orders. Each task row has: checkbox (complete/incomplete), task description text, "Assigned to" dropdown (team member), due date field, and linked order reference (e.g., "Quote #1 Company Tees - SP + EMB"). "Filter by Status" dropdown at top right. "Add Task" form at bottom with text input + due date. "Completed Tasks" link at bottom. Tasks are job-linked but viewed in aggregate — useful for "what do I need to do today" across all orders.

### printavo-10-my-account-settings.png

**Printavo My Account — Settings Overview** — Left panel shows all settings sections (20+ categories): Personal Information, Shop Information, Invoice Information, Customize Your Line Items, Invoice Fees, **Customize Order Statuses**, Accept Payments, Approvals, **Automations**, Pricing Matrices, Purchase Orders, Vendors, Users, Inquiry Form, Messaging, Shipping, Categories, Expense Categories, Product Catalogs, Custom Products, **Preset Task Lists**, QuickBooks Online Export, Contractor Profiles, Import/Export Data. Right panel shows Personal Info form: Avatar, Name, Email, Timezone, Task Reminder Emails, Task Assigned Emails, Password. Below: Shop Information with Logo, Company Name, Email, Address, Social profiles, Custom URL Branding, API Token.

### printavo-10-my-account-full.png

**Printavo My Account — Full Page** — Complete settings page showing all sections scrolled. Reveals additional details: S&S Activewear and SanMar product catalog toggles (both enabled by default), account-specific pricing (premium feature), Inquiry Form embed code for website, Purchase Order email notifications, EasyPost shipping integration setup (FedEx, USPS, UPS, DHL), and the full form layout.

### printavo-11-order-statuses.png

**Printavo Customize Order Statuses** — CRITICAL PAGE. Shows the full default status pipeline (13 statuses):

1. **Quote** (#47A0D9 blue) — Quote stage [locked, cannot delete]
2. **Quote Approval Sent** (#327399 dark blue) — Quote stage
3. **Quote Approved** (#1D4359 navy) — Invoice stage
4. **Art Approval Sent** (#D99C48 gold) — Invoice stage
5. **Art Approved** (#996E32 brown) — Invoice stage
6. **Ready for Production** (#9B60DE purple) — Invoice stage
7. **In Production** (#7340AD dark purple) — Invoice stage
8. **Completed - Ready to Package** (#653D73 plum) — Invoice stage
9. **Order Ready for Pickup** (#4D4D4D gray) — Invoice stage
10. **Order Shipped** (#1E2420 near-black) — Invoice stage
11. **Feedback Request** (#14CCB3 teal) — Invoice stage
12. **Need it Again?** (#06806F dark teal) — Invoice stage
13. **Order on Hold (Issue)** (#F55E1E orange-red) — Invoice stage

Each status has: text name (editable), hex color (editable), Order Stage dropdown (Quote/Invoice), drag handle for reordering, delete button. "Add a Status" button at bottom. Key insight: Printavo uses a TWO-STAGE model (Quote vs Invoice) rather than a production-specific pipeline. Status colors progress from cool blues → warm golds → purples → grays → teals. The "Order on Hold (Issue)" status uses a warning orange-red, breaking the pattern to draw attention.

### printavo-11-order-statuses-full.png

**Printavo Order Statuses — Full Page** — Same as above but showing Save button at bottom.

### printavo-12-automations.png

**Printavo Automations — Top Section** — Status-triggered workflow automation engine. Shows "Create Automation" button, filter dropdowns (All Triggers, All Actions, All Statuses). First 4 automations visible:

1. "Add Quote Approval button & text & email quote approval to customer" — Trigger: status → QUOTE APPROVAL SENT → request Quote approval + email customer [ON]
2. "Change status to Quote Approved when customer approves the quote" — Trigger: Quote approval approved → auto-change status to QUOTE APPROVED [ON]
3. "Text & email 100% payment request when customer approves quote" — Trigger: status → QUOTE APPROVED → request 100% payment + email [OFF by default]
4. "Text & email thank you and next steps to customer when they pay in full" — Trigger: paid in full → email customer [ON]

### printavo-12-automations-full.png

**Printavo Automations — Full Page (13 automations)** — Complete automation chain:

1. Quote Approval Sent → request approval + email customer [ON]
2. Quote approved → auto-change status to "Quote Approved" [ON]
3. Quote Approved → request 100% payment + email [OFF]
4. Paid in full → email thank you [ON]
5. Paid in full → apply "Art Department: Add Art and Send Approval" preset task list [ON]
6. Art Approval Sent → request Artwork approval + email customer [ON]
7. Artwork approved → auto-change status to "Art Approved" [ON]
8. Art Approved → apply "Production Prep" preset task list [ON]
9. In Production → email customer "order in production" [ON]
10. Order Ready for Pickup → email customer [ON]
11. Order Shipped → email customer [ON]
12. Feedback Request → email customer [ON]
13. Need it Again? → email customer reorder prompt [ON]

Key insight: Automations are the backbone of Printavo's workflow. They auto-chain status changes, trigger task lists at key milestones, and send customer communications. The trigger types include: "If status changed to **_", "If _** approval is approved", "If paid in full", "If all tasks in preset list completed". Actions: send email/text, apply preset task list, request payment %, request approval, change status. Each has on/off toggle + drag reorder. This is the "guardrail" system our user envisions — but Printavo gives maximum flexibility (can be overwhelming for new shops).

### printavo-13-preset-task-lists.png

**Printavo Preset Task Lists** — Two default preset task groups that auto-apply via automations at workflow milestones:

1. **"Production Prep"** (7 tasks): Count in goods → Rectify order issues → Print film → Double-check screen mesh count → Burn screen(s) → Mix ink(s) → Change status to "Ready for Production". Applied when Art Approved status is reached.
2. **"Art Department: Add Art and Send Approval"** (3 tasks): Add internal files to Production files → Add mockup(s) to line item(s) → Change status to "Art Approval Sent". Applied when Paid in Full trigger fires.

Key insight: Preset task lists are Printavo's "checklist guardrail" — they ensure no step gets skipped by auto-applying a defined checklist at key milestones. The last task in each list is always "Change status to [next status]" — creating an explicit human gate that drives the workflow forward only when all preparatory work is confirmed complete. This is smart: automations handle the macro workflow, task lists handle the micro steps within each phase.

### printavo-14-new-quote-top.png / printavo-14-new-quote-middle.png / printavo-14-new-quote-full.png

**Printavo New Quote Form** — Single long-form page (NOT a multi-step wizard like PrintLife). Everything editable at once:

- **Top-right panel**: QUOTE badge, Owner dropdown, Delivery Method, PO Number, Created date, Production Due Date, Customer Due Date, Invoice Date, Payment Due Date (5 date fields!)
- **Left panel**: Customer dropdown (searchable, or "New Customer"), side-by-side Customer Billing / Customer Shipping address forms, "+ Address" link
- **Notes section**: Nickname (invoice label), Customer Notes (external-facing with ? tooltip), Production Notes (internal-only with ? tooltip), Production Files upload, Tags
- **Right sidebar**: "Getting Started With Quoting" onboarding tips (3 steps: Customize Line Items, Searching For Products, Attaching Mockups & Approvals) — only shown for new accounts
- **Line Items table**: Columns: drag handle, Category (Embroidery/Promo/Screen Printing/Setup Fee), Item #, Color, Description, size columns (XS/S/M/L/XL/2XL — configurable), Quantity, Items, Price, Taxed checkbox, Total. Each row has a line item actions menu.
- **Below line items**: "+ Line Item" button, "Imprint" button, "Refresh Pricing" button, "Mockup Creator" button
- **Line Item Group**: Add multiple line item groups (e.g., one for screen printing garments, one for embroidery)
- **Fees table**: Fee name, Description, Qty, Amount, Taxed, Total
- **Financial summary**: Total Quantity, Item Total, Fees Total, Sub Total, Discount ($/%toggle), Sales Tax (%), Total Due
- **Bottom bar**: "Cancel changes", "Save", "Save & finish" (green primary CTA)

Key insight: Printavo uses a "everything on one page" approach vs PrintLife's strict wizard. More flexible for experienced users but potentially overwhelming for beginners. The dual "Save" vs "Save & finish" is interesting — "Save" keeps you editing, "Save & finish" takes you to the read-only order view. No validation enforcement during quote creation — you can save an empty quote with no customer, no line items, nothing. Maximum flexibility, minimum guardrails.

### printavo-15-imprint-dialog.png

**Printavo Manage Imprints Dialog** — Modal for adding/editing print specifications per line item group. Each imprint has:

- **Matrix**: Dropdown to select pricing matrix (connects to configured pricing matrices)
- **Column**: Dropdown for matrix column (e.g., number of ink colors)
- **Details**: Freetext area for print spec details (location, colors, notes)
- **Mockups**: Button to attach mockup images/files
- **Delete** link and "+ Imprint" to add more

Key insight: Much simpler than PrintLife's print spec form (which had Decoration Method, Width slider, Distance from collar, Placement radio buttons, Ink Change checkbox, Names/Numbers). Printavo relies on freetext Details field for specifics rather than structured fields. Trade-off: faster to fill in but less structured data for production reporting.

### printavo-16-line-item-options.png

**Printavo Customize Line Item Columns** — Settings page for configuring which columns appear in the line items table across all quotes/invoices. Two sections:

1. **General columns** (checkboxes): Quantity (checked), Item # (checked), Category dropdown (checked), Color (checked), Markup % (checked). Each has a description explaining its use.
2. **Sizing options** (checkboxes): Full range from infant (6M, 12M, 18M, 24M) through toddler (2T-5T), youth (Youth-XS through Youth-XL), to adult (XS through 6XL). Default checked: XS, S, M, L, XL, 2XL. Also includes "Other" for non-standard.

Key insight: This level of column customization is good — shops can tailor the quote form to their business. But the sizes are just columns, not linked to any garment catalog. Each size is an independent numeric field with no inventory connection. Also, per-quote customization is available too (noted in the description text).

### printavo-17-manage-goods.png

**Printavo Manage Goods Page** — Purchase order management with two tabs: "Purchasing" and "Receiving". Search bar for purchase orders, buttons for "Create Purchase Orders" and "Vendors". Empty state: "No Purchase Orders - Create One". This is Printavo's garment sourcing module — tracks what blanks need to be ordered for jobs. Key insight: Purchase orders are separate from quotes/jobs — they represent the buying side (ordering blanks from suppliers like SanMar, S&S Activewear). The Receiving tab tracks when goods arrive. This is a critical part of the production pipeline that our user highlighted — knowing when blanks arrive affects when a job can actually go to press.

### printavo-18-analytics.png

**Printavo Analytics Dashboard** — 9 report cards in a 4x2+1 grid:

1. **Quotes and Invoices Created** — volume over time
2. **Revenue and Expenses** — earnings over time period
3. **Sales Tax** — tax owed for time period
4. **Sales by User** — per-salesperson metrics
5. **Sales by Line Item Categories** — most profitable categories (screen printing vs embroidery vs promo)
6. **Total Sales** — total sales by status
7. **Account Receivables** — outstanding receivables
8. **Sales by Customers** — per-customer sales data
9. **Expenses Breakdown** — expense categorization

Key insight: All financial/sales-focused analytics. NO production analytics — no throughput metrics, no cycle time, no on-time delivery rates, no capacity utilization. This is a major gap for production-focused shops. Our user specifically wants productivity tracking (daily output, weekly averages) and capacity planning data. Printavo's analytics serve the accounting department, not the production floor.
