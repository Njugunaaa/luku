# Luku - Youth Thrift Store TODO

## Database & Backend
- [x] Database schema: products, categories, cart, orders, order_items tables
- [x] tRPC router: products (list, get, by category, featured, search)
- [x] tRPC router: cart (get, add, update, remove, clear)
- [x] tRPC router: orders (create, list, get by id, update status)
- [x] tRPC router: admin (all orders, update status, manual order entry, summary reports)
- [x] Seed data: 35 products across all 5 categories with realistic data

## Frontend - Core
- [x] Global theme: warm charcoal + gold, Playfair Display + Inter (index.css)
- [x] Header: logo, nav links, cart icon with badge, user menu dropdown
- [x] Footer: store info, links, social media, WhatsApp contact
- [x] Routing: all pages wired in App.tsx with Layout wrapper
- [x] Auth context: login/logout flow via Manus OAuth
- [x] Cart context: persistent cart state for logged-in users

## Frontend - Pages
- [x] Homepage: hero section, card stack carousel, category showcase, scroll animations
- [x] Category page: product grid with search, condition filter, sort, grid/list view
- [x] Product detail page: images, description, size/color selector, add to cart, WhatsApp order button
- [x] Cart page: items list, quantity controls, subtotal, proceed to checkout
- [x] Checkout page: address form, delivery toggle, order summary, submit
- [x] User account page: order history with status badges
- [x] Admin dashboard: overview stats, orders table, manual entry form, reports with charts
- [x] 404 page

## Features
- [x] WhatsApp quick-order button on product detail (pre-filled message)
- [x] Cart badge count in header
- [x] Role-based access control (admin vs user)
- [x] Admin manual order entry for WhatsApp purchases
- [x] Weekly/monthly admin summary reports with recharts
- [x] Smooth scroll animations (framer-motion)
- [x] Card stack carousel on homepage
- [x] Responsive mobile design
- [x] Product image gallery on detail page
- [x] Search functionality on category pages

## Testing & Polish
- [x] Vitest tests: 31 tests passing (auth, categories, products, cart, orders, admin)
- [x] DB migration and seed complete
- [x] Final UI polish and responsiveness check
- [x] Local setup guide (README.local.md)

## Pending / Future
- [ ] Update WhatsApp number (currently placeholder: 254700000000)
- [ ] Product image upload for admin panel
- [ ] Email notifications on order placement
- [ ] Wishlist persistence in DB
- [ ] Global search page
