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

  // Al hacer click en la tarjeta:
  div.addEventListener("click", ()=> {
    // cerrar perfil si está abierto (si existe)
    const profileModal = document.getElementById("profile-modal");
    if (profileModal && profileModal.style.display === "flex") {
      closeProfile();
    }
    openModal(p);
  });

  return div;
}

/* ===== carga inicial (data/products.json + localStorage) ===== */
async function loadProducts(){
  const container = document.getElementById("product-list");
  if (container) container.innerHTML = `<p class="placeholder">Cargando productos...</p>`;
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
    if (container) container.innerHTML = `<p style="text-align:center;color:#ef4444;padding:40px 0">Error al cargar productos</p>`;
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
    // si existe bio guardada en reviews store, restaurarla
    const bioKey = `__bio__:${s}`;
    if (reviewsStore[bioKey]) sellerProfiles[s].bio = reviewsStore[bioKey];
  });
}

/* ===== RENDER y FILTROS ===== */
function renderFiltered(){
  const searchInputEl = document.getElementById("search-input");
  const filterEl = document.getElementById("filter-category");

  const q = safeLower(searchInputEl ? searchInputEl.value : "");
  const cat = filterEl ? (filterEl.value || "") : "";
  const container = document.getElementById("product-list");
  if (!container) return;

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
  if (!modal) return;
  const imgEl = document.getElementById("modal-image");
  const nameEl = document.getElementById("modal-name");
  const priceEl = document.getElementById("modal-price");
  const sellerEl = document.getElementById("modal-seller");
  const categoryEl = document.getElementById("modal-category");
  const achievementEl = document.getElementById("modal-achievement");

  if (imgEl) imgEl.src = p.image || `https://via.placeholder.com/600x400?text=${encodeURIComponent(p.name)}`;
  if (nameEl) nameEl.textContent = p.name;
  if (priceEl) priceEl.textContent = `💰 ${Number(p.price).toFixed(2)}€`;

  if (sellerEl) {
    sellerEl.innerHTML = `👤 <a href="#" id="seller-link">${escapeHtml(p.seller)}</a>`;
    const link = sellerEl.querySelector("#seller-link");
    if (link) {
      link.addEventListener("click", (ev)=>{
        ev.preventDefault();
        closeModal();
        openProfile(p.seller);
      });
    }
  }

  if (categoryEl) categoryEl.textContent = `📦 ${p.category || "Sin categoría"}`;
  if (achievementEl) achievementEl.textContent = p.achievement || "";

  modal.style.display = "flex";
  modal.setAttribute("aria-hidden","false");
}
function closeModal(){
  const modal = document.getElementById("product-modal");
  if(!modal) return;
  modal.style.display = "none";
  modal.setAttribute("aria-hidden","true");
}

/* ===== PERFIL DE VENDEDOR ===== */
function openProfile(sellerName){
  const profile = sellerProfiles[sellerName];
  if(!profile) return;
  currentProfile = sellerName;

  const avatarEl = document.getElementById("profile-avatar");
  const nameEl = document.getElementById("profile-name");
  const nameEl2 = document.getElementById("profile-name-2");
  const bioEl = document.getElementById("profile-bio");
  const contactBtn = document.getElementById("contact-seller");
  const grid = document.getElementById("profile-products");
  const reviewsList = document.getElementById("reviews-list");

  if (avatarEl) avatarEl.src = profile.avatar;
  if (nameEl) nameEl.textContent = profile.name;
  if (nameEl2) nameEl2.textContent = profile.name;
  if (bioEl) bioEl.value = profile.bio || "";

  if (contactBtn) {
    contactBtn.onclick = () => {
      const text = encodeURIComponent(`Hola ${profile.name}, estoy interesado en tus productos en LocalUndertake.`);
      const wa = `https://wa.me/?text=${text}`;
      window.open(wa, "_blank");
    };
  }

  if (grid) {
    grid.innerHTML = "";
    // permitir scroll dentro del grid de perfil y limitar altura
    grid.style.overflowY = "auto";
    grid.style.maxHeight = "60vh";
    (profile.products || []).forEach(p => {
      // crear tarjeta compacta (usamos createProductCard, pero evitar doble-close)
      const card = createProductCard(p);
      // cuando se hace click en la tarjeta desde el perfil, createProductCard ya cerrará perfil antes de abrir el modal
      grid.appendChild(card);
    });
  }

  // render reseñas
  renderReviews(profile.name);

  // mostrar modal perfil
  const modal = document.getElementById("profile-modal");
  if (modal) {
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden","false");
  }
}

