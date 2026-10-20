# Aura Coffee

Website + order page. Orders are saved to `orders.json` by a small Node server.

## Run
```bash
npm install
node server.js          # or: ADMIN_KEY=yourpassword node server.js
```
- Site: http://localhost:3000/aura-coffee.html
- Order page: http://localhost:3000/aura-cafe-order.html
- Staff page: http://localhost:3000/admin.html (default key `aura123` — change it)

## Edit the menu
Names, prices and images live in `public/aura-cafe-order.html` inside `<script id="menuData">`.

## Files
- `public/landing.*` landing page, `public/order.*` order page, `public/landing-menu.js` landing menu
- `server.js`, `package.json`, `orders.json` stay outside `public/` so they are never downloadable
