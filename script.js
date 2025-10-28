// === VARIABLES GLOBALES ===
const STORAGE_KEY = "localundertake_products";
const PROFILE_KEY = "localundertake_profiles";
const LOCAL_USER_KEY = "localundertake_user";

// === UTILIDADES ===
function saveProfiles(profiles) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles || {}));
}
function getProfiles() {
  return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
}

function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products || []));
}
function getProducts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USER_KEY) || "null");
  } catch {
    return null;
  }
}
function saveUserProfile(profile) {
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile || {}));
  updateUserIcon();
}

// === PERFIL DE USUARIO LOCAL ===
function updateUserIcon() {
  const icon = document.getElementById("user-profile-icon");
  const user = getUserProfile();
  if (!icon) return;

  if (user && user.avatar) {
    icon.style.backgroundImage = `url('${user.avatar}')`;
  } else if (user && user.name) {
    icon.style.backgroundImage = `url('https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
      user.name
    )}')`;
  } else {
    icon.style.backgroundImage = `url('https://api.dicebear.com/9.x/initials/svg?seed=User')`;
  }
  icon.style.backgroundSize = "cover";
  icon.style.backgroundPosition = "center";
}

function openUserModal() {
  const modal = document.getElementById("user-modal");
  const user = getUserProfile() || {};
  document.getElementById("user-name").value = user.name || "";
  document.getElementById("user-bio").value = user.bio || "";
  document.getElementById("user-avatar").value = user.avatar || "";
  modal.style.display = "flex";
}
function closeUserModal() {
  document.getElementById("user-modal").style.display = "none";
}

const saveUserBtn = document.getElementById("save-user-profile");
if (saveUserBtn) {
  saveUserBtn.addEventListener("click", () => {
    const name = document.getElementById("user-name").value.trim();
    const bio = document.getElementById("user-bio").value.trim();
    const avatar = document.getElementById("user-avatar").value.trim();
    if (!name) return alert("Introduce un nombre para tu perfil.");

    saveUserProfile({ name, bio, avatar });

    const sellerInput = document.getElementById("product-seller");
    if (sellerInput) sellerInput.value = name;

    closeUserModal();
    alert("Perfil guardado correctamente.");
  });
}

const userIconEl = document.getElementById("user-profile-icon");
if (userIconEl) userIconEl.addEventListener("click", openUserModal);
document
  .getElementById("close-user-modal")
  ?.addEventListener("click", closeUserModal);

// === CARGAR DATOS AL INICIO ===
document.addEventListener("DOMContentLoaded", () => {
  updateUserIcon();
  const user = getUserProfile();
  if (user && user.name) {
    const sellerInput = document.getElementById("product-seller");
    if (sellerInput) sellerInput.value = user.name;
  }
  renderProducts();
});

// === AÑADIR PRODUCTO ===
document
  .getElementById("add-product-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("product-name").value.trim();
    const price = parseFloat(
      document.getElementById("product-price").value.trim()
    );
    const sellerInput = document.getElementById("product-seller");
    const user = getUserProfile();
    const seller =
      user && user.name ? user.name : sellerInput?.value.trim() || "";
    const category = document.getElementById("product-category").value;
    const image = document.getElementById("product-image").value.trim();
    const description =
      document.getElementById("product-description")?.value.trim() || "";

    if (!name || !price || !seller || !category)
      return alert("Por favor, completa todos los campos.");

    const newProduct = {
      id: Date.now(),
      name,
      price,
      seller,
      category,
      image:
        image ||
        `https://via.placeholder.com/300x200?text=${encodeURIComponent(name)}`,
      description,
    };

    const products = getProducts();
    products.push(newProduct);
    saveProducts(products);
    renderProducts();
    e.target.reset();
    if (user && user.name && sellerInput) sellerInput.value = user.name;
  });

document
  .getElementById("clear-local")
  .addEventListener("click", () => {
    if (confirm("¿Seguro que quieres borrar todos los productos locales?")) {
      localStorage.removeItem(STORAGE_KEY);
      renderProducts();
    }
  });

// === BUSCAR Y FILTRAR ===
const searchInputEl = document.getElementById("search-input");
if (searchInputEl) {
  let timer = null;
  searchInputEl.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(renderProducts, 150);
  });
}
document
  .getElementById("filter-category")
  ?.addEventListener("change", renderProducts);