/* Guardar bio (persistimos en el mismo store de reviews para simplicidad) */
function saveBioForCurrent(){
  if(!currentProfile) return;
  const text = (document.getElementById("profile-bio") || {value:""}).value.trim();
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
  if(!reviewsDiv) return;
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
  const reviewerEl = document.getElementById("reviewer-name");
  const ratingEl = document.getElementById("review-rating");
  const textEl = document.getElementById("review-text");
  const reviewer = reviewerEl ? reviewerEl.value.trim() : "";
  const rating = ratingEl ? Number(ratingEl.value) : 0;
  const text = textEl ? textEl.value.trim() : "";

  if(!reviewer || !rating || !text) return alert("Completa todos los campos de la reseña.");
  const store = getReviewsStore();
  store[currentProfile] = store[currentProfile] || [];
  store[currentProfile].push({ reviewer, rating, text, date: new Date().toISOString() });
  saveReviewsStore(store);
  renderReviews(currentProfile);
  const form = document.getElementById("add-review-form");
  if (form) form.reset();
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
  if(!modal) return;
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
  // formulario añadir producto (si existe)
  const form = document.getElementById("add-product-form");
  if (form) {
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
      const filterEl = document.getElementById("filter-category");
      if (filterEl) filterEl.value = "";
    });
  }

  const clearLocalBtn = document.getElementById("clear-local");
  if (clearLocalBtn) clearLocalBtn.addEventListener("click", clearLocalProducts);

  const closeModalBtn = document.getElementById("close-modal");
  if (closeModalBtn) closeModalBtn.addEventListener("click", closeModal);
  window.addEventListener("click", (e)=> { if(e.target && e.target.id === "product-modal") closeModal(); });

  const closeProfileBtn = document.getElementById("close-profile");
  if (closeProfileBtn) closeProfileBtn.addEventListener("click", closeProfile);
  window.addEventListener("click", (e)=> { if(e.target && e.target.id === "profile-modal") closeProfile(); });

  // BUSCAR + FILTRAR (debounce)
  const searchInput = document.getElementById("search-input");
  let timer = null;
  if (searchInput) {
    searchInput.addEventListener("input", ()=> {
      clearTimeout(timer);
      timer = setTimeout(renderFiltered, 140);
    });
  }

  const filterEl = document.getElementById("filter-category");
  if (filterEl) filterEl.addEventListener("change", renderFiltered);

  const saveBioBtn = document.getElementById("save-bio");
  if (saveBioBtn) saveBioBtn.addEventListener("click", saveBioForCurrent);

  const contactSellerBtn = document.getElementById("contact-seller");
  if (contactSellerBtn) contactSellerBtn.addEventListener("click", ()=> { /* definido dinámicamente en openProfile */ });

  const reviewForm = document.getElementById("add-review-form");
  if (reviewForm) reviewForm.addEventListener("submit", addReviewForCurrent);

  const clearReviewsBtn = document.getElementById("clear-reviews");
  if (clearReviewsBtn) clearReviewsBtn.addEventListener("click", clearReviewsForCurrent);
}

/* arrancar */
document.addEventListener("DOMContentLoaded", ()=>{
  setup();
  loadProducts();
});
