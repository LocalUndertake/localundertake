// === VARIABLES GLOBALES ===
const STORAGE_KEY = "localundertake_products";
const PROFILE_KEY = "localundertake_profiles";
const LOCAL_USER_KEY = "localundertake_user";

// === UTILIDADES ===
// 🔹 funciones de perfiles persistidos (faltaban)
function saveProfiles(profiles) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles || {}));
}
function getProfiles() {
  return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
}

// funciones products
function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products || []));
}
function getProducts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

// 🔹 perfil de usuario local (guardado separado)
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
    // 🔹 preferimos la avatar personalizada (URL)
    icon.style.backgroundImage = `url('${user.avatar}')`;
    icon.style.backgroundSize = "cover";
    icon.style.backgroundPosition = "center";
  } else if (user && user.name) {
    // 🔹 si no hay avatar, usamos DiceBear con el nombre
    icon.style.backgroundImage = `url('https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
      user.name
    )}')`;
    icon.style.backgroundSize = "cover";
    icon.style.backgroundPosition = "center";
  } else {
    // 🔹 fallback
    icon.style.backgroundImage = `url('https://api.dicebear.com/9.x/initials/svg?seed=User')`;
    icon.style.backgroundSize = "cover";
    icon.style.backgroundPosition = "center";
  }
}

function openUserModal() {
  const modal = document.getElementById("user-modal");
  const user = getUserProfile() || {};
  document.getElementById("user-name").value = user.name || "";
  document.getElementById("user-bio").value = user.bio || "";
  // 🔹 nuevo campo para avatar (si existe)
  const avatarInput = document.getElementById("user-avatar");
  if (avatarInput) avatarInput.value = user.avatar || "";
  modal.style.display = "flex";
}
function closeUserModal() {
  const modal = document.getElementById("user-modal");
  if (modal) modal.style.display = "none";
}

// 🔹 Listener de guardado del perfil de usuario (si el botón existe)
const saveUserBtn = document.getElementById("save-user-profile");
if (saveUserBtn) {
  saveUserBtn.addEventListener("click", () => {
    const name = document.getElementById("user-name").value.trim();
    const bio = document.getElementById("user-bio").value.trim();
    const avatarEl = document.getElementById("user-avatar");
    const avatar = avatarEl ? avatarEl.value.trim() : "";

    if (!name) return alert("Introduce un nombre para tu perfil.");

    // guardar perfil local
    saveUserProfile({ name, bio, avatar });

    // autocompletar vendedor en el formulario
    const sellerInput = document.getElementById("product-seller");
    if (sellerInput) sellerInput.value = name;

    // si el modal de perfil de vendedor está abierto y corresponde al mismo seller,
    // actualizamos su vista para reflejar la nueva bio/avatar
    const profileNameEl = document.getElementById("profile-name");
    if (profileNameEl && profileNameEl.textContent === name) {
      // actualizar avatar y bio en el modal del vendedor
      const profileAvatarEl = document.getElementById("profile-avatar");
      if (profileAvatarEl) {
        profileAvatarEl.src = avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
      }
      const profileBioEl = document.getElementById("profile-bio");
      if (profileBioEl) profileBioEl.value = bio || "";
    }

    closeUserModal();
    alert("Perfil guardado correctamente.");
  });
}

// 🔹 Icono abrir modal user y cerrar
const userIconEl = document.getElementById("user-profile-icon");
if (userIconEl) userIconEl.addEventListener("click", openUserModal);
const closeUserModalBtn = document.getElementById("close-user-modal");
if (closeUserModalBtn) closeUserModalBtn.addEventListener("click", closeUserModal);

// === CARGAR DATOS AL INICIO ===
document.addEventListener("DOMContentLoaded", () => {
  // actualizar icono en la esquina derecha según perfil guardado
  updateUserIcon();

  // rellenar vendedor si hay perfil
  const user = getUserProfile();
  if (user && user.name) {
    const sellerInput = document.getElementById("product-seller");
    if (sellerInput) sellerInput.value = user.name;
  }

  // render inicial de productos
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
    // si existe perfil local, preferimos su nombre
    const user = getUserProfile();
    const seller = (user && user.name) ? user.name : (sellerInput ? sellerInput.value.trim() : "");
    const category = document.getElementById("product-category").value;
    const image = document.getElementById("product-image").value.trim();

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
    };

    const products = getProducts();
    products.push(newProduct);
    saveProducts(products);
    renderProducts();

    e.target.reset();

    // si hay perfil local, mantenemos el seller autocompletado
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
    timer = setTimeout(renderProducts, 140);
  });
}
const filterCategoryEl = document.getElementById("filter-category");
if (filterCategoryEl) filterCategoryEl.addEventListener("change", renderProducts);

