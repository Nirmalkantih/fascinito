# UI/UX Specifications for Fascinito

## Document Information
- **Version**: 1.0
- **Date**: December 2024
- **Status**: Active
- **Scope**: Customer Portal, Admin Dashboard, Vendor Portal, Staff Management

---

## 1. Customer Portal - Pages & Flows

### 1.1 Home Page

**Purpose**: Welcome screen, showcase featured products and promotions

**Key Sections**:
1. **Hero Banner** (80vh height)
   - Full-width background image
   - Centered call-to-action overlay
   - Title, subtitle, CTA button
   - Gradient overlay (primary color at 30% opacity)

2. **Featured Products Carousel**
   - Horizontal scrollable carousel
   - Product cards (same spec as product grid)
   - Auto-play every 5 seconds
   - Manual navigation arrows
   - Desktop: 4 visible items, Tablet: 3, Mobile: 1.5

3. **Category Grid**
   - 3-4 categories per row
   - Category card with image thumbnail
   - Hover: Scale 1.05, shadow elevation
   - Click: Navigate to category products

4. **Promotional Banners**
   - 2-column layout on desktop, 1 on mobile
   - Image background with text overlay
   - Limited-time badge
   - CTA button

5. **Footer**
   - Links organized in 4 columns
   - Newsletter signup form
   - Social media icons
   - Copyright text

**Design Decisions**:
- Why gradient overlays? Ensures text readability over images
- Why carousel auto-play? Engages users with content rotation
- Why featured products? Highlights best sellers and profits

---

### 1.2 Products Page

**Purpose**: Browse and search all available products

**Layout**:
- **Left Sidebar** (md breakpoint and up)
  - Filters: Category, Price range, Rating, Availability
  - Sticky on scroll
  - Collapse/expand on mobile
  - Apply/Reset buttons

- **Main Content**
  - Search bar at top
  - Sort dropdown (Price, Rating, Newest, Popular)
  - Products grid (4 columns lg, 3 md, 2 sm, 1 xs)
  - Pagination at bottom

**Product Card Spec** (See Design System Section 11)
- Image: 200px height with hover zoom
- Title: H6, 1-line truncate
- Category: Small chip
- Description: Body2, 2-line clamp
- Price: H6 with strike-through original
- CTA: Full-width "Add to Cart" button
- Favorite: Heart icon top-right

**Interactions**:
- Search: Filters in real-time (client-side or debounced)
- Sort: Re-orders current page
- Pagination: Loads new set of products
- Add to Cart: Toast success, option to view cart
- Heart Icon: Requires login, adds to wishlist

**Performance Notes**:
- Backend pagination: 12 items per page
- Images: Lazy loaded with placeholder
- Search: Debounced 300ms
- Infinite scroll (optional): Load next page on scroll

**Design Decisions**:
- 12 items per page? Balances content density vs. scroll distance
- Sticky sidebar? Keeps filters accessible without scrolling
- Heart icon top-right? Follows e-commerce conventions

---

### 1.3 Product Detail Page

**Purpose**: View complete product information and purchase

**Layout** (2-column on desktop, 1-column on mobile):

**Left Column (60%)**:
- **Image Gallery**
  - Large main image (400x400px minimum)
  - Thumbnail carousel below (60px squares)
  - Zoom on hover (magnifying glass icon)
  - Full-screen modal option

**Right Column (40%)**:
- Product title (H4)
- Rating and review count
- Price (large, highlighted)
  - Original price strikethrough
  - Discount percentage badge (if applicable)
- Availability status (green/red chip)
- Quantity selector (dropdown or +/- buttons)
- Variations (if any):
  - Color/Size swatches as tabs or buttons
  - Stock indicator per variation
- Primary CTA: "Add to Cart" (gradient button)
- Secondary: "Add to Wishlist" (outlined button)
- Share buttons (social)

**Below the Fold**:
- **Description Tabs**
  - Overview
  - Details
  - Specifications (if any)
  - Reviews
  - Q&A (optional)

- **Reviews Section**
  - Star rating display
  - Review list (5 per page, paginated)
  - Review form (logged-in users only)
  - Sort: Most helpful, Recent, High-rated

**Sidebar (sticky on desktop)**:
- Seller information
- Shipping details
- Return policy
- Trust badges

**Interactions**:
- Image hover: Shows zoom lens
- Variation selection: Updates price and stock
- Quantity change: Updates "Add to Cart" button state
- Write review: Opens modal form
- Share: Opens share menu

