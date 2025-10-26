/* ===== Estado global ===== */
let allProducts = [];
let sellerProfiles = {};
let currentProfile = null;
const LOCAL_PRODUCTS_KEY = "localundertake_products";
const LOCAL_REVIEWS_KEY = "localundertake_reviews";
const LOCAL_USER_KEY = "localundertake_user";

/* ===== Utilidades ===== */
function safeLower(v){ return String(v || "").toLowerCase(); }
function escapeHtml(t){ return t ? String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : ""; }
function dicebearAvatar(seed){
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,89cff0,f0a6ca`;
}

/* ===== Perfil del usuario actual ===== */
function getUserProfile(){
  return JSON.parse(localStorage.getItem(LOCAL_USER_KEY) || "null");
}
function saveUserProfile(profile){
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
  updateUserIcon();
}
function updateUserIcon(){
  const icon = document.getElementById("user-profile-icon");
  const user = getUserProfile();
  if(!icon) return;
  if(user && user.name){
    icon.style.backgroundImage = `url('${dicebearAvatar(user.name)}')`;
  } else {
    icon.style.backgroundImage = `url('https://api.dicebear.com/9.x/initials/svg?seed=User')`;
  }
}

/* ===== Crear tarjeta de producto ===== */
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
      <p style="color:#555;font-size:0.9rem;">👤 ${escapeHtml(p.seller)}</p>
    </div>
  `;
  div.addEventListener("click", ()=> openModal(p));
  return div;
}

/* ===== Cargar productos ===== */
async function loadProducts(){
  const container = document.getElementById("product-list");
  container.innerHTML = `<p class="placeholder">Cargando productos...</p>`;
  try {
    const res = await fetch("data/products.json");
    const json = await res.json();
    const local = JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");

    allProducts = [...local, ...json].map(p => ({
      name: p.name || "Sin nombre",
      price: Number(p.price) || 0,
      seller: p.seller || "Anónimo",
      category: p.category || "Sin categoría",
      image: p.image || null,
      achievement: p.achievement || ""
    }));

    buildProfiles();
    renderFiltered();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p style="text-align:center;color:#ef4444;padding:40px 0">Error al cargar productos.</p>`;
  }
}

/* ===== Construir perfiles ===== */
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

  // cargar reseñas previas
  const reviewsStore = JSON.parse(localStorage.getItem(LOCAL_REVIEWS_KEY) || "{}");
  Object.keys(sellerProfiles).forEach(s => {
    sellerProfiles[s].reviews = reviewsStore[s] || [];
    if(reviewsStore[`__bio__:${s}`]) sellerProfiles[s].bio = reviewsStore[`__bio__:${s}`];
  });
}

/* ===== Renderizado y filtros ===== */
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

/* ===== Modal de producto ===== */
function openModal(p){
  closeProfile();
  closeUserModal();
  const modal = document.getElementById("product-modal");
  document.getElementById("modal-image").src = p.image || `https://via.placeholder.com/600x400?text=${encodeURIComponent(p.name)}`;
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("modal-price").textContent = `💰 ${Number(p.price).toFixed(2)}€`;
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

/* ===== Perfil del usuario (modal propio) ===== */
function openUserModal(){
  const modal = document.getElementById("user-modal");
  const user = getUserProfile() || {};
  document.getElementById("user-name").value = user.name || "";
  document.getElementById("user-bio").value = user.bio || "";
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden","false");
}
function closeUserModal(){
  const modal = document.getElementById("user-modal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden","true");
}

/* ===== Añadir producto local ===== */
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

function clearLocalProducts(){
  if(!confirm("¿Borrar todos los productos locales?")) return;
  localStorage.removeItem(LOCAL_PRODUCTS_KEY);
  loadProducts();
}

/* ===== Inicialización ===== */
function setup(){
  const form = document.getElementById("add-product-form");
  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const name = form["product-name"].value.trim();
    const price = Number(form["product-price"].value);
    const category = form["product-category"].value;
    const image = form["product-image"].value.trim();
    const user = getUserProfile();
    const seller = user?.name || "Anónimo";
    if(!name || !category || isNaN(price)){
      return alert("Por favor, completa todos los campos correctamente.");
    }
    addLocalProduct({ name, price, seller, category, image, achievement: "🆕 Añadido localmente" });
    form.reset();
  });

  document.getElementById("clear-local").addEventListener("click", clearLocalProducts);
  document.getElementById("close-modal").addEventListener("click", closeModal);
  document.getElementById("close-user-modal").addEventListener("click", closeUserModal);

  document.getElementById("user-profile-icon").addEventListener("click", openUserModal);
  document.getElementById("save-user-profile").addEventListener("click", ()=>{
    const name = document.getElementById("user-name").value.trim();
    const bio = document.getElementById("user-bio").value.trim();
    if(!name) return alert("Introduce un nombre para tu perfil.");
    saveUserProfile({ name, bio });
    closeUserModal();
    alert("Perfil guardado correctamente.");
  });

  const searchInput = document.getElementById("search-input");
  let timer = null;
  searchInput.addEventListener("input", ()=> {
    clearTimeout(timer);
    timer = setTimeout(renderFiltered, 140);
  });
  document.getElementById("filter-category").addEventListener("change", renderFiltered);

  updateUserIcon();
  loadProducts();
}

/* ===== Arranque ===== */
document.addEventListener("DOMContentLoaded", setup);