// === MOSTRAR PRODUCTOS ===
function renderProducts() {
  const list = document.getElementById("product-list");
  const products = getProducts();
  const query = (document.getElementById("search-input")?.value || "").toLowerCase().trim();
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
    // Mantengo tu clase original .product para que el CSS funcione
    card.className = "product";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <div class="category-badge">${p.category}</div>
      <div class="product-info">
        <h3>${p.name}</h3>
        <p>${Number(p.price).toFixed(2)}€</p>
        <p style="color:#555;font-size:0.9rem;">👤 ${p.seller}</p>
      </div>
    `;
    card.addEventListener("click", () => openProductModal(p));
    list.appendChild(card);
  });
}

// === MODAL DE PRODUCTO ===
function openProductModal(product) {
  closeProfileModal(); // 🔹 Cierra perfil si está abierto
  closeUserModal(); // 🔹 cierra modal user si estuviera abierto

  const modal = document.getElementById("product-modal");
  modal.style.display = "flex";
  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-name").textContent = product.name;
  document.getElementById("modal-price").textContent = `💶 ${product.price} €`;
  document.getElementById("modal-seller").innerHTML = `👤 <a href="#" id="seller-link">${product.seller}</a>`;
  document.getElementById("modal-category").textContent = `🏷️ ${product.category}`;

  // link vendedor: abre modal perfil (y ese modal usará avatar/bio del perfil local si coincide)
  const sellerLink = document.getElementById("seller-link");
  if (sellerLink) {
    sellerLink.addEventListener("click", (e) => {
      e.preventDefault();
      closeProductModal();
      openProfileModal(product.seller);
    });
  }
}

function closeProductModal() {
  const modal = document.getElementById("product-modal");
  if (modal) modal.style.display = "none";
}
const closeModalBtn = document.getElementById("close-modal");
if (closeModalBtn) closeModalBtn.addEventListener("click", closeProductModal);

// === PERFIL DEL VENDEDOR ===
function openProfileModal(seller) {
  const profiles = getProfiles();
  const profile = profiles[seller] || { bio: "", reviews: [] };
  const products = getProducts().filter((p) => p.seller === seller);

  const userProfile = getUserProfile();
  // 🔹 Si el vendedor coincide con el perfil local, usamos su foto y bio
  const avatar =
    (userProfile && userProfile.name === seller && userProfile.avatar) ||
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(
      seller
    )}`;

  const bioText =
    (userProfile && userProfile.name === seller && userProfile.bio) ||
    profile.bio ||
    "";

  const profileAvatarEl = document.getElementById("profile-avatar");
  if (profileAvatarEl) profileAvatarEl.src = avatar;

  const profileNameEl = document.getElementById("profile-name");
  if (profileNameEl) profileNameEl.textContent = seller;

  const profileName2El = document.getElementById("profile-name-2");
  if (profileName2El) profileName2El.textContent = seller;

  const profileBioEl = document.getElementById("profile-bio");
  if (profileBioEl) profileBioEl.value = bioText;

  const profileProducts = document.getElementById("profile-products");
  if (profileProducts) {
    profileProducts.innerHTML = "";
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
      profileProducts.appendChild(card);
    });
  }

  renderReviews(profile.reviews || []);
  const profileModal = document.getElementById("profile-modal");
  if (profileModal) profileModal.style.display = "flex";

  // guardar bio botón
  const saveBioBtn = document.getElementById("save-bio");
  if (saveBioBtn) {
    saveBioBtn.onclick = () => saveSellerBio(seller);
  }
}

function closeProfileModal() {
  const modal = document.getElementById("profile-modal");
  if (modal) modal.style.display = "none";
}
const closeProfileBtn = document.getElementById("close-profile");
if (closeProfileBtn) closeProfileBtn.addEventListener("click", closeProfileModal);

// === GUARDAR BIO ===
function saveSellerBio(seller) {
  const bioEl = document.getElementById("profile-bio");
  const bio = bioEl ? bioEl.value.trim() : "";
  const profiles = getProfiles();
  if (!profiles[seller]) profiles[seller] = { bio: "", reviews: [] };
  profiles[seller].bio = bio;
  saveProfiles(profiles);

  // Si hay perfil local con el mismo nombre, sincronizamos su bio también
  const user = getUserProfile();
  if (user && user.name === seller) {
    user.bio = bio;
    saveUserProfile(user);
  }

  alert("Biografía guardada.");
}

// === RESEÑAS ===
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
    div.innerHTML = `<div class="meta"><span class="stars">${"★".repeat(r.rating || 0)}</span> ${escapeHtml(r.reviewer || r.name || "Anon")}</div>
                     <div class="body">${escapeHtml(r.text || "")}</div>`;
    list.appendChild(div);
  });
}

function escapeHtml(t){ return t ? String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") : ""; }

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
    profiles[seller].reviews = profiles[seller].reviews || [];
    profiles[seller].reviews.push({ reviewer: name, rating, text, date: new Date().toISOString() });
    saveProfiles(profiles);

    renderReviews(profiles[seller].reviews);
    e.target.reset();
  });
}

const clearReviewsBtn = document.getElementById("clear-reviews");
if (clearReviewsBtn) {
  clearReviewsBtn.addEventListener("click", () => {
    const seller = document.getElementById("profile-name").textContent;
    const profiles = getProfiles();
    if (profiles[seller]) profiles[seller].reviews = [];
    saveProfiles(profiles);
    renderReviews([]);
  });
}