**Design Decisions**:
- 60/40 split? Balanced focus on image and info
- Tabs for details? Reduces page scroll, organizes info
- Sticky sidebar? Keeps actions visible while scrolling

---

### 1.4 Shopping Cart Page

**Purpose**: Review and modify items before checkout

**Layout**:
- **Header**: "Shopping Cart" title, item count
- **Main Content** (75% on desktop, full on mobile)
  - Cart items table:
    - Product image, name, variant
    - Unit price
    - Quantity adjuster
    - Line total
    - Remove button (trash icon)
  - Continue Shopping link

- **Sidebar** (25% on desktop, full-width below on mobile)
  - Order Summary
    - Subtotal
    - Tax (if applicable)
    - Shipping (flat/calculated)
    - Discount code input (with Apply button)
    - **Total** (bold, large)
  - Primary CTA: "Proceed to Checkout"
  - Secondary: "Continue Shopping"

**Empty State**:
- Illustration/icon
- Message: "Your cart is empty"
- "Start Shopping" button

**Interactions**:
- Quantity: +/- buttons or input field
  - Validation: 1 to stock quantity
  - Updates line total and order summary
  - Shows stock warning if near limit
- Remove: Confirm modal or undo toast
- Discount code: Instant validation, shows discount amount
- Continue: Validation for stock (in case of changes)

**Design Decisions**:
- Table layout? Clear item comparison
- Right sidebar? Follows E-commerce UX patterns
- Quantity adjuster? Direct control over items

---

### 1.5 Checkout Page

**Purpose**: Collect shipping, billing, and payment info

**Layout** (Single column, vertical flow):

**Steps** (4 total, progress indicator at top):
1. Shipping Address
2. Billing Address
3. Shipping Method
4. Payment Method

**Step 1: Shipping Address**
- Option to use existing addresses
- Form fields:
  - Full Name (required)
  - Phone (required)
  - Address Line 1 (required)
  - Address Line 2 (optional)
  - City (required)
  - State/Province (required)
  - Postal Code (required)
  - Country (required, dropdown)
- "Save this address" checkbox
- Validate before next step

**Step 2: Billing Address**
- Radio option: "Same as shipping" (pre-selected)
- Or: Full form (same as shipping)

**Step 3: Shipping Method**
- Radio buttons for available methods:
  - Standard Shipping (5-7 days) - Free
  - Express Shipping (2-3 days) - $X
  - Overnight Shipping - $X
- Estimated delivery date for each
- Cost display

**Step 4: Payment Method**
- Payment method selector:
  - Credit/Debit Card (Razorpay)
  - UPI (Razorpay)
  - Wallet (if available)
  - Save card checkbox
- Special offers/promotions display
- Apply discount code (if not already applied)
- Final order summary
- Terms & conditions checkbox
- Primary CTA: "Place Order"

**Right Sidebar** (sticky, desktop only):
- Order Summary (readonly)
  - Items list with line totals
  - Subtotal
  - Tax
  - Shipping
  - Discount
  - **Total**

**Interactions**:
- Form validation: Real-time for email/phone, on blur for others
- Address lookup: Google Places auto-complete
- Shipping method change: Updates total
- Next/Previous buttons: Validate and navigate
- Place Order: Shows loading, redirects to payment or success

**Design Decisions**:
- 4-step flow? Breaks down large form, reduces cognitive load
- Progress indicator? Shows user where they are
- Right summary? Keeps total in view during entry
- Same as shipping default? Reduces 80% of user input

---

### 1.6 Order Success Page

**Purpose**: Confirm order placement and next steps

**Layout**:
- **Success Icon** (large, animated checkmark)
- **Order Number** (prominently displayed, selectable)
- **Thank You Message**
- **Order Summary**
  - Items (collapsible)
  - Shipping address
  - Total amount
  - Expected delivery date
- **Next Steps**
  - "Track your order" button
  - "Continue Shopping" button
  - Email confirmation notice
- **Support CTA**
  - "Contact us" link
  - FAQ link

**Animations**:
- Checkmark: Animated draw + bounce (0.5s)
- Content: Fade in staggered (0.2s each)

**Design Decisions**:
- Large checkmark? Clear visual confirmation
- Collapsible items? Reduces visual clutter
- Next steps prominent? Guides user to next action

---

### 1.7 Order History Page

**Purpose**: View all previous orders with details and actions

**Layout**:
- **Header**: "My Orders" title
- **Filter Bar**:
  - Status filter (All, Pending, Processing, Shipped, Delivered, Cancelled)
  - Date range picker (optional)
  - Search by order number
