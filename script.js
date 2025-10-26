// === VARIABLES GLOBALES ===
const STORAGE_KEY = "localundertake_products";
const PROFILE_KEY = "localundertake_profiles";
const LOCAL_USER_KEY = "localundertake_user";

// === UTILIDADES ===
function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}
function getProducts() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}
function saveProfiles(profiles) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profiles));
}
function getProfiles() {
  return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
}
function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USER_KEY) || "null");
  } catch {
    return null;
  }
}
function saveUserProfile(profile) {
  localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
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

document.getElementById("save-user-profile").addEventListener("click", () => {
  const name = document.getElementById("user-name").value.trim();
  const bio = document.getElementById("user-bio").value.trim();
  const avatar = document.getElementById("user-avatar").value.trim();

  if (!name) return alert("Introduce un nombre para tu perfil.");

  saveUserProfile({ name, bio, avatar });

  // auto-completa vendedor
  document.getElementById("product-seller").value = name;

  closeUserModal();
  alert("Perfil guardado correctamente.");
});

document
  .getElementById("user-profile-icon")
  .addEventListener("click", openUserModal);
document
  .getElementById("close-user-modal")
  .addEventListener("click", closeUserModal);

// === CARGAR DATOS AL INICIO ===
document.addEventListener("DOMContentLoaded", () => {
  updateUserIcon();
  renderProducts();

  const user = getUserProfile();
  if (user && user.name) {
    const sellerInput = document.getElementById("product-seller");
    if (sellerInput) sellerInput.value = user.name;
  }
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
    const seller = document.getElementById("product-seller").value.trim();
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
document
  .getElementById("search-input")
  .addEventListener("input", renderProducts);
document
  .getElementById("filter-category")
  .addEventListener("change", renderProducts);

// === MOSTRAR PRODUCTOS ===
function renderProducts() {
  const list = document.getElementById("product-list");
  const products = getProducts();
  const query = document
    .getElementById("search-input")
    .value.toLowerCase()
    .trim();
  const filter = document.getElementById("filter-category").value;

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
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>💶 ${p.price} €</p>
      <p>👤 ${p.seller}</p>
    `;
    card.addEventListener("click", () => openProductModal(p));
    list.appendChild(card);
  });
}

// === MODAL DE PRODUCTO ===
function openProductModal(product) {
  closeProfileModal(); // 🔹 Cierra perfil si está abierto

  const modal = document.getElementById("product-modal");
  modal.style.display = "flex";
  document.getElementById("modal-image").src = product.image;
  document.getElementById("modal-name").textContent = product.name;
  document.getElementById("modal-price").textContent = `💶 ${product.price} €`;
  document.getElementById(
    "modal-seller"
  ).innerHTML = `👤 <a href="#" id="seller-link">${product.seller}</a>`;
  document.getElementById(
    "modal-category"
  ).textContent = `🏷️ ${product.category}`;

  document
    .getElementById("seller-link")
    .addEventListener("click", (e) => {
      e.preventDefault();
      closeProductModal();
      openProfileModal(product.seller);
    });
}

function closeProductModal() {
  document.getElementById("product-modal").style.display = "none";
}
document
  .getElementById("close-modal")
  .addEventListener("click", closeProductModal);

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

  document.getElementById("profile-avatar").src = avatar;
  document.getElementById("profile-name").textContent = seller;
  document.getElementById("profile-name-2").textContent = seller;
  document.getElementById("profile-bio").value = bioText;

  const profileProducts = document.getElementById("profile-products");
  profileProducts.innerHTML = "";
  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <img src="${p.image}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>💶 ${p.price} €</p>
    `;
    card.addEventListener("click", () => {
      closeProfileModal();
      openProductModal(p);
    });
    profileProducts.appendChild(card);
  });

  renderReviews(profile.reviews || []);
  document.getElementById("profile-modal").style.display = "flex";
  document.getElementById("save-bio").onclick = () =>
    saveSellerBio(seller);
}

function closeProfileModal() {
  document.getElementById("profile-modal").style.display = "none";
}

document
  .getElementById("close-profile")
  .addEventListener("click", closeProfileModal);

// === GUARDAR BIO ===
function saveSellerBio(seller) {
  const bio = document.getElementById("profile-bio").value.trim();
  const profiles = getProfiles();
  if (!profiles[seller]) profiles[seller] = { bio: "", reviews: [] };
  profiles[seller].bio = bio;
  saveProfiles(profiles);
  alert("Biografía guardada.");
}

// === RESEÑAS ===
function renderReviews(reviews) {
  const list = document.getElementById("reviews-list");
  list.innerHTML = "";
  if (!reviews || !reviews.length) {
    list.innerHTML = "<p>Aún no hay reseñas.</p>";
    return;
  }
  reviews.forEach((r) => {
    const div = document.createElement("div");
    div.className = "review";
    div.innerHTML = `<strong>${r.name}</strong> ⭐${r.rating}<p>${r.text}</p>`;
    list.appendChild(div);
  });
}

document
  .getElementById("add-review-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("reviewer-name").value.trim();
    const rating = document.getElementById("review-rating").value;
    const text = document.getElementById("review-text").value.trim();
    const seller = document.getElementById("profile-name").textContent;

    if (!name || !rating || !text) return;

    const profiles = getProfiles();
    if (!profiles[seller]) profiles[seller] = { bio: "", reviews: [] };
    profiles[seller].reviews.push({ name, rating, text });
    saveProfiles(profiles);

    renderReviews(profiles[seller].reviews);
    e.target.reset();
  });

document
  .getElementById("clear-reviews")
  .addEventListener("click", () => {
    const seller = document.getElementById("profile-name").textContent;
    const profiles = getProfiles();
    if (profiles[seller]) profiles[seller].reviews = [];
    saveProfiles(profiles);
    renderReviews([]);
  });
