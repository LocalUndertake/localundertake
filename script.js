/* global state */
let allProducts = [];

/* utils */
function safeLower(v){ return String(v||"").toLowerCase(); }
function escapeHtml(t){ return t?String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""; }

/* crea tarjeta con badge de categoría */
function createProductCard(p){
  const div = document.createElement("div");
  div.className = "product";
  const image = p.image || "assets/default-product.png";
  const category = p.category || "Sin categoría";
  div.innerHTML = `
    <img src="${image}" alt="${escapeHtml(p.name)}">
    <div class="category-badge">${escapeHtml(category)}</div>
    <div class="product-info">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${Number(p.price).toFixed(2)}€</p>
    </div>
  `;
  div.addEventListener("click", ()=> openModal(p));
  return div;
}

/* render con filtros aplicados */
function renderFiltered(){
  const q = safeLower(document.getElementById("search-input").value);
  const cat = document.getElementById("filter-category").value;
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  const filtered = allProducts.filter(p=>{
    const name = safeLower(p.name);
    const seller = safeLower(p.seller);
    const category = safeLower(p.category);
    const matchText = q === "" || name.includes(q) || seller.includes(q) || category.includes(q);
    const matchCat = !cat || (p.category === cat);
    return matchText && matchCat;
  });
  if(filtered.length === 0){
    container.innerHTML = "<p style='text-align:center;color:#64748b;padding:40px 0'>Sin resultados 😔</p>";
    return;
  }
  filtered.forEach(p => container.appendChild(createProductCard(p)));
}

/* carga inicial (JSON + localStorage) */
async function loadProducts(){
  const container = document.getElementById("product-list");
  container.innerHTML = "<p style='text-align:center;padding:40px 0;color:#64748b'>Cargando productos...</p>";
  try {
    const res = await fetch("data/products.json");
    const json = await res.json();
    const local = JSON.parse(localStorage.getItem("localundertake_products") || "[]");
    // Normaliza: asegura campos existentes para evitar errors
    allProducts = [...local, ...json].map(p => ({
      name: p.name || "Sin nombre",
      price: (typeof p.price === "number") ? p.price : Number(p.price) || 0,
      seller: p.seller || "Anónimo",
      category: p.category || "Sin categoría",
      image: p.image || null,
      achievement: p.achievement || ""
    }));
    renderFiltered();
  } catch(err) {
    console.error(err);
    container.innerHTML = "<p style='text-align:center;color:#ef4444;padding:40px 0'>Error al cargar productos 😔</p>";
  }
}

/* modal */
function openModal(p){
  const modal = document.getElementById("product-modal");
  document.getElementById("modal-image").src = p.image || "assets/default-product.png";
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("modal-price").textContent = `💰 ${Number(p.price).toFixed(2)}€`;
  document.getElementById("modal-seller").textContent = `👤 ${p.seller}`;
  document.getElementById("modal-category").textContent = `📦 Categoría: ${p.category || "Sin categoría"}`;
  document.getElementById("modal-achievement").textContent = p.achievement || "";
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden","false");
}
function closeModal(){
  const modal = document.getElementById("product-modal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden","true");
}

/* añadir producto local */
function addLocalProduct(p){
  const key = "localundertake_products";
  const local = JSON.parse(localStorage.getItem(key) || "[]");
  // normalize
  const normalized = {
    name: p.name,
    price: Number(p.price) || 0,
    seller: p.seller || "Anónimo",
    category: p.category || "Sin categoría",
    image: p.image || null,
    achievement: p.achievement || ""
  };
  local.unshift(normalized);
  localStorage.setItem(key, JSON.stringify(local));
  loadProducts();
}

/* limpiar */
function clearLocalProducts(){
  if(confirm("¿Borrar todos los productos locales?")){
    localStorage.removeItem("localundertake_products");
    loadProducts();
  }
}

/* init: hooks y listeners */
function setup(){
  const form = document.getElementById("add-product-form");
  form.addEventListener("submit", e=>{
    e.preventDefault();
    const name = form["product-name"].value.trim();
    const price = Number(form["product-price"].value);
    const seller = form["product-seller"].value.trim();
    const category = form["product-category"].value;
    const image = form["product-image"].value.trim();
    if(!name || !seller || !category || isNaN(price)){
      alert("Por favor, completa todos los campos correctamente.");
      return;
    }
    addLocalProduct({ name, price, seller, category, image: image || null, achievement: "🆕 Añadido localmente" });
    form.reset();
    // Mantener filtros actuales y mostrar nuevo producto
    renderFiltered();
  });

  document.getElementById("clear-local").addEventListener("click", clearLocalProducts);
  document.getElementById("close-modal").addEventListener("click", closeModal);
  window.addEventListener("click", e => { if(e.target.id === "product-modal") closeModal(); });

  // búsqueda y filtro
  const searchInput = document.getElementById("search-input");
  const filterCategory = document.getElementById("filter-category");
  // Debounce simple para evitar re-render excesivo
  let timer = null;
  searchInput.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(renderFiltered, 120);
  });
  filterCategory.addEventListener("change", renderFiltered);

  // accesibilidad: enter en select aplica filtro
}

/* arrancar */
document.addEventListener("DOMContentLoaded", () => {
  setup();
  loadProducts();
});
