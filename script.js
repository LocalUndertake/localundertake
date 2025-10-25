/* ===== estado global ===== */
let allProducts = [];          // array de productos (local + data)
let sellerProfiles = {};       // perfiles generados
let currentProfile = null;     // vendedor abierto
const LOCAL_PRODUCTS_KEY = "localundertake_products";
const LOCAL_REVIEWS_KEY = "localundertake_reviews";

/* ===== utilidades ===== */
function safeLower(v){ return String(v || "").toLowerCase(); }
function escapeHtml(t){ return t ? String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : ""; }
function dicebearAvatar(seed, size=128){
  // Genera URL DiceBear initials (sin requerir API key)
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,89cff0,f0a6ca`;
}

/* ===== creación tarjetas y DOM ===== */
function createProductCard(p){
  const div = document.createElement("div");
  div.className = "product";
  const image = p.image || `https://via.placeholder.com/600x400?text=${encodeURIComponent(p.name || "Producto")}`;
  const category = p.category || "Sin categoría";
  div.innerHTML = `
    <img src="${image}" alt="${escapeHtml(p.name)}">
    <div class="category-badge">${escapeHtml(category)}</div>
    <div class="product-info">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${Number(p.price).toFixed(2)}€</p>
    </div>
  `;

  // 🔹 Si la tarjeta se genera dentro del perfil, al hacer clic debe cerrar el perfil y abrir el modal del producto
  div.addEventListener("click", ()=> {
    const profileModal = document.getElementById("profile-modal");
    if (profileModal.style.display === "flex") {
      closeProfile(); // Cerrar perfil antes de abrir el modal
    }
    openModal(p);
  });

  return div;
}

/* ===== carga inicial (data/products.json + localStorage) ===== */
async function loadProducts(){
  const container = document.getElementById("product-list");
  container.innerHTML = `<p class="placeholder">Cargando productos...</p>`;
  try {
    const res = await fetch("data/products.json");
    const json = await res.json();
    const local = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");
    // normalizar y combinar (local primero)
    allProducts = [...local, ...json].map(p => ({
      name: p.name || "Sin nombre",
      price: (typeof p.price === "number") ? p.price : Number(p.price) || 0,
      seller: p.seller || "Anónimo",
      category: p.category || "Sin categoría",
      image: p.image || null,
      achievement: p.achievement || ""
    }));
    buildProfiles();
    renderFiltered();
  } catch(err){
    console.error(err);
    container.innerHTML = `<p style="text-align:center;color:#ef4444;padding:40px 0">Error al cargar productos</p>`;
  }
}

/* ===== perfiles (por vendedor) ===== */
function buildProfiles(){
  sellerProfiles = {};
  allProducts.forEach(p => {
    const key = p.seller;
    if(!sellerProfiles[key]){
      sellerProfiles[key] = {
        name: key,
        avatar: dicebearAvatar(key),
        bio: `Vendedor local — ${key}`,
        products: []
      };
    }
    sellerProfiles[key].products.push(p);
  });
  // cargar reseñas previas (si existen)
  const reviewsStore = JSON.parse(localStorage.getItem(LOCAL_REVIEWS_KEY) || "{}");
  Object.keys(sellerProfiles).forEach(s => {
    sellerProfiles[s].reviews = reviewsStore[s] || [];
  });
}

/* ===== RENDER y FILTROS ===== */
function renderFiltered(){
  const q = safeLower(document.getElementById("search-input").value || "");
  const cat = document.getElementById("filter-category").value || "";
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  const filtered = allProducts.filter(p=>{
    const name = safeLower(p.name);
    const seller = safeLower(p.seller);
    const category = safeLower(p.category);
    const matchText = q === "" || name.includes(q) || seller.includes(q) || category.includes(q);
    const matchCat = !cat || p.category === cat;
    return matchText && matchCat;
  });
  if(filtered.length === 0){
    container.innerHTML = `<p style="text-align:center;color:#64748b;padding:40px 0">Sin resultados</p>`;
    return;
  }
  filtered.forEach(p => container.appendChild(createProductCard(p)));
}

/* ===== MODAL PRODUCTO ===== */
function openModal(p){
  const modal = document.getElementById("product-modal");
  document.getElementById("modal-image").src = p.image || `https://via.placeholder.com/600x400?text=${encodeURIComponent(p.name)}`;
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("modal-price").textContent = `💰 ${Number(p.price).toFixed(2)}€`;
  // vendedor clicable
  const sellerEl = document.getElementById("modal-seller");
  sellerEl.innerHTML = `👤 <a href="#" id="seller-link">${escapeHtml(p.seller)}</a>`;
  sellerEl.querySelector("#seller-link").addEventListener("click", (ev)=>{
    ev.preventDefault();
    closeModal();
    openProfile(p.seller);
  });
  document.getElementById("modal-category").textContent = `📦 ${p.category || "Sin categoría"}`;
  document.getElementById("modal-achievement").textContent = p.achievement || "";
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden","false");
}
function closeModal(){
  const modal = document.getElementById("product-modal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden","true");
}

/* ===== PERFIL DE VENDEDOR ===== */
function openProfile(sellerName){
  const profile = sellerProfiles[sellerName];
  if(!profile) return;
  currentProfile = sellerName;
  document.getElementById("profile-avatar").src = profile.avatar;
  document.getElementById("profile-name").textContent = profile.name;
  document.getElementById("profile-name-2").textContent = profile.name;
  document.getElementById("profile-bio").value = profile.bio || "";
  // Contactar: abre WhatsApp con texto predefinido (no es obligatorio)
  document.getElementById("contact-seller").onclick = () => {
    const text = encodeURIComponent(`Hola ${profile.name}, estoy interesado en tus productos en LocalUndertake.`);
    const wa = `https://wa.me/?text=${text}`;
    window.open(wa, "_blank");
  };

  // productos del vendedor
  const grid = document.getElementById("profile-products");
  grid.innerHTML = "";
  grid.style.overflowY = "auto";      // 🔹 permitir scroll vertical
  grid.style.maxHeight = "60vh";     // 🔹 límite de altura con scroll
  (profile.products || []).forEach(p => grid.appendChild(createProductCard(p)));

  // reseñas
  renderReviews(profile.name);

  // mostrar modal perfil
  const modal = document.getElementById("profile-modal");
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden","false");
}