- **Orders List**:
  - Desktop: Table view
    - Order number (clickable)
    - Date ordered
    - Status (with badge color)
    - Items count
    - Total price
    - Action button (dropdown: View, Track, Refund, Return)
  - Mobile: Card list
    - Order number
    - Date and status
    - Items preview
    - Total
    - Action button

**Order Card** (Mobile view):
```
╔═════════════════════╗
║ Order #12345678     ║
║ Dec 15, 2024        ║
║ Status: Delivered   ║
║ ────────────────    ║
║ 3 items             ║
║ Total: ₹2,499       ║
║ [Actions ▼]         ║
╚═════════════════════╝
```

**Pagination**: 10 orders per page

**Empty State**: Illustration + "No orders yet" + "Start Shopping" button

**Interactions**:
- Order number click: Navigate to detail page
- Status badge: Shows order status timeline
- Action dropdown: View details, track, initiate refund
- Filter: Dynamically filters list
- Date picker: Custom date range filter

**Design Decisions**:
- Table on desktop? Compact, compare multiple orders
- Cards on mobile? Touch-friendly, easier to scan
- Status badge colors? Clear visual status indication

---

### 1.8 Order Detail Page

**Purpose**: Complete view of a single order

**Layout**:
- **Order Header**
  - Order number and date
  - Status timeline (visual stepper)
  - Expected delivery date
  - Edit/Cancel buttons (if applicable)

- **Order Items Section**
  - Product card for each item:
    - Product image, name, variant
    - Unit price, quantity, line total
    - Product link

- **Two-Column Layout Below**
  - **Left** (60%):
    - Shipping Address
    - Billing Address
    - Payment Information
    - Special Instructions/Notes

  - **Right** (40%):
    - Order Summary
      - Subtotal
      - Tax
      - Shipping
      - Discount
      - Total
    - Actions:
      - "Track Order" button
      - "Request Return/Refund" button
      - "Contact Support" link
      - "Print Order" button

**Design Decisions**:
- Status timeline? Visual progress through fulfillment
- Expandable sections? Keeps page organized
- Actions right sidebar? Easy access to next steps

---

### 1.9 User Profile Page

**Purpose**: Manage user account information

**Layout**:
- **Sidebar Navigation** (md+, collapsible on mobile)
  - Profile
  - Addresses
  - Orders
  - Wishlist
  - Settings
  - Logout

- **Main Content Area**
  - **Profile Tab**:
    - Profile picture upload
    - Full name
    - Email
    - Phone
    - Date of birth
    - Save button

  - **Addresses Tab**:
    - List of saved addresses
    - Add address button
    - Edit/Delete for each
    - Set as default checkbox

  - **Wishlist Tab**:
    - Grid of wishlist products
    - Remove from wishlist option
    - Add to cart button

  - **Settings Tab**:
    - Email notifications toggle
    - SMS notifications toggle
    - Newsletter subscription
    - Delete account button (with confirmation)

**Design Decisions**:
- Sidebar navigation? Organizes sections, allows quick switching
- Profile picture? Personalizes account
- Address management? Reduces checkout friction

---

### 1.10 Wishlist Page

**Purpose**: View and manage favorite products

**Layout**:
- **Header**: "My Wishlist" title, item count
- **View Options**: Grid/List toggle
- **Filter/Sort**: Category, price range, sort by date added
- **Products Grid** (same as product page)
  - Remove from wishlist button
  - Add to cart button
  - Share button (optional)

**Empty State**: "Your wishlist is empty" + "Continue Shopping" button

**Design Decisions**:
- Grid by default? Shows more products at once
- Remove vs. favorites? Explicit removal action
- Share button? Enables wish-listing sharing

---

## 2. Admin Dashboard

### 2.1 Dashboard Overview

**Purpose**: High-level business metrics and quick actions

**Layout** (Grid-based cards):
- **Key Metrics** (4-column grid, 1-column mobile)
  - Total Revenue
  - Total Orders
  - Total Customers
  - Average Order Value
  - Each: Large number, label, trend indicator (↑↓), time period

- **Charts Section** (2-column layout, full on mobile)
  - Sales Chart (line/bar): Last 30 days by day/week/month
  - Category Performance (bar chart)
  - Order Status Breakdown (pie chart)

- **Recent Activities**
  - Recent orders table (5 rows)
  - Recent customers list (5 items)

**Interactions**:
- Date range selector: Changes all chart data
- Chart hover: Shows tooltips with values
- Row click: Navigate to detail page