// === MOSTRAR PRODUCTOS ===
function renderProducts() {
  const list = document.getElementById("product-list");
  const products = getProducts();
  const query =
    (document.getElementById("search-input")?.value || "").toLowerCase().trim();
  const filter = document.getElementById("filter-category")?.value || "";

  list.innerHTML = "";

  const filtered = products.filter((p) => {
    const matchQuery =
      p.name.toLowerCase().includes(query) ||
      p.seller.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query);
    const matchCategory = !filter || p.category === filter;
    return matchQuery && matchCategory;
  });

  if (!filtered.length) {
    list.innerHTML = `<p class="placeholder">No se encontraron productos.</p>`;
    return;
  }

  filtered.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="category-badge">${p.category}</div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>${Number(p.price).toFixed(2)}€</p>
        <p class="seller-link" data-seller="${p.seller}">👤 ${p.seller}</p>
      </div>
    `;
    card.addEventListener("click", () => openProductModal(p));
    list.appendChild(card);
  });
}

// === MODAL DE PRODUCTO ===
function openProductModal(product) {
  closeProfileModal();
  closeUserModal();

  const modal = document.getElementById("product-modal");
  modal.style.display = "flex";
  modal.querySelector(".modal-content").style.maxHeight = "90vh";
  modal.querySelector(".modal-content").style.overflowY = "auto";

  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-name").textContent = product.name;
  document.getElementById("modal-price").textContent = `💶 ${product.price} €`;
  document.getElementById(
    "modal-seller"
  ).innerHTML = `👤 <a href="#" class="seller-link" data-seller="${product.seller}">${product.seller}</a>`;
  document.getElementById(
    "modal-category"
  ).textContent = `🏷️ ${product.category}`;

  const descContainer = document.getElementById("modal-description");
  if (descContainer)
    descContainer.textContent = product.description || "Sin descripción.";

  // === 🔹 RESEÑAS EN MODAL DE PRODUCTO ===
  let reviewsSection = document.getElementById("product-reviews-section");
  if (!reviewsSection) {
    reviewsSection = document.createElement("div");
    reviewsSection.id = "product-reviews-section";
    reviewsSection.className = "reviews-section";
    reviewsSection.innerHTML = `
      <h4>Reseñas del producto</h4>
      <div id="product-reviews-list"></div>
      <form id="add-product-review-form" class="review-form">
        <input id="product-reviewer-name" type="text" placeholder="Tu nombre" required>
        <select id="product-review-rating" required>
          <option value="">Puntuación</option>
          <option value="5">5 — Excelente</option>
          <option value="4">4 — Muy bueno</option>
          <option value="3">3 — Bien</option>
          <option value="2">2 — Regular</option>
          <option value="1">1 — Malo</option>
        </select>
        <textarea id="product-review-text" rows="2" placeholder="Tu comentario" required></textarea>
        <div style="display:flex;gap:8px;">
          <button type="submit">Enviar reseña</button>
          <button id="clear-product-reviews" type="button" class="danger small">Borrar reseñas</button>
        </div>
      </form>
    `;
    modal.querySelector(".modal-body").appendChild(reviewsSection);
  }

  // Renderizar reseñas del producto
  const profiles = getProfiles();
  const productKey = `product_${product.id}`;
  const productProfile = profiles[productKey] || { reviews: [] };
  renderProductReviews(productProfile.reviews);

  // Manejadores de reseñas del producto
  const form = document.getElementById("add-product-review-form");
  form.onsubmit = (e) => {
    e.preventDefault();
    const name = document.getElementById("product-reviewer-name").value.trim();
    const rating = Number(document.getElementById("product-review-rating").value);
    const text = document.getElementById("product-review-text").value.trim();
    if (!name || !rating || !text) return;

    if (!profiles[productKey]) profiles[productKey] = { reviews: [] };
    profiles[productKey].reviews.push({
      reviewer: name,
      rating,
      text,
      date: new Date().toISOString(),
    });
    saveProfiles(profiles);
    renderProductReviews(profiles[productKey].reviews);
    form.reset();
  };

  document.getElementById("clear-product-reviews").onclick = () => {
    if (confirm("¿Borrar todas las reseñas del producto?")) {
      if (profiles[productKey]) profiles[productKey].reviews = [];
      saveProfiles(profiles);
      renderProductReviews([]);
    }
  };
}

function renderProductReviews(reviews) {
  const list = document.getElementById("product-reviews-list");
  if (!list) return;
  list.innerHTML = "";
  if (!reviews || !reviews.length) {
    list.innerHTML = "<p>Aún no hay reseñas.</p>";
    return;
  }
  reviews.forEach((r) => {
    const div = document.createElement("div");
    div.className = "review";
    div.innerHTML = `<div class="meta"><span class="stars">${"★".repeat(
      r.rating || 0
    )}</span> ${escapeHtml(r.reviewer || "Anon")}</div>
                     <div class="body">${escapeHtml(r.text || "")}</div>`;
    list.appendChild(div);
  });
}

function closeProductModal() {
  document.getElementById("product-modal").style.display = "none";
}
document
  .getElementById("close-modal")
  ?.addEventListener("click", closeProductModal);

// === PERFIL DEL VENDEDOR ===
function openProfileModal(seller) {
  const profiles = getProfiles();
  const profile = profiles[seller] || { bio: "", reviews: [] };
  const products = getProducts().filter((p) => p.seller === seller);
  const userProfile = getUserProfile();

  const avatar =
    (userProfile && userProfile.name === seller && userProfile.avatar) ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
      seller
    )}`;
  const bioText =
    (userProfile && userProfile.name === seller && userProfile.bio) ||
    profile.bio ||
    "";

  document.getElementById("profile-avatar").src = avatar;
  document.getElementById("profile-name").textContent = seller;
  document.getElementById("profile-name-2").textContent = seller;
  document.getElementById("profile-bio").value = bioText;

  const container = document.getElementById("profile-products");
  container.innerHTML = "";
  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>💶 ${p.price} €</p>
      </div>
    `;
    card.addEventListener("click", () => {
      closeProfileModal();
      openProductModal(p);
    });
    container.appendChild(card);
  });

  renderReviews(profile.reviews || []);
  document.getElementById("profile-modal").style.display = "flex";
  document.getElementById("save-bio").onclick = () => saveSellerBio(seller);
}

function closeProfileModal() {
  document.getElementById("profile-modal").style.display = "none";
}
document
  .getElementById("close-profile")
  ?.addEventListener("click", closeProfileModal);

// === CLIC EN EL NOMBRE DEL VENDEDOR DESDE TARJETA ===
document.addEventListener("click", (e) => {
  const sellerEl = e.target.closest(".seller-link");
  if (sellerEl && sellerEl.dataset.seller) {
    e.preventDefault();
    closeProductModal();
    openProfileModal(sellerEl.dataset.seller);
  }
});

// === GUARDAR BIO ===
function saveSellerBio(seller) {
  const bio = document.getElementById("profile-bio").value.trim();
  const profiles = getProfiles();
  if (!profiles[seller]) profiles[seller] = { bio: "", reviews: [] };
  profiles[seller].bio = bio;
  saveProfiles(profiles);
  const user = getUserProfile();
  if (user && user.name === seller) {
    user.bio = bio;
    saveUserProfile(user);
  }
  alert("Biografía guardada.");
}

// === RESEÑAS DE PERFIL ===
function renderReviews(reviews) {
  const list = document.getElementById("reviews-list");
  if (!list) return;
  list.innerHTML = "";
  if (!reviews || !reviews.length) {
    list.innerHTML = "<p>Aún no hay reseñas.</p>";
    return;
  }
  reviews.forEach((r) => {
    const div = document.createElement("div");
    div.className = "review";
    div.innerHTML = `<div class="meta"><span class="stars">${"★".repeat(
      r.rating || 0
    )}</span> ${escapeHtml(r.reviewer || "Anon")}</div>
                     <div class="body">${escapeHtml(r.text || "")}</div>`;
    list.appendChild(div);
  });
}

function escapeHtml(t) {
  return t
    ? String(t)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
    : "";
}

const addReviewForm = document.getElementById("add-review-form");
if (addReviewForm) {
  addReviewForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("reviewer-name").value.trim();
    const rating = Number(document.getElementById("review-rating").value);
    const text = document.getElementById("review-text").value.trim();
    const seller = document.getElementById("profile-name").textContent;
    if (!name || !rating || !text) return;

    const profiles = getProfiles();
    if (!profiles[seller]) profiles[seller] = { bio: "", reviews: [] };
    profiles[seller].reviews.push({
      reviewer: name,
      rating,
      text,
      date: new Date().toISOString(),
    });
    saveProfiles(profiles);
    renderReviews(profiles[seller].reviews);
    e.target.reset();
  });
}

document.getElementById("clear-reviews")?.addEventListener("click", () => {
  const seller = document.getElementById("profile-name").textContent;
  const profiles = getProfiles();
  if (profiles[seller]) profiles[seller].reviews = [];
  saveProfiles(profiles);
  renderReviews([]);
});