/* Guardar bio */
function saveBioForCurrent(){
  if(!currentProfile) return;
  const text = document.getElementById("profile-bio").value.trim();
  sellerProfiles[currentProfile].bio = text;
  const store = JSON.parse(localStorage.getItem(LOCAL_REVIEWS_KEY) || "{}");
  store[`__bio__:${currentProfile}`] = text;
  localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(store));
  alert("Bio guardada.");
}

/* ===== RESEÑAS ===== */
function getReviewsStore(){
  return JSON.parse(localStorage.getItem(LOCAL_REVIEWS_KEY) || "{}");
}
function saveReviewsStore(obj){ localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify(obj)); }

function renderReviews(sellerName){
  const reviewsDiv = document.getElementById("reviews-list");
  reviewsDiv.innerHTML = "";
  const store = getReviewsStore();
  const reviews = store[sellerName] || [];
  if(reviews.length === 0){
    reviewsDiv.innerHTML = `<p style="color:#64748b">Aún no hay reseñas — sé el primero.</p>`;
    return;
  }
  reviews.slice().reverse().forEach(r => {
    const d = document.createElement("div");
    d.className = "review";
    d.innerHTML = `<div class="meta"><span class="stars">${"★".repeat(r.rating)}</span> ${escapeHtml(r.reviewer)} — <span style="color:#94a3b8;font-weight:500">${new Date(r.date).toLocaleString()}</span></div>
                   <div class="body">${escapeHtml(r.text)}</div>`;
    reviewsDiv.appendChild(d);
  });
}

function addReviewForCurrent(e){
  e.preventDefault();
  if(!currentProfile) return alert("No hay perfil abierto.");
  const reviewer = document.getElementById("reviewer-name").value.trim();
  const rating = Number(document.getElementById("review-rating").value);
  const text = document.getElementById("review-text").value.trim();
  if(!reviewer || !rating || !text) return alert("Completa todos los campos de la reseña.");
  const store = getReviewsStore();
  store[currentProfile] = store[currentProfile] || [];
  store[currentProfile].push({ reviewer, rating, text, date: new Date().toISOString() });
  saveReviewsStore(store);
  renderReviews(currentProfile);
  document.getElementById("add-review-form").reset();
}

/* borrar reseñas */
function clearReviewsForCurrent(){
  if(!currentProfile) return;
  if(!confirm("Borrar todas las reseñas de este vendedor?")) return;
  const store = getReviewsStore();
  delete store[currentProfile];
  saveReviewsStore(store);
  renderReviews(currentProfile);
}

/* cerrar perfil */
function closeProfile(){
  const modal = document.getElementById("profile-modal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden","true");
  currentProfile = null;
}

/* ===== añadir producto local ===== */
function addLocalProduct(p){
  const local = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");
  const normalized = {
    name: p.name,
    price: Number(p.price) || 0,
    seller: p.seller || "Anónimo",
    category: p.category || "Sin categoría",
    image: p.image || null,
    achievement: p.achievement || ""
  };
  local.unshift(normalized);
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(local));
  loadProducts();
}

/* borrar productos locales */
function clearLocalProducts(){
  if(!confirm("Borrar todos los productos añadidos localmente?")) return;
  localStorage.removeItem(LOCAL_PRODUCTS_KEY);
  loadProducts();
}

/* ===== inicialización y listeners ===== */
function setup(){
  const form = document.getElementById("add-product-form");
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = form["product-name"].value.trim();
    const price = Number(form["product-price"].value);
    const seller = form["product-seller"].value.trim();
    const category = form["product-category"].value;
    const image = form["product-image"].value.trim();
    if(!name || !seller || !category || isNaN(price)) {
      return alert("Por favor, completa todos los campos correctamente.");
    }
    addLocalProduct({ name, price, seller, category, image: image || null, achievement: "🆕 Añadido localmente" });
    form.reset();
    document.getElementById("filter-category").value = "";
  });

  document.getElementById("clear-local").addEventListener("click", clearLocalProducts);

  document.getElementById("close-modal").addEventListener("click", closeModal);
  window.addEventListener("click", (e)=> { if(e.target.id === "product-modal") closeModal(); });

  document.getElementById("close-profile").addEventListener("click", closeProfile);
  window.addEventListener("click", (e)=> { if(e.target.id === "profile-modal") closeProfile(); });

  const searchInput = document.getElementById("search-input");
  let timer = null;
  searchInput.addEventListener("input", ()=> {
    clearTimeout(timer);
    timer = setTimeout(renderFiltered, 140);
  });
  document.getElementById("filter-category").addEventListener("change", renderFiltered);

  document.getElementById("save-bio").addEventListener("click", saveBioForCurrent);
  document.getElementById("contact-seller").addEventListener("click", ()=> {});

  document.getElementById("add-review-form").addEventListener("submit", addReviewForCurrent);
  document.getElementById("clear-reviews").addEventListener("click", clearReviewsForCurrent);
}

/* arrancar */
document.addEventListener("DOMContentLoaded", ()=>{
  setup();
  loadProducts();
});