**Design Decisions**:
- 4 key metrics? Covers health indicators
- Multiple charts? Different views of data
- Date range? Flexible time period analysis

---

### 2.2 Products Management

**Purpose**: Create, read, update, delete products

**Layout** (List with bulk actions):
- **Header**: "Products" title, import/export buttons, add product button
- **Filter Bar**:
  - Search by name/SKU
  - Category filter
  - Stock status filter (In stock, Low stock, Out of stock)
  - Active toggle
  - Show archived checkbox
- **Products Table**:
  - Checkbox (select all)
  - Product image (thumbnail)
  - Product name
  - SKU
  - Category
  - Stock quantity
  - Price
  - Status (active/inactive badge)
  - Actions (Edit, Delete, Duplicate)
  - Bulk actions: Delete, Archive, Change Category

**Pagination**: 25 items per page

**Add/Edit Product Form**:
- **Basic Info Tab**
  - Product name
  - Slug (auto-generated)
  - SKU
  - Category
  - Sub-category
  - Vendor
  - Description (rich text editor)
  - Detailed description (optional)

- **Pricing Tab**
  - Regular price
  - Sale price (optional)
  - Cost per item
  - Tax rate
  - Tax exempt toggle

- **Inventory Tab**
  - Track inventory toggle
  - Stock quantity
  - Low stock threshold
  - Location selector

- **Images Tab**
  - Upload/drag-drop zone
  - Thumbnail gallery
  - Set primary image
  - Alt text per image

- **Variations Tab** (if applicable)
  - Add variation (Color, Size, etc.)
  - Variant combinations grid
  - Price per variant
  - Stock per variant

- **Visibility Tab**
  - Active toggle
  - Visible to customers toggle
  - Featured toggle
  - Display order

- **Actions**
  - Save button
  - Save & Close button
  - Save & Duplicate button
  - Cancel button

**Design Decisions**:
- Tabbed form? Reduces cognitive load, organizes related fields
- Rich text editor? Formatted product descriptions
- Variation matrix? Manage variants efficiently
- Image upload? Visual product presentation

---

### 2.3 Orders Management

**Purpose**: View, process, and manage all orders

**Layout** (Table with filters):
- **Header**: "Orders" title, export button
- **Filter Bar**:
  - Status filter (multi-select)
  - Date range
  - Customer search
  - Order number search
  - Payment status filter

- **Orders Table**:
  - Order number (linked)
  - Customer name
  - Date
  - Status (badge with color)
  - Items count
  - Total amount
  - Payment status
  - Actions (View, Edit status, Refund, Cancel)

**Order Detail Modal**:
- Order header with status and date
- Customer information
- Items list with prices
- Shipping address
- Billing address
- Notes/special instructions
- Status update button (dropdown)
- Refund button
- Print button
- Close button

**Status Update Flow**:
- Dropdown with available next statuses
- Confirmation modal
- Optional notes field
- Notify customer checkbox
- Confirm button

**Design Decisions**:
- Table view? Scan multiple orders
- Status badges? Quick visual status identification
- Modal for details? Doesn't leave page context

---

### 2.4 Customers Management

**Purpose**: View and manage customer accounts

**Layout** (Table):
- **Header**: "Customers" title, export button
- **Filter Bar**:
  - Search by name/email/phone
  - Registration date range
  - Order count filter
  - Segment filter (VIP, Regular, Inactive)

- **Customers Table**:
  - Customer avatar
  - Name
  - Email
  - Phone
  - Total orders
  - Total spent
  - Last order date
  - Status (Active/Inactive)
  - Actions (View, Edit, Send email, Delete)

**Customer Detail Page**:
- **Profile Section**
  - Avatar, name, email, phone
  - Registration date
  - Total orders, total spent
  - Edit profile button

- **Addresses**
  - List of saved addresses
  - Edit/delete buttons
  - Set default checkbox

- **Orders History**
  - Table of customer orders
  - Link to order details

- **Messages** (if support system exists)
  - Chat history
  - Send message button

**Design Decisions**:
- Avatar? Visual identification
- Total spent metric? Identifies VIP customers
- Quick actions? Edit, email without leaving page

---

### 2.5 Categories Management

**Purpose**: Organize product catalog hierarchy

**Layout** (Tree/List):
- **Header**: "Categories" title, add category button
- **Sidebar** (optional): Category tree view
- **Main Content**:
  - Categories list with nesting
    - Category name
    - Product count
    - Sub-category count
    - Actions (Edit, Delete, Add sub-category)
  - Drag-to-reorder (optional)

