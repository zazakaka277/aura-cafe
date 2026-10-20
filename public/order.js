(function () {
  "use strict";

  // Menu data is loaded from the HTML (#menuData) at the bottom of this file
  let MENU = [], CATEGORIES = ["All"];
  const TAX_RATE = 0.08;
  const KEY = "aura-cart";

  const $ = (s) => document.querySelector(s);
  const money = (n) => "$" + n.toFixed(2);

  const tabsEl = $("#tabs"), menuContainer = $("#menuContainer"), menuNote = $("#menuNote");
  const cartBody = $("#cartBody"), cartCount = $("#cartCount"), cartPanel = $("#cartPanel") || $("#order");
  const form = $("#orderForm"), orderBtn = $("#placeOrderBtn");
  const toast = $("#toast"), toastText = $("#toastText");
  const modal = $("#modalBackdrop"), nav = $("#nav");

  const state = { cat: "All", cart: {} };

  function load() {
    try {
      const c = JSON.parse(localStorage.getItem(KEY)) || {};
      Object.keys(c).forEach(id => { if (!MENU.some(i => i.id === id)) delete c[id]; });
      return c;
    } catch (e) { return {}; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state.cart)); } catch (e) {} }

  /* ---------- Menu ---------- */
  function renderTabs() {
    tabsEl.innerHTML = "";
    CATEGORIES.forEach(cat => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "tab" + (cat === state.cat ? " active" : "");
      b.textContent = cat;
      b.addEventListener("click", () => { state.cat = cat; renderTabs(); renderMenu(); });
      tabsEl.appendChild(b);
    });
  }

  function renderMenu() {
    const items = MENU.filter(i => state.cat === "All" || i.cat === state.cat);
    menuNote.textContent = items.length + " items" + (state.cat === "All" ? "" : " · " + state.cat);
    const grid = document.createElement("div");
    grid.className = "menu-grid";
    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML =
        '<div class="item-img"><img loading="lazy" alt=""></div>' +
        '<div class="item-body"><div class="item-top"><h3></h3><span class="price"></span></div>' +
        '<p></p><button class="add-btn" type="button">Add</button></div>';
      const img = card.querySelector("img");
      img.alt = item.name;
      img.src = item.img;
      img.addEventListener("error", () => { img.parentNode.textContent = item.icon; });
      card.querySelector("h3").textContent = item.name;
      card.querySelector(".price").textContent = money(item.price);
      card.querySelector("p").textContent = item.desc;
      card.querySelector(".add-btn").addEventListener("click", () => addToCart(item));
      grid.appendChild(card);
    });
    menuContainer.innerHTML = "";
    menuContainer.appendChild(grid);
  }

  /* ---------- Cart ---------- */
  function addToCart(item) {
    state.cart[item.id] = (state.cart[item.id] || 0) + 1;
    renderCart();
    showToast(item.name + " added");
    cartCount.classList.remove("bump");
    void cartCount.offsetWidth;
    cartCount.classList.add("bump");
  }

  function changeQty(id, d) {
    if (!state.cart[id]) return;
    state.cart[id] += d;
    if (state.cart[id] <= 0) delete state.cart[id];
    renderCart();
  }

  function totals() {
    let subtotal = 0, count = 0;
    Object.entries(state.cart).forEach(([id, qty]) => {
      const it = MENU.find(i => i.id === id);
      if (it) { subtotal += it.price * qty; count += qty; }
    });
    const tax = subtotal * TAX_RATE;
    return { subtotal, tax, total: subtotal + tax, count };
  }

  function renderCart() {
    const t = totals();
    cartCount.textContent = t.count;
    form.hidden = !t.count;
    save();
    if (!t.count) {
      cartBody.innerHTML = '<div class="cart-empty">Nothing here yet — add something from the menu.</div>';
      return;
    }
    const rows = Object.entries(state.cart).map(([id, qty]) => {
      const it = MENU.find(i => i.id === id);
      return '<div class="cart-row" data-id="' + id + '"><div class="cr-name">' + it.name +
        "<small>" + money(it.price) + ' each</small></div><div class="qty">' +
        '<button type="button" data-d="-1" aria-label="Remove one">–</button><span>' + qty +
        '</span><button type="button" data-d="1" aria-label="Add one">+</button></div>' +
        '<div class="cr-price">' + money(it.price * qty) + "</div></div>";
    }).join("");
    cartBody.innerHTML = '<div class="cart-list">' + rows + '</div><div class="totals">' +
      '<div class="row"><span>Subtotal</span><span>' + money(t.subtotal) + "</span></div>" +
      '<div class="row"><span>Tax</span><span>' + money(t.tax) + "</span></div>" +
      '<div class="row total"><span>Total</span><span>' + money(t.total) + "</span></div></div>";
    orderBtn.textContent = "Place order · " + money(t.total);
  }

  cartBody.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-d]");
    if (b) changeQty(b.closest(".cart-row").dataset.id, Number(b.dataset.d));
  });

  $("#clearBtn").addEventListener("click", () => { state.cart = {}; renderCart(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const t = totals();
    if (!t.count) return;
    const pick = $("#pickup");
    orderBtn.disabled = true;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: $("#custName").value.trim(),
          pickup: pick.options[pick.selectedIndex].text,
          note: $("#orderNote").value.trim(),
          items: Object.entries(state.cart).map(([id, qty]) => ({ id, qty }))
        })
      });
      if (!res.ok) throw new Error(res.status);
      const order = await res.json();           // saved in orders.json by the server
      $("#orderNum").textContent = "#" + order.number;
      $("#modalMsg").textContent = "Thanks, " + order.name + "! " + t.count +
        (t.count === 1 ? " item" : " items") + " · " + money(order.total) + ". Pickup: " +
        order.pickup.toLowerCase() + ".";
      modal.classList.add("show");
      state.cart = {};
      form.reset();
      renderCart();
      closeCart();
    } catch (err) {
      showToast("Could not place order. Please try again.");
    } finally {
      orderBtn.disabled = false;
    }
  });

  /* ---------- Order panel + nav ---------- */
  const isMobile = () => window.matchMedia("(max-width: 880px)").matches;
  const openCart = () => cartPanel.classList.add("open");
  function closeCart() { cartPanel.classList.remove("open"); }
  function showOrder() {
    if (isMobile()) cartPanel.classList.toggle("open");
    else cartPanel.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  $("#cartToggleBtn").addEventListener("click", showOrder);
  $("#cartPanelClose").addEventListener("click", closeCart);
  $("#burger").addEventListener("click", () => nav.classList.toggle("open"));

  nav.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    nav.classList.remove("open");
    if (a.getAttribute("href") === "#order") { e.preventDefault(); showOrder(); }
  });

  // Highlight the nav link of the section in view
  const links = [...nav.querySelectorAll("a")];
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  ["home", "menu", "about", "contact"].forEach(id => spy.observe($("#" + id)));

  /* ---------- Toast + modal ---------- */
  function showToast(msg) {
    toastText.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
  }
  const closeModal = () => modal.classList.remove("show");
  $("#modalCloseBtn").addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeModal(); closeCart(); nav.classList.remove("open"); } });

  // Menu comes from <script id="menuData"> inside aura-cafe-order.html
  try {
    MENU = JSON.parse($("#menuData").textContent);
    CATEGORIES = ["All", ...new Set(MENU.map(i => i.cat))];
    state.cart = load();
    renderTabs();
    renderMenu();
    renderCart();
  } catch (err) {
    menuNote.textContent = "";
    menuContainer.innerHTML = '<div class="cart-empty">Menu data is missing or has a JSON error (check #menuData in the HTML).</div>';
  }
})();