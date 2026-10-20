/* Landing page menu — reads the menu stored in aura-cafe-order.html */
fetch("aura-cafe-order.html")
  .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
  .then(html => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const items = JSON.parse(doc.getElementById("menuData").textContent);
    const filters = document.getElementById("menuFilters");
    const grid = document.getElementById("menuGrid");
    const cats = [...new Set(items.map(i => i.cat))];

    filters.innerHTML = '<button class="filter-btn active" data-cat="All">All</button>' +
      cats.map(c => `<button class="filter-btn" data-cat="${c}">${c}</button>`).join("");

    grid.innerHTML = items.map(i => `
      <div class="menu-item show" data-cat="${i.cat}">
        <div class="menu-thumb"><img src="${i.img}" alt="${i.name}"></div>
        <div class="menu-info"><h4>${i.name}</h4><p>${i.desc}</p></div>
        <div class="menu-side"><span class="menu-price">$${i.price.toFixed(2)}</span></div>
      </div>`).join("");

    filters.addEventListener("click", e => {
      const b = e.target.closest(".filter-btn");
      if (!b) return;
      filters.querySelectorAll(".filter-btn").forEach(x => x.classList.toggle("active", x === b));
      grid.querySelectorAll(".menu-item").forEach(el =>
        el.classList.toggle("show", b.dataset.cat === "All" || el.dataset.cat === b.dataset.cat));
    });
  })
  .catch(() => {
    document.getElementById("menuGrid").innerHTML =
      '<p style="opacity:.7">Could not load the menu. Open the site with Live Server.</p>';
  });