// ========== FUNCIONES EXISTENTES (resumen base de tu app) ==========
const LOCAL_PRODUCTS_KEY = "localundertake_products";

function dicebearAvatar(seed) {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`;
}

function loadLocalProducts() {
  return JSON.parse(localStorage.getItem(LOCAL_PRODUCTS_KEY) || "[]");
}

function saveLocalProducts(products) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
}

function addLocalProduct(product) {
  const products = loadLocalProducts();
  products.push(product);
  saveLocalProducts(products);
  renderProducts(products);
}

function renderProducts(products = loadLocalProducts()) {
  const list = document.getElementById("product-list");
  list.innerHTML = "";

  if (!products.length) {
    list.innerHTML = `<p class="placeholder">No hay productos aún. ¡Agrega uno!</p>`;
    return;
  }

  products.forEach(p => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image || "https://via.placeholder.com/200"}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p><strong>${p.price} €</strong></p>
      <p>${p.seller}</p>
      <p class="category">${p.category}</p>
    `;
    list.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Render inicial
  renderProducts();

  // Añadir producto
  document.getElementById("add-product-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const p = {
      name: document.getElementById("product-name").value,
      price: document.getElementById("product-price").value,
      seller: document.getElementById("product-seller").value,
      category: document.getElementById("product-category").value,
      image: document.getElementById("product-image").value
    };
    addLocalProduct(p);
    e.target.reset();
  });

  // Limpiar productos locales
  document.getElementById("clear-local").addEventListener("click", () => {
    if (confirm("¿Seguro que deseas borrar todos los productos locales?")) {
      localStorage.removeItem(LOCAL_PRODUCTS_KEY);
      renderProducts([]);
    }
  });
});

// ========== NUEVO: PERFIL DE USUARIO LOCAL ==========
const LOCAL_USER_KEY = "localundertake_user";
let localUser = JSON.parse(localStorage.getItem(LOCAL_USER_KEY) || "{}");

function loadUserProfile() {
  if (localUser.name) {
    document.getElementById("profile-avatar-mini").src = localUser.avatar || dicebearAvatar(localUser.name);
  }
}

function openUserModal() {
  document.getElementById("user-name").value = localUser.name || "";
  document.getElementById("user-bio").value = localUser.bio || "";
  document.getElementById("user-avatar").src = localUser.avatar || dicebearAvatar(localUser.name || "Invitado");
  const modal = document.getElementById("user-modal");
  modal.style.display = "flex";
  modal.setAttribute("aria-hidden", "false");
}

function closeUserModal() {
  const modal = document.getElementById("user-modal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

function saveUserProfile() {
  const name = document.getElementById("user-name").value.trim() || "Invitado";
  const bio = document.getElementById("user-bio").value.trim() || "";
  const avatar = dicebearAvatar(name);
  localUser = { name, bio, avatar };
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser));
  document.getElementById("profile-avatar-mini").src = avatar;
  alert("Perfil guardado correctamente.");
  closeUserModal();
}

// Asignar productos al perfil actual
const originalAddLocalProduct = addLocalProduct;
addLocalProduct = function(p) {
  if (localUser && localUser.name) {
    p.seller = localUser.name;
  }
  originalAddLocalProduct(p);
};

// Eventos perfil usuario
document.addEventListener("DOMContentLoaded", () => {
  loadUserProfile();

  const icon = document.getElementById("profile-icon");
  if (icon) icon.addEventListener("click", openUserModal);

  const closeBtn = document.getElementById("close-user");
  if (closeBtn) closeBtn.addEventListener("click", closeUserModal);

  const saveBtn = document.getElementById("save-user");
  if (saveBtn) saveBtn.addEventListener("click", saveUserProfile);
});