**Add/Edit Category Form**:
- Category name
- Slug (auto-generated)
- Description
- Parent category (if sub-category)
- Category image/icon upload
- Display order
- Active toggle
- Save/Cancel buttons

**Design Decisions**:
- Tree view? Shows hierarchy
- Drag-to-reorder? Flexible organization
- Parent category selector? Manages nesting

---

### 2.6 Reports Section

**Purpose**: Business analytics and insights

**Layout** (Tab-based):
- **Sales Report Tab**
  - Date range selector
  - Metrics: Total sales, avg order value, orders count
  - Chart: Sales by day/week/month (selectable)
  - Export to CSV/PDF button

- **Product Performance Tab**
  - Sortable table: Product, units sold, revenue, trend
  - Top performers vs. bottom performers
  - Category breakdown

- **Customer Analytics Tab**
  - New customers count
  - Repeat purchase rate
  - Customer lifetime value chart
  - Customer segments pie chart

- **Inventory Report Tab**
  - Low stock items (alert)
  - Slow-moving inventory
  - Overstock items
  - Stock value chart

**Design Decisions**:
- Tabs? Separate report types
- Date range selectors? Custom analysis periods
- Export options? Data accessibility

---

## 3. Design Consistency Checklist

### For Every New Page/Component:
- [ ] Mobile-first responsive design (xs, sm, md, lg, xl)
- [ ] Color scheme uses theme palette
- [ ] Typography follows heading/body hierarchy
- [ ] Spacing uses 8px grid system (1, 2, 3, 4, 5, 6 units)
- [ ] Icons consistent (Material-UI icons)
- [ ] Button states styled (default, hover, active, disabled)
- [ ] Forms have proper labels and validation messages
- [ ] Images are optimized and lazy-loaded
- [ ] Loading states shown (skeletons or spinners)
- [ ] Error states handled with clear messages
- [ ] Empty states designed with illustrations
- [ ] Keyboard navigation tested
- [ ] ARIA labels added for accessibility
- [ ] Animations use 0.2s-0.3s ease-in-out
- [ ] Shadows use theme shadow levels
- [ ] Border radius matches component type (10px buttons, 16px cards)

---

## 4. Interaction Patterns

### Forms
- Labels always visible
- Validation on blur for most fields
- Error messages in red below field
- Success checkmark on valid fields
- Disabled submit button until valid
- Loading state on submit
- Success/error toast after submission

### Tables
- Hover: Slight background color change
- Click row: Navigate to detail page or select
- Pagination at bottom
- Sortable columns (click header)
- Bulk actions with checkboxes
- Actions column at end

### Modals
- Centered on screen
- Backdrop blur/overlay
- Close button top-right (X icon)
- Escape key closes
- Click outside closes (if not critical)
- Animations: Fade in/out

### Dropdowns/Selects
- Click to open
- Highlight on hover
- Keyboard arrow keys navigate
- Enter to select
- Escape to close
- Search/filter (if many options)

### Toasts/Notifications
- Auto-dismiss after 4-5 seconds
- Manual close button
- Stacked if multiple
- Show briefly then fade out
- Position: Top-right or bottom-right

---

## 5. Error Handling UX

### Form Validation Errors
- Red border on field
- Error message below field
- Icon indicator
- Disable submit until fixed

### API Errors
- Toast with error message
- If critical: Modal with action button
- If server error: Show support contact option
- Log error for debugging

### Network Errors
- Show offline indicator
- Retry button
- Cached data (if available)
- Queue actions for when online

---

## 6. Performance Targets

- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 3 seconds
- **Interaction to Next Paint**: < 100ms
- **Cumulative Layout Shift**: < 0.1
- **Image Load Time**: < 1 second with lazy loading
- **API Response**: < 500ms
- **Mobile**: Optimized for 4G

---

## 7. Approval Matrix

| Element | Designer | PM | Tech Lead | QA |
|---------|----------|-----|-----------|-----|
| New Page | ✓ | ✓ | ✓ | — |
| Component Change | ✓ | — | ✓ | ✓ |
| Color Scheme | ✓ | ✓ | — | — |
| Typography | ✓ | — | — | — |
| Layout Change | ✓ | ✓ | — | ✓ |
| Interaction Pattern | ✓ | ✓ | ✓ | — |

---

## 8. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Dec 2024 | Initial specification | Design Team |

---

**Document Maintained By**: Design Team
**Last Updated**: December 2024
