// Aura Cafe server: serves the website and saves orders to orders.json
const express = require("express");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "aura123"; // change this!
const TAX_RATE = 0.08;
const STATUSES = ["New", "Making", "Ready", "Done"];
const ORDERS = path.join(__dirname, "orders.json");
const PUBLIC = path.join(__dirname, "public");
const PAGE = path.join(PUBLIC, "aura-cafe-order.html");
// Menu lives inside the order page (<script id="menuData">), so prices have one source of truth
const readMenu = () => {
  try {
    const m = fs.readFileSync(PAGE, "utf8").match(/<script[^>]*id="menuData"[^>]*>([\s\S]*?)<\/script>/);
    return JSON.parse(m[1]);
  } catch (e) { return []; }
};

const read = (f) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { return []; } };
const write = (f, d) => { fs.writeFileSync(f + ".tmp", JSON.stringify(d, null, 2)); fs.renameSync(f + ".tmp", f); };
const round = (n) => Math.round(n * 100) / 100;

const app = express();
app.use(express.json({ limit: "50kb" }));

// Only public/ is served, so orders.json and server.js stay private
app.use(express.static(PUBLIC));

const needKey = (req, res, next) =>
  req.get("x-admin-key") === ADMIN_KEY ? next() : res.status(401).json({ error: "Unauthorized" });

// Customer places an order
app.post("/api/orders", (req, res) => {
  const { name, pickup, note, items } = req.body || {};
  if (typeof name !== "string" || !name.trim() || !Array.isArray(items) || !items.length)
    return res.status(400).json({ error: "Invalid order" });

  const menu = readMenu();
  const lines = [];
  let subtotal = 0;
  for (const it of items) {                      // prices come from the HTML menu, not the browser
    const m = menu.find((x) => x.id === it.id);
    const qty = Number(it.qty);
    if (!m || !Number.isInteger(qty) || qty < 1 || qty > 50)
      return res.status(400).json({ error: "Invalid item" });
    lines.push({ id: m.id, name: m.name, price: m.price, qty });
    subtotal += m.price * qty;
  }

  const orders = read(ORDERS);
  const seq = orders.length ? Math.max(...orders.map((o) => o.seq)) + 1 : 101;
  const order = {
    seq, number: "A-" + seq, createdAt: new Date().toISOString(), status: "New",
    name: name.trim().slice(0, 40), pickup: String(pickup || "").slice(0, 60),
    note: String(note || "").slice(0, 200), items: lines,
    subtotal: round(subtotal), tax: round(subtotal * TAX_RATE), total: round(subtotal * (1 + TAX_RATE))
  };
  orders.push(order);
  write(ORDERS, orders);
  res.status(201).json(order);
});

// Staff: list orders and change status
app.get("/api/orders", needKey, (req, res) => res.json(read(ORDERS)));
app.patch("/api/orders/:number", needKey, (req, res) => {
  const orders = read(ORDERS);
  const o = orders.find((x) => x.number === req.params.number);
  if (!o) return res.status(404).json({ error: "Not found" });
  if (!STATUSES.includes(req.body.status)) return res.status(400).json({ error: "Bad status" });
  o.status = req.body.status;
  write(ORDERS, orders);
  res.json(o);
});

app.listen(PORT, () => {
  console.log("Aura Cafe running at http://localhost:" + PORT);
  if (!process.env.ADMIN_KEY) console.log("Warning: using the default admin key. Set ADMIN_KEY before going live.");
});