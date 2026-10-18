
(function () {
  "use strict";

  const MENU = [
    { id: "esp", cat: "Coffee", icon: "☕", name: "Ember Espresso", desc: "Double shot, dark cocoa notes, bright finish.", price: 3.50 },
    { id: "oat-latte", cat: "Coffee", icon: "☕", name: "Amber Oat Latte", desc: "Espresso, steamed oat milk, a trace of honey.", price: 5.25 },
    { id: "mocha", cat: "Coffee", icon: "☕", name: "Midnight Mocha", desc: "Rich cocoa and espresso, soft whipped cream.", price: 5.75 },
    { id: "filter", cat: "Coffee", icon: "☕", name: "Slow Pour Filter", desc: "Single-origin, floral with a citrus finish.", price: 4.00 },
    { id: "chai", cat: "Tea & Chai", icon: "🍵", name: "Golden Turmeric Chai", desc: "Black tea, warm spice, turmeric, steamed milk.", price: 4.50 },
    { id: "jasmine", cat: "Tea & Chai", icon: "🍵", name: "Jasmine Pearl Tea", desc: "Hand-rolled green tea, delicate floral aroma.", price: 4.00 },
    { id: "ginger", cat: "Tea & Chai", icon: "🍵", name: "Honey Ginger Steeper", desc: "Fresh ginger, chamomile, a little raw honey.", price: 4.25 },
    { id: "croissant", cat: "Pastries", icon: "🥐", name: "Brown Butter Croissant", desc: "Laminated dough, baked until deep golden.", price: 4.00 },
    { id: "cardamom", cat: "Pastries", icon: "🥐", name: "Cardamom Bun", desc: "Soft milk bun, cardamom sugar glaze.", price: 3.75 },
    { id: "fig-loaf", cat: "Pastries", icon: "🥐", name: "Fig & Walnut Loaf", desc: "Dense quick bread, toasted walnuts, dried fig.", price: 4.50 },
    { id: "olive-cake", cat: "Pastries", icon: "🥐", name: "Olive Oil Cake", desc: "Citrus-soaked, finished with a thin glaze.", price: 4.25 },
    { id: "coldbrew", cat: "Cold Pours", icon: "🧊", name: "Cold Brew Aura", desc: "Steeped 18 hours, smooth and low-acid.", price: 4.75 },
    { id: "cascara", cat: "Cold Pours", icon: "🧊", name: "Citrus Cascara Fizz", desc: "Coffee-cherry tea, soda water, orange peel.", price: 5.00 },
    { id: "iced-oat", cat: "Cold Pours", icon: "🧊", name: "Iced Vanilla Oat Latte", desc: "Espresso, oat milk, house vanilla syrup.", price: 5.50 }
  ];

  const CATEGORIES = [...new Set(MENU.map(m => m.cat))];
  const TAX_RATE = 0.08;

  const state = {
    activeCategory: CATEGORIES[0],
    cart: {} // id -> qty
  };

  const $ = (sel) => document.querySelector(sel);
  const tabsEl = $("#tabs");
  const menuContainer = $("#menuContainer");
  const cartBody = $("#cartBody");
  const cartCount = $("#cartCount");
  const cartPanel = $("#cartPanel");
  const toast = $("#toast");
  const toastText = $("#toastText");

  function formatMoney(n) { return "$" + n.toFixed(2); }

  function renderTabs() {
    tabsEl.innerHTML = "";
    CATEGORIES.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "tab" + (cat === state.activeCategory ? " active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        state.activeCategory = cat;
        renderTabs();
        renderMenu();
      });
      tabsEl.appendChild(btn);
    });
  }

  function renderMenu() {
    menuContainer.innerHTML = "";
    const section = document.createElement("section");
    section.className = "menu-section";
    const items = MENU.filter(m => m.cat === state.activeCategory);

    const h2 = document.createElement("h2");
    h2.textContent = state.activeCategory;
    const note = document.createElement("p");
    note.className = "section-note";
    note.textContent = items.length + " items";
    section.appendChild(h2);
    section.appendChild(note);

    const grid = document.createElement("div");
    grid.className = "menu-grid";

    items.forEach(item => {
      const card = document.createElement("div");
      card.className = "item-card";
      card.innerHTML = `
        <div class="item-glow">${item.icon}</div>
        <div class="item-body">
          <div class="item-top">
            <h3>${item.name}</h3>
            <span class="item-price">${formatMoney(item.price)}</span>
          </div>
          <p>${item.desc}</p>
          <button class="add-btn" type="button">Add</button>
        </div>
      `;
      card.querySelector(".add-btn").addEventListener("click", () => addToCart(item));
      grid.appendChild(card);
    });

    section.appendChild(grid);
    menuContainer.appendChild(section);
  }

  function addToCart(item) {
    state.cart[item.id] = (state.cart[item.id] || 0) + 1;
    renderCart();
    showToast(item.name + " added");
    bumpCount();
  }

  function changeQty(id, delta) {
    if (!state.cart[id]) return;
    state.cart[id] += delta;
    if (state.cart[id] <= 0) delete state.cart[id];
    renderCart();
  }

  function bumpCount() {
    cartCount.classList.remove("bump");
    void cartCount.offsetWidth;
    cartCount.classList.add("bump");
  }

  function showToast(msg) {
    toastText.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function cartTotals() {
    let subtotal = 0, count = 0;
    Object.entries(state.cart).forEach(([id, qty]) => {
      const item = MENU.find(m => m.id === id);
      if (item) { subtotal += item.price * qty; count += qty; }
    });
    const tax = subtotal * TAX_RATE;
    return { subtotal, tax, total: subtotal + tax, count };
  }

  function renderCart() {
    const { subtotal, tax, total, count } = cartTotals();
    cartCount.textContent = count;

    if (count === 0) {
      cartBody.innerHTML = `<div class="cart-empty">Nothing here yet — add something from the menu.</div>`;
      return;
    }

    let rowsHtml = "";
    Object.entries(state.cart).forEach(([id, qty]) => {
      const item = MENU.find(m => m.id === id);
      if (!item) return;
      rowsHtml += `
        <div class="cart-row" data-id="${id}">
          <div class="cr-name">${item.name}<small>${formatMoney(item.price)} each</small></div>
          <div class="qty-control">
            <button type="button" data-action="dec">–</button>
            <span>${qty}</span>
            <button type="button" data-action="inc">+</button>
          </div>
          <div class="cr-price">${formatMoney(item.price * qty)}</div>
        </div>
      `;
    });

    cartBody.innerHTML = `
      <div class="cart-list">${rowsHtml}</div>
      <div class="cart-totals">
        <div class="row"><span>Subtotal</span><span>${formatMoney(subtotal)}</span></div>
        <div class="row"><span>Tax</span><span>${formatMoney(tax)}</span></div>
        <div class="row total"><span>Total</span><span>${formatMoney(total)}</span></div>
      </div>
      <div class="note-field">
        <label for="orderNote">Note for the barista (optional)</label>
        <textarea id="orderNote" placeholder="Oat milk only, extra hot, etc."></textarea>
      </div>
      <button class="place-order" id="placeOrderBtn" type="button">Place order · ${formatMoney(total)}</button>
    `;

    cartBody.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const row = e.target.closest(".cart-row");
        const id = row.getAttribute("data-id");
        const delta = btn.getAttribute("data-action") === "inc" ? 1 : -1;
        changeQty(id, delta);
      });
    });

    $("#placeOrderBtn").addEventListener("click", placeOrder);
  }

  function placeOrder() {
    const { count } = cartTotals();
    if (count === 0) return;
    const orderNum = "A-" + (100 + Math.floor(Math.random() * 90));
    $("#orderNum").textContent = "#" + orderNum;
    $("#modalBackdrop").classList.add("show");
    state.cart = {};
    renderCart();
    closeMobileCart();
  }

  function openMobileCart() { cartPanel.classList.add("open"); }
  function closeMobileCart() { cartPanel.classList.remove("open"); }

  $("#cartToggleBtn").addEventListener("click", () => {
    if (window.matchMedia("(max-width: 880px)").matches) {
      cartPanel.classList.contains("open") ? closeMobileCart() : openMobileCart();
    } else {
      cartPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  $("#cartPanelClose").addEventListener("click", closeMobileCart);
  $("#modalCloseBtn").addEventListener("click", () => $("#modalBackdrop").classList.remove("show"));
  $("#modalBackdrop").addEventListener("click", (e) => {
    if (e.target.id === "modalBackdrop") $("#modalBackdrop").classList.remove("show");
  });

  renderTabs();
  renderMenu();
  renderCart();
})();
