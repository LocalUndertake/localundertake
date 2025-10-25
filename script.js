const localKey = "localundertake_products";
let allProducts = [];
let sellerProfiles = {};
let currentProfile = null;

// ========== Cargar productos ==========
document.addEventListener("DOMContentLoaded", () => {
  setupForm();
  loadProducts();
  setupSearch();
});

// Crear tarjeta
function createProductCard(p) {
  const div = document.createElement("div");
  div.className = "product";
  div.innerHTML = `
    <img src="${p.image || 'https://via.placeholder.com/200'}" alt="${p.name}">
    <h3>${p.name}</h3>
    <p><strong>💰 ${Number(p.price).toFixed(2)}€</strong></p>
    <p>📂 ${p.category}</p>
    <p>👤 ${p.seller}</p>
  `;
  div.addEventListener("click", () => openModal(p));
  return div;
}

// Cargar productos desde JSON + localStorage
async function loadProducts() {
  let initial = [];
  try {
    const res = await fetch("data/products.json");
    initial = await res.json();
  } catch {}
  let local = JSON.parse(localStorage.getItem(localKey) || "[]");
  allProducts = [...local, ...initial];
  renderProducts(allProducts);
  generateProfiles();
}

// Mostrar productos
function renderProducts(list) {
  const container = document.getElementById("product-list");
  container.innerHTML = "";
  if (list.length === 0) {
    container.innerHTML = "<p>No hay productos 😔</p>";
    return;
  }
  list.forEach(p => container.appendChild(createProductCard(p)));
}

// Añadir producto
function setupForm() {
  const form = document.getElementById("add-product-form");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = productName.value.trim();
    const price = Number(productPrice.value);
    const seller = productSeller.value.trim();
    const image = productImage.value.trim();
    const category = productCategory.value;

    if (!name || !seller || !category) return alert("Completa todos los campos");

    const newP = { name, price, seller, image, category, achievement: "🆕 Producto añadido localmente" };
    const current = JSON.parse(localStorage.getItem(localKey) || "[]");
    current.unshift(newP);
    localStorage.setItem(localKey, JSON.stringify(current));
    form.reset();
    loadProducts();
  });

  document.getElementById("clear-local").addEventListener("click", () => {
    if (confirm("¿Borrar productos locales?")) {
      localStorage.removeItem(localKey);
      loadProducts();
    }
  });
}

// Buscar y filtrar
function setupSearch() {
  const input = document.getElementById("search-input");
  const filter = document.getElementById("filter-category");
  input.addEventListener("input", applyFilters);
  filter.addEventListener("change", applyFilters);
}

function applyFilters() {
  const text = document.getElementById("search-input").value.toLowerCase();
  const cat = document.getElementById("filter-category").value;
  const filtered = allProducts.filter(p =>
    (!cat || p.category === cat) &&
    (p.name.toLowerCase().includes(text) || p.seller.toLowerCase().includes(text))
  );
  renderProducts(filtered);
}

// ========== MODAL PRODUCTO ==========
function openModal(p) {
  document.getElementById("modal-image").src = p.image || "https://via.placeholder.com/200";
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("modal-price").textContent = `💰 ${p.price} €`;
  const sellerEl = document.getElementById("modal-seller");
  sellerEl.textContent = `👤 ${p.seller}`;
  sellerEl.onclick = () => { closeModal(); openProfile(p.seller); };
  document.getElementById("modal-category").textContent = `📂 Categoría: ${p.category}`;
  document.getElementById("modal-achievement").textContent = p.achievement || "";
  document.getElementById("product-modal").style.display = "flex";
}
function closeModal() {
  document.getElementById("product-modal").style.display = "none";
}

// ========== PERFIL ==========
function generateProfiles() {
  sellerProfiles = {};
  allProducts.forEach(p => {
    if (!sellerProfiles[p.seller]) {
      sellerProfiles[p.seller] = {
        name: p.seller,
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=" + encodeURIComponent(p.seller),
        bio: "Emprendedor local que confía en LocalUndertake 💼",
        products: []
      };
    }
    sellerProfiles[p.seller].products.push(p);
  });
}

function openProfile(sellerName){
  const profile = sellerProfiles[sellerName];
  if(!profile) return;
  currentProfile = sellerName;

  document.getElementById("profile-avatar").src = profile.avatar;
  document.getElementById("profile-name").textContent = profile.name;
  document.getElementById("profile-name-2").textContent = profile.name;
  document.getElementById("profile-bio").textContent = profile.bio;

  const grid = document.getElementById("profile-products");
  grid.innerHTML = "";
  profile.products.forEach(p => {
    const card = createProductCard(p);
    card.addEventListener("click", (e) => {
      e.stopPropagation();
      closeProfile();
      openModal(p);
    });
    grid.appendChild(card);
  });

  const modal = document.getElementById("profile-modal");
  modal.style.display = "flex";
}

function closeProfile() {
  document.getElementById("profile-modal").style.display = "none";
}
